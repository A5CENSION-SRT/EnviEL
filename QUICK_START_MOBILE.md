# Quick Start: EnviEL Mobile Integration

## 30-Second Overview

You now have a **VLC-style Android audio player** that connects to your EnviEL dashboard to show real-time gunshot 🔫 and animal 🦁 detection audio playback.

---

## Setup (2 minutes)

### Step 1: Generate Audio Files
```bash
node scripts/generate-audio-samples.js
```
✅ Creates 10 WAV files (gunshot + animal)

### Step 2: Start Web Server
```bash
npm run dev
```
✅ Dashboard ready at `http://localhost:3000/dashboard`

### Step 3: Build Android App
```bash
cd android
./gradlew installDebug
```
✅ App installed on phone/emulator

### Step 4: Configure Server URL
- Tap ⚙️ Settings in app
- Enter: `http://YOUR_IP:3000`
- Tap Save

✅ Done! System ready.

---

## How It Works (30 seconds)

```
📱 Phone: Play audio
    ↓
📱 Phone: Sends event to server
    ↓
💻 Dashboard: Updates in real-time
    ↓
✅ Gunshot/Animal shows on screen
```

**That's it!** The dashboard updates every 10 seconds with mobile playback events.

---

## Test It Now

1. **Open mobile app** → Select Gunshot 🔫
2. **Play first audio file** 
3. **Look at dashboard** → "Mobile Audio Player Activity" section
4. **See the event** with file name, type, and duration

---

## Demo Workflow

Perfect for demonstration:

1. **Show the Setup**
   - "This is our mobile field app"
   - "It plays detection audio files"

2. **Play Audio on Phone**
   - Tap 🔫 Gunshot category
   - Play first file
   - "Sending to dashboard in real-time..."

3. **Show Dashboard**
   - "Here we see the gunshot detection"
   - "Mobile playback synced automatically"

4. **Switch Categories**
   - "Let's play animal detection"
   - Tap 🦁 Animal
   - Play file
   - "Both types appear on dashboard"

5. **Show Offline Mode**
   - "Works offline too"
   - Enable airplane mode on phone
   - Play audio
   - "Events queue and sync when reconnected"

---

## Key Files

| File | Purpose |
|------|---------|
| `android/app/src/main/kotlin/.../MainActivity.kt` | Main audio player UI |
| `app/api/audio-files/route.ts` | Serves audio file list |
| `app/api/audio-events/route.ts` | Receives playback events |
| `app/dashboard/page.tsx` | Shows mobile events |
| `public/audio/` | Audio file storage |
| `scripts/generate-audio-samples.js` | Generates WAV files |

---

## Customization Tips

### 🎵 Use Your Own Audio
1. Place WAV files in `public/audio/gunshot/` or `public/audio/animal/`
2. Update file list in `/app/api/audio-files/route.ts`
3. Restart server

### 🎨 Change Colors
Edit `android/app/src/main/res/drawable/btn_category_active.xml`:
```xml
<solid android:color="#FF6B6B" /> <!-- Change this color -->
```

### 📱 Change Server URL
Settings ⚙️ button in app → Enter new IP:port

---

## Troubleshooting

### "Can't connect to server"
- Check IP in Settings ⚙️
- Ensure both on same WiFi
- Verify `npm run dev` is running

### "No audio plays"
- Run: `node scripts/generate-audio-samples.js`
- Check files exist: `public/audio/gunshot/detection_001.wav`

### "Dashboard doesn't update"
- Play audio on phone first (generates event)
- Check app isn't in offline mode
- Refresh browser page

---

## Documentation

- **Full Guide**: See `MOBILE_INTEGRATION.md`
- **Complete Overview**: See `IMPLEMENTATION_COMPLETE.md`
- **Android Build**: See `android/README.md`

---

## Next Steps

✅ Show system to team  
✅ Customize with real audio files  
✅ Deploy to staging environment  
✅ Train rangers on mobile app usage  

---

**Need Help?** Check the troubleshooting section in `MOBILE_INTEGRATION.md`

---

*Version 1.0 • Ready for Demonstration*
