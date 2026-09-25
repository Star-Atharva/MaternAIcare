"""
MaternAI Care — Anomaly detector.
Layer 1: Clinical thresholds (rules)
Layer 2: ML population risk (Random Forest)
Layer 3: Temporal CNN anomaly detection
"""

import json
import os
import numpy as np
from collections import deque

HERE = os.path.dirname(__file__)

T = {
    "sys_high": 140, "sys_crit": 160,
    "dia_high": 90,  "dia_crit": 110,
    "hr_high": 120,  "hr_low": 50,
    "spo2_low": 94,
    "temp_high": 38.0,
}

# ---------- LAYER 2: Random Forest ----------
try:
    import joblib
    MODEL_PATH = os.path.join(HERE, "population_model.pkl")
    POP_MODEL = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None
except Exception:
    POP_MODEL = None

# ---------- LAYER 3: CNN ----------
try:
    import torch
    import torch.nn as nn

    class VitalsCNN(nn.Module):
        def __init__(self, channels=4, n_classes=3):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv1d(channels, 32, kernel_size=3, padding=1),
                nn.ReLU(),
                nn.MaxPool1d(2),
                nn.Conv1d(32, 64, kernel_size=3, padding=1),
                nn.ReLU(),
                nn.AdaptiveAvgPool1d(1),
            )
            self.head = nn.Sequential(
                nn.Flatten(),
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Linear(32, n_classes),
            )
        def forward(self, x):
            return self.head(self.net(x))

    CNN_PATH      = os.path.join(HERE, "cnn_model.pt")
    CNN_MEAN_PATH = os.path.join(HERE, "cnn_norm_mean.npy")
    CNN_STD_PATH  = os.path.join(HERE, "cnn_norm_std.npy")

    if os.path.exists(CNN_PATH) and os.path.exists(CNN_MEAN_PATH):
        CNN_MODEL = VitalsCNN()
        CNN_MODEL.load_state_dict(torch.load(CNN_PATH, map_location="cpu"))
        CNN_MODEL.eval()
        CNN_MEAN = np.load(CNN_MEAN_PATH)
        CNN_STD  = np.load(CNN_STD_PATH)
        print("[detector] CNN model loaded")
    else:
        CNN_MODEL = None
        CNN_MEAN = CNN_STD = None
except Exception as e:
    CNN_MODEL = None
    CNN_MEAN = CNN_STD = None
    print("[detector] CNN not loaded:", e)

# Rolling vitals window per patient: [sys, dia, hr, spo2]
VITALS_WINDOWS = {}


def detect(patient_id, reading, db):
    st = reading["sensor_type"] if isinstance(reading, dict) else reading.sensor_type
    v  = reading["value"]        if isinstance(reading, dict) else reading.value

    # Update rolling window
    if patient_id not in VITALS_WINDOWS:
        VITALS_WINDOWS[patient_id] = deque(maxlen=20)
    buf = VITALS_WINDOWS[patient_id]

    if st == "bp":
        buf.append([v.get("systolic", 115), v.get("diastolic", 75), 82.0, 98.0])
    elif st == "hr" and buf:
        buf[-1][2] = v.get("bpm", 82)
    elif st == "spo2" and buf:
        buf[-1][3] = v.get("percent", 98)

    # Layer 1 — rules
    rule_alert = _check_rules(patient_id, st, v, db)

    # Layer 2 — Random Forest
    ml_alert = None
    if POP_MODEL is not None and st in ("bp", "hr", "spo2", "temp"):
        ml_alert = _check_ml(patient_id, st, v, db)

    # Layer 3 — CNN (only after window is full)
    cnn_alert = None
    if CNN_MODEL is not None and st == "bp" and len(buf) == 20:
        cnn_alert = _check_cnn(patient_id, db)

    return rule_alert or ml_alert or cnn_alert


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

        X = np.array([[28, sys_v, dia_v, tp_v, hr_v]])
        proba = POP_MODEL.predict_proba(X)[0]
        high = float(proba[2]) if len(proba) > 2 else 0.0

        if high > 0.5:
            return _save(db, patient_id, "warning", "high_risk",
                         f"High population risk: {high:.2f}",
                         {"systolic": sys_v, "diastolic": dia_v, "hr": hr_v,
                          "pop_risk": round(high, 2), "rule": "ml_population"})
    except Exception as e:
        print("[detector] ML error:", e)
    return None


def _check_cnn(patient_id, db):
    try:
        buf = VITALS_WINDOWS.get(patient_id)
        if not buf or len(buf) < 20:
            return None

        arr = np.array(buf, dtype=np.float32)
        arr = (arr - CNN_MEAN) / (CNN_STD + 1e-6)
        arr = arr.T
        x = torch.tensor(arr).unsqueeze(0)

        with torch.no_grad():
            logits = CNN_MODEL(x)
            probs = torch.softmax(logits, dim=1).numpy()[0]

        cls = int(np.argmax(probs))
        conf = float(probs[cls])

        if cls == 2 and conf > 0.7:
            return _save(db, patient_id, "critical", "cnn_temporal",
                         f"CNN critical pattern ({conf:.2f})",
                         {"cnn_class": "critical", "confidence": round(conf, 2),
                          "rule": "cnn_temporal"})
        if cls == 1 and conf > 0.7:
            return _save(db, patient_id, "warning", "cnn_temporal",
                         f"CNN warning pattern ({conf:.2f})",
                         {"cnn_class": "warning", "confidence": round(conf, 2),
                          "rule": "cnn_temporal"})
    except Exception as e:
        print("[detector] CNN error:", e)
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