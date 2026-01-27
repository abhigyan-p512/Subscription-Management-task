const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');

router.get('/history/:customerId', async (req, res) => {
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
      }))
    });
  } catch (error) {
    console.error('Error fetching invoice history:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/upcoming/:customerId', async (req, res) => {
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

module.exports = router;

