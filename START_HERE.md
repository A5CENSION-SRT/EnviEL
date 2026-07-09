# 🎬 START HERE - EnviEL Demo Setup

**You want to**: Run EnviEL dashboard locally + use VLC app to mock detections

**Time needed**: 15 minutes setup + 5 minutes for demo

---

## 3-Step Quick Start

### Step 1️⃣ Generate Audio & Start Dashboard (3 minutes)

```bash
cd c:\coding\EnviEL

# Generate 10 fake detection audio files
node scripts/generate-audio-samples.js

# Start dashboard on localhost:3000
npm run dev
```

✅ Open browser: **http://localhost:3000/dashboard**

---

### Step 2️⃣ Build & Deploy VLC App (10 minutes)

```bash
cd c:\coding\EnviEL\android

# Build Android app
./gradlew build

# Install to phone or emulator
./gradlew installDebug
```

✅ VLC app opens on your device

---

### Step 3️⃣ Configure & Test (2 minutes)

**On phone:**
1. Tap ⚙️ Settings (top right)
2. Enter server: `http://192.168.1.100:3000`
   - Replace with YOUR laptop IP (find with `ipconfig`)
3. Tap Save

**Test it:**
1. Tap 🔫 GUNSHOT
2. Play first audio file
3. Check dashboard - should show new event! ✅

---

## What Happens When You Play Audio

```
Phone (VLC App)          →  Network  →  Laptop (Dashboard)
Play gunshot audio       →   WiFi    →  Shows "🔫 GUNSHOT DETECTED"
File: detection_001.wav  →  :3000    →  Duration: 3.5s | Time: 14:32:10
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `DEMO_SETUP_GUIDE.md` | Full detailed guide with troubleshooting |
| `DEMO_QUICK_REFERENCE.txt` | Cheat sheet for demo |
| `SYSTEM_OVERVIEW.md` | How everything works together |
| `app/dashboard/page.tsx` | Where mobile events appear |
| `app/api/audio-events/` | Receives playback from phone |
| `android/app/src/...` | VLC app source code |
| `public/audio/` | Fake detection audio files |

---

## Your Demo in 5 Minutes

```
[30 sec]  Show dashboard
[2 min]   Play gunshot → Dashboard updates 🔫
[1 min]   Play animal → Dashboard updates 🦁
[1 min]   Show offline mode works
[30 sec]  Explain field workflow
```

---

## Troubleshooting Fast Lane

| Problem | Fix |
|---------|-----|
| Phone can't find server | Check IP: `ipconfig`, update in VLC settings |
| Dashboard shows nothing | Play audio on VLC first, wait 10 seconds |
| Audio won't play | Regenerate: `node scripts/generate-audio-samples.js` |
| Won't install | Try: `./gradlew uninstallDebug` first |

---

## One Command to Remember

```bash
# Everything on one screen
npm run dev
```

That's your dashboard. Everything else flows from there.

---

## After Demo

```bash
# Stop dashboard: Ctrl+C in terminal

# Remove app from phone: 
./gradlew uninstallDebug

# To run again later:
npm run dev  # (audio files already exist)
```

---

## Next Steps

1. ✅ Run Step 1 (audio + dashboard)
2. ✅ Test dashboard loads
3. ✅ Run Step 2 (build VLC)
4. ✅ Run Step 3 (configure + test)
5. ✅ Do demo!

---

**Want detailed help?** → Read `DEMO_SETUP_GUIDE.md`

**Need quick commands?** → Read `DEMO_QUICK_REFERENCE.txt`

**Want system overview?** → Read `SYSTEM_OVERVIEW.md`

---

**Ready?** Start with Step 1 above! 🚀
