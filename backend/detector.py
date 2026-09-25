"""
MaternAI Care — Rule-based anomaly detector.
Layer 1: Clinical thresholds (always run).
Layer 2: ML population risk (if model is loaded).
"""

import json
import os

T = {
    "sys_high": 140, "sys_crit": 160,
    "dia_high": 90,  "dia_crit": 110,
    "hr_high": 120,  "hr_low": 50,
    "spo2_low": 94,
    "temp_high": 38.0,
}

# Try loading ML model (optional)
try:
    import joblib
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "population_model.pkl")
    POP_MODEL = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
except Exception:
    POP_MODEL = None


def detect(patient_id, reading, db):
    st = reading["sensor_type"] if isinstance(reading, dict) else reading.sensor_type
    v  = reading["value"]        if isinstance(reading, dict) else reading.value

    alert = _check_rules(patient_id, st, v, db)
    if alert:
        return alert

    if POP_MODEL is not None and st in ("bp", "hr", "spo2", "temp"):
        return _check_ml(patient_id, st, v, db)

    return None


def _check_rules(patient_id, st, v, db):
    if st == "bp":
        sys_v = v.get("systolic", 0)
        dia_v = v.get("diastolic", 0)
        if sys_v >= T["sys_crit"] or dia_v >= T["dia_crit"]:
            return _save(db, patient_id, "critical", "preeclampsia",
                         f"Severe hypertension: {sys_v}/{dia_v}",
                         {"systolic": sys_v, "diastolic": dia_v, "rule": "critical_bp"})
        if sys_v >= T["sys_high"] or dia_v >= T["dia_high"]:
            return _save(db, patient_id, "warning", "preeclampsia",
                         f"Hypertension: {sys_v}/{dia_v}",
                         {"systolic": sys_v, "diastolic": dia_v, "rule": "high_bp"})

    elif st == "hr":
        hr = v.get("bpm", 0)
        if hr > T["hr_high"]:
            return _save(db, patient_id, "warning", "tachycardia",
                         f"High pulse: {hr} bpm", {"pulse": hr, "rule": "high_hr"})
        if hr and hr < T["hr_low"]:
            return _save(db, patient_id, "warning", "bradycardia",
                         f"Low pulse: {hr} bpm", {"pulse": hr, "rule": "low_hr"})

    elif st == "spo2":
        sp = v.get("percent", 100)
        if sp < T["spo2_low"]:
            return _save(db, patient_id, "critical", "hypoxia",
                         f"Low SpO2: {sp}%", {"spo2": sp, "rule": "low_spo2"})

    elif st == "temp":
        t = v.get("celsius", 37)
        if t > T["temp_high"]:
            return _save(db, patient_id, "warning", "infection",
                         f"Fever: {t}°C", {"temp": t, "rule": "fever"})

    return None


def _check_ml(patient_id, st, v, db):
    try:
        base = db.execute(
            "SELECT systolic, diastolic, pulse, spo2, temp FROM baseline_vitals WHERE patient_id=?",
            (patient_id,),
        ).fetchone()
        if not base:
            return None

        sys_v = v.get("systolic",  base[0]) if st == "bp"   else base[0]
        dia_v = v.get("diastolic", base[1]) if st == "bp"   else base[1]
        hr_v  = v.get("bpm",       base[2]) if st == "hr"   else base[2]
        tp_v  = v.get("celsius",   base[4]) if st == "temp" else base[4]

        import numpy as np
        X = np.array([[28, sys_v, dia_v, tp_v, hr_v]])
        proba = POP_MODEL.predict_proba(X)[0]
        high = float(proba[2]) if len(proba) > 2 else 0.0

        if high > 0.7:
            return _save(db, patient_id, "warning", "high_risk",
                         f"High population risk: {high:.2f}",
                         {"systolic": sys_v, "diastolic": dia_v, "hr": hr_v,
                          "pop_risk": round(high, 2), "rule": "ml_population"})
    except Exception as e:
        print("[detector] ML error:", e)
    return None


def _save(db, patient_id, severity, category, message, explanation):
    db.execute(
        """INSERT INTO alerts (patient_id, severity, category, message, explanation)
           VALUES (?, ?, ?, ?, ?)""",
        (patient_id, severity, category, message, json.dumps(explanation)),
    )
    db.commit()
    return {"severity": severity, "category": category,
            "message": message, "explanation": explanation}