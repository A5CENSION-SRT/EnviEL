# VLC App - Usage Guide (Updated)

## ✅ What Changed

### 1. Hidden Server Settings
- Settings button moved to top-right corner (small gear icon)
- No more prominent "Settings" text button
- Server URL hidden from main screen

### 2. Folder-Based Audio Playback
- **No more tabs!** 
- Now reads actual .wav files from phone storage
- Two folder paths:
  - `/storage/emulated/0/Download/gunshot/`
  - `/storage/emulated/0/Download/animal/`

---

## 📁 Setup Folders on Phone

### Step 1: Create Folders
1. Open your phone's File Manager
2. Navigate to **Download** (or **Downloads**)
3. Create two new folders:
   - `gunshot`
   - `animal`

### Step 2: Add Audio Files
1. Copy your `.wav` files to the appropriate folder:
   - Gunshot detection audio → `Download/gunshot/`
   - Animal detection audio → `Download/animal/`
2. File names can be anything (e.g., `detection_001.wav`, `test.wav`, etc.)

**Example structure:**
```
/storage/emulated/0/Download/
├── gunshot/
│   ├── gunshot_001.wav
│   ├── gunshot_002.wav
│   └── detection_test.wav
└── animal/
    ├── animal_001.wav
    ├── elephant.wav
    └── tiger_roar.wav
```

---

## 🎵 Using the App

### First Launch
1. App will request **Storage Permission** - tap **Allow**
2. If you accidentally denied it:
   - Go to phone Settings → Apps → VLC → Permissions
   - Enable "Files and media" or "Storage"

### Main Screen
- Two buttons at top:
  - **Download/gunshot** - Shows files from gunshot folder
  - **Download/animal** - Shows files from animal folder
- Tap any file to play it
- Playing file shows with orange volume icon
- Currently playing file highlighted

### Settings (Hidden)
- Tap the small **gear icon** (⚙️) in top-right corner
- Enter server URL: `http://192.168.43.100:3000`
- Test connection
- Save

---

## 🔄 How It Works

### 1. Audio Playback
```
Tap file → Plays from phone storage → Sends event to server
```

### 2. Dashboard Integration
When you play a file:
```
Phone: Detection_gunshot_001.wav plays
  ↓
POST /api/audio-events
  {
    "fileName": "Detection_gunshot_001.wav",
    "audioType": "gunshot",
    "duration": 3000,
    "timestamp": 1720547530000
  }
  ↓
Dashboard: Shows "Gunshot Detected"
```

### 3. Folder Switching
```
Tap "Download/gunshot" → Scans gunshot folder → Lists .wav files
Tap "Download/animal" → Scans animal folder → Lists .wav files
```

---

## 📱 Permissions Required

The app needs:
- **Storage/Files** - To read .wav files from Download folder
- **Internet** - To send events to dashboard
- **Network State** - To check connectivity

---

## 🐛 Troubleshooting

### "No audio files found"
**Cause:** Folders don't exist or contain no .wav files

**Fix:**
1. Open File Manager on phone
2. Go to Download folder
3. Create `gunshot` and `animal` folders
4. Add .wav files
5. Go back to VLC app and tap folder button again

### "Storage permission is required"
**Cause:** Permission denied

**Fix:**
1. Phone Settings → Apps → VLC → Permissions
2. Enable "Files and media" or "Storage"
3. Restart VLC app

### Audio plays but dashboard doesn't update
**Cause:** Server not reachable or wrong URL

**Fix:**
1. Tap gear icon ⚙️ (top-right)
2. Verify server URL is correct
3. Test connection
4. Make sure laptop and phone on same network (mobile hotspot)

### Can't find gear icon for settings
**Cause:** It's very small

**Fix:**
Look at **top-right** corner of app bar, small gray gear icon (⚙️)

---

## 🎯 Demo Workflow

### Preparation
1. **Create folders** on phone:
   - `Download/gunshot/`
   - `Download/animal/`

2. **Add test files**:
   - Copy 2-3 .wav files to each folder

3. **Start server** on laptop:
   ```bash
   cd c:\coding\EnviEL
   npm run dev
   ```

4. **Connect to hotspot**:
   - Enable mobile hotspot on phone
   - Connect laptop to hotspot
   - Note laptop IP (e.g., 192.168.43.100)

5. **Configure VLC app**:
   - Tap ⚙️ icon
   - Enter: `http://192.168.43.100:3000`
   - Test connection → Save

### During Demo
1. Open dashboard on laptop
2. Open VLC app on phone
3. Tap **Download/gunshot** button
4. Tap any gunshot .wav file
5. **Dashboard shows: "Gunshot Detected"** ✅
6. Tap **Download/animal** button
7. Tap any animal .wav file
8. **Dashboard shows: "Animal Detected"** ✅

---

## 📝 Technical Details

### Folder Paths Used
```dart
final String gunshotPath = '/storage/emulated/0/Download/gunshot';
final String animalPath = '/storage/emulated/0/Download/animal';
```

### Supported File Types
- **Only `.wav` files** (case-insensitive)
- Files must have `.wav` extension

### Event Payload
```json
{
  "fileName": "your_file.wav",
  "audioType": "gunshot" or "animal",
  "duration": 3000,
  "timestamp": 1720547530000
}
```

---

## 🚀 Quick Start Checklist

- [ ] Install updated APK on phone
- [ ] Grant storage permission when asked
- [ ] Create `Download/gunshot/` folder
- [ ] Create `Download/animal/` folder
- [ ] Add .wav files to both folders
- [ ] Start Next.js server on laptop
- [ ] Connect both to mobile hotspot
- [ ] Configure server URL via ⚙️ icon
- [ ] Test playing files
- [ ] Verify dashboard receives events

You're ready for your demo! 🎉
