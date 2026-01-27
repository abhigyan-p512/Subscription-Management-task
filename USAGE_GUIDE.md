# Step-by-Step Usage Guide - Subscription Management System

This guide will walk you through setting up and using the Subscription Management System.

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Running the Application](#running-the-application)
4. [Using the Application](#using-the-application)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)
- ✅ **MongoDB Atlas account** (free tier works) - [Sign up here](https://www.mongodb.com/cloud/atlas)
- ✅ **Stripe account** (test mode) - [Sign up here](https://stripe.com/)
- ✅ **Code editor** (VS Code recommended)

---

## 🚀 Initial Setup

### Step 1: Install Dependencies

#### Backend Setup:
1. Open a terminal/command prompt
2. Navigate to the backend folder:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\backend"
   ```
3. Install backend dependencies:
   ```bash
   npm install
   ```

#### Frontend Setup:
1. Open a **new** terminal/command prompt
2. Navigate to the frontend folder:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\frontend"
   ```
3. Install frontend dependencies:
   ```bash
   npm install
   ```

---

### Step 2: Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign in
2. Create a new cluster (or use existing)
3. Click **"Connect"** on your cluster
4. Choose **"Connect your application"**
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/...`)
6. Replace `<username>` and `<password>` with your database credentials
7. Add `/subscription-management` before the `?` to specify the database name
8. **Important:** In "Network Access", add your IP address (or `0.0.0.0/0` for development)

---

### Step 3: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test Mode** (toggle in the top right)
3. Copy your **Publishable Key** (starts with `pk_test_...`)
4. Copy your **Secret Key** (starts with `sk_test_...`)

---

### Step 4: Create Stripe Products and Prices

1. Go to [Stripe Products](https://dashboard.stripe.com/test/products)
2. Click **"+ Add product"**
3. Create at least one product (e.g., "Monthly Plan")
4. Set the price (e.g., $29.99/month)
5. Copy the **Price ID** (starts with `price_...`)
6. Repeat for additional plans if needed

**Note:** You'll need to update the Price IDs in the frontend code (see Step 5).

---

### Step 5: Configure Environment Variables

#### Backend `.env` File:

1. Navigate to: `backend\.env`
2. Update the file with your actual values:

```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/subscription-management?retryWrites=true&w=majority
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
FRONTEND_URL=http://localhost:3000
```

**Note:** For webhook secret, you can use a placeholder for now (e.g., `whsec_test123`) or set up webhooks later.

#### Frontend `.env` File:

1. Create a file: `frontend\.env`
2. Add the following:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
REACT_APP_API_URL=http://localhost:5000/api
```

---

### Step 6: Update Price IDs in Frontend

1. Open: `frontend\src\components\Subscribe.js`
2. Find the `PRICE_PLANS` array
3. Replace the `id` values with your actual Stripe Price IDs from Step 4

Example:
```javascript
const PRICE_PLANS = [
  {
    id: 'price_YOUR_MONTHLY_PRICE_ID',  // Replace this
    name: 'Monthly Plan',
    price: '$29.99',
    period: 'per month',
    description: 'Perfect for getting started'
  },
  // ... add more plans as needed
];
```

---

## ▶️ Running the Application

### Step 1: Start the Backend Server

1. Open a terminal
2. Navigate to the backend folder:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\backend"
   ```
3. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```
4. You should see: `Server running on port 5000` or similar

**Keep this terminal open!**

---

### Step 2: Start the Frontend Server

1. Open a **new** terminal
2. Navigate to the frontend folder:
   ```bash
   cd "c:\Users\DEVENDER SINGH\OneDrive\Desktop\Subscription Management\frontend"
   ```
3. Start the React app:
   ```bash
   npm start
   ```
4. Your browser should automatically open to `http://localhost:3000`

**Keep this terminal open too!**

---

## 🎯 Using the Application

### Step 1: Access the Landing Page

1. When the app opens, you'll see the **Landing Page** with:
   - Hero section with "Get Started Free" button
   - Features section
   - Call-to-action section

---

### Step 2: Sign Up / Login

1. Click **"Get Started Free"** or **"Start Managing Now"**
2. Enter your email address in the email field
3. Click **"Continue"**
4. The app will:
   - Create a customer account
   - Save your session
   - Redirect you to the Dashboard

---

### Step 3: View Dashboard

After logging in, you'll see:

- **Navigation Bar** at the top with:
  - Dashboard
  - Subscribe
  - Billing History
  - Logout button

- **Dashboard** showing:
  - Your account information
  - Current subscription status (if any)
  - Subscription details (plan, status, renewal date)

---

### Step 4: Subscribe to a Plan

1. Click **"Subscribe"** in the navigation bar
2. You'll see available subscription plans
3. Click **"Select Plan"** on the plan you want
4. Enter your payment details:
   - **Card Number:** Use test card `4242 4242 4242 4242`
   - **Expiry Date:** Any future date (e.g., 12/25)
   - **CVC:** Any 3 digits (e.g., 123)
   - **Postal Code:** Any valid code (e.g., 12345)
5. Click **"Subscribe"**
6. Wait for confirmation
7. You'll be redirected to the Dashboard showing your active subscription

**Test Cards:**
- ✅ Success: `4242 4242 4242 4242`
- ❌ Decline: `4000 0000 0000 0002`
- 🔐 Requires Auth: `4000 0025 0000 3155`

---

### Step 5: View Billing History

1. Click **"Billing History"** in the navigation bar
2. You'll see:
   - List of all invoices
   - Invoice details (amount, date, status)
   - Links to download invoices (if available)
   - Upcoming invoice preview

---

### Step 6: Manage Subscription

From the Dashboard:

- **View Subscription Details:**
  - Current plan name
  - Subscription status (active, canceled, etc.)
  - Current period end date
  - Renewal information

- **Cancel Subscription:**
  - If available, you'll see a cancel button
  - Click to cancel (subscription will end at period end)

---

### Step 7: Logout

1. Click **"Logout"** in the navigation bar
2. You'll be logged out and returned to the Landing Page
3. Your session is cleared

---

## 🔄 Optional: Set Up Webhooks (For Real-Time Updates)

Webhooks keep your database synchronized with Stripe events.

### Using Stripe CLI (Recommended for Development):

1. Install Stripe CLI: [Download here](https://stripe.com/docs/stripe-cli)
2. Login:
   ```bash
   stripe login
   ```
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Update `backend\.env` with the secret:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_copied_secret_here
   ```
6. Restart your backend server

---

## 🐛 Troubleshooting

### Backend won't start:
- ✅ Check if port 5000 is already in use
- ✅ Verify `.env` file exists and has correct values
- ✅ Check MongoDB connection string is correct
- ✅ Ensure MongoDB Atlas IP whitelist includes your IP

### Frontend won't start:
- ✅ Check if port 3000 is already in use
- ✅ Verify `frontend\.env` file exists
- ✅ Check that backend is running first

### Payment not working:
- ✅ Verify Stripe keys are correct (test mode)
- ✅ Check Price IDs match your Stripe dashboard
- ✅ Use test card numbers (not real cards)
- ✅ Check browser console for errors

### Can't connect to MongoDB:
- ✅ Verify connection string in `.env`
- ✅ Check MongoDB Atlas IP whitelist
- ✅ Ensure database credentials are correct
- ✅ Check internet connection

### Subscription not showing:
- ✅ Check webhooks are set up (optional but recommended)
- ✅ Refresh the page
- ✅ Check browser console and server logs

---

## 📝 Quick Reference

### Important URLs:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Stripe Dashboard:** https://dashboard.stripe.com/test
- **MongoDB Atlas:** https://cloud.mongodb.com

### Test Card Numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

### Common Commands:
```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm start

# Stripe CLI (if using webhooks)
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

---

## ✅ Checklist Before First Use

- [ ] Node.js installed
- [ ] MongoDB Atlas account created
- [ ] Stripe account created (test mode)
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] Frontend dependencies installed (`npm install` in frontend folder)
- [ ] Backend `.env` file configured
- [ ] Frontend `.env` file created and configured
- [ ] Stripe products and prices created
- [ ] Price IDs updated in `Subscribe.js`
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Browser opened to http://localhost:3000

---

## 🎉 You're All Set!

Your Subscription Management System is now ready to use. Start by signing up with your email and exploring the features!

For more detailed technical information, see the main [README.md](README.md) file.
