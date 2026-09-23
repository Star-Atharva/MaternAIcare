-- MaternAI Care — Database Schema (SQLite)
-- Hackathon version. Swap to Postgres later by changing AUTOINCREMENT -> SERIAL.

PRAGMA foreign_keys = ON;

-- =========================================================
-- USERS — auth for 3 roles
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password      TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('mother','caretaker','clinic')),
    full_name     TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- PATIENTS — personal info, 1:1 with a mother user
-- =========================================================
CREATE TABLE IF NOT EXISTS patients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    age           INTEGER,
    weight_kg     REAL,
    height_cm     REAL,
    bmi           REAL,
    blood_group   TEXT,
    phone         TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- PREGNANCY INFO — static per pregnancy
-- =========================================================
CREATE TABLE IF NOT EXISTS pregnancy_info (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id         INTEGER UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    trimester          INTEGER CHECK (trimester IN (1,2,3)),
    expected_due_date  DATE,
    gravida            INTEGER,
    para               INTEGER,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- BASELINE VITALS — personal normal for anomaly detection
-- =========================================================
CREATE TABLE IF NOT EXISTS baseline_vitals (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id     INTEGER UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    systolic       REAL,
    diastolic      REAL,
    pulse          REAL,
    spo2           REAL,
    temp           REAL,
    sleep_quality  INTEGER,
    stress_level   INTEGER,
    activity       TEXT,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- ACCESS MAP — who can see whose data
-- =========================================================
CREATE TABLE IF NOT EXISTS access_map (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    viewer_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    patient_id  INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    role        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(viewer_id, patient_id)
);

-- =========================================================
-- DEVICES — patch / wristband registry
-- =========================================================
CREATE TABLE IF NOT EXISTS devices (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    device_key   TEXT UNIQUE NOT NULL,
    patient_id   INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    device_type  TEXT,
    last_seen    TIMESTAMP
);

-- =========================================================
-- READINGS — every sensor value + daily manual entries
-- value is JSON text so different sensors fit without schema change
-- =========================================================
CREATE TABLE IF NOT EXISTS readings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    sensor_type  TEXT NOT NULL,
    value        TEXT NOT NULL,
    recorded_at  TIMESTAMP NOT NULL,
    ingested_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_readings_patient_time
    ON readings(patient_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_readings_sensor
    ON readings(patient_id, sensor_type, recorded_at DESC);

-- =========================================================
-- ALERTS — anomaly detector output, with explanations
-- =========================================================
CREATE TABLE IF NOT EXISTS alerts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id    INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    severity      TEXT CHECK (severity IN ('info','warning','critical')),
    category      TEXT,
    message       TEXT,
    explanation   TEXT,
    acknowledged  INTEGER DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_patient_time
    ON alerts(patient_id, created_at DESC);