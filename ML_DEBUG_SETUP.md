# ML Model Debug Dashboard Setup

## Overview
You now have a complete debug system to visualize ML model results in real-time. The system consists of:

1. **Python Serial Bridge** - Processes audio from Arduino and runs ML inference
2. **Debug Logger** - Tracks inference results and saves to JSON
3. **Web Dashboard** - Visualizes results in real-time

## Components

### 1. Python Serial Bridge (`arduino/serial_bridge.py`)
Enhanced with:
- ✅ Real-time debug logging
- ✅ Dashboard printout every 10 windows
- ✅ JSON file export (`ml_debug_log.json`)
- ✅ Statistics tracking (total windows, detections, confidence)
- ✅ Terminal output with formatted results

**Features:**
```
📊 STATISTICS:
   Total windows processed: 50
   Gunshot detections: 3
   Current confidence: 0.9876

📋 RECENT INFERENCES:
   Window    Time      Amp    Result      Confidence
   0001      10:23:45  145    🔴 GUNSHOT  0.9876
   0002      10:23:46  45     ✅ Clear    0.0123
```

### 2. Web Dashboard (`app/dashboard/ml-debug/page.tsx`)
**Access at:** `http://localhost:3000/dashboard/ml-debug`

Features:
- 📊 Real-time statistics cards
- 📈 Confidence trend chart
- 📊 Amplitude vs detection bar chart
- 📋 Recent inferences table (last 20 windows)
- 🔄 Auto-refreshes every 2 seconds

### 3. API Endpoint (`app/api/ml-debug/route.ts`)
- Serves debug data from `ml_debug_log.json`
- Accessible at: `http://localhost:3000/api/ml-debug`
- Returns JSON with stats and recent history

## How to Run

### Step 1: Start the Next.js App
```bash
npm install  # if not done already
npm run dev
```
App runs at: `http://localhost:3000`

### Step 2: Upload Arduino Sketch
1. Open Arduino IDE
2. Open `arduino/SentinelSound_Uno.ino`
3. Install library: `LiquidCrystal_I2C` by Frank de Brabander
4. Select Board: Arduino Uno
5. Select Port: COM3 (or your Arduino's port)
6. Click Upload

### Step 3: Start the Python Bridge
In a new terminal:
```bash
# Install dependencies (one-time)
pip install pyserial librosa scikit-learn numpy joblib

# Run the bridge
python arduino/serial_bridge.py
```

**Important:** Update `SERIAL_PORT` in `serial_bridge.py` if needed:
- Windows: `COM3` (check Device Manager)
- Linux: `/dev/ttyUSB0`
- macOS: `/dev/cu.usbserial-XXXXX`

### Step 4: View the Dashboard
Open your browser and go to:
```
http://localhost:3000/dashboard/ml-debug
```

## What You'll See

### Terminal Output (Python Bridge)
- Real-time inference results
- Amplitude measurements
- Gunshot detection with confidence scores
- Formatted dashboard every 10 windows

### Web Dashboard
- Live statistics cards
- Confidence trend chart
- Amplitude analysis
- Detection history table
- Auto-refreshes every 2 seconds

## Debug Data Files

### `ml_debug_log.json`
Location: Project root  
Updated: Every 10 windows  
Contents:
```json
{
  "stats": {
    "total_windows": 50,
    "gunshot_detections": 3,
    "avg_confidence": 0.9876,
    "last_updated": "2024-01-15T10:23:45.123Z"
  },
  "recent_history": [
    {
      "timestamp": "2024-01-15T10:23:45.123Z",
      "window": 1,
      "amplitude": 145,
      "is_gunshot": true,
      "confidence": 0.9876,
      "features_mean": 0.0234
    },
    ...
  ]
}
```

## Troubleshooting

### Dashboard Shows "No debug log available"
- Python bridge is not running
- Start it with: `python arduino/serial_bridge.py`

### Dashboard Not Updating
- Check if `ml_debug_log.json` exists in project root
- Verify Python bridge is still running
- Hard refresh browser (Ctrl+Shift+R)

### Arduino Not Connecting
- Check COM port in Arduino IDE
- Update `SERIAL_PORT` in `serial_bridge.py`
- Verify Arduino sketch is uploaded

### Python Bridge Crashes
- Install missing dependencies: `pip install librosa scikit-learn`
- Check Arduino is sending data (serial monitor in Arduino IDE)
- Verify model file exists: `gunshot_animal_model.pkl`

## Real-Time Workflow

1. **Terminal sees:** Real-time inference logs as audio streams in
2. **Python saves:** `ml_debug_log.json` every 10 windows
3. **API reads:** Latest data from JSON file
4. **Dashboard displays:** Updates every 2 seconds
5. **You analyze:** Trends, confidence, false positives, etc.

## Next Steps

- Monitor detection patterns
- Adjust noise gate threshold if needed
- Train improved models using collected data
- Set up alerts for high-confidence detections
- Integrate with response dispatch system
