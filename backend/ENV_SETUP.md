# Environment Variables Setup

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:3000
```

## MongoDB Atlas Connection String

1. Go to your MongoDB Atlas dashboard: https://cloud.mongodb.com
2. Click on "Connect" for your cluster
3. Choose "Connect your application"
4. Copy the connection string (it looks like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your actual database username and password
6. Add your database name at the end (before the `?`):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/subscription-management?retryWrites=true&w=majority
   ```
7. Paste this complete string as the value for `MONGODB_URI` in your `.env` file

### Example `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/subscription-management?retryWrites=true&w=majority
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
FRONTEND_URL=http://localhost:3000
```

## Important Notes:

- Never commit the `.env` file to git (it's already in `.gitignore`)
- Make sure your MongoDB Atlas IP whitelist includes your current IP address (or use `0.0.0.0/0` for development)
- The database name (`subscription-management`) will be created automatically if it doesn't exist

