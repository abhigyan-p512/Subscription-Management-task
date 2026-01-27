const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const { body, validationResult } = require('express-validator');

router.post('/create', [
  body('customerId').notEmpty(),
  body('paymentMethodId').notEmpty(),
  body('priceId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, paymentMethodId, priceId } = req.body;

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach payment method to customer (if not already attached)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (attachError) {
      // If payment method is already attached, that's okay - continue
      if (attachError.code !== 'resource_already_exists') {
        throw attachError;
      }
    }

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    const dbSubscription = new Subscription({
      userId: user._id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      priceId: priceId,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });

    await dbSubscription.save();

    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret || null;

    res.status(201).json({
      subscription: {
        id: dbSubscription._id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        clientSecret: clientSecret
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw
    });
    
    // Get priceId from request body (might not be available if validation failed)
    const priceId = req.body?.priceId || 'unknown';
    
    // Provide more detailed error messages
    let errorMessage = error.message;
    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'resource_missing' || error.message.includes('No such price')) {
        errorMessage = `Price ID "${priceId}" does not exist in Stripe. Please create the price in Stripe Dashboard and update the Price ID in Subscribe.js.`;
      }
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        type: error.type,
        code: error.code,
        stripeError: error.raw
      } : undefined
    });
  }
});

router.get('/:customerId', async (req, res) => {
  try {
    const user = await User.findOne({ stripeCustomerId: req.params.customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return all subscriptions (latest first) so dashboard can show history
    const subscriptions = await Subscription.find({ userId: user._id }).sort({ createdAt: -1 });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const latest = subscriptions[0];
    // Only retrieve Stripe data for the latest subscription (avoid multiple Stripe calls)
    const stripeSubscription = await stripe.subscriptions.retrieve(latest.stripeSubscriptionId);
    const stripeStatus = stripeSubscription?.status || latest.status;
    const stripePriceId = stripeSubscription?.items?.data?.[0]?.price?.id || latest.priceId;
    const stripeCancelAtPeriodEnd = typeof stripeSubscription?.cancel_at_period_end === 'boolean'
      ? stripeSubscription.cancel_at_period_end
      : latest.cancelAtPeriodEnd;
    const stripeCurrentPeriodEnd = stripeSubscription?.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000)
      : latest.currentPeriodEnd;
    const stripeCurrentPeriodStart = stripeSubscription?.current_period_start
      ? new Date(stripeSubscription.current_period_start * 1000)
      : latest.currentPeriodStart;

    // Self-heal DB if webhook didn't run
    try {
      const needsUpdate =
        latest.status !== stripeStatus ||
        latest.priceId !== stripePriceId ||
        latest.cancelAtPeriodEnd !== stripeCancelAtPeriodEnd ||
        String(latest.currentPeriodEnd) !== String(stripeCurrentPeriodEnd) ||
        String(latest.currentPeriodStart) !== String(stripeCurrentPeriodStart);

      if (needsUpdate) {
        latest.status = stripeStatus;
        latest.priceId = stripePriceId;
        latest.cancelAtPeriodEnd = stripeCancelAtPeriodEnd;
        latest.currentPeriodEnd = stripeCurrentPeriodEnd;
        latest.currentPeriodStart = stripeCurrentPeriodStart;
        await latest.save();
      }
    } catch (e) {
      // Non-fatal: still return Stripe-backed values to the client
      console.warn('Failed to sync subscription from Stripe:', e.message);
    }

    res.json({
      subscriptions: subscriptions.map((s) => ({
        id: s._id,
        stripeSubscriptionId: s.stripeSubscriptionId,
        status: String(s._id) === String(latest._id) ? stripeStatus : s.status,
        priceId: String(s._id) === String(latest._id) ? stripePriceId : s.priceId,
        currentPeriodEnd: String(s._id) === String(latest._id) ? stripeCurrentPeriodEnd : s.currentPeriodEnd,
        currentPeriodStart: String(s._id) === String(latest._id) ? stripeCurrentPeriodStart : s.currentPeriodStart,
        cancelAtPeriodEnd: String(s._id) === String(latest._id) ? stripeCancelAtPeriodEnd : s.cancelAtPeriodEnd,
        createdAt: s.createdAt
      })),
      subscription: {
        id: latest._id,
        stripeSubscriptionId: latest.stripeSubscriptionId,
        status: stripeStatus,
        priceId: stripePriceId,
        currentPeriodEnd: stripeCurrentPeriodEnd,
        currentPeriodStart: stripeCurrentPeriodStart,
        cancelAtPeriodEnd: stripeCancelAtPeriodEnd,
        stripeData: stripeSubscription
      }
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cancel/:subscriptionId', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    res.json({
      message: 'Subscription will be canceled at period end',
      subscription: {
        id: subscription._id,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resume canceled subscription
router.post('/resume/:subscriptionId', async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const resumedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    );

    subscription.cancelAtPeriodEnd = false;
    subscription.status = resumedSubscription.status;
    subscription.currentPeriodEnd = new Date(resumedSubscription.current_period_end * 1000);
    subscription.currentPeriodStart = new Date(resumedSubscription.current_period_start * 1000);
    await subscription.save();

    res.json({
      message: 'Subscription has been resumed',
      subscription: {
        id: subscription._id,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        status: subscription.status
      }
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update subscription (upgrade/downgrade)
router.post('/update/:subscriptionId', [
  body('priceId').notEmpty().withMessage('Price ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { priceId, prorationBehavior } = req.body;
    const subscription = await Subscription.findById(req.params.subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Get current subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: prorationBehavior || 'create_prorations', // 'create_prorations', 'none', 'always_invoice'
      }
    );

    // Update database
    subscription.priceId = priceId;
    subscription.status = updatedSubscription.status;
    subscription.currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);
    subscription.currentPeriodStart = new Date(updatedSubscription.current_period_start * 1000);
    await subscription.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription: {
        id: subscription._id,
        priceId: subscription.priceId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

