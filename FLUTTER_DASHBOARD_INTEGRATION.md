# Flutter VLC App + Next.js Dashboard Integration

## ✅ Complete Setup

### Flutter VLC App (Android)
**Status:** Built & Installed  
**Location:** `/flutterapp/build/app/outputs/flutter-apk/app-debug.apk`  
**Features:**
- ✅ File browser with folder navigation
- ✅ Configurable folder prefix
- ✅ Professional music player at bottom with:
  - Progress bar with seek
  - Play/Pause button (center)
  - Previous/Next buttons
  - Shuffle button
  - Repeat modes (off/all/one)
  - Time display (current/total)
- ✅ Storage permissions
- ✅ Settings for server URL
- ✅ Sends playback events to backend

### Next.js Dashboard
**Status:** Running on localhost:3000  
**Features:**
- ✅ Mobile audio events section
- ✅ Mock ML detection with varying confidence scores
- ✅ Real-time display of playback events
- ✅ Confidence progress bar

---

## 🔄 How It Works (Demo Flow)

### 1. Setup Network
```
Phone: Enable mobile hotspot
Laptop: Connect to phone's hotspot
Get laptop IP: ipconfig (on Windows)
```

### 2. Configure Flutter App
```
Open VLC app on phone
Tap Settings (gear icon ⚙️)
Enter server URL: http://<LAPTOP_IP>:3000
Test connection → Save
```

### 3. Add Audio Files
```
Phone File Manager:
  Download/
    ├── gunshot/
    │   ├── test1.wav
    │   └── test2.wav
    └── animal/
        ├── animal1.wav
        └── animal2.wav
```

### 4. Play Audio & See Dashboard Update
```
VLC App:
  Tap filter icon (⊚) → Type "gunshot"
  See all .wav files in gunshot folder
  Tap any file to play

Dashboard (http://localhost:3000):
  See new entry in "Mobile Audio Player Activity"
  Shows file name, detection type, and confidence %
```

---

## 📊 Mock ML Detection System

### Confidence Score Generation
```typescript
function generateMockMLDetection(audioType: string) {
  const baseConfidence = 0.75 + Math.random() * 0.2;
  
  if (audioType === 'gunshot')
    return { confidence: min(0.95, base + 0.1), type: 'gunshot' };
  
  if (audioType === 'animal')
    return { confidence: min(0.92, base), type: 'animal' };
  
  // Random if unknown
  return { confidence: min(0.88, base), type: random('gunshot'|'animal') };
}
```

### Varying Scores
- **Gunshot files:** 75% - 95% confidence
- **Animal files:** 75% - 92% confidence  
- **Random detection:** Each detection varies
- **No ML model required:** Pure mock for presentation

---

## 🎵 Flutter Player Controls

### Bottom Player Bar (When Playing)
```
File Name
├─ Shuffle (toggles)
├─ Previous (skip back)
├─ Play/Pause (center, orange button)
├─ Next (skip forward)
└─ Repeat (cycles: off → all → one)

Progress:
  [Current Time] ━●━━━━━━ [Total Time]
  (Slider allows seeking)
```

### Player Behavior
- Play starts immediately on file tap
- Duration read from actual .wav file
- Progress updates in real-time
- Shuffle: plays next file in sequence
- Repeat all: loops folder
- Repeat one: loops current file

---

## 📱 Mobile Audio Events Section (Dashboard)

### Display Format
```
📱 Mobile Audio Player Activity

File: gunshot_001.wav
Type: GUNSHOT DETECTED (badge)
Duration: 3.5s • 2 mins ago
Confidence: 87.3% [█████████░]
```

### Event Data Sent to API
```json
POST /api/audio-events
{
  "fileName": "gunshot_001.wav",
  "audioType": "gunshot",
  "duration": 3500,
  "timestamp": 1720547530000
}
```

### API Response with ML Detection
```json
{
  "success": true,
  "message": "GUNSHOT detected (87.3%)",
  "event": {
    "fileName": "gunshot_001.wav",
    "audioType": "gunshot",
    "duration": 3500,
    "receivedAt": "2026-07-09T19:38:50.000Z",
    "confidence": 0.873,
    "mlDetectionType": "gunshot"
  }
}
```

---

## 🚀 Live Demo Steps

### Prerequisites
- Phone charged and connected to hotspot
- Laptop connected to phone's WiFi
- Flask/Next.js server running
- Audio files in Download folder on phone

### During Presentation

**Step 1: Show System**
```
1. Open laptop browser → http://localhost:3000/dashboard
2. Show sensor network and stats
```

**Step 2: Play Audio from Phone**
```
1. Open VLC app on phone
2. Navigate to gunshot folder (via filter)
3. Play test1.wav
4. Talk about ML model detecting gunshot sound
```

**Step 3: Check Dashboard**
```
1. Dashboard auto-updates
2. Shows: "gunshot_001.wav - GUNSHOT DETECTED - 87.3%"
3. Highlight that this is mock ML from backend
```

**Step 4: Try Different Audio**
```
1. Play animal/test1.wav
2. Dashboard shows: "Animal detected - 91.2%"
3. Mention accuracy, confidence varying per detection
```

**Step 5: Show Player Controls**
```
1. Explain shuffle/repeat/seek functionality
2. Play multiple files in sequence
3. Show progress bar and timing
```

---

## 📝 Key Points for Presentation

1. **Real-time Detection:**
   - Phone sends event to laptop via WiFi hotspot
   - Dashboard receives and displays within 1 second
   - Live updates every 10 seconds

2. **Mobile Integration:**
   - No emulator needed - actual Android phone
   - Professional VLC-like interface
   - Folder-based file management

3. **Mock ML System:**
   - Demonstrates how real ML would integrate
   - Varying confidence scores (realistic)
   - Type detection from audio folder path

4. **Scalability:**
   - In production: real ML model replaces mock
   - Same API structure works with actual ML
   - Confidence scores would come from model

---

## 🔧 Troubleshooting

### "Server not reachable" on app
- Check laptop IP: `ipconfig`
- Verify port 3000 is open
- Ensure both on same WiFi

### No files showing in VLC
- Create folder in Download
- Add .wav files to folder
- Tap folder button again

### Dashboard not updating
- Check browser console for errors
- Verify API endpoints exist
- Refresh page manually

### Wrong type detected
- Type detection uses folder path
- "gunshot" in path → gunshot type
- "animal" in path → animal type
- Other paths → detection varies randomly

---

## 📚 Files Modified

### Backend
- `/app/api/audio-events/route.ts` - Added mock ML detection with confidence

### Frontend
- `/app/dashboard/page.tsx` - Added confidence score display

### Mobile
- `/flutterapp/lib/screens/player_screen.dart` - Added player controls
- `/flutterapp/lib/services/audio_service.dart` - Added seek method

---

## 🎯 Success Criteria

✅ Phone connects to server via hotspot  
✅ Playing audio sends event to dashboard  
✅ Dashboard shows file name and detection type  
✅ Confidence score displayed with progress bar  
✅ Score varies between 0.75-0.95  
✅ Player controls work (play, pause, next, prev, shuffle, repeat)  
✅ Multiple plays show new events in feed  

---

## 🎉 You're Ready!

Everything is set up and ready for your presentation. Just:
1. Connect phone to hotspot
2. Start server: `npm run dev`
3. Open dashboard: http://localhost:3000
4. Open VLC app on phone
5. Play audio files and watch dashboard update!

Good luck! 🚀
