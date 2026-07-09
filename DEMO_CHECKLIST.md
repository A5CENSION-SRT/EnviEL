# 🎯 Demo Day Checklist

Print this out or save to your phone!

---

## ✅ Pre-Demo (Day Before)

- [ ] Run `npm run dev` - make sure no errors
- [ ] Open dashboard in browser - verify it loads
- [ ] Check audio files exist: `ls public/audio/gunshot/`
- [ ] Build VLC app: `./gradlew build`
- [ ] Install to phone: `./gradlew installDebug`
- [ ] Verify VLC app opens
- [ ] Charge phone battery fully
- [ ] Test WiFi on laptop
- [ ] Write down laptop IP: `ipconfig` → Copy IPv4
- [ ] Test full flow once (play → dashboard updates)

---

## ✅ Day Of Demo (30 Minutes Before)

**Terminal 1: Start Dashboard**
```bash
cd c:\coding\EnviEL
npm run dev
```
- [ ] See "▲ Next.js ... ready on http://localhost:3000"
- [ ] Open http://localhost:3000/dashboard in browser
- [ ] Dashboard loads without errors

**On Phone:**
- [ ] Full battery? (100%)
- [ ] WiFi connected? (same as laptop)
- [ ] VLC app opens
- [ ] Settings show correct IP
  - [ ] Tap ⚙️ Settings
  - [ ] Should show: `http://192.168.x.x:3000`

**Test Connection:**
- [ ] Play gunshot on VLC
- [ ] Check dashboard updates within 10 seconds
- [ ] See "🔫 GUNSHOT DETECTED" badge
- [ ] If not working, check:
  - [ ] Is laptop WiFi on?
  - [ ] Is phone on same WiFi?
  - [ ] Correct IP in VLC settings?

---

## ✅ During Demo (Have These Ready)

**Phone Setup:**
- [ ] VLC app running
- [ ] 🔫 GUNSHOT tab visible
- [ ] 🦁 ANIMAL tab visible
- [ ] First 3 audio files loaded
- [ ] Airplane mode OFF

**Laptop Setup:**
- [ ] Dashboard in browser (full screen)
- [ ] Terminal showing "npm run dev" (don't close)
- [ ] No other apps running (close Slack, email, etc.)
- [ ] Close unnecessary browser tabs
- [ ] Do NOT lock screen

**Props:**
- [ ] Demo script printed or phone notes open
- [ ] Laptop IP written down
- [ ] Phone charger nearby (just in case)
- [ ] Water (for throat)

---

## 🎬 Demo Flow Checklist

### Opening (1 min) - 30 seconds early
- [ ] "Good morning everyone"
- [ ] "We're showing EnviEL - anti-poaching detection"
- [ ] "Laptop = HQ Dashboard, Phone = Ranger's VLC app"

### Show Dashboard (30 sec)
- [ ] Point at screen
- [ ] "This is our headquarters"
- [ ] "Monitors sensor network in real-time"

### First Gunshot (2 min)
- [ ] Say: "Ranger detects gunshot..."
- [ ] Tap 🔫 GUNSHOT on phone
- [ ] Tap first audio file
- [ ] Tap ▶️ PLAY
- [ ] Wait and watch dashboard update
- [ ] Say: "See? Real-time sync. Exactly what ranger played."
- [ ] Point: "File name, duration, timestamp - all automated"

### Second Detection (1.5 min)
- [ ] Say: "Different threat type..."
- [ ] Tap 🦁 ANIMAL on phone
- [ ] Tap first audio file
- [ ] Tap ▶️ PLAY
- [ ] Dashboard updates again
- [ ] Say: "System distinguishes between threats"

### Offline Demo (1 min)
- [ ] Say: "Rangers aren't always connected"
- [ ] Enable Airplane Mode on phone
- [ ] Tap to play audio - should still work
- [ ] Disable Airplane Mode
- [ ] Say: "When reconnected, events sync automatically"

### Closing (30 sec)
- [ ] "That's EnviEL - real-time protection"
- [ ] "Questions?"

---

## ⚠️ If Something Goes Wrong

### Audio Won't Play
- [ ] Check: Audio files exist? `ls public/audio/gunshot/detection_001.wav`
- [ ] Fix: Regenerate → `node scripts/generate-audio-samples.js`
- [ ] Reinstall app → `./gradlew uninstallDebug && ./gradlew installDebug`

### Dashboard Doesn't Update
- [ ] Check: Did you play audio?
- [ ] Check: Waited 10 seconds?
- [ ] Fix: Refresh browser
- [ ] Fix: Restart `npm run dev`

### Can't Connect
- [ ] Check: Same WiFi? (phone + laptop)
- [ ] Check: Firewall? (Allow node.exe in Windows Firewall)
- [ ] Fix: Get new IP → `ipconfig`
- [ ] Fix: Update VLC settings with new IP

### Phone Disconnects
- [ ] Move closer to WiFi router
- [ ] Airplane mode might have turned on - check
- [ ] Re-enter server IP in settings

### Last Resort
- [ ] Close VLC app completely
- [ ] Restart WiFi on phone
- [ ] Uninstall app: `./gradlew uninstallDebug`
- [ ] Reinstall: `./gradlew installDebug`
- [ ] Reconfigure settings

---

## 📊 What Audience Should See

**On Laptop Screen:**
```
Gunshot Detection Event:
🔫 GUNSHOT DETECTED
Detection_gunshot_001.wav
Duration: 3.5s | 14:32:10

Animal Detection Event:  
🦁 ANIMAL DETECTED
Detection_animal_001.wav
Duration: 5.2s | 14:28:45
```

**Updates happen within 10 seconds of playing audio**

If this doesn't happen → System isn't working

---

## 🏆 Success Criteria

- [ ] Dashboard updates when audio plays ✅
- [ ] Shows correct file name ✅
- [ ] Shows correct duration ✅
- [ ] Shows correct detection type (🔫 or 🦁) ✅
- [ ] Updates for both gunshot and animal ✅
- [ ] Offline mode works ✅
- [ ] No WiFi drops during demo ✅
- [ ] Audience understands the workflow ✅

If all ✅ → **DEMO SUCCESSFUL** 🎉

---

## After Demo

```bash
# Stop dashboard: Ctrl+C in terminal with "npm run dev"

# Uninstall app from phone:
./gradlew uninstallDebug

# To run again later (no setup needed):
npm run dev  # Audio files already exist
```

---

## Emergency Contact

If things don't work:

1. **Read**: DEMO_SETUP_GUIDE.md (Troubleshooting section)
2. **Read**: SYSTEM_OVERVIEW.md (How it works)
3. **Check**: Is WiFi working?
4. **Check**: Is port 3000 in use? (`netstat -ano | grep 3000`)
5. **Try**: Restart everything (npm run dev, reinstall app)

---

## Pro Tips for Success

✅ **Practice**: Run demo 2-3x before showing people

✅ **Network**: Have phone hotspot as backup WiFi

✅ **Timing**: Wait between plays (don't play too fast)

✅ **Speak**: Explain what's happening at each step

✅ **Show**: Point at screen with cursor/hand

✅ **Pause**: Let dashboard update before next action

✅ **Attitude**: Look confident, even if things break

---

## Time Breakdown

| Step | Time | What to Say |
|------|------|-----------|
| Intro | 30s | Show system, explain purpose |
| Dashboard | 30s | "This is HQ monitoring" |
| Gunshot Demo | 2 min | "Watch it sync in real-time" |
| Animal Demo | 1.5 min | "Different threat, same system" |
| Offline | 1 min | "Works without WiFi" |
| Q&A | Open | Answer questions |

**Total**: 5-10 minutes including Q&A

---

## Notes for Your Demo

```
Audience size: _______

Demo location: _______

WiFi network: _______

Laptop IP (find day-of): _______

Phone model: _______

Practice run 1: ___/___/___  ✅ or ❌
Practice run 2: ___/___/___  ✅ or ❌
Practice run 3: ___/___/___  ✅ or ❌

Real demo: ___/___/___  ✅ or ❌

Feedback: _______________________________

```

---

## Good Luck! 🎬

You've built a real system. It works. Trust it.

**Remember**: The goal is to show EnviEL works, not to be perfect.

**If something breaks**: Just explain what would happen in production, then move on.

**Most important**: Tell the story of how rangers use this in the field.

---

Print this page and check boxes as you go! ✅
