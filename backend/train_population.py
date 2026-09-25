"""
Train Random Forest on UCI Maternal Health Risk dataset.
Run: python train_population.py
Output: population_model.pkl
"""

import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

HERE = os.path.dirname(__file__)
DATA = os.path.join(HERE, "..", "data", "maternal_health_risk.csv")

df = pd.read_csv(DATA)
print("Columns:", df.columns.tolist())
print("Shape:", df.shape)
print(df.head())

# Standard UCI column names
FEATURES = ["Age", "SystolicBP", "DiastolicBP", "BodyTemp", "HeartRate"]
X = df[FEATURES].values

# RiskLevel: "low risk" | "mid risk" | "high risk"
label_map = {"low risk": 0, "mid risk": 1, "high risk": 2}
y = df["RiskLevel"].str.lower().str.strip().map(label_map).values
print("\nLabel distribution:", np.bincount(y))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(n_estimators=200, max_depth=10, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("\nAccuracy:", round(accuracy_score(y_test, y_pred), 4))
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["low", "mid", "high"]))

out_path = os.path.join(HERE, "population_model.pkl")
joblib.dump(model, out_path)
print(f"\n✅ Saved: {out_path}")