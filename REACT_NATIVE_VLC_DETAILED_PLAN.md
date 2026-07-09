# React Native VLC App - Detailed Integration Plan

## Architecture Overview

```
┌─────────────────────────────────┐
│  React Native VLC App (Android) │
│  - Expo-managed                 │
│  - Expo Video Player (expo-av)  │
│  - Axios for HTTP calls         │
└────────────┬────────────────────┘
             │
             │ HTTP POST
             │ /api/audio-events
             │
┌────────────▼────────────────────┐
│  EnviEL Backend (Next.js)       │
│  localhost:3000 on Laptop       │
│                                 │
│  - GET /api/audio-files         │
│  - POST /api/audio-events       │
│  - SQLite Database              │
└─────────────────────────────────┘
             ▲
             │ HTTP GET
             │ /api/audio-events
             │
┌────────────┴────────────────────┐
│  EnviEL Dashboard (Browser)     │
│  Shows Mobile Events in Real-time
└─────────────────────────────────┘
```

## Project Structure

```
vlc-mobile/
├── app.json                 # App configuration (name, permissions, icon)
├── package.json             # Dependencies (expo, react-native, expo-av)
├── index.js                 # Entry point
├── App.js                   # Main application component
├── src/
│   ├── screens/
│   │   ├── PlayerScreen.js  # Main player UI
│   │   └── SettingsScreen.js # Server configuration
│   ├── services/
│   │   └── AudioService.js  # API communication (Axios)
│   └── constants/
│       └── config.js        # Configuration (server URL, etc)
└── assets/
    └── (empty initially)
```

## Component Details

### 1. App.js - Main Entry Point
- Navigation between Player and Settings screens
- State management for server connection
- Network status detection

### 2. PlayerScreen.js - Audio Player
- Displays gunshot/animal categories
- Shows playlist of audio files
- ExoPlayer equivalent using expo-av
- Sends playback events to backend

### 3. SettingsScreen.js - Configuration
- Input field for server IP (e.g., http://192.168.1.100:3000)
- Save/Load from AsyncStorage
- Test connection button
- Network status display

### 4. AudioService.js - Backend Communication
```javascript
// API calls:
getAudioFiles(type) → GET /api/audio-files?type=gunshot|animal
sendPlaybackEvent(data) → POST /api/audio-events
```

## Data Flow

### Playing Audio (Online)
1. User opens app → Loads from Settings stored IP
2. User selects category (gunshot/animal)
3. AudioService.getAudioFiles() → Fetches list from /api/audio-files
4. User taps audio → Plays via expo-av
5. AudioService.sendPlaybackEvent() → POST to /api/audio-events
6. Dashboard polls and shows event

### Playing Audio (Offline)
1. App detects no network
2. Shows "OFFLINE MODE" banner
3. Plays local mock audio files
4. Events queued in AsyncStorage
5. On reconnect, sends queued events

## Key Features

### Bare Minimum (Phase 1)
- Two category buttons (Gunshot/Animal)
- Audio file list from server
- Play/Pause/Stop controls
- Send playback events
- Settings screen for IP configuration

### Enhanced (Phase 2 - Optional)
- Offline file caching
- Event history display
- Network reconnection handler
- Auto-retry failed events

## Integration with EnviEL

### Backend Changes Needed
None. Uses existing endpoints:
- GET /api/audio-files (already exists)
- POST /api/audio-events (already exists)

### Dashboard Changes Needed
None. Dashboard already displays mobile events in:
- "Mobile Audio Player Activity" section

### How It Works Together

```
1. Laptop: npm run dev
   → Next.js server running on localhost:3000

2. Phone: npm start (in vlc-mobile directory)
   → Expo development server starts
   → Shows QR code to scan

3. Phone: Scan QR with Expo Go app
   → App loads on phone
   → Reads server IP from Settings

4. Phone: Play audio
   → Sends POST /api/audio-events
   → Event stored in memory

5. Laptop Browser: /dashboard
   → Polls /api/audio-events every 10s
   → Shows new playback event

6. Loop: Phone plays → Dashboard updates in real-time
```

## Network Setup (Phone Hotspot Method)

```
Phone (Hotspot: 192.168.43.1)
├─ VLC App: http://192.168.43.100:3000
└─ Laptop Connected to Hotspot

Laptop (Connected to hotspot):
├─ Next.js: localhost:3000
└─ Dashboard: Browser shows events
```

## Installation & Setup Steps

### Step 1: Create React Native Project
```bash
cd c:\coding\EnviEL
npx create-expo-app vlc-mobile
```

### Step 2: Install Dependencies
```bash
cd vlc-mobile
npm install expo-av axios react-native-screens react-native-safe-area-context
```

### Step 3: Create File Structure
- Copy App.js, screens/, services/, constants/

### Step 4: Configure app.json
- Package name: com.enviel.vlc
- Permissions: INTERNET, ACCESS_NETWORK_STATE

### Step 5: Build APK for Android
```bash
npx eas-cli build --platform android --local
```

Or use Expo Go for development:
```bash
npm start
# Scan QR code with Expo Go app on phone
```

### Step 6: Configure Server IP
- In app: Settings screen
- Enter: http://192.168.43.100:3000 (your laptop IP)
- Save

## Testing Checklist

- [ ] App opens on phone
- [ ] Settings screen shows input for server IP
- [ ] Save IP persists after app restart
- [ ] Can toggle between Gunshot/Animal categories
- [ ] Audio file list loads from server
- [ ] Can play audio file
- [ ] Playback event visible on dashboard within 10 seconds
- [ ] Both categories show correct detection type badge
- [ ] Can switch categories mid-demo
- [ ] Offline mode shows banner when hotspot disabled
- [ ] App continues playing offline

## Troubleshooting

### App Won't Start
```bash
# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install
npm start
```

### Can't Connect to Server
- Verify laptop IP with: ipconfig
- Check both on same hotspot network
- Verify npm run dev is running on laptop

### Audio Won't Play
- Check audio files exist: ls public/audio/gunshot/
- Regenerate: node scripts/generate-audio-samples.js
- Check permissions in app.json

### Expo Go Not Working
- Update Expo Go app from Play Store
- Try building APK: eas build --platform android

## Key Differences from Native Android

| Aspect | React Native | Native Android |
|--------|--------------|---|
| Build time | 2-3 min | 5-10 min |
| Code language | JavaScript | Kotlin |
| Cross-platform | Yes (iOS too) | Android only |
| Performance | 95% native | 100% native |
| Learning curve | Easier | Harder |
| Dependencies | Fewer conflicts | More complex |

## File Sizes & Performance

- APK size: ~80-100 MB (with Expo)
- App RAM usage: 60-80 MB
- Startup time: 2-3 seconds
- Playback latency: <100ms
- API call response: <200ms (local network)

## Security Considerations

- Server IP stored in AsyncStorage (not encrypted)
- HTTP only (for demo purposes)
- For production: Use HTTPS + encryption
- Consider JWT tokens for auth

## Post-Launch Improvements

1. Add event history display
2. Implement local file caching
3. Add repeat/shuffle controls
4. Add volume control
5. Add recording capability
6. Add event filters (by date, type)

## Success Metrics

App is ready when:
1. Opens without errors
2. Connects to server IP
3. Fetches and plays audio
4. Sends events to dashboard
5. Dashboard updates in real-time
6. Works offline gracefully
