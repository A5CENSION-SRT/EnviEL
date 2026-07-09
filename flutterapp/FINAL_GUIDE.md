# VLC App - File Browser Version

## ✨ What's New

### File Browser UI
- **No tabs!** Proper folder navigation with back arrow
- **Folder icon** in header shows current folder location
- **Folders** appear at top (orange folder icons)
- **Audio files** (.wav) below (music note icons)
- Tap folder → open it
- Tap .wav file → play it

### Folder Prefix System
- Tap the **filter icon** (funnel) on right side of header
- Enter prefix to auto-navigate to that subfolder
- Example: Type "gunshot" → auto-opens Download/gunshot folder
- Example: Type "demo" → auto-opens Download/demo folder
- Prefix is saved and remembered

---

## 🎯 Quick Start

### 1. Grant Permission (First Launch)
- App asks for storage permission
- Tap **Allow**

### 2. Set Folder Prefix
- Tap the **filter icon** (funnel) ⊚ in top-right
- Type the subfolder name (e.g., `gunshot`)
- Tap **Apply**
- App auto-navigates to that folder

### 3. Add Audio Files
- Put `.wav` files in that folder
- They appear in the list

### 4. Play Audio
- Tap any `.wav` file to play
- Sends event to dashboard automatically

---

## 🗂️ Folder Structure

```
/storage/emulated/0/Download/
├── gunshot/
│   ├── test1.wav
│   ├── test2.wav
│   └── test3.wav
├── animal/
│   ├── elephant.wav
│   ├── birds.wav
│   └── dog.wav
└── other_folder/
    └── audio.wav
```

**Usage:**
- Open VLC app
- Tap filter icon
- Type `gunshot` → App opens gunshot folder
- All .wav files shown
- Tap to play

---

## 🎮 Navigation

| Action | What Happens |
|--------|--------------|
| Tap folder | Opens that folder |
| Tap .wav file | Plays the audio |
| Tap back arrow ← | Goes to parent folder |
| Tap filter icon ⊚ | Opens prefix dialog |
| Tap ⚙️ settings | Opens server settings |

---

## 🔧 Settings

### Server Configuration
- Tap **⚙️** icon (top-right, small gray gear)
- Enter server URL: `http://192.168.43.100:3000`
- Test connection
- Save

### Folder Prefix
- Tap **⊚** filter icon (top-right, looks like funnel)
- Enter subfolder name
- Apply

---

## 📱 How It Works

### Playing Audio
1. Navigate to folder with .wav files
2. Tap any file
3. Audio plays from phone storage
4. Event sent to server:
   ```json
   {
     "fileName": "test1.wav",
     "audioType": "gunshot", // detected from folder path
     "duration": 3000,
     "timestamp": 1720547530000
   }
   ```
5. Dashboard receives and displays event

### Type Detection
App automatically detects type from folder path:
- Folder contains "gunshot" → type: "gunshot"
- Folder contains "animal" → type: "animal"
- Other folder → type: "unknown"

---

## ⚙️ Bug Fixes Included

✅ Fixed playback event not sending  
✅ Fixed folder path handling  
✅ Fixed permission requests  
✅ Fixed back navigation  
✅ Sorted files alphabetically  
✅ Folders appear first, then files  
✅ Visual indicators for current playback  

---

## 🎬 Demo Flow

1. **Setup** (one-time):
   - Create folder: `Download/gunshot/`
   - Copy .wav files to that folder
   - Or create any custom folder with any prefix

2. **Run app**:
   - Open VLC app
   - Grant storage permission
   - Tap filter icon ⊚
   - Type `gunshot` (or your custom prefix)
   - Press Apply

3. **Play audio**:
   - See list of .wav files
   - Tap any file to play
   - Watch dashboard update

4. **Switch folders**:
   - Tap back arrow to go to Download
   - Tap filter icon again
   - Type different prefix (e.g., `animal`)
   - See new files

---

## 🐛 Troubleshooting

### "Storage permission required"
- Go to Settings → Apps → VLC → Permissions
- Enable "Files and media"
- Restart app

### "Empty folder"
- Check folder name matches the prefix you entered
- Make sure .wav files are in that folder
- Use File Manager to verify

### No files showing
- Tap back arrow to go to Download folder
- Check if subfolders exist there
- Files must be .wav format (case-insensitive)

### Playback fails
- Make sure device has audio system
- Check .wav file is valid (not corrupted)
- Try different .wav file

### Dashboard doesn't update
- Verify server URL with test button
- Check network connection
- Server must be on same WiFi (mobile hotspot)

---

## 📝 Tips

- **Create any folders you want** - prefix system works with any folder name
- **Mix folders** - Can have gunshot, animal, demo, test, etc. all in Download
- **Quick switching** - Just tap filter icon and type different prefix
- **File organization** - Put related audio in same folder for easy access
- **Remember prefix** - App saves your last used prefix

---

## 🚀 Ready to Go!

Your app is now installed and ready to use. Just:
1. Create folders in Download
2. Add .wav files
3. Open app
4. Use filter to set prefix
5. Play and demo!

Good luck with your presentation! 🎉
