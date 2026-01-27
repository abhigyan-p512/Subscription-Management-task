# Fix MongoDB Connection Error

## Error: `getaddrinfo ENOTFOUND ac-gdb1enc-shard-00-02.ye0u4qj.mongodb.net`

This error means your application cannot connect to MongoDB Atlas. Follow these steps to fix it:

---

## ✅ Step 1: Verify MongoDB Atlas Cluster Exists

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. Sign in to your account
3. Check if your cluster `cluster0.ye0u4qj.mongodb.net` exists
4. If the cluster doesn't exist or was deleted:
   - Create a new cluster (Free tier M0 works fine)
   - Wait for it to finish creating (takes 3-5 minutes)

---

## ✅ Step 2: Get the Correct Connection String

1. In MongoDB Atlas, click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select **"Node.js"** as the driver
4. Copy the connection string (it will look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

---

## ✅ Step 3: Update Your Connection String

1. Open `backend\.env` file
2. Replace the `MONGODB_URI` line with your new connection string
3. **Important:** 
   - Replace `<username>` with your MongoDB username
   - Replace `<password>` with your MongoDB password
   - Add `/subscription-management` before the `?` to specify the database name
   
   **Example:**
   ```env
   MONGODB_URI=mongodb+srv://myusername:mypassword@cluster0.xxxxx.mongodb.net/subscription-management?retryWrites=true&w=majority
   ```

---

## ✅ Step 4: Configure Network Access (IP Whitelist)

**This is CRITICAL - MongoDB won't connect without this!**

1. In MongoDB Atlas, go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. For development, you can:
   - Click **"Add Current IP Address"** (recommended)
   - OR click **"Allow Access from Anywhere"** and enter `0.0.0.0/0` (less secure, but works for testing)
4. Click **"Confirm"**

**Note:** If your IP changes (e.g., different WiFi network), you'll need to update this.

---

## ✅ Step 5: Verify Database User Credentials

1. In MongoDB Atlas, go to **"Database Access"** (left sidebar)
2. Check if a user with username `subscription` exists
3. If it doesn't exist:
   - Click **"Add New Database User"**
   - Choose **"Password"** authentication
   - Username: `subscription` (or any username you prefer)
   - Password: Create a strong password (or use `WR5ld3TUz5ybf5r7` if you want to keep it)
   - Set privileges to **"Read and write to any database"**
   - Click **"Add User"**

---

## ✅ Step 6: Test the Connection

1. Make sure your backend server is **stopped**
2. Restart the backend server:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\backend"
   npm start
   ```
3. Look for this message: `MongoDB connected` ✅
4. If you see `MongoDB connection error:`, check the error message

---

## ✅ Step 7: Test in the Frontend

1. Make sure both backend and frontend servers are running
2. Open http://localhost:3000
3. Enter your email and click "Continue"
4. It should work now! ✅

---

## 🔍 Common Issues and Solutions

### Issue: "Authentication failed"
- **Solution:** Check your username and password in the connection string match your MongoDB Atlas database user

### Issue: "IP not whitelisted"
- **Solution:** Add your current IP address in MongoDB Atlas Network Access

### Issue: "Cluster not found"
- **Solution:** The cluster might have been deleted. Create a new cluster in MongoDB Atlas

### Issue: "Connection timeout"
- **Solution:** 
  - Check your internet connection
  - Verify the cluster is running (not paused)
  - Check firewall settings

### Issue: Still getting errors after all steps
- **Solution:** Try creating a completely new cluster and new database user

---

## 📝 Quick Checklist

- [ ] MongoDB Atlas cluster exists and is running
- [ ] Connection string is correct in `backend\.env`
- [ ] Username and password in connection string match MongoDB Atlas user
- [ ] IP address is whitelisted in Network Access
- [ ] Database user has read/write permissions
- [ ] Backend server restarted after changes
- [ ] Backend shows "MongoDB connected" message

---

## 🆘 Still Having Issues?

If you're still getting errors:

1. **Check backend terminal** - Look for the exact error message
2. **Check MongoDB Atlas logs** - Go to "Monitoring" in Atlas to see connection attempts
3. **Try a fresh setup:**
   - Create a new MongoDB Atlas cluster
   - Create a new database user
   - Get a fresh connection string
   - Update your `.env` file

---

## Alternative: Use Local MongoDB (For Testing)

If MongoDB Atlas continues to cause issues, you can use a local MongoDB instance:

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Update `backend\.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/subscription-management
   ```
3. Make sure MongoDB service is running locally

---

**After fixing, restart your backend server and try again!**
