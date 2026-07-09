# EnviEL Demo Setup - Mobile Hotspot Edition

**Setup**: Laptop connects to Phone's WiFi Hotspot → Dashboard + VLC App communicate through phone's internet

---

## Network Architecture

```
┌──────────────────────┐
│   Android Phone       │
│  (WiFi Hotspot ON)   │
│  Network: "YourName" │
│  Password: ****      │
└──────┬───────────────┘
       │ WiFi Hotspot
       │
┌──────▼───────────────────┐
│   Laptop (Windows)        │
│ Connected to:             │
│ Network: "YourName"       │
│ IP: 192.168.x.x (Dynamic) │
│                           │
│ Running: Next.js Server   │
│ localhost:3000            │
└───────────────────────────┘
```

**Important**: Both laptop AND VLC app connect to the SAME hotspot

---

## Step 1: Enable Mobile Hotspot on Phone

### Android Hotspot Setup

1. **Open Settings** on phone
2. **Tap "Network & Internet"** or **"Connections"**
3. **Select "Hotspot & Tethering"** (name varies by phone)
4. **Tap "WiFi Hotspot"** or **"Mobile Hotspot"**
5. **Turn ON** the toggle
6. **Note the network name** (e.g., "AndroidPhone")
7. **Note the password** (usually 8+ characters)
8. **Leave this screen open** during demo

✅ Phone is now broadcasting WiFi hotspot

---

## Step 2: Connect Laptop to Hotspot

1. **Click WiFi icon** in Windows system tray
2. **Find your phone's hotspot** (e.g., "AndroidPhone")
3. **Click "Connect"**
4. **Enter password** (from Step 1.7)
5. **Wait for "Connected" status**

✅ Laptop is now on phone's hotspot

---

## Step 3: Find Laptop's IP on Hotspot Network

Once connected to hotspot, find the laptop's IP:

```bash
ipconfig
```

Look for:
```
WiFi adapter WiFi:
   Connection-specific DNS Suffix . : 
   IPv4 Address. . . . . . . . . . . : 192.168.43.x
```

**Note this IP** (e.g., 192.168.43.100)

---

## Step 4: Start Dashboard on Laptop

```bash
cd c:\coding\EnviEL

# Generate audio (one time)
node scripts/generate-audio-samples.js

# Start Next.js server
npm run dev
```

✅ Dashboard runs on: `http://192.168.43.100:3000`

---

## Step 5: Configure VLC App

On the **same phone** with hotspot ON:

1. **Open VLC app** (already installed)
2. **Tap ⚙️ Settings** (top right)
3. **Find "Server URL"** field
4. **Enter**: `http://192.168.43.100:3000`
   - Use the IP from Step 3
5. **Tap Save**

✅ VLC app now connects to dashboard through phone's hotspot

---

## Step 6: Test Connection

**On VLC App:**
1. Tap 🔫 **GUNSHOT**
2. Tap first audio file
3. Tap **▶️ PLAY**

**On Laptop Browser:**
- Open `http://192.168.43.100:3000/dashboard` (on laptop)
- Look for "📱 Mobile Audio Player Activity" section
- Should show: "🔫 GUNSHOT DETECTED" within 10 seconds

✅ If event appears → System working!
❌ If nothing → Check IP is correct

---

## Demo Flow (Unchanged)

The EnviEL dashboard works **exactly the same**. It naturally detects the playback events:

```
VLC App plays audio
    ↓
POST /api/audio-events sent through hotspot
    ↓
Laptop receives event
    ↓
Dashboard updates with badge:
   "🔫 GUNSHOT DETECTED"
   "Detection_gunshot_001.wav"
   "Duration: 3.5s • 14:32:10"
```

**No changes to dashboard detection logic** - it works naturally

---

## During Demo

### Phone (VLC App)
- Hotspot stays ON
- Play audio files
- Switch between gunshot/animal
- Can show offline by disabling hotspot mid-play

### Laptop
- Stays connected to phone hotspot
- Dashboard displays events normally
- No network setup needed (just connected to hotspot)

### Presentation Flow

1. **30 sec**: "This is our HQ dashboard"
2. **2 min**: "Ranger plays gunshot detection"
   - Play on VLC
   - Dashboard updates naturally
3. **1.5 min**: "Different threat type"
   - Play animal detection
   - Dashboard shows both events
4. **1 min**: "Works offline too"
   - Disable hotspot briefly
   - Show app still plays locally
   - Re-enable hotspot, events sync

---

## Troubleshooting

### Problem: Laptop Can't Find Hotspot
**Fix:**
1. Check hotspot is ON on phone
2. Wait 5 seconds for phone to broadcast
3. Refresh WiFi list on laptop
4. Try again

### Problem: Connected but No Internet
**Check:**
1. Phone has cellular data? (or WiFi to share)
2. Hotspot isn't throttled/paused
3. Try airplane mode OFF → back ON

### Problem: Dashboard Shows Nothing
**Check:**
1. Did you play audio on VLC? ✓
2. Waited 10 seconds? ✓
3. IP in VLC settings is correct? ✓

**Verify IP:**
```bash
ipconfig  # Get current IP again
```
Phone hotspot IPs sometimes change - update VLC settings if different

### Problem: Connected But Can't Reach Dashboard
**Test:**
```bash
ping 192.168.43.100  # Replace with your IP
```

If no response → hotspot not sharing internet properly

**Fix:**
1. Turn hotspot OFF
2. Turn hotspot ON
3. Reconnect laptop
4. Get new IP with `ipconfig`

---

## Checklist

Before Demo:

- [ ] Phone has enough battery (100%)
- [ ] Phone has cellular data (or connected to WiFi)
- [ ] Hotspot enabled on phone
- [ ] Laptop connected to hotspot
- [ ] Found laptop IP: `ipconfig`
- [ ] Dashboard running: `npm run dev`
- [ ] VLC app has correct IP in settings
- [ ] Test: Play audio → Dashboard updates
- [ ] Both gunshot and animal work
- [ ] Can toggle hotspot for offline demo

---

## Network Diagram (This Setup)

```
┌─────────────────────────────────────┐
│      Android Phone (Hotspot ON)     │
│                                     │
│  Broadcasts: "AndroidPhone"         │
│  Internet: Cellular or WiFi bridge  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  VLC App Connected to:       │   │
│  │  http://192.168.43.x:3000   │   │
│  │  Plays audio → Sends events  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
           │
    WiFi Hotspot Connection
           │
┌──────────▼──────────────────────────┐
│      Windows Laptop                  │
│                                     │
│  Connected to: "AndroidPhone"        │
│  IP: 192.168.43.100 (example)       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Next.js Server             │   │
│  │  http://localhost:3000      │   │
│  │  http://192.168.43.100:3000 │   │
│  │  (accessible from phone)    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Dashboard Browser          │   │
│  │  Shows mobile events in      │   │
│  │  real-time as they occur    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## One-Liner Setup

```bash
# Step 1: Turn on phone hotspot
# Step 2: Connect laptop to hotspot
# Step 3: Find laptop IP
ipconfig | grep "IPv4"
# Step 4: Start dashboard
cd c:\coding\EnviEL && npm run dev
# Step 5: Put IP in VLC settings: http://192.168.x.x:3000
# Step 6: Play audio and watch dashboard update naturally
```

---

## Success = Dashboard Updates Naturally

When you play audio on VLC:
- Dashboard automatically shows event
- No manual trigger
- No fake data injection
- Real detection system working as designed

**That's it!** Same EnviEL system, just using phone hotspot as network.

---

**Ready?** Start with Step 1 above!
