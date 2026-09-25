"""
Train 1D-CNN on synthetic vitals windows for temporal anomaly detection.
Run: python train_cnn.py
Output: cnn_model.pt
"""

import os
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

WINDOW = 20          # 20 timesteps
CHANNELS = 4         # systolic, diastolic, HR, SpO2
N_SAMPLES = 6000     # 2000 per class

HERE = os.path.dirname(__file__)


# =========================================================
# SYNTHETIC DATA GENERATION
# =========================================================
def make_normal():
    """Stable vitals around healthy baseline."""
    sys_v = np.random.normal(115, 4, WINDOW)
    dia_v = np.random.normal(75, 3, WINDOW)
    hr_v  = np.random.normal(82, 5, WINDOW)
    sp_v  = np.random.normal(98, 0.8, WINDOW)
    return np.stack([sys_v, dia_v, hr_v, sp_v], axis=1)


def make_preeclampsia():
    """BP rising gradually, HR mildly up."""
    start = np.random.uniform(115, 125)
    slope = np.random.uniform(1.5, 3.0)
    sys_v = start + slope * np.arange(WINDOW) + np.random.normal(0, 2, WINDOW)
    dia_v = sys_v * 0.65 + np.random.normal(0, 2, WINDOW)
    hr_v  = 82 + np.arange(WINDOW) * 0.8 + np.random.normal(0, 3, WINDOW)
    sp_v  = np.random.normal(97, 1, WINDOW)
    return np.stack([sys_v, dia_v, hr_v, sp_v], axis=1)


def make_hemorrhage():
    """BP dropping, HR spiking, SpO2 falling."""
    sys_v = 115 - np.arange(WINDOW) * 2 + np.random.normal(0, 2, WINDOW)
    dia_v = 75 - np.arange(WINDOW) * 1 + np.random.normal(0, 2, WINDOW)
    hr_v  = 82 + np.arange(WINDOW) * 3 + np.random.normal(0, 4, WINDOW)
    sp_v  = 98 - np.arange(WINDOW) * 0.4 + np.random.normal(0, 0.7, WINDOW)
    return np.stack([sys_v, dia_v, hr_v, sp_v], axis=1)


def build_dataset():
    X, y = [], []
    # Class 0: normal
    for _ in range(N_SAMPLES // 3):
        X.append(make_normal()); y.append(0)
    # Class 1: warning (preeclampsia-like, mild)
    for _ in range(N_SAMPLES // 3):
        X.append(make_preeclampsia()); y.append(1)
    # Class 2: critical (hemorrhage-like, severe)
    for _ in range(N_SAMPLES // 3):
        X.append(make_hemorrhage()); y.append(2)
    X = np.array(X, dtype=np.float32)
    y = np.array(y, dtype=np.int64)
    return X, y


# =========================================================
# MODEL
# =========================================================
class VitalsCNN(nn.Module):
    def __init__(self, channels=CHANNELS, n_classes=3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(channels, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool1d(2),
            nn.Conv1d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),    # -> (batch, 64, 1)
        )
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, n_classes),
        )

    def forward(self, x):
        # x: (batch, channels, timesteps)
        return self.head(self.net(x))


# =========================================================
# TRAINING
# =========================================================
def main():
    print("Generating synthetic data...")
    X, y = build_dataset()
    # Normalize each channel by mean/std across dataset
    mean = X.mean(axis=(0, 1), keepdims=True)
    std  = X.std(axis=(0, 1), keepdims=True) + 1e-6
    X = (X - mean) / std
    np.save(os.path.join(HERE, "cnn_norm_mean.npy"), mean.squeeze())
    np.save(os.path.join(HERE, "cnn_norm_std.npy"), std.squeeze())

    # Transpose for Conv1D: (batch, channels, timesteps)
    X = np.transpose(X, (0, 2, 1))

    split = int(0.8 * len(X))
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    train_ds = TensorDataset(torch.tensor(X_train), torch.tensor(y_train))
    test_ds  = TensorDataset(torch.tensor(X_test),  torch.tensor(y_test))
    train_dl = DataLoader(train_ds, batch_size=64, shuffle=True)
    test_dl  = DataLoader(test_ds, batch_size=128)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = VitalsCNN().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()

    print(f"Training on {device}...")
    for epoch in range(10):
        model.train()
        total_loss = 0
        for xb, yb in train_dl:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            opt.step()
            total_loss += loss.item()
        print(f"  Epoch {epoch+1:2d}  loss={total_loss/len(train_dl):.4f}")

    # Evaluate
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for xb, yb in test_dl:
            xb, yb = xb.to(device), yb.to(device)
            preds = model(xb).argmax(dim=1)
            correct += (preds == yb).sum().item()
            total += len(yb)
    print(f"\nTest accuracy: {correct/total:.4f}")

    out = os.path.join(HERE, "cnn_model.pt")
    torch.save(model.state_dict(), out)
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()