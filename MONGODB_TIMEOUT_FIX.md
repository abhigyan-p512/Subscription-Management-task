# Fix MongoDB Timeout Error

## The Problem
You're seeing: **"Operation `users.findOne()` buffering timed out after 10000ms"**

This means MongoDB is not connecting, so operations are queuing up and timing out.

---

## ✅ Quick Diagnosis

**First, check your backend terminal:**
- Does it say `✅ MongoDB connected successfully`? 
  - ✅ **YES** → The issue is something else (check below)
  - ❌ **NO** → MongoDB is not connecting (follow steps below)

---

## 🔧 Solution: Fix MongoDB Connection

### Step 1: Verify MongoDB Atlas Status

1. Go to: https://cloud.mongodb.com/
2. Sign in
3. Check your cluster status:
   - Is it **"Running"**? ✅ Good
   - Is it **"Paused"**? ❌ Click "Resume" to start it
   - Does it exist? ❌ Create a new one if deleted

### Step 2: Verify IP Whitelist (MOST COMMON ISSUE)

1. In MongoDB Atlas, go to **"Network Access"** (left sidebar)
2. Check if your IP is listed:
   - ✅ **Your IP is there** → Move to Step 3
   - ❌ **Your IP is NOT there** → Add it:
     - Click **"Add IP Address"**
     - Click **"Add Current IP Address"**
     - Click **"Confirm"**
     - Wait 1-2 minutes

**OR** for quick testing:
- Click **"Add IP Address"**
- Click **"Allow Access from Anywhere"**
- Enter: `0.0.0.0/0`
- Click **"Confirm"**
- Wait 1-2 minutes

### Step 3: Verify Connection String

1. Open `backend\.env`
2. Check the `MONGODB_URI` line
3. Make sure it looks like this:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/subscription-management?retryWrites=true&w=majority
   ```
4. Verify:
   - ✅ Username and password are correct
   - ✅ Cluster name matches your Atlas cluster
   - ✅ Database name is `/subscription-management`

### Step 4: Test Connection String

1. In MongoDB Atlas:
   - Click **"Connect"** on your cluster
   - Choose **"Connect your application"**
   - Copy the connection string
   - Compare it with your `.env` file
   - Make sure they match (except for the database name part)

### Step 5: Restart Backend Server

1. **Stop** the backend server (Ctrl + C)
2. **Start** it again:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\backend"
   npm start
   ```
3. **Look for this message:**
   - ✅ `✅ MongoDB connected successfully` → **Good!**
   - ❌ `❌ MongoDB connection error:` → Check the error message

### Step 6: Test Again

1. Go to http://localhost:3000
2. Enter your email
3. Click "Continue"
4. Should work now! ✅

---

## 🔍 Common Issues

### Issue: "Still timing out after adding IP"
- **Solution:**
  - Wait 2-3 minutes after adding IP (it takes time to propagate)
  - Check if your IP changed (different WiFi network)
  - Restart backend server after adding IP
  - Try "Allow Access from Anywhere" (`0.0.0.0/0`) temporarily

### Issue: "MongoDB connection error: Authentication failed"
- **Solution:**
  - Check username and password in connection string
  - Verify database user exists in MongoDB Atlas → "Database Access"
  - Make sure password doesn't have special characters that need URL encoding

### Issue: "Cluster not found"
- **Solution:**
  - Cluster might be deleted or paused
  - Create a new cluster in MongoDB Atlas
  - Get a fresh connection string
  - Update your `.env` file

### Issue: "Connection works but still timing out"
- **Solution:**
  - Check if MongoDB cluster is running (not paused)
  - Check your internet connection
  - Try restarting both backend and frontend servers

---

## 📝 Checklist

- [ ] MongoDB Atlas cluster exists and is **Running** (not paused)
- [ ] IP address is whitelisted in Network Access
- [ ] Connection string in `backend\.env` is correct
- [ ] Username and password match MongoDB Atlas database user
- [ ] Backend server shows `✅ MongoDB connected successfully`
- [ ] Backend server restarted after any changes
- [ ] Waited 2-3 minutes after adding IP to whitelist

---

## 🆘 Still Not Working?

### Check Backend Terminal Output:
Look for these messages:
- `✅ MongoDB connected successfully` → Connection is working
- `❌ MongoDB connection error:` → Check the specific error message
- `Server running on port 5000` → Server is running

### Get More Details:
1. Check the **exact error message** in backend terminal
2. Check MongoDB Atlas → **"Monitoring"** → See connection attempts
3. Try creating a **new cluster** and **new database user** (fresh start)

---

## 💡 Quick Test

To verify your connection string works:
1. Go to MongoDB Atlas
2. Click **"Connect"** → **"Connect using MongoDB Compass"**
3. Copy the connection string
4. Compare it with your `.env` file
5. They should be very similar (except database name)

---

**After fixing, restart your backend server and try again!**
