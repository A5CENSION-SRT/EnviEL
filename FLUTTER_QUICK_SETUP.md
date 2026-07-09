# Flutter VLC App - Quick Setup Reference

## Prerequisites
- Flutter SDK 3.16+
- Android SDK 21+ (minSdk)
- Target SDK 34
- Java 17+

## Project Creation
```bash
# Create new Flutter project
flutter create vlc-flutter
cd vlc-flutter
```

## Dependencies to Add (pubspec.yaml)
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  shared_preferences: ^2.2.0
  just_audio: ^0.9.36
  connectivity_plus: ^5.0.0
  intl: ^0.19.0
```

## Key Dart Files to Create

### 1. lib/main.dart
- App widget with routing between Player and Settings
- Load saved server URL on startup
- Pass server URL to screens as parameter

### 2. lib/screens/player_screen.dart
- Display two category buttons (Gunshot/Animal)
- Show audio file list
- Play/Pause controls
- Show now playing info

### 3. lib/screens/settings_screen.dart
- Text input for server URL
- Test connection button
- Save/Cancel buttons

### 4. lib/services/api_service.dart
- getAudioFiles(type, serverUrl) → HTTP GET
- sendPlaybackEvent(event, serverUrl) → HTTP POST
- testConnection(serverUrl) → HTTP GET

### 5. lib/services/audio_service.dart
- initialize() → create AudioPlayer
- load(url) → load audio file
- play() → start playback
- pause() → pause playback
- stop() → stop and unload

### 6. lib/services/storage_service.dart
- saveServerUrl(url) → SharedPreferences
- getServerUrl() → SharedPreferences
- clearServerUrl() → SharedPreferences

### 7. lib/models/audio_file.dart
- AudioFile class with: name, url, duration, type, timestamp

### 8. lib/models/playback_event.dart
- PlaybackEvent class with: fileName, audioType, duration, timestamp

## Android Configuration

### File: android/app/build.gradle
```gradle
android {
    compileSdk 34
    
    defaultConfig {
        applicationId "com.enviel.vlc"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
}
```

### File: android/app/src/main/AndroidManifest.xml
```xml
<manifest package="com.enviel.vlc">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application>
        <activity android:name=".MainActivity">
            ...
        </activity>
    </application>
</manifest>
```

## UI Layout Specifications

### PlayerScreen
```
AppBar (56dp)
├── Title: "VLC"
└── Action: Settings button

Now Playing Section (64dp when active)
├── File name
└── Play/Pause buttons

Category Buttons (48dp)
├── GUNSHOT (left 50%)
└── ANIMAL (right 50%)

Audio List (flexible)
└── List items (64dp each)

Footer (40dp)
└── Server URL display
```

### SettingsScreen
```
AppBar (56dp)
├── Title: "Settings"

Input Field
├── Hint: "http://192.168.1.100:3000"

Test Button
├── Shows connection status

Action Buttons
├── Save
└── Cancel
```

## Color Scheme
- Background: #1a1a1a (dark)
- Header: #000000 (black)
- Surface: #2a2a2a (dark gray)
- Accent: #FF9800 (orange)
- Gunshot Badge: #D32F2F (red)
- Animal Badge: #FF9800 (orange)

## API Integration Details

### Endpoint 1: GET /api/audio-files
```
URL: http://192.168.43.100:3000/api/audio-files?type=gunshot
Response: JSON array of AudioFile objects
Timeout: 10 seconds
Error: Use mock data if fails
```

### Endpoint 2: POST /api/audio-events
```
URL: http://192.168.43.100:3000/api/audio-events
Body: {fileName, audioType, duration, timestamp}
Response: {success, message, event}
Timeout: 5 seconds
Error: Fail silently (offline mode)
```

## Build & Run Commands

### Development (Debug)
```bash
flutter run
```

### Release Build
```bash
flutter build apk --release
```

### Debug APK
```bash
flutter build apk
```

### Install on Device
```bash
flutter run -d <device_id>
# Or
adb install build/app/outputs/apk/debug/app-debug.apk
```

## Network Configuration (For Demo)

```
Phone Hotspot: 192.168.43.1
Laptop on Hotspot: 192.168.43.100
App Server URL: http://192.168.43.100:3000

Flow:
Phone → WiFi (hotspot) → Laptop (Next.js)
Laptop Browser → /dashboard (shows events)
```

## State Management (MVP - Use setState)

```dart
// In PlayerScreen
class PlayerScreenState extends State<PlayerScreen> {
  String selectedCategory = 'gunshot';
  List<AudioFile> audioFiles = [];
  AudioFile? nowPlaying;
  bool isPlaying = false;
  
  // Update state
  setState(() {
    selectedCategory = 'animal';
  });
}
```

## Error Handling Strategy

1. **Network Error**
   - Show toast: "Network error - using local data"
   - Load mock audio files

2. **Invalid URL**
   - Show alert: "Invalid server URL"
   - Stay on Settings screen

3. **Audio Play Failure**
   - Show toast: "Failed to play audio"
   - Continue app

4. **API Failure**
   - POST /api/audio-events fails silently
   - No user notification

## Testing Before Demo

- [ ] App installs without errors
- [ ] Settings saves URL correctly
- [ ] Audio files load from server
- [ ] Audio plays successfully
- [ ] Playback event sent (check dashboard)
- [ ] Both categories work
- [ ] Can toggle categories
- [ ] Offline banner shows when offline
- [ ] No crashes during usage

## Folder Structure to Create

```bash
vlc-flutter/
├── lib/
│   ├── screens/
│   │   ├── player_screen.dart
│   │   └── settings_screen.dart
│   ├── services/
│   │   ├── api_service.dart
│   │   ├── audio_service.dart
│   │   └── storage_service.dart
│   ├── models/
│   │   ├── audio_file.dart
│   │   └── playback_event.dart
│   ├── widgets/
│   │   ├── category_button.dart
│   │   └── audio_list_item.dart
│   └── main.dart
└── android/
    ├── app/build.gradle
    └── src/main/AndroidManifest.xml
```

## Expected Outcomes

✓ App builds and installs on Android  
✓ Connects to EnviEL backend via hotspot  
✓ Fetches and plays audio files  
✓ Sends events to dashboard in real-time  
✓ Works offline gracefully  
✓ Professional UI, no unnecessary elements

---

This plan is ready for implementation. Each component is clearly defined with specific files, methods, and integration points.
