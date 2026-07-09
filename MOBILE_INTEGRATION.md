# EnviEL Mobile Audio Player Integration Guide

## Overview

The EnviEL system now includes a native Android audio player app that connects to your Next.js web dashboard to demonstrate gunshot and animal detection audio playback in real-time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EnviEL Web Dashboard                    │
│              (http://localhost:3000/dashboard)              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mobile Audio Player Activity Section (Real-time)   │   │
│  │  • Shows gunshot 🔫 and animal 🦁 detections       │   │
│  │  • Displays duration and timestamp of each playback │   │
│  │  • Refreshes every 10 seconds                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ▲                                           
           │ POST /api/audio-events                   
           │ (playback notifications)                 
           │                                          
┌──────────▼──────────────────────────────────────────────────┐
│                  EnviEL Backend (Next.js)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GET /api/audio-files?type=gunshot|animal           │   │
│  │  • Returns list of 5 mock audio files               │   │
│  │  • PCM WAV format (16-bit, 44.1kHz)                 │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  POST /api/audio-events                             │   │
│  │  • Receives playback events from mobile             │   │
│  │  • Stores in-memory (last 50) + SQLite database     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────▲──────────────────────────────────────────────────┘
           │                                          
           │ GET /api/audio-files                    
           │ (fetch audio files)                     
           │                                          
┌──────────────────────────────────────────────────────────────┐
│              Android VLC-Style Audio Player                  │
│                    (Mobile Device)                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ExoPlayer Media Engine                             │   │
│  │  • Plays WAV/MP3 files                              │   │
│  │  • Seek/pause/resume controls                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Two Audio Categories:                              │   │
│  │  🔫 Gunshot Detection   🦁 Animal Detection         │   │
│  │                                                     │   │
│  │  Each category shows:                               │   │
│  │  • File name                                        │   │
│  │  • Timestamp of detection                           │   │
│  │  • Audio duration                                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Network Integration:                               │   │
│  │  • Sends playback events to dashboard               │   │
│  │  • Fetches audio files from server                  │   │
│  │  • Settings: Configure server IP/port               │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Offline Fallback:                                  │   │
│  │  • Works without server connection                  │   │
│  │  • Uses local mock audio files                      │   │
│  │  • Queues events when offline                       │   │
│  │  • Resumes sync when connection restored            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Build & Deploy Android App

```bash
# Navigate to Android directory
cd android

# Build APK
./gradlew build

# Or install directly to device/emulator
./gradlew installDebug
```

### 2. Configure Mobile App

When you first launch the app:

1. **Tap ⚙️ (Settings)** in the top-right corner
2. **Enter Server URL**: `http://YOUR_MACHINE_IP:3000`
   - Replace `YOUR_MACHINE_IP` with your actual IP address
   - Example: `http://192.168.1.100:3000`
3. **Tap Save**

The app will then connect to your server.

### 3. Start Web Dashboard

```bash
# In the EnviEL main directory
npm run dev
# Opens http://localhost:3000
```

Navigate to `/dashboard` to see real-time mobile playback events.

---

## Features

### Mobile App

#### 📱 Two Audio Categories
- **🔫 Gunshot Detection**: 5 demo audio files showing gunshot events
- **🦁 Animal Detection**: 5 demo audio files showing animal distress events

#### ▶️ Media Player Controls
- Play/Pause/Seek with ExoPlayer UI
- Progress bar with duration
- Repeat/shuffle controls
- Dark VLC-style interface optimized for field use

#### 📡 Real-Time Integration
- Sends playback events to dashboard
- File name, type, duration, and timestamp
- Auto-updates dashboard in real-time

#### 🔌 Offline Fallback
- Works without internet connection
- Uses bundled mock audio files
- Network status indicator (red when offline)
- Events queued and sent when reconnected

#### ⚙️ Settings Screen
- Configure server URL
- View network status
- Clear/reset configuration

### Web Dashboard

#### 📊 Mobile Activity Section
- **Location**: Main dashboard (appears when events received)
- **Shows**: Real-time gunshot/animal detections from mobile
- **Updates**: Every 10 seconds
- **Design**: Blue gradient card with emoji icons

---

## API Endpoints

### GET `/api/audio-files`

**Query Parameters:**
- `type` (required): `"gunshot"` or `"animal"`

**Response:**
```json
[
  {
    "name": "Detection_gunshot_001.wav",
    "url": "/audio/gunshot/detection_001.wav",
    "duration": 3500,
    "type": "gunshot",
    "timestamp": "2024-01-15 14:32:10"
  },
  ...
]
```

### POST `/api/audio-events`

**Request Body:**
```json
{
  "fileName": "Detection_gunshot_001.wav",
  "audioType": "gunshot",
  "duration": 3500,
  "timestamp": 1705328400000
}
```

**Response:**
```json
{
  "success": true,
  "message": "GUNSHOT playback event recorded",
  "event": {
    "fileName": "Detection_gunshot_001.wav",
    "audioType": "gunshot",
    "duration": 3500,
    "receivedAt": "2024-01-15T14:32:10.123Z"
  }
}
```

---

## File Structure

### Android App

```
android/
├── app/
│   ├── build.gradle.kts          # Dependencies and build config
│   ├── AndroidManifest.xml       # App permissions and activities
│   ├── src/main/kotlin/
│   │   └── org/enviel/audioplayer/
│   │       ├── MainActivity.kt           # Main audio player screen
│   │       ├── SettingsActivity.kt       # Settings/config screen
│   │       ├── network/
│   │       │   └── AudioService.kt       # API client & network logic
│   │       └── ui/
│   │           ├── AudioAdapter.kt       # Playlist RecyclerView
│   │           └── AudioPlayerUI.kt      # UI utilities
│   ├── res/layout/
│   │   ├── activity_main.xml             # Player screen layout
│   │   ├── activity_settings.xml         # Settings layout
│   │   └── item_audio.xml                # Playlist item layout
│   └── res/drawable/                    # Buttons, shapes
│
├── settings.gradle.kts            # Project config
└── README.md                       # Android build instructions
```

### Web Backend

```
app/api/
├── audio-files/
│   └── route.ts                  # GET audio file list
└── audio-events/
    └── route.ts                  # POST playback events

public/audio/
├── gunshot/
│   ├── detection_001.wav
│   ├── detection_002.wav
│   ├── detection_003.wav
│   ├── detection_004.wav
│   ├── detection_005.wav
│   └── README.md
└── animal/
    ├── detection_001.wav
    ├── detection_002.wav
    ├── detection_003.wav
    ├── detection_004.wav
    ├── detection_005.wav
    └── README.md

scripts/
└── generate-audio-samples.js     # Generate WAV files
```

---

## Demonstration Workflow

### Scenario 1: Online Playback with Dashboard Sync

1. **Mobile**: Open app → Select Gunshot category
2. **Mobile**: Tap audio file to play
3. **Mobile**: App sends playback event to server
4. **Web Dashboard**: Real-time section updates showing:
   - "Playing: Detection_gunshot_001.wav"
   - 🔫 GUNSHOT DETECTED badge
   - Duration and timestamp
5. **Mobile**: Switch to Animal category and repeat
6. **Web Dashboard**: Shows both gunshot and animal detections

### Scenario 2: Offline Fallback

1. **Mobile**: Disconnect from network (airplane mode)
2. **Mobile**: App shows "📡 OFFLINE MODE" banner
3. **Mobile**: Select audio files - plays local copies
4. **Mobile**: When playing, shows "📡 Event queued (offline)"
5. **Mobile**: Reconnect to network
6. **Mobile**: Events automatically sync to dashboard

### Scenario 3: Network Reconfiguration

1. **Mobile**: Tap ⚙️ Settings button
2. **Mobile**: Change server URL to new IP
3. **Mobile**: Tap Save
4. **Mobile**: App reconnects to new server
5. **Mobile**: Resume normal operation

---

## Customization

### Add More Audio Files

1. **Generate new samples:**
   ```bash
   node scripts/generate-audio-samples.js
   ```

2. **Or use your own audio:**
   - Place WAV files in `public/audio/gunshot/` or `public/audio/animal/`
   - Update `/api/audio-files/route.ts` with new file names

### Change Detection Categories

Edit `app/api/audio-files/route.ts`:

```typescript
const MOCK_AUDIO_FILES: Record<string, AudioFile[]> = {
  myCategory: [
    { name: "file1.wav", ... },
    { name: "file2.wav", ... }
  ],
  ...
};
```

### Customize Mobile UI

Edit Android layouts in `android/app/src/main/res/layout/`:
- `activity_main.xml` - Player screen styling
- `item_audio.xml` - Playlist item appearance
- Colors, fonts, spacing all configurable

---

## Troubleshooting

### Mobile App Can't Connect to Server

**Problem**: "Network error - Using local audio files"

**Solutions:**
1. Check server IP address in Settings ⚙️
2. Ensure mobile is on same WiFi network as server
3. Verify Next.js server is running (`npm run dev`)
4. Check firewall isn't blocking port 3000

### No Playback Events Appearing on Dashboard

**Problem**: Dashboard shows "No recent events"

**Solutions:**
1. Play audio on mobile app (should trigger event)
2. Check browser console for errors
3. Verify `/api/audio-events` endpoint is responding:
   ```bash
   curl http://localhost:3000/api/audio-events
   ```

### Audio Files Not Playing

**Problem**: "No recent events" or playback fails

**Solutions:**
1. Ensure WAV files exist in `public/audio/`
2. Run audio generation script:
   ```bash
   node scripts/generate-audio-samples.js
   ```
3. Check browser DevTools → Network tab
4. Verify `/api/audio-files` returns correct URLs

---

## Performance Notes

- **Mobile**: ExoPlayer handles media efficiently
- **Dashboard**: Refreshes every 10 seconds (configurable)
- **Database**: Audio events persisted to SQLite
- **Memory**: In-memory store keeps last 50 events
- **Offline**: Works with zero network latency

---

## Future Enhancements

- [ ] WebSocket for real-time push (instead of polling)
- [ ] Local audio file discovery from device storage
- [ ] Event queue persistence (SQLite on mobile)
- [ ] Admin panel to manage audio files
- [ ] Push notifications for new detections
- [ ] Multi-device support with user authentication
- [ ] Battery and network status API monitoring
- [ ] Audio file upload from mobile to server

---

## Support

For issues or questions:
1. Check `/android/README.md` for build help
2. Review Android Logcat for runtime errors
3. Check browser DevTools for dashboard issues
4. Verify all API endpoints are accessible
