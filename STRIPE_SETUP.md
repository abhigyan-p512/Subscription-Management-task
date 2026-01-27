# Fix Stripe API Key Error

## The Problem
You're seeing: **"Invalid API Key provided"** - This means you need to replace the placeholder Stripe keys with your real keys from Stripe.

---

## ✅ Step 1: Get Your Stripe API Keys

### 1.1: Sign Up / Log In to Stripe
1. Go to: https://dashboard.stripe.com/
2. Sign up for a free account (or log in if you have one)
3. **Important:** Make sure you're in **Test Mode** (toggle in the top right should say "Test mode")

### 1.2: Get Your API Keys
1. In Stripe Dashboard, go to: **"Developers"** → **"API keys"** (or visit: https://dashboard.stripe.com/test/apikeys)
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - This goes in the frontend
   - **Secret key** (starts with `sk_test_...`) - This goes in the backend
3. Click **"Reveal test key"** to see your secret key
4. **Copy both keys** - You'll need them in the next steps

---

## ✅ Step 2: Update Backend `.env` File

1. Open: `backend\.env`
2. Find this line:
   ```env
   STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
   ```
3. Replace it with your real Stripe Secret Key:
   ```env
   STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
   ```
4. **Important:** Keep the `sk_test_` prefix - just replace everything after it with your actual key
5. Save the file

**Example:**
```env
STRIPE_SECRET_KEY=sk_test_51QaZxSwErDcVfRtGbYhNjUmIkOlPqWeAsDfGhJkL1234567890
```

---

## ✅ Step 3: Create Frontend `.env` File

1. Create a new file: `frontend\.env`
2. Add these two lines:
   ```env
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   REACT_APP_API_URL=http://localhost:5000/api
   ```
3. Replace `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual Publishable Key from Stripe
4. Save the file

**Example:**
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51QaZxSwErDcVfRtGbYhNjUmIkOlPqWeAsDfGhJkL1234567890
REACT_APP_API_URL=http://localhost:5000/api
```

---

## ✅ Step 4: Restart Both Servers

### Backend:
1. Stop the backend server (Ctrl + C)
2. Start it again:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\backend"
   npm start
   ```

### Frontend:
1. Stop the frontend server (Ctrl + C)
2. Start it again:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\frontend"
   npm start
   ```

**Important:** React apps need to be restarted after creating/updating `.env` files!

---

## ✅ Step 5: Test Again

1. Go to http://localhost:3000
2. Enter your email and click "Continue"
3. It should work now! ✅

---

## 🔍 Quick Checklist

- [ ] Created Stripe account (or logged in)
- [ ] In Test Mode in Stripe Dashboard
- [ ] Copied Publishable Key (starts with `pk_test_`)
- [ ] Copied Secret Key (starts with `sk_test_`)
- [ ] Updated `backend\.env` with real Secret Key
- [ ] Created `frontend\.env` with Publishable Key
- [ ] Restarted backend server
- [ ] Restarted frontend server
- [ ] Tested by entering email

---

## 🆘 Common Issues

### Issue: "Still getting invalid API key"
- **Solution:** 
  - Make sure you copied the ENTIRE key (they're long!)
  - Check for extra spaces before/after the key
  - Make sure you're using Test Mode keys (start with `sk_test_` and `pk_test_`)
  - Restart both servers after updating

### Issue: "Can't find API keys in Stripe"
- **Solution:**
  - Go to: https://dashboard.stripe.com/test/apikeys
  - Make sure you're in Test Mode (toggle in top right)
  - Click "Reveal test key" to see the secret key

### Issue: "Frontend still shows error"
- **Solution:**
  - Make sure `frontend\.env` file exists
  - Make sure it's named exactly `.env` (not `.env.txt`)
  - Restart the frontend server (React needs restart for .env changes)
  - Check the key starts with `REACT_APP_` prefix for the variable name

---

## 📝 File Locations Summary

**Backend `.env` location:**
```
c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\backend\.env
```

**Frontend `.env` location:**
```
c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\frontend\.env
```

---

## 🎯 What Your Files Should Look Like

### `backend\.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://subscription:WR5ld3TUz5ybf5r7@cluster0.ye0u4qj.mongodb.net/subscription-management?retryWrites=true&w=majority
STRIPE_SECRET_KEY=sk_test_YOUR_REAL_SECRET_KEY_FROM_STRIPE
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
FRONTEND_URL=http://localhost:3000
```

### `frontend\.env`:
```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_REAL_PUBLISHABLE_KEY_FROM_STRIPE
REACT_APP_API_URL=http://localhost:5000/api
```

---

**After updating both files and restarting servers, try again!**
