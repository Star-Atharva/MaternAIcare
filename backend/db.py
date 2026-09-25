"""
MaternAI Care — Database layer.
Uses Python's built-in sqlite3. No installation needed.
The schema in schema.sql is applied automatically on first run.
"""

import sqlite3
import os
from pathlib import Path

# Path to DB file — sits next to this file
BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "maternai.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"

# Single shared connection (fine for hackathon; use a pool in production)
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
conn.row_factory = sqlite3.Row       # lets us access columns by name
conn.execute("PRAGMA foreign_keys = ON;")


def init_db():
    """Apply schema.sql. Idempotent — safe to call on every startup."""
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Missing schema: {SCHEMA_PATH}")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()


def get_db():
    """FastAPI dependency. Yields the shared connection."""
    yield conn


def query(sql: str, params: tuple = ()):
    """SELECT helper — returns list of dicts."""
    cur = conn.execute(sql, params)
    return [dict(row) for row in cur.fetchall()]


def query_one(sql: str, params: tuple = ()):
    """SELECT helper — returns a single dict or None."""
    cur = conn.execute(sql, params)
    row = cur.fetchone()
    return dict(row) if row else None


def execute(sql: str, params: tuple = ()):
    """INSERT/UPDATE/DELETE helper — returns lastrowid."""
    cur = conn.execute(sql, params)
    conn.commit()
    return cur.lastrowid


# Run schema on import
init_db()


if __name__ == "__main__":
    # Quick self-test: print all tables
    rows = query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    print("Tables in", DB_PATH.name)
    for r in rows:
        print(" -", r["name"])