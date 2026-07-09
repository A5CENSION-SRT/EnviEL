# EnviEL - Quick Start

## One-Command Startup

### Windows:
```batch
run-all.bat
```

This single script will:
1. ✅ Close Arduino IDE (frees COM port)
2. ✅ Start Next.js web server
3. ✅ Start Python ML bridge
4. ✅ Open two terminal windows automatically

## What Starts

| Component | Port | URL |
|-----------|------|-----|
| Next.js Server | 3000 | http://localhost:3000 |
| ML Debug Dashboard | 3000 | http://localhost:3000/dashboard/ml-debug |
| Python Bridge | COM3 | Serial bridge to Arduino |

## Before Running

### Arduino Upload (One-time):
1. Open Arduino IDE manually
2. File → Open → `SentinelSound_Uno.ino`
3. Sketch → Include Library → Manage Libraries → Install `LiquidCrystal_I2C`
4. Tools → Board → Arduino Uno
5. Tools → Port → COM3
6. Upload (Ctrl+U)
7. Close Arduino IDE

## After Startup

Two new terminal windows open:

**Terminal 1: Next.js Server**
- Shows API requests
- Port 3000 ready
- Keep running

**Terminal 2: Python Bridge**
- Shows ML inference results
- Real-time gunshot detection logs
- Keep running

## Access Dashboard

Open browser: **http://localhost:3000/dashboard/ml-debug**

See:
- 📊 Real-time statistics
- 📈 Confidence charts
- 📋 Detection history
- 🔄 Auto-refreshes every 2 seconds

## Stop Everything

Just close the two terminal windows.

## Troubleshooting

**"Arduino not found"**
- Check Arduino is on COM3: Device Manager
- Upload sketch first via Arduino IDE

**"Port already in use"**
- Close Arduino IDE
- Run `run-all.bat` again

**Python crashes**
- Check Arduino is sending data (serial monitor in Arduino IDE)
- Verify gunshot_animal_model.pkl exists
