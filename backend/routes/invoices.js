const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.get('/history/:customerId', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ stripeCustomerId: req.params.customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const invoices = await Invoice.find({})
      .populate({
        path: 'subscriptionId',
        match: { userId: user._id }
      })
      .sort({ createdAt: -1 });

    const filteredInvoices = invoices.filter(inv => inv.subscriptionId !== null);

    res.json({
      invoices: filteredInvoices.map(inv => ({
        id: inv._id,
        stripeInvoiceId: inv.stripeInvoiceId,
        amountPaid: inv.amountPaid,
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt,
        invoicePdf: inv.invoicePdf,
        hostedInvoiceUrl: inv.hostedInvoiceUrl,
        createdAt: inv.createdAt
      })),
      total: filteredInvoices.length
    });
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/upcoming/:customerId', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ stripeCustomerId: req.params.customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = await Subscription.findOne({ userId: user._id })
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: user.stripeCustomerId,
      subscription: subscription.stripeSubscriptionId,
    });

    res.json({
      upcomingInvoice: {
        amountDue: upcomingInvoice.amount_due,
        currency: upcomingInvoice.currency,
        nextPaymentAttempt: upcomingInvoice.next_payment_attempt
          ? new Date(upcomingInvoice.next_payment_attempt * 1000)
          : null,
        periodEnd: new Date(upcomingInvoice.period_end * 1000),
        periodStart: new Date(upcomingInvoice.period_start * 1000),
        subtotal: upcomingInvoice.subtotal,
        total: upcomingInvoice.total
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manually sync invoices from Stripe (all statuses)
router.post('/sync/:customerId', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ stripeCustomerId: req.params.customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get ALL invoices from Stripe for this customer (all statuses)
    const stripeInvoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 100
    });

    let syncedCount = 0;
    const syncedInvoices = [];

    for (const stripeInvoice of stripeInvoices.data) {
      // Skip draft invoices
      if (stripeInvoice.status === 'draft') {
        continue;
      }

      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeInvoice.subscription
      });

      if (!subscription) {
        continue; // Skip if subscription not found
      }

      // Check if invoice already exists
      let invoice = await Invoice.findOne({
        stripeInvoiceId: stripeInvoice.id
      });

      if (!invoice) {
        invoice = new Invoice({
          subscriptionId: subscription._id,
          stripeInvoiceId: stripeInvoice.id,
          amountPaid: stripeInvoice.amount_paid,
          currency: stripeInvoice.currency,
          status: stripeInvoice.status,
          paidAt: stripeInvoice.status_transitions.paid_at
            ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
            : null,
          invoicePdf: stripeInvoice.invoice_pdf,
          hostedInvoiceUrl: stripeInvoice.hosted_invoice_url
        });
        await invoice.save();
        syncedCount++;
      } else {
        // Update existing invoice with latest Stripe data
        invoice.status = stripeInvoice.status;
        invoice.amountPaid = stripeInvoice.amount_paid;
        invoice.paidAt = stripeInvoice.status_transitions.paid_at
          ? new Date(stripeInvoice.status_transitions.paid_at * 1000)
          : invoice.paidAt;
        invoice.invoicePdf = stripeInvoice.invoice_pdf;
        invoice.hostedInvoiceUrl = stripeInvoice.hosted_invoice_url;
        await invoice.save();
      }
      syncedInvoices.push({
        id: invoice._id,
        status: invoice.status,
        amount: invoice.amountPaid
      });
    }

    res.json({
      message: 'Invoices synced successfully',
      syncedCount,
      totalStripeInvoices: stripeInvoices.data.length,
      syncedInvoices
    });
  } catch (error) {
    console.error('Error syncing invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Development endpoint: Create test invoices (for testing/demo purposes)
router.post('/test/create-sample/:customerId', verifyToken, async (req, res) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'This endpoint is only available in development mode' });
    }

    const user = await User.findOne({ stripeCustomerId: req.params.customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = await Subscription.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (!subscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Create sample invoices
    const sampleInvoices = [
      {
        stripeInvoiceId: `test_inv_${Date.now()}_1`,
        amountPaid: 2999,
        currency: 'usd',
        status: 'paid',
        paidAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        invoicePdf: 'https://invoice.stripe.com/pdf/test1',
        hostedInvoiceUrl: 'https://invoice.stripe.com/i/test1'
      },
      {
        stripeInvoiceId: `test_inv_${Date.now()}_2`,
        amountPaid: 2999,
        currency: 'usd',
        status: 'paid',
        paidAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        invoicePdf: 'https://invoice.stripe.com/pdf/test2',
        hostedInvoiceUrl: 'https://invoice.stripe.com/i/test2'
      },
      {
        stripeInvoiceId: `test_inv_${Date.now()}_3`,
        amountPaid: 2999,
        currency: 'usd',
        status: 'paid',
        paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        invoicePdf: 'https://invoice.stripe.com/pdf/test3',
        hostedInvoiceUrl: 'https://invoice.stripe.com/i/test3'
      }
    ];

    const createdInvoices = [];
    for (const invoiceData of sampleInvoices) {
      const newInvoice = new Invoice({
        subscriptionId: subscription._id,
        ...invoiceData
      });
      await newInvoice.save();
      createdInvoices.push(newInvoice);
    }

    res.json({
      message: 'Sample invoices created successfully',
      count: createdInvoices.length,
      invoices: createdInvoices
    });
  } catch (error) {
    console.error('Error creating test invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

