# EnviEL + VLC Demo Setup Guide

**Goal**: Run EnviEL dashboard on laptop + mock gunshot/animal detections using VLC Android app

---

## Part 1: Setup EnviEL Dashboard (Laptop)

### Step 1: Generate Audio Files
```bash
cd c:\coding\EnviEL
node scripts/generate-audio-samples.js
```
✅ Creates 10 fake detection audio files (5 gunshot + 5 animal)

### Step 2: Start Next.js Server
```bash
npm run dev
```
✅ Dashboard runs at: `http://localhost:3000/dashboard`

**Dashboard will show:**
- Sensor network status
- Real-time event feed
- **NEW: Mobile Audio Player Activity** (shows when app plays audio)

---

## Part 2: Setup VLC Android App (Phone/Emulator)

### Option A: Android Phone (Recommended for Demo)

1. **Build the app:**
   ```bash
   cd android
   ./gradlew build
   ./gradlew installDebug
   ```

2. **Find Your Laptop IP:**
   ```bash
   ipconfig
   ```
   Look for IPv4 address like: `192.168.1.100` or `192.168.x.x`

3. **Configure Server in VLC App:**
   - Open VLC app on phone
   - Tap ⚙️ Settings (top right)
   - Enter: `http://YOUR_LAPTOP_IP:3000`
   - Tap Save
   - ✅ App connects to your laptop

### Option B: Android Emulator (Alternative)

```bash
# From Android Studio
1. AVD Manager → Create new emulator
2. Start emulator
3. In emulator terminal:
   adb shell ip route | awk '{print $3}' | head -1
4. Use that IP in VLC settings
```

---

## Part 3: Demo Flow (5 Minutes)

### Scene 1: Show Dashboard (30 seconds)
```
Browser: Open http://localhost:3000/dashboard
Point out:
- Sensor network status (green lights = online)
- Real-time event feed showing detections
- NEW: "Mobile Audio Player Activity" section (empty now)
```

### Scene 2: Play Gunshot Audio (2 minutes)
```
Phone: Open VLC app
Phone: Tap 🔫 GUNSHOT tab
Phone: Tap first audio file
Phone: PLAY ▶️

Laptop: Check dashboard - shows new event!
Dashboard: Displays "🔫 GUNSHOT DETECTED"
Dashboard: Shows file name, duration, timestamp
Narrator: "Real-time sync from mobile to dashboard"
```

### Scene 3: Switch to Animal (2 minutes)
```
Phone: Tap 🦁 ANIMAL tab
Phone: Tap first audio file
Phone: PLAY ▶️

Laptop: Check dashboard - shows animal event!
Dashboard: Displays "🦁 ANIMAL DETECTED"
Narrator: "Both detection types work seamlessly"
```

### Scene 4: Show Offline Mode (1 minute)
```
Phone: Enable Airplane Mode
Phone: Still tap play - audio continues!
Phone: Notice "OFFLINE - Using Local Audio" message
Narrator: "Works in field without connectivity"
```

---

## Quick Troubleshooting

### Problem: Phone Can't Find Server
**Check:**
1. Both phone and laptop on same WiFi? ✓
2. Firewall blocking port 3000?
   - Windows: Allow `node.exe` through firewall
3. VLC settings has correct IP? ✓

**Fix:**
```bash
# On phone, try: Settings → Enter laptop IP again
http://192.168.1.YOUR_NUMBER:3000
```

### Problem: Dashboard Shows Nothing
**Check:**
1. Is `npm run dev` running? ✓
2. Did you play audio on VLC? (must play first)
3. Wait 10 seconds (dashboard refreshes every 10s)

**Fix:**
```bash
# Manually test API
# Open browser and visit:
http://localhost:3000/api/audio-events
# Should return JSON array
```

### Problem: Audio Doesn't Play on Phone
**Fix:**
```bash
# Regenerate audio files
node scripts/generate-audio-samples.js

# Check files exist
ls public/audio/gunshot/
# Should see: detection_001.wav, detection_002.wav, etc.
```

---

## Files Being Used

```
For Dashboard:
  ✅ app/api/audio-files/route.ts        (serves audio list)
  ✅ app/api/audio-events/route.ts       (receives playback events)
  ✅ app/dashboard/page.tsx              (shows mobile events)
  ✅ public/audio/gunshot/*.wav          (demo audio files)
  ✅ public/audio/animal/*.wav           (demo audio files)

For Android VLC App:
  ✅ android/app/src/main/kotlin/...     (VLC app code)
  ✅ android/app/AndroidManifest.xml     (app config)
  ✅ android/app/build.gradle.kts        (dependencies)
```

---

## Demo Script (Use This!)

### Intro (30 seconds)
> "We're demonstrating EnviEL - an anti-poaching system with mobile audio detection. 
> On the left is our field monitoring dashboard, on the right is our ranger's VLC audio player.
> When a ranger detects audio in the field, it syncs to headquarters in real-time."

### Show Dashboard (30 seconds)
> "This is our headquarters dashboard. We can see:
> - Sensor network status (which nodes are online)
> - Real-time event feed from sensors
> - And here - mobile audio events (currently empty)"

### Play First Audio (2 minutes)
> "Let me play the first detection from the field..."
> [Tap play on VLC]
> "Notice - the dashboard immediately shows the gunshot detection!
> File name, type, duration - all synced in real-time."

### Switch Detection Type (1.5 minutes)
> "Let me show you animal detection..."
> [Tap animal category, play audio]
> "Different audio type, same real-time sync.
> The system can distinguish between threats."

### Show Offline (1 minute)
> "In the field, connectivity isn't guaranteed..."
> [Enable airplane mode]
> "But the app keeps working. Audio plays locally, and when 
> we reconnect [disable airplane mode], events sync automatically."

### Closing (30 seconds)
> "That's EnviEL - real-time threat detection with seamless 
> mobile integration. Perfect for protecting wildlife reserves."

---

## Network Setup Diagram

```
┌─────────────────────────────────────────┐
│         Your Laptop (192.168.x.x)       │
├─────────────────────────────────────────┤
│  Next.js Server: localhost:3000         │
│  ├─ Dashboard displays events           │
│  ├─ API: /api/audio-files               │
│  └─ API: /api/audio-events              │
└────────────▲───────────────────────────┘
             │ WiFi
             │ (192.168.x.x:3000)
             │
┌────────────▼───────────────────────────┐
│        Android Phone on WiFi            │
├─────────────────────────────────────────┤
│  VLC App (org.videolan.vlc.enviel)     │
│  ├─ Plays detection audio               │
│  ├─ Sends events to dashboard           │
│  └─ Works offline with local audio      │
└─────────────────────────────────────────┘
```

---

## Testing Checklist

Before your demo, verify:

- [ ] `npm run dev` runs without errors
- [ ] Dashboard opens at `http://localhost:3000/dashboard`
- [ ] Audio files exist: `ls public/audio/gunshot/detection_001.wav`
- [ ] VLC app installed and starts
- [ ] Can connect VLC to laptop: tap ⚙️, enter IP, save
- [ ] Can play audio on VLC phone
- [ ] Dashboard updates with playback event within 10 seconds
- [ ] Both gunshot (🔫) and animal (🦁) categories work
- [ ] App works offline (airplane mode on phone)

---

## Pro Tips for Demo

1. **Pre-test Everything**: Run through demo 2-3x before showing stakeholders
2. **Have WiFi Ready**: Bring phone on your hotspot as backup
3. **Airplane Mode Ready**: Have it enabled before demo for offline portion
4. **Full Battery**: Demo uses ExoPlayer + WiFi, drains battery fast
5. **Show Logs**: `npm run dev` terminal shows API calls happening
6. **Point at Screen**: Use cursor to highlight dashboard updates

---

## One-Liner Demo Start

If you have time, copy this for quick setup:

```bash
# Terminal 1 - Start dashboard
cd c:\coding\EnviEL && npm run dev

# Terminal 2 - Build & deploy Android app
cd c:\coding\EnviEL\android && ./gradlew installDebug

# Then:
# 1. Find laptop IP: ipconfig
# 2. Enter in VLC Settings: http://YOUR_IP:3000
# 3. Play audio on VLC
# 4. Watch dashboard update
```

---

## What Dashboard Shows

### Normal Operation
```
✅ Connected to EnviEL Server

🔫 Detection_gunshot_001.wav
   GUNSHOT DETECTED  |  3.5s  |  14:32:10

🦁 Detection_animal_001.wav
   ANIMAL DETECTED   |  5.2s  |  14:28:45
```

### Offline Mode
```
⚠️  OFFLINE - Using Local Audio

[Same events, but no sync to server]
[Events queue locally until reconnected]
```

---

## Success Criteria

Demo is successful when:

1. ✅ Dashboard displays real-time updates from VLC app
2. ✅ Gunshot and animal detections show separately  
3. ✅ Both online and offline modes work
4. ✅ No console errors on laptop
5. ✅ Phone doesn't disconnect mid-demo
6. ✅ Audience understands the field → HQ workflow

---

## After the Demo

**To stop everything:**
1. Close browser tab with dashboard
2. Ctrl+C in terminal running `npm run dev`
3. Uninstall VLC app from phone: `./gradlew uninstallDebug`

**To run again later:**
- Same steps, VLC remembers server IP
- Audio files already generated (no need to recreate)
- Next.js rebuilds automatically on changes

---

**That's it! You're ready to demo.** 🎉
