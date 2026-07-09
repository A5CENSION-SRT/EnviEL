# Fix Build Error

I've added the missing root `build.gradle.kts` file. Now do this in Android Studio:

## Step 1: Sync Project Again

1. **File → Sync Now**
2. Wait for sync to complete

## Step 2: Rebuild

1. **Build → Rebuild Project**
2. Wait for it to finish

## Step 3: If Still Failing

1. Click **File → Invalidate Caches**
2. Select **Invalidate and Restart**
3. Android Studio restarts
4. Wait for sync
5. Click **Build → Rebuild Project**

## Step 4: Run

1. Click green ▶️ **Run** button
2. Select device
3. Click OK

---

## What Changed

✅ Created root `build.gradle.kts` with Android Gradle Plugin 8.5
✅ Updated app's `build.gradle.kts` to include plugin versions
✅ Now all dependencies are properly configured

This should fix the "Plugin not found" error!
