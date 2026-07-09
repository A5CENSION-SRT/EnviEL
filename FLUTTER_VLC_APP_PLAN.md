# Flutter VLC App - Comprehensive Implementation Plan

## Project Overview

Build a bare minimum Flutter audio player app that:
- Connects to EnviEL backend via HTTP
- Plays gunshot/animal detection audio
- Sends playback events to dashboard
- Works with mobile hotspot connection
- No emojis, minimal UI, professional

---

## 1. Project Structure

```
vlc-flutter/                          # Root folder
├── android/                           # Android native code (pre-generated)
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/AndroidManifest.xml
│   └── build.gradle
├── ios/                               # iOS native code (pre-generated)
├── lib/                               # Dart source code
│   ├── main.dart                      # App entry point
│   ├── screens/
│   │   ├── player_screen.dart         # Main player UI
│   │   └── settings_screen.dart       # Server IP configuration
│   ├── services/
│   │   ├── audio_service.dart         # Audio playback (just_audio)
│   │   ├── api_service.dart           # Backend communication (HTTP)
│   │   └── storage_service.dart       # Local storage (SharedPreferences)
│   ├── models/
│   │   ├── audio_file.dart            # Data model for audio files
│   │   └── playback_event.dart        # Data model for events
│   └── widgets/
│       ├── category_button.dart       # Gunshot/Animal button
│       └── audio_list_item.dart       # List item for audio files
├── pubspec.yaml                       # Dependencies
├── pubspec.lock                       # Lock file
└── README.md                          # Setup instructions
```

---

## 2. Technology Stack

### Framework: Flutter
- **Language**: Dart
- **Min SDK**: Android 21 (API 21)
- **Target SDK**: Android 34
- **Version**: Flutter 3.16+

### Key Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `http` | HTTP client for API calls | ^1.1.0 |
| `just_audio` | Audio playback engine | ^0.9.36 |
| `shared_preferences` | Local storage (AsyncStorage equivalent) | ^2.2.0 |
| `connectivity_plus` | Network status detection | ^5.0.0 |
| `intl` | Date/time formatting | ^0.19.0 |

### Optional (Not needed for bare minimum)
- `audio_service` - Background audio (skip for MVP)
- `provider` - State management (use setState for MVP)
- `get` - Navigation (use MaterialApp for MVP)

---

## 3. Architecture & Data Flow

### High-Level Flow

```
User Opens App
    ↓
Load Server URL from SharedPreferences
    ↓
Player Screen renders
    ↓
User selects Category (Gunshot/Animal)
    ↓
API Call: GET /api/audio-files?type=gunshot
    ↓
Display audio list from response
    ↓
User taps audio file
    ↓
just_audio plays file
    ↓
API Call: POST /api/audio-events {fileName, audioType, duration}
    ↓
Dashboard updates in real-time (via polling)
```

### Component Interactions

```
main.dart (App Widget)
    ├─ PlayerScreen
    │   ├─ API Service (fetch audio files)
    │   ├─ Audio Service (playback)
    │   └─ Storage Service (read server URL)
    └─ SettingsScreen
        └─ Storage Service (save server URL)

API Service
    ├─ GET /api/audio-files
    ├─ POST /api/audio-events
    └─ Error handling + network detection

Audio Service (just_audio)
    ├─ Load audio file
    ├─ Play / Pause / Stop
    └─ Track duration

Storage Service (SharedPreferences)
    ├─ Save server URL
    ├─ Load server URL
    └─ Clear data
```

---

## 4. Detailed Screen Specifications

### Screen 1: Player Screen (Default)

**Layout**:
```
┌─────────────────────────────────┐
│  Header: "VLC"     [Settings]   │ ← 56dp height
├─────────────────────────────────┤
│ Now Playing:                    │
│ Detection_gunshot_001.wav       │ ← 64dp height
│ [PLAY] [PAUSE]                  │
├─────────────────────────────────┤
│ [GUNSHOT]  [ANIMAL]             │ ← 48dp height
├─────────────────────────────────┤
│                                 │
│ Audio List:                     │
│ • Detection_gunshot_001  3:42   │ ← 64dp per item
│ • Detection_gunshot_002  2:48   │
│ • Detection_gunshot_003  4:10   │
│                                 │
│ (scrollable)                    │
├─────────────────────────────────┤
│ Server: http://192.168.1.100... │ ← 40dp height
└─────────────────────────────────┘
```

**Components**:
1. **AppBar**
   - Title: "VLC"
   - Action: Settings button
   - Background: #000000
   - Height: 56dp

2. **Now Playing Section**
   - File name
   - Play/Pause buttons
   - Background: #2a2a2a
   - Height: 64dp (when playing)

3. **Category Buttons**
   - Two buttons: "GUNSHOT" | "ANIMAL"
   - Active: #333333 background
   - Inactive: #212121 background
   - Height: 48dp
   - Width: 50% each

4. **Audio List**
   - ListView with audio items
   - Each item: 64dp height
   - Shows: filename, duration, type badge
   - Badge color: Red (#D32F2F) for gunshot, Orange (#FF9800) for animal

5. **Footer**
   - Server URL display
   - Background: #000000
   - Height: 40dp

**Interactions**:
- Tap gunshot button → Reload category=gunshot audio files
- Tap animal button → Reload category=animal audio files
- Tap audio item → Play audio + send playback event
- Tap settings → Navigate to SettingsScreen

---

### Screen 2: Settings Screen

**Layout**:
```
┌─────────────────────────────────┐
│  Settings                       │
├─────────────────────────────────┤
│                                 │
│ Server Configuration            │
│                                 │
│ Enter server URL:               │
│ [http://192.168.1.100:3000   ] │
│                                 │
│ [Test Connection]               │
│                                 │
│ Connection Status: Connected    │
│                                 │
│ [Save]  [Cancel]                │
│                                 │
└─────────────────────────────────┘
```

**Components**:
1. **AppBar**
   - Title: "Settings"

2. **Input Field**
   - Hint: "http://192.168.1.100:3000"
   - Pre-filled with saved URL
   - Keyboard: URL type

3. **Test Button**
   - Tests connection to server
   - Shows: "Connecting...", "Connected", or "Failed"

4. **Action Buttons**
   - Save: Persists URL to SharedPreferences, returns to PlayerScreen
   - Cancel: Discards changes, returns to PlayerScreen

---

## 5. Service Layer Details

### 5.1 API Service (api_service.dart)

**Methods**:

```
1. getAudioFiles(type: String, serverUrl: String) → Future<List<AudioFile>>
   - Endpoint: GET /api/audio-files?type={type}
   - Response: JSON array of audio files
   - Error handling: Network error → return mock data
   - Timeout: 10 seconds

2. sendPlaybackEvent(event: PlaybackEvent, serverUrl: String) → Future<void>
   - Endpoint: POST /api/audio-events
   - Body: { fileName, audioType, duration, timestamp }
   - Error handling: Fail silently (offline mode)
   - Timeout: 5 seconds

3. testConnection(serverUrl: String) → Future<bool>
   - Tests if server is reachable
   - Endpoint: GET /api/audio-events (lightweight)
   - Returns: true if response 200, false otherwise
```

**Data Models**:

```
AudioFile {
  String name
  String url
  int duration (milliseconds)
  String type (gunshot/animal)
  String timestamp
}

PlaybackEvent {
  String fileName
  String audioType
  int duration
  int timestamp
}
```

**Error Handling**:
- Network timeout → Show toast "Network error, using local data"
- Connection refused → Show "Cannot connect to server"
- Invalid URL → Show "Invalid server URL"
- HTTP 400 → Show server error message
- HTTP 500 → Show "Server error"

---

### 5.2 Audio Service (audio_service.dart)

**Using: just_audio package**

**Methods**:

```
1. initialize() → Future<void>
   - Initialize AudioPlayer instance

2. load(url: String) → Future<void>
   - Load audio file from URL
   - Handle: network URLs, file URLs

3. play() → Future<void>
   - Start playback

4. pause() → Future<void>
   - Pause playback

5. stop() → Future<void>
   - Stop playback and unload

6. getDuration() → Future<Duration>
   - Get total duration

7. getCurrentPosition() → Stream<Duration>
   - Get current playback position

8. dispose() → Future<void>
   - Clean up resources
```

**State Management**:
- `isPlaying`: bool (playing/paused)
- `currentPosition`: Duration (update every 100ms)
- `duration`: Duration (total length)

---

### 5.3 Storage Service (storage_service.dart)

**Using: shared_preferences package**

**Methods**:

```
1. saveServerUrl(url: String) → Future<bool>
   - Key: 'server_url'
   - Save to device storage

2. getServerUrl() → Future<String?>
   - Retrieve saved URL
   - Default: null

3. clearServerUrl() → Future<bool>
   - Delete stored URL

4. saveLastCategory(category: String) → Future<bool>
   - Remember last selected category

5. getLastCategory() → Future<String?>
   - Retrieve last category (default: 'gunshot')
```

**Storage Location**:
- Android: SharedPreferences (internal app storage)
- Encrypted: No (demo app, fine for now)

---

## 6. Integration with EnviEL Backend

### Backend Endpoints Used

**Endpoint 1: GET /api/audio-files**
```
Request:
  GET http://192.168.43.100:3000/api/audio-files?type=gunshot

Response:
  [
    {
      name: "Detection_gunshot_001.wav",
      url: "/audio/gunshot/detection_001.wav",
      duration: 3500,
      type: "gunshot",
      timestamp: "2024-01-15 14:32:10"
    },
    ...
  ]

Error handling:
  - If network fails → Use mock data (5 local files per category)
```

**Endpoint 2: POST /api/audio-events**
```
Request:
  POST http://192.168.43.100:3000/api/audio-events
  Content-Type: application/json
  {
    fileName: "Detection_gunshot_001.wav",
    audioType: "gunshot",
    duration: 3500,
    timestamp: 1705328400000
  }

Response:
  {
    success: true,
    message: "GUNSHOT playback event recorded",
    event: {...}
  }

Error handling:
  - If network fails → Queue locally (optional for MVP)
  - Fail silently (user doesn't see error)
```

### Network Communication Flow

```
1. App connects to phone hotspot
   IP: 192.168.43.1 (gateway)
   Laptop IP: 192.168.43.100 (user configures)

2. App resolves: http://192.168.43.100:3000
   → Points to laptop running Next.js

3. Player Screen loads
   → GET /api/audio-files?type=gunshot
   → Response: 5 files or mock data

4. User plays audio
   → Audio file loads (from /audio/gunshot/*.wav)
   → Plays via just_audio

5. Playback event sent
   → POST /api/audio-events
   → Event queued on server

6. Dashboard polls (every 10s)
   → GET /api/audio-events
   → Shows new event in real-time
```

---

## 7. Offline Mode Behavior

**When Network Disconnects**:
1. API call fails (catch exception)
2. Show "OFFLINE - Using local data" banner
3. Load mock audio files (hardcoded in app)
4. Allow playback to continue
5. Queue events locally (optional)

**When Network Reconnects**:
1. Try API call again
2. Hide offline banner
3. Load fresh audio files from server
4. Send queued events (if implemented)

**Mock Audio Files** (Fallback):
```
Gunshot (local):
- Detection_gunshot_001.wav
- Detection_gunshot_002.wav
- Detection_gunshot_003.wav
- Detection_gunshot_004.wav
- Detection_gunshot_005.wav

Animal (local):
- Detection_animal_001.wav
- Detection_animal_002.wav
- Detection_animal_003.wav
- Detection_animal_004.wav
- Detection_animal_005.wav

Note: These don't actually play in offline mode
(just_audio can't play non-existent files)
Alternative: Embed 5 second silence audio files
```

---

## 8. Build & Deployment Process

### Step 1: Environment Setup
```
Prerequisites:
- Flutter SDK 3.16+ installed
- Android SDK API 34 installed
- Java 17+ for Gradle
- Git (optional)
```

### Step 2: Create Flutter Project
```bash
flutter create vlc-flutter
cd vlc-flutter
```

### Step 3: Update Dependencies
```bash
# Edit pubspec.yaml with required packages
# Run: flutter pub get
```

### Step 4: Configure Android
```
File: android/app/build.gradle
- minSdkVersion: 21
- targetSdkVersion: 34
- compileSdkVersion: 34

File: android/app/src/main/AndroidManifest.xml
- Add permissions: INTERNET, ACCESS_NETWORK_STATE
- Set package: com.enviel.vlc
```

### Step 5: Build for Android
```bash
# Development (Debug APK)
flutter run

# Production APK
flutter build apk --release

# Debug APK
flutter build apk
```

### Step 6: Install on Device
```bash
# Connect phone via USB
flutter run

# Or manually install APK
adb install build/app/outputs/apk/release/app-release.apk
```

---

## 9. User Workflow

### First Time Setup
1. User installs APK on Android phone
2. Taps app icon "VLC"
3. App opens to Player Screen
4. User taps "Settings"
5. Enters laptop IP: http://192.168.43.100:3000
6. Taps "Test Connection" → Shows "Connected"
7. Taps "Save" → Returns to Player Screen
8. App fetches audio files from /api/audio-files

### Demo Usage
1. Phone hotspot enabled (192.168.43.1)
2. Laptop connected to hotspot
3. Laptop: npm run dev (Next.js running)
4. Phone: VLC app opens
5. Phone: Tap "GUNSHOT"
6. Phone: Tap audio file → Plays
7. Laptop browser: http://192.168.43.100:3000/dashboard
8. Dashboard: Shows "GUNSHOT DETECTED" event within 10 seconds
9. Phone: Tap "ANIMAL"
10. Phone: Tap audio file → Plays
11. Laptop browser: Dashboard shows "ANIMAL DETECTED"

---

## 10. Testing Checklist

### Unit Tests
- [ ] AudioFile model parsing from JSON
- [ ] PlaybackEvent model creation
- [ ] URL validation in SettingsScreen

### Integration Tests
- [ ] API call returns audio files
- [ ] Playback event sent successfully
- [ ] Local storage saves/loads URL
- [ ] Network error triggers offline mode

### Manual Tests (Before Demo)
- [ ] App installs without errors
- [ ] Settings screen input works
- [ ] Server IP saves and persists
- [ ] Audio files load from API
- [ ] Audio file plays
- [ ] Playback event visible on dashboard
- [ ] Both categories work
- [ ] Can switch categories
- [ ] Offline mode shows when hotspot disabled
- [ ] App works without crashing

---

## 11. Performance Considerations

### Memory Usage
- Estimated: 40-60 MB (Flutter runtime + just_audio)
- Audio buffer: 1-2 MB per file

### Network Usage
- Audio file list: ~2 KB per request
- Each audio file: 200-400 KB (depends on duration)
- Playback event: 0.5 KB per request

### Startup Time
- Cold start: 2-3 seconds
- Warm start: <1 second
- Audio playback latency: 50-100ms

### Battery Drain
- WiFi active: ~5-10% per hour
- Audio playback: +3-5% per hour
- Recommendation: Charge phone before demo

---

## 12. Directory Structure (Final)

```
vlc-flutter/
├── android/                          # Android native layer
│   ├── app/
│   │   ├── build.gradle              # Gradle configuration
│   │   └── src/main/
│   │       └── AndroidManifest.xml   # Permissions, package name
│   └── gradle/wrapper/               # Gradle wrapper
├── ios/                              # iOS native layer (not used for demo)
├── lib/                              # Dart source code
│   ├── main.dart                     # App entry point + routing
│   ├── screens/
│   │   ├── player_screen.dart        # Main player UI (PlayerScreen class)
│   │   └── settings_screen.dart      # Settings UI (SettingsScreen class)
│   ├── services/
│   │   ├── api_service.dart          # HTTP calls (ApiService class)
│   │   ├── audio_service.dart        # just_audio wrapper (AudioService class)
│   │   └── storage_service.dart      # SharedPreferences (StorageService class)
│   ├── models/
│   │   ├── audio_file.dart           # AudioFile model
│   │   └── playback_event.dart       # PlaybackEvent model
│   └── widgets/
│       ├── category_button.dart      # Reusable category button
│       └── audio_list_item.dart      # Reusable list item
├── pubspec.yaml                      # Dependencies & metadata
├── pubspec.lock                      # Locked versions
├── pubspec.local.yaml                # Local overrides (optional)
├── README.md                         # Setup & build instructions
├── .gitignore                        # Git ignore (auto-generated)
└── analysis_options.yaml             # Lint rules (auto-generated)
```

---

## 13. Key Differences from Native Android

| Aspect | Flutter | Native Android |
|--------|---------|---|
| Build tool | `flutter build` | Gradle + Android Studio |
| Language | Dart | Kotlin |
| UI widgets | Material Design 3 | Native Material |
| Performance | ~95% native | 100% native |
| Code size | 50 lines/screen | 200+ lines/screen |
| Build time | 2-3 min | 5-10 min |
| Cross-platform | Easy (iOS too) | Android only |
| Learning curve | Medium | Steep |

---

## 14. Rollout Plan

### Phase 1: Development (2 hours)
- [ ] Create Flutter project
- [ ] Set up dependencies
- [ ] Build basic UI screens
- [ ] Implement API service
- [ ] Implement audio service
- [ ] Test on emulator

### Phase 2: Testing (30 minutes)
- [ ] Test on physical device
- [ ] Verify API communication
- [ ] Check hotspot connectivity
- [ ] Verify dashboard updates

### Phase 3: Demo (5-10 minutes)
- [ ] Show settings configuration
- [ ] Play gunshot audio → Dashboard updates
- [ ] Play animal audio → Dashboard updates
- [ ] Show offline capability

---

## 15. Success Criteria

App is complete when:
1. ✓ App installs on Android phone without errors
2. ✓ Settings screen allows IP configuration
3. ✓ App fetches audio files from backend API
4. ✓ Audio plays when user taps file
5. ✓ Playback event sent to /api/audio-events
6. ✓ Dashboard shows detection within 10 seconds
7. ✓ Both gunshot and animal categories work
8. ✓ Can switch between categories smoothly
9. ✓ App handles offline gracefully
10. ✓ UI is clean, minimal, professional (no emojis)

---

This plan provides enough detail to implement the Flutter app systematically without running into major issues. Each component is clearly defined with specific responsibilities.
