"""
MaternAI Care — FastAPI backend
Endpoints: auth, patient intake, sensor ingest, readings, alerts
"""

from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import query, query_one, execute

app = FastAPI(title="MaternAI Care API", version="0.1")

# Allow the frontend to talk to us from anywhere (dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- HARDCODED DEMO USERS ----------
HARDCODED_USERS = {
    "mother":    {"password": "mother123", "role": "mother",    "name": "Priya Sharma"},
    "caretaker": {"password": "care123",   "role": "caretaker", "name": "Anita Rao"},
    "clinic":    {"password": "clinic123", "role": "clinic",    "name": "City Hospital"},
}

DEVICE_KEYS = {
    "patch-001": 1,
    "wrist-001": 1,
}

# =========================================================
# HEALTH
# =========================================================
@app.get("/health")
def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

# =========================================================
# AUTH
# =========================================================
class LoginIn(BaseModel):
    username: str
    password: str

@app.post("/auth/login")
def login(payload: LoginIn):
    # hardcoded first
    if payload.username in HARDCODED_USERS:
        u = HARDCODED_USERS[payload.username]
        if u["password"] == payload.password:
            return {"ok": True, "username": payload.username, "role": u["role"], "name": u["name"]}

    # then DB
    row = query_one(
        "SELECT id, username, password, role, full_name FROM users WHERE username = ?",
        (payload.username,),
    )
    if row and row["password"] == payload.password:
        return {"ok": True, "username": row["username"], "role": row["role"], "name": row["full_name"]}

    raise HTTPException(status_code=401, detail="Invalid credentials")


class RegisterIn(BaseModel):
    username: str
    password: str
    role: str
    full_name: Optional[str] = None

@app.post("/auth/register")
def register(payload: RegisterIn):
    if payload.role not in ("mother", "caretaker", "clinic"):
        raise HTTPException(400, "Invalid role")
    existing = query_one("SELECT id FROM users WHERE username = ?", (payload.username,))
    if existing:
        raise HTTPException(400, "Username already exists")
    uid = execute(
        "INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)",
        (payload.username, payload.password, payload.role, payload.full_name),
    )
    return {"ok": True, "user_id": uid}

# =========================================================
# INTAKE — new patient form
# =========================================================
class Personal(BaseModel):
    name: str
    age: int
    weight_kg: float
    height_cm: float
    blood_group: str
    phone: Optional[str] = None

class Pregnancy(BaseModel):
    trimester: int
    expected_due_date: Optional[str] = None   # ISO date string
    gravida: Optional[int] = None
    para: Optional[int] = None

class Baseline(BaseModel):
    systolic: float
    diastolic: float
    pulse: float
    spo2: float
    temp: float
    sleep_quality: Optional[int] = None
    stress_level: Optional[int] = None
    activity: Optional[str] = None

class IntakeIn(BaseModel):
    user_id: int
    personal: Personal
    pregnancy: Pregnancy
    baseline: Baseline

@app.post("/patients/intake")
def intake(payload: IntakeIn):
    # check user exists
    user = query_one("SELECT id, role FROM users WHERE id = ?", (payload.user_id,))
    if not user:
        raise HTTPException(400, "User not found. Register first.")
    if user["role"] != "mother":
        raise HTTPException(400, "Only mother accounts can submit intake")

    # compute BMI
    h_m = payload.personal.height_cm / 100.0
    bmi = round(payload.personal.weight_kg / (h_m * h_m), 2) if h_m > 0 else None

    # insert patient
    patient_id = execute(
        """INSERT INTO patients
           (user_id, name, age, weight_kg, height_cm, bmi, blood_group, phone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            payload.user_id,
            payload.personal.name,
            payload.personal.age,
            payload.personal.weight_kg,
            payload.personal.height_cm,
            bmi,
            payload.personal.blood_group,
            payload.personal.phone,
        ),
    )

    # insert pregnancy
    execute(
        """INSERT INTO pregnancy_info
           (patient_id, trimester, expected_due_date, gravida, para)
           VALUES (?, ?, ?, ?, ?)""",
        (
            patient_id,
            payload.pregnancy.trimester,
            payload.pregnancy.expected_due_date,
            payload.pregnancy.gravida,
            payload.pregnancy.para,
        ),
    )

    # insert baseline
    execute(
        """INSERT INTO baseline_vitals
           (patient_id, systolic, diastolic, pulse, spo2, temp,
            sleep_quality, stress_level, activity)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            patient_id,
            payload.baseline.systolic,
            payload.baseline.diastolic,
            payload.baseline.pulse,
            payload.baseline.spo2,
            payload.baseline.temp,
            payload.baseline.sleep_quality,
            payload.baseline.stress_level,
            payload.baseline.activity,
        ),
    )

    return {"ok": True, "patient_id": patient_id, "bmi": bmi}

@app.get("/patients/{patient_id}")
def get_patient(patient_id: int):
    p = query_one("SELECT * FROM patients WHERE id = ?", (patient_id,))
    if not p:
        raise HTTPException(404, "Patient not found")
    preg = query_one("SELECT * FROM pregnancy_info WHERE patient_id = ?", (patient_id,))
    base = query_one("SELECT * FROM baseline_vitals WHERE patient_id = ?", (patient_id,))
    return {"patient": p, "pregnancy": preg, "baseline": base}

# =========================================================
# INGEST — sensor + manual readings
# =========================================================
class ReadingIn(BaseModel):
    sensor_type: str          # bp | hr | spo2 | temp | accel | sleep
    recorded_at: str          # ISO timestamp
    value: dict               # JSON payload

@app.post("/ingest")
def ingest(payload: ReadingIn, x_device_key: str = Header(...)):
    patient_id = DEVICE_KEYS.get(x_device_key)
    if not patient_id:
        raise HTTPException(401, "Unknown device")
    import json as _json
    rid = execute(
        """INSERT INTO readings (patient_id, sensor_type, value, recorded_at)
           VALUES (?, ?, ?, ?)""",
        (patient_id, payload.sensor_type, _json.dumps(payload.value), payload.recorded_at),
    )
    return {"ok": True, "reading_id": rid}

# =========================================================
# READINGS + ALERTS
# =========================================================
@app.get("/readings/{patient_id}")
def get_readings(patient_id: int, limit: int = 100):
    rows = query(
        """SELECT id, sensor_type, value, recorded_at
           FROM readings WHERE patient_id = ?
           ORDER BY recorded_at DESC LIMIT ?""",
        (patient_id, limit),
    )
    import json as _json
    for r in rows:
        try:
            r["value"] = _json.loads(r["value"])
        except Exception:
            pass
    return rows

@app.get("/alerts/{patient_id}")
def get_alerts(patient_id: int):
    rows = query(
        """SELECT id, severity, category, message, explanation,
                  acknowledged, created_at
           FROM alerts WHERE patient_id = ?
           ORDER BY created_at DESC LIMIT 50""",
        (patient_id,),
    )
    import json as _json
    for r in rows:
        if r["explanation"]:
            try:
                r["explanation"] = _json.loads(r["explanation"])
            except Exception:
                pass
    return rows
# =========================================================
# SIMULATION CONTROL
# =========================================================
import threading
from simulator import run_scenario, SIM_STATE, SCENARIOS

@app.post("/sim/start/{scenario}")
def sim_start(scenario: str, patient_id: int = 1, speed: float = 1.0):
    if SIM_STATE["running"]:
        raise HTTPException(400, f"Already running: {SIM_STATE['scenario']}")
    if scenario not in SCENARIOS:
        raise HTTPException(400, f"Unknown scenario. Use: {list(SCENARIOS.keys())}")
    t = threading.Thread(
        target=run_scenario,
        args=(scenario, patient_id, speed),
        daemon=True,
    )
    t.start()
    return {"ok": True, "scenario": scenario,
            "patient_id": patient_id, "speed": speed}

@app.post("/sim/stop")
def sim_stop():
    SIM_STATE["running"] = False
    return {"ok": True}

@app.get("/sim/status")
def sim_status():
    return SIM_STATE

@app.post("/sim/reset/{patient_id}")
def sim_reset(patient_id: int):
    conn = __import__("db").conn
    conn.execute("DELETE FROM readings WHERE patient_id=?", (patient_id,))
    conn.execute("DELETE FROM alerts   WHERE patient_id=?", (patient_id,))
    conn.commit()
    return {"ok": True, "patient_id": patient_id}
