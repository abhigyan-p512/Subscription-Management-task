# Subscription Management System

A complete MERN (MongoDB, Express, React, Node.js) application for managing subscriptions using Stripe. This application allows users to subscribe to paid plans, view their subscription status, manage billing, and view invoice history.

## Tech Stack

### Frontend
- React.js
- Stripe.js
- @stripe/react-stripe-js
- Axios
- React Router

### Backend
- Node.js
- Express.js
- Stripe SDK
- MongoDB
- Mongoose

## Features

- ✅ User authentication and customer creation
- ✅ Secure card payment using Stripe Elements (CardElement)
- ✅ Subscription management (create, view, cancel)
- ✅ Real-time subscription status tracking
- ✅ Billing history with invoice details
- ✅ Upcoming invoice preview
- ✅ Stripe webhook integration for real-time updates
- ✅ Database synchronization with Stripe events

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas connection string)
- Stripe account with API keys
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd subscription-management
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `backend` directory:

**For Local MongoDB:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/subscription-management
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:3000
```

**For MongoDB Atlas (Cloud):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/subscription-management?retryWrites=true&w=majority
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:3000
```

**How to get MongoDB Atlas connection string:**
1. Go to https://cloud.mongodb.com
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your database credentials
6. Add `/subscription-management` before the `?` to specify the database name

**Important:** Replace the placeholder values with your actual keys:
- Get your Stripe Secret Key from: https://dashboard.stripe.com/test/apikeys
- The webhook secret will be generated when you set up webhooks (see Webhook Setup section)
- Make sure your MongoDB Atlas IP whitelist includes your current IP (or use `0.0.0.0/0` for development)

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd ../frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
REACT_APP_API_URL=http://localhost:5000/api
```

**Important:** Replace with your actual Stripe Publishable Key from: https://dashboard.stripe.com/test/apikeys

### 4. Stripe Price Setup

Before testing subscriptions, you need to create Price IDs in your Stripe Dashboard:

1. Go to https://dashboard.stripe.com/test/products
2. Create products and prices (e.g., Monthly Plan, Yearly Plan)
3. Copy the Price IDs (they start with `price_`)
4. Update the `PRICE_PLANS` array in `frontend/src/components/Subscribe.js` with your actual Price IDs:

```javascript
const PRICE_PLANS = [
  {
    id: 'price_your_monthly_price_id',
    name: 'Monthly Plan',
    price: '$29.99',
    period: 'per month',
    description: 'Perfect for getting started'
  },
  {
    id: 'price_your_yearly_price_id',
    name: 'Yearly Plan',
    price: '$299.99',
    period: 'per year',
    description: 'Save 17% with annual billing'
  }
];
```

## Running the Application

### Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
```

### Start Backend Server

In the `backend` directory:

```bash
npm start

# Or for development with auto-reload
npm run dev
```

The backend server will run on `http://localhost:5000`

### Start Frontend Development Server

In the `frontend` directory:

```bash
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Webhook Setup

Stripe webhooks are essential for keeping your database in sync with Stripe events. You can set up webhooks in two ways:

### Option 1: Using Stripe CLI (Recommended for Development)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe CLI:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to your `backend/.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_copied_secret_here
```

5. The CLI will forward webhook events to your local server automatically.

### Option 2: Using Stripe Dashboard (For Production)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select the following events to listen to:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret and add it to your `.env` file

## API Endpoints

### Customers
- `POST /api/customers/create` - Create a new customer
- `GET /api/customers/:customerId` - Get customer details

### Subscriptions
- `POST /api/subscriptions/create` - Create a new subscription
- `GET /api/subscriptions/:customerId` - Get subscription details
- `POST /api/subscriptions/cancel/:subscriptionId` - Cancel subscription

### Invoices
- `GET /api/invoices/history/:customerId` - Get billing history
- `GET /api/invoices/upcoming/:customerId` - Get upcoming invoice

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook endpoint

## Database Schema

### User
- `email` (String, unique, required)
- `stripeCustomerId` (String, unique, required)
- `createdAt`, `updatedAt` (timestamps)

### Subscription
- `userId` (ObjectId, ref: User)
- `stripeSubscriptionId` (String, unique, required)
- `status` (String, enum: active, canceled, past_due, etc.)
- `priceId` (String, required)
- `currentPeriodEnd` (Date, required)
- `currentPeriodStart` (Date, required)
- `cancelAtPeriodEnd` (Boolean)
- `createdAt`, `updatedAt` (timestamps)

### Invoice
- `subscriptionId` (ObjectId, ref: Subscription)
- `stripeInvoiceId` (String, unique, required)
- `amountPaid` (Number, required)
- `currency` (String, default: 'usd')
- `status` (String, enum: paid, open, void, etc.)
- `paidAt` (Date)
- `invoicePdf` (String)
- `hostedInvoiceUrl` (String)
- `createdAt`, `updatedAt` (timestamps)

## Testing with Stripe Test Cards

Use these test card numbers in development:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Authentication:** `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any postal code.

## Project Structure

```
subscription-management/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Subscription.js
│   │   └── Invoice.js
│   ├── routes/
│   │   ├── customers.js
│   │   ├── subscriptions.js
│   │   ├── invoices.js
│   │   └── webhooks.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── Subscribe.js
│   │   │   └── BillingHistory.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env
└── README.md
```

## Security Best Practices

- ✅ Never expose Stripe secret keys to the frontend
- ✅ Use environment variables for all sensitive data
- ✅ Verify webhook signatures before processing events
- ✅ Use separate webhook routes with `express.raw()` middleware
- ✅ Validate all user inputs on the backend
- ✅ Use HTTPS in production

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Stripe Webhook Not Working
- Verify webhook secret in `.env`
- Check that webhook endpoint is accessible
- Use Stripe CLI for local development
- Check server logs for webhook errors

### Payment Not Processing
- Verify Stripe keys are correct
- Check that Price IDs exist in Stripe
- Ensure test cards are being used in test mode
- Check browser console and server logs for errors

## Production Deployment

Before deploying to production:

1. Update all environment variables with production values
2. Use production Stripe keys (switch from test to live mode)
3. Set up production webhook endpoint in Stripe Dashboard
4. Configure CORS properly for your production domain
5. Use MongoDB Atlas or a production MongoDB instance
6. Enable HTTPS
7. Set up proper error logging and monitoring

## License

This project is open source and available under the MIT License.

## Support

For issues related to:
- **Stripe API:** https://stripe.com/docs/api
- **Stripe Support:** https://support.stripe.com
- **MongoDB:** https://docs.mongodb.com

