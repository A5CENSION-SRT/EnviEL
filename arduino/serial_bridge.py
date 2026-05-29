#!/usr/bin/env python3
"""
EnviEL ML Serial Bridge
========================
Reads raw 8-bit audio bytes from the Arduino Uno (streaming at 4 kHz),
runs them through gunshot_animal_model.pkl on every 1-second window,
writes gunshot events to the SQLite database, and sends the result
back to the Arduino so it can update the LCD.

Setup (one-time):
    pip install pyserial librosa scikit-learn numpy

Usage:
    python arduino/serial_bridge.py

Change SERIAL_PORT below if needed:
    Linux / macOS:  /dev/ttyUSB0  or  /dev/cu.usbserial-XXXXX
    Windows:        COM3
"""

import os
import sys
import time
import sqlite3

import joblib
import serial
import numpy as np

try:
    import librosa
except ImportError:
    print('[bridge] ERROR: librosa not installed.  Run: pip install librosa')
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────

SERIAL_PORT = '/dev/ttyACM0'   # Arduino Uno R3
BAUD_RATE   = 115200           # must match the Arduino sketch

SAMPLE_RATE  = 4000            # Hz — matches the Arduino ADC loop (250 µs / sample)
WINDOW_SECS  = 1.0             # seconds per inference window
WINDOW_BYTES = int(SAMPLE_RATE * WINDOW_SECS)  # 4000 bytes = 1 second of audio

# ── Noise gate ────────────────────────────────────────────────────────────────
# Peak-to-peak amplitude (0–255 scale) below which the window is discarded
# without running ML inference.  Speech at ~60 cm typically produces 20–60.
# Shouts reach ~80–120.  A nearby gunshot should be 140+.
# Raise this value if ambient noise causes false positives; lower it if real
# gunshots are being missed.
NOISE_GATE_AMPLITUDE = 110

NODE_ID = 'NODE-001'
ZONE    = 'Bandipur-Zone-A'

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(SCRIPT_DIR, '..', 'data',  'enviel.db')
MODEL_PATH = os.path.join(SCRIPT_DIR, '..', 'gunshot_animal_model.pkl')

# ── ML Model ──────────────────────────────────────────────────────────────────

def load_model():
    model = joblib.load(MODEL_PATH)
    print(f'[bridge] Model  : {model.__class__.__name__}')
    print(f'[bridge] Classes: {model.classes_}  (1 = gunshot)')
    print(f'[bridge] Features expected: {model.n_features_in_}')
    return model


def extract_features(raw_bytes: bytes) -> np.ndarray:
    """
    Convert 4000 raw 8-bit samples into 26 features that match the
    training pipeline of gunshot_animal_model.pkl:

        13 MFCC coefficient means   (mfcc.mean over time frames)
      + 13 MFCC coefficient stds    (mfcc.std  over time frames)
      = 26 features total

    The 8-bit samples from the Arduino are unsigned [0, 255].
    We re-centre to [-1, 1] before calling librosa.
    """
    audio = (np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0

    mfcc      = librosa.feature.mfcc(y=audio, sr=SAMPLE_RATE, n_mfcc=13)
    feat_mean = mfcc.mean(axis=1)          # shape (13,)
    feat_std  = mfcc.std(axis=1)           # shape (13,)
    return np.concatenate([feat_mean, feat_std])  # shape (26,)

# ── Database ──────────────────────────────────────────────────────────────────

def get_conn() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
    conn = sqlite3.connect(os.path.abspath(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def upsert_node(conn: sqlite3.Connection):
    conn.execute("""
        INSERT INTO sensor_nodes (id, name, zone, status, last_seen)
        VALUES (?, ?, ?, 'online', datetime('now'))
        ON CONFLICT(id) DO UPDATE SET
            status    = 'online',
            last_seen = datetime('now')
    """, (NODE_ID, f'Node {NODE_ID}', ZONE))
    conn.commit()


def save_gunshot(conn: sqlite3.Connection, confidence: float):
    conn.execute("""
        INSERT INTO poaching_events
            (node_id, event_type, severity, confidence, verification_status)
        VALUES (?, 'gunshot', 'critical', ?, 'pending')
    """, (NODE_ID, confidence))
    conn.commit()

# ── Main loop ─────────────────────────────────────────────────────────────────

def run(model, conn: sqlite3.Connection):
    buffer       = bytearray()
    window_index = 0

    print(f'[bridge] Opening serial port {SERIAL_PORT} @ {BAUD_RATE} baud ...')

    with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as ser:
        # Flush any stale bytes that accumulated during Arduino boot
        time.sleep(2)
        ser.reset_input_buffer()

        print(f'[bridge] Connected. Streaming {WINDOW_BYTES} bytes/window '
              f'({WINDOW_SECS:.1f} s @ {SAMPLE_RATE} Hz)\n')

        while True:
            # Read whatever bytes are available (non-blocking drain)
            waiting = ser.in_waiting
            if waiting > 0:
                buffer.extend(ser.read(waiting))
            else:
                chunk = ser.read(64)   # small blocking read to avoid busy-loop
                if chunk:
                    buffer.extend(chunk)

            # Once we have a full 1-second window, apply noise gate then ML
            if len(buffer) >= WINDOW_BYTES:
                window        = bytes(buffer[:WINDOW_BYTES])
                buffer        = buffer[WINDOW_BYTES:]
                window_index += 1

                # ── Noise gate ────────────────────────────────────────────
                raw          = np.frombuffer(window, dtype=np.uint8)
                peak_to_peak = int(raw.max()) - int(raw.min())

                if peak_to_peak < NOISE_GATE_AMPLITUDE:
                    print(f'[gate]      #{window_index:04d}  '
                          f'amp={peak_to_peak:3d} < {NOISE_GATE_AMPLITUDE} — too quiet, skipped')
                    # Don't send anything back; Arduino keeps streaming
                    continue

                # ── ML inference ──────────────────────────────────────────
                try:
                    features   = extract_features(window)
                    pred       = model.predict([features])[0]
                    proba      = model.predict_proba([features])[0]

                    # classes_ = [0, 1]  →  proba[1] = P(gunshot)
                    is_gunshot   = bool(pred == 1)
                    gunshot_prob = float(proba[1])

                    tag = '*** GUNSHOT ***' if is_gunshot else 'clear'
                    print(f'[inference] #{window_index:04d}  '
                          f'amp={peak_to_peak:3d}  '
                          f'P(gunshot)={gunshot_prob:.3f}  →  {tag}')

                    # Send single-byte result back to Arduino
                    ser.write(b'G' if is_gunshot else b'N')

                    if is_gunshot:
                        upsert_node(conn)
                        save_gunshot(conn, gunshot_prob)

                except Exception as exc:
                    print(f'[bridge] Inference error: {exc}')
                    ser.write(b'N')


def main():
    print('=' * 50)
    print(' EnviEL ML Serial Bridge')
    print('=' * 50)
    print(f'[bridge] Model : {os.path.abspath(MODEL_PATH)}')
    print(f'[bridge] DB    : {os.path.abspath(DB_PATH)}')
    print(f'[bridge] Port  : {SERIAL_PORT}\n')

    model = load_model()
    conn  = get_conn()
    upsert_node(conn)

    while True:
        try:
            run(model, conn)

        except serial.SerialException as exc:
            print(f'[bridge] Serial error: {exc}  — retrying in 5 s')
            time.sleep(5)

        except KeyboardInterrupt:
            print('\n[bridge] Stopped by user.')
            conn.close()
            sys.exit(0)

        except Exception as exc:
            print(f'[bridge] Unexpected error: {exc}  — retrying in 5 s')
            time.sleep(5)


if __name__ == '__main__':
    main()
