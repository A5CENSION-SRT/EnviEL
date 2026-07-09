# VLC Flutter App - Installation & Usage Guide

## ✅ Build Successful!

**APK Location:** `flutterapp\build\app\outputs\flutter-apk\app-debug.apk`  
**APK Size:** 154.6 MB  
**Package Name:** com.enviel.vlc  
**App Name:** VLC

---

## 📱 Installing on Your Android Phone

### Method 1: USB Transfer (Recommended)
1. Connect your phone to the laptop via USB cable
2. Copy `app-debug.apk` from `flutterapp\build\app\outputs\flutter-apk\` to your phone (Downloads folder)
3. On your phone, open the file manager and navigate to Downloads
4. Tap on `app-debug.apk`
5. If prompted, enable "Install from Unknown Sources" for your file manager
6. Tap "Install" and wait for installation to complete

### Method 2: Cloud Transfer
1. Upload `app-debug.apk` to Google Drive / OneDrive / Dropbox
2. Download it on your phone
3. Install as per Method 1 steps 3-6

### Method 3: Direct Install (If phone is connected)
```bash
cd flutterapp
flutter install
```

---

## 🔧 Initial Setup

### 1. Enable Mobile Hotspot
1. On your phone, enable Mobile Hotspot
2. Connect your laptop to the hotspot WiFi
3. Find your laptop's IP address:
   ```bash
   ipconfig
   ```
   Look for "Wireless LAN adapter Wi-Fi" → IPv4 Address (e.g., `192.168.43.100`)

### 2. Start Your Next.js Server
```bash
cd c:\coding\EnviEL
npm run dev
```
Server should start on port 3000.

### 3. Configure the VLC App
1. Open the VLC app on your phone
2. Tap **Settings** (top right)
3. Enter your server URL: `http://192.168.43.100:3000` (use your actual laptop IP)
4. Tap **Test Connection**
5. Wait for "Status: Connected"
6. Tap **Save**

---

## 🎵 Using the App

### Playing Audio
1. The app has two tabs: **GUNSHOT** and **ANIMAL**
2. Tap on any audio file to play it
3. The app will send a playback event to your dashboard via HTTP POST to `/api/audio-events`

### Dashboard Integration
When you play audio on the phone:
- The app sends: `{ fileName, audioType, duration, timestamp }` to `/api/audio-events`
- Your dashboard polls `/api/events` and displays the detection

### Mock Audio Files
If the server is offline or doesn't return audio files, the app shows mock data:
- **Gunshot folder:** 5 mock files (2.8s - 4.1s duration)
- **Animal folder:** 5 mock files (4.6s - 6.1s duration)

---

## 🧪 Testing the Workflow

1. **Start the Next.js server** on your laptop (connected to mobile hotspot)
2. **Open the dashboard** in your browser: `http://localhost:3000/dashboard`
3. **Open the VLC app** on your phone
4. **Play a gunshot audio file** → Dashboard should show "Gunshot detected"
5. **Play an animal audio file** → Dashboard should show "Animal detected"

---

## ⚙️ App Features

### Player Screen
- Two category tabs: GUNSHOT / ANIMAL
- Audio file list with duration
- Play/Pause controls
- Shows server URL at bottom

### Settings Screen
- Server URL configuration
- Connection test button
- Save/Cancel options

### Network Handling
- Works offline with mock data
- Automatically sends events when connected
- Fails silently if server is unreachable

---

## 🐛 Troubleshooting

### "App not installed"
- Enable "Install from Unknown Sources" in phone settings
- Try clearing Downloads folder and re-copying the APK

### "Connection Failed" in Settings
- Verify laptop and phone are on the same network (mobile hotspot)
- Check laptop firewall allows connections on port 3000
- Verify Next.js server is running: `npm run dev`
- Test in browser: `http://192.168.43.100:3000` (from laptop)

### Audio Not Playing
- The app uses `just_audio` package for playback
- Mock files have placeholder URLs (`file:///mock/...`)
- Real playback requires actual audio file URLs from your backend

### Dashboard Not Showing Events
- Check `/api/audio-events` endpoint exists in your Next.js app
- Verify the endpoint accepts POST requests with JSON body
- Check browser console for errors
- Verify dashboard polling interval

---

## 📊 API Endpoints Used

### GET `/api/audio-files?type={gunshot|animal}`
Expected response:
```json
[
  {
    "name": "Detection_gunshot_001.wav",
    "url": "http://server/audio/gunshot001.wav",
    "duration": 3500,
    "type": "gunshot",
    "timestamp": "2026-07-09T14:32:10Z"
  }
]
```

### POST `/api/audio-events`
Request body:
```json
{
  "fileName": "Detection_gunshot_001.wav",
  "audioType": "gunshot",
  "duration": 3500,
  "timestamp": 1720547530000
}
```

---

## 🔄 Rebuilding the App

If you make changes to the Flutter code:
```bash
cd flutterapp
flutter clean
flutter pub get
flutter build apk --debug
```
New APK will be in `build\app\outputs\flutter-apk\app-debug.apk`

---

## 📝 Notes

- **connectivity_plus** package was removed due to compileSdk incompatibility
- App still works without network detection - fails gracefully
- Debug APK is larger than release APK (includes debug symbols)
- For production, use: `flutter build apk --release` (requires signing keys)

---

## ✨ Next Steps

1. Transfer the APK to your phone
2. Install and configure the server URL
3. Test with your Next.js dashboard
4. Prepare for your presentation demo!

Good luck with your demonstration! 🎉
