"""
MaternAI Care — Patient simulator.
Injects realistic sensor scenarios directly into the DB + detector.
No HTTP needed — runs in-process for speed and reliability.

Scenarios: normal | preeclampsia | hemorrhage | sepsis
"""

import time
import json
import random
import threading
from datetime import datetime, timezone

from db import conn
from detector import detect

# Shared state (read by /sim/status)
SIM_STATE = {
    "running": False,
    "scenario": None,
    "patient_id": 1,
    "speed": 1.0,
    "started_at": None,
}
_LOCK = threading.Lock()


def _emit(patient_id, sensor_type, value):
    """Insert reading into DB, run detector, return alert if any."""
    conn.execute(
        """INSERT INTO readings (patient_id, sensor_type, value, recorded_at)
           VALUES (?, ?, ?, ?)""",
        (patient_id, sensor_type, json.dumps(value),
         datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    return detect(patient_id, {"sensor_type": sensor_type, "value": value}, conn)


def _round(patient_id, bp, hr, spo2, temp):
    """Emit one BP, HR, SpO2, Temp reading."""
    for st, val in [("bp", bp), ("hr", hr), ("spo2", spo2), ("temp", temp)]:
        _emit(patient_id, st, val)


# =========================================================
# SCENARIOS
# =========================================================
def scenario_normal(patient_id, speed):
    for _ in range(30):
        if not SIM_STATE["running"]:
            return
        _round(
            patient_id,
            {"systolic": random.randint(110, 122),
             "diastolic": random.randint(70, 80)},
            {"bpm": random.randint(75, 90)},
            {"percent": random.randint(97, 99)},
            {"celsius": round(random.uniform(36.5, 37.0), 1)},
        )
        time.sleep(5 / speed)


def scenario_preeclampsia(patient_id, speed):
    """BP rises steadily. Detector should fire warning then critical."""
    sys_v = 115.0
    dia_v = 75.0
    hr_v = 82
    for i in range(30):
        if not SIM_STATE["running"]:
            return
        sys_v += random.uniform(1.5, 3.0)
        dia_v += random.uniform(0.8, 1.8)
        hr_v += 1
        _round(
            patient_id,
            {"systolic": int(sys_v), "diastolic": int(dia_v)},
            {"bpm": int(hr_v)},
            {"percent": random.randint(96, 98)},
            {"celsius": round(36.8 + i * 0.02, 1)},
        )
        time.sleep(4 / speed)


def scenario_hemorrhage(patient_id, speed):
    """BP drops, HR spikes, SpO2 falls — classic hemorrhage pattern."""
    for i in range(20):
        if not SIM_STATE["running"]:
            return
        _round(
            patient_id,
            {"systolic": max(70, 110 - i * 2),
             "diastolic": max(45, 70 - i)},
            {"bpm": min(150, 82 + i * 3)},
            {"percent": max(88, 98 - i // 2)},
            {"celsius": round(36.6 - i * 0.05, 1)},
        )
        time.sleep(3 / speed)


def scenario_sepsis(patient_id, speed):
    """Fever + tachycardia + falling BP. Detector fires multiple alerts."""
    for i in range(25):
        if not SIM_STATE["running"]:
            return
        _round(
            patient_id,
            {"systolic": max(85, 115 - i),
             "diastolic": max(55, 75 - i // 2)},
            {"bpm": min(135, 85 + i * 2)},
            {"percent": max(93, 98 - i // 4)},
            {"celsius": round(36.8 + i * 0.12, 1)},
        )
        time.sleep(4 / speed)


SCENARIOS = {
    "normal":       scenario_normal,
    "preeclampsia": scenario_preeclampsia,
    "hemorrhage":   scenario_hemorrhage,
    "sepsis":       scenario_sepsis,
}


# =========================================================
# RUNNER
# =========================================================
def run_scenario(scenario, patient_id=1, speed=1.0):
    """Entry point. Runs until finished or stopped."""
    with _LOCK:
        if SIM_STATE["running"]:
            return False
        SIM_STATE["running"] = True
        SIM_STATE["scenario"] = scenario
        SIM_STATE["patient_id"] = patient_id
        SIM_STATE["speed"] = speed
        SIM_STATE["started_at"] = datetime.now(timezone.utc).isoformat()

    try:
        fn = SCENARIOS.get(scenario)
        if fn:
            fn(patient_id, speed)
    except Exception as e:
        print(f"[simulator] error: {e}")
    finally:
        with _LOCK:
            SIM_STATE["running"] = False
            SIM_STATE["scenario"] = None

    return True