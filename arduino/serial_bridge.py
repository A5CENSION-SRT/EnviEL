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
import json
from datetime import datetime
from collections import deque

import joblib
import serial
import numpy as np

try:
    import librosa
except ImportError:
    print('[bridge] ERROR: librosa not installed.  Run: pip install librosa')
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────

SERIAL_PORT = 'COM3'           # Arduino Uno R3 (Windows)
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

NODE_ID = 'SN-001'
ZONE    = 'Zone A - Gopalaswamy Betta'

# ── Paths ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(SCRIPT_DIR, '..', 'data',  'enviel.db')
MODEL_PATH = os.path.join(SCRIPT_DIR, '..', 'gunshot_animal_model.pkl')

# ── ML Model ──────────────────────────────────────────────────────────────────

def get_timestamp():
    """Get current timestamp in HH:MM:SS.mmm format"""
    return datetime.now().strftime('%H:%M:%S.%f')[:-3]


def load_model():
    model = joblib.load(MODEL_PATH)
    print(f'[bridge] Model  : {model.__class__.__name__}')
    print(f'[bridge] Classes: {model.classes_}  (1 = gunshot)')
    print(f'[bridge] Features expected: {model.n_features_in_}')
    return model


# ── Debug Logger ──────────────────────────────────────────────────────────────

class DebugLogger:
    """Tracks inference results for real-time monitoring"""
    def __init__(self, max_history=50):
        self.history = deque(maxlen=max_history)
        self.stats = {
            'total_windows': 0,
            'gunshot_detections': 0,
            'false_positives': 0,
            'avg_confidence': 0.0,
            'last_updated': None
        }
    
    def log_inference(self, window_idx, amplitude, is_gunshot, confidence, features_mean):
        """Log a single inference result"""
        entry = {
            'timestamp': datetime.now().isoformat(),
            'window': window_idx,
            'amplitude': amplitude,
            'is_gunshot': is_gunshot,
            'confidence': round(confidence, 4),
            'features_mean': round(float(features_mean), 4)
        }
        self.history.append(entry)
        
        # Update stats
        self.stats['total_windows'] += 1
        if is_gunshot:
            self.stats['gunshot_detections'] += 1
        self.stats['avg_confidence'] = round(confidence, 4)
        self.stats['last_updated'] = datetime.now().isoformat()
    
    def print_dashboard(self):
        """Print a formatted debug dashboard"""
        print('\n' + '='*80)
        print(f"  ML MODEL DEBUG DASHBOARD — {datetime.now().strftime('%H:%M:%S')}")
        print('='*80)
        
        print(f"\n📊 STATISTICS:")
        print(f"   Total windows processed: {self.stats['total_windows']}")
        print(f"   Gunshot detections: {self.stats['gunshot_detections']}")
        print(f"   Current confidence: {self.stats['avg_confidence']:.4f}")
        
        if self.history:
            print(f"\n📋 RECENT INFERENCES (last {len(self.history)} windows):")
            print(f"   {'Window':<8} {'Time':<12} {'Amp':<6} {'Result':<10} {'Confidence':<12}")
            print(f"   {'-'*60}")
            for entry in list(self.history)[-10:]:
                time_str = entry['timestamp'].split('T')[1][:8]
                result = "🔴 GUNSHOT" if entry['is_gunshot'] else "✅ Clear"
                print(f"   {entry['window']:<8} {time_str:<12} "
                      f"{entry['amplitude']:<6} {result:<10} {entry['confidence']:<12.4f}")
        
        print('\n' + '='*80 + '\n')
    
    def save_to_file(self, filepath='ml_debug_log.json'):
        """Save debug log to JSON file"""
        with open(filepath, 'w') as f:
            json.dump({
                'stats': self.stats,
                'recent_history': list(self.history)
            }, f, indent=2)


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


def backend_recently_active(conn: sqlite3.Connection, seconds: int = 30) -> bool:
    """
    Check if the Next.js backend received any audio events in the last `seconds`.
    If so, yield to the mobile app and skip serial ML processing.
    """
    try:
        row = conn.execute(
            "SELECT COUNT(*) AS c FROM audio_events WHERE received_at >= datetime('now', ?)",
            (f'-{seconds} seconds',)
        ).fetchone()
        return row['c'] > 0 if row else False
    except Exception:
        return False

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

def get_timestamp():
    """Get current timestamp in HH:MM:SS.mmm format"""
    return datetime.now().strftime('%H:%M:%S.%f')[:-3]


def run(model, conn: sqlite3.Connection, debug_logger: DebugLogger):
    buffer       = bytearray()
    window_index = 0

    print(f'[bridge] {get_timestamp()} Opening serial port {SERIAL_PORT} @ {BAUD_RATE} baud ...')

    with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as ser:
        # Flush any stale bytes that accumulated during Arduino boot
        time.sleep(2)
        ser.reset_input_buffer()

        print(f'[bridge] {get_timestamp()} Connected. Streaming {WINDOW_BYTES} bytes/window '
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
                ts = get_timestamp()

                # ── Noise gate ────────────────────────────────────────────
                raw          = np.frombuffer(window, dtype=np.uint8)
                peak_to_peak = int(raw.max()) - int(raw.min())

                if peak_to_peak < NOISE_GATE_AMPLITUDE:
                    print(f'[gate]      {ts}  #{window_index:04d}  '
                          f'amp={peak_to_peak:3d} < {NOISE_GATE_AMPLITUDE} — too quiet, skipped')
                    # Don't send anything back; Arduino keeps streaming
                    continue

                # ── Backend activity check ─────────────────────────────
                if backend_recently_active(conn, seconds=30):
                    print(f'[bridge]    {ts}  #{window_index:04d}  '
                          f'amp={peak_to_peak:3d}  — mobile app active, skipping serial ML')
                    ser.write(b'N')  # keep Arduino happy
                    continue

                # ── ML inference ──────────────────────────────────────────
                try:
                    features   = extract_features(window)
                    pred       = model.predict([features])[0]
                    proba      = model.predict_proba([features])[0]

                    # classes_ = [0, 1]  →  proba[1] = P(gunshot)
                    is_gunshot   = bool(pred == 1)
                    gunshot_prob = float(proba[1])

                    tag = '🔴 *** GUNSHOT ***' if is_gunshot else '✅ clear'
                    print(f'[inference] {ts}  #{window_index:04d}  '
                          f'amp={peak_to_peak:3d}  '
                          f'P(gunshot)={gunshot_prob:.3f}  →  {tag}')

                    # Log to debug logger
                    debug_logger.log_inference(
                        window_index, peak_to_peak, is_gunshot, gunshot_prob, features.mean()
                    )

                    # Send single-byte result back to Arduino
                    ser.write(b'G' if is_gunshot else b'N')

                    if is_gunshot:
                        upsert_node(conn)
                        save_gunshot(conn, gunshot_prob)
                    
                    # Print dashboard every 10 windows
                    if window_index % 10 == 0:
                        debug_logger.print_dashboard()
                        debug_logger.save_to_file()

                except Exception as exc:
                    print(f'[bridge] {get_timestamp()} Inference error: {exc}')
                    ser.write(b'N')


def main():
    print('=' * 70)
    print(' EnviEL ML Serial Bridge')
    print('=' * 70)
    print(f'[bridge] {get_timestamp()} Model : {os.path.abspath(MODEL_PATH)}')
    print(f'[bridge] {get_timestamp()} DB    : {os.path.abspath(DB_PATH)}')
    print(f'[bridge] {get_timestamp()} Port  : {SERIAL_PORT}\n')

    model = load_model()
    conn  = get_conn()
    upsert_node(conn)
    
    # Initialize debug logger
    debug_logger = DebugLogger(max_history=50)

    while True:
        try:
            run(model, conn, debug_logger)

        except serial.SerialException as exc:
            print(f'[bridge] {get_timestamp()} Serial error: {exc}  — retrying in 5 s')
            time.sleep(5)

        except KeyboardInterrupt:
            print(f'\n[bridge] {get_timestamp()} Stopped by user.')
            debug_logger.save_to_file()
            conn.close()
            sys.exit(0)

        except Exception as exc:
            print(f'[bridge] {get_timestamp()} Unexpected error: {exc}  — retrying in 5 s')
            time.sleep(5)


if __name__ == '__main__':
    main()
