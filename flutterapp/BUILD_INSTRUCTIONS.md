# Flutter VLC App - Build Instructions

## Prerequisites Setup (One-time)

### 1. Enable Windows Developer Mode
This is **required** for Flutter to create symlinks for plugins.

**Option A: Via Settings UI**
1. Press `Windows + I` to open Settings
2. Go to **Privacy & Security** → **For developers**
3. Turn on **Developer Mode**
4. Confirm the UAC prompt

**Option B: Via PowerShell (Admin)**
```powershell
# Run PowerShell as Administrator
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /t REG_DWORD /f /v "AllowDevelopmentWithoutDevLicense" /d "1"
```

### 2. Verify Flutter Setup
```bash
cd flutterapp
flutter doctor
```

## Building the App

### Clean Build (Recommended first time)
```bash
cd flutterapp
flutter clean
flutter pub get
flutter build apk --debug
```

### Quick Build (After first successful build)
```bash
cd flutterapp
flutter build apk --debug
```

### Install to Connected Phone
```bash
cd flutterapp
flutter install
```

Or use:
```bash
cd flutterapp
flutter run
```

## Output Location
- Debug APK: `flutterapp/build/app/outputs/flutter-apk/app-debug.apk`
- You can copy this APK to your phone and install it

## Troubleshooting

### "Building with plugins requires symlink support"
- Enable Developer Mode (see Prerequisites above)

### "Execution failed for task ':connectivity_plus:checkDebugAarMetadata'"
- This is handled via `android/gradle.properties` suppressions
- If it persists, try: `flutter pub cache repair`

### Gradle Build Timeouts
- First build takes 5-10 minutes (downloads dependencies)
- Subsequent builds are much faster (1-2 minutes)

### "Java version incompatible"
- Ensure Java 17 or 21 is installed
- Check: `java -version`

## Configuration

### Server URL
- Default: `http://192.168.1.100:3000`
- Change in app Settings screen after installation

### Mobile Hotspot Setup
1. Enable mobile hotspot on your phone
2. Connect laptop to the hotspot
3. Find laptop's IP on the hotspot network: `ipconfig` (look for Wireless LAN adapter Wi-Fi)
4. Update server URL in app to: `http://<laptop-ip>:3000`

## Next Steps After Build

1. Transfer APK to phone (USB/Drive/Cloud)
2. Enable "Install from Unknown Sources" on Android
3. Install the APK
4. Open app → Go to Settings
5. Enter your server URL (laptop IP on hotspot)
6. Test connection
7. Save and start playing audio
