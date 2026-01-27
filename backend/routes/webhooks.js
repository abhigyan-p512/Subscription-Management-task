const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const notificationService = require('../services/notificationService');

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleInvoicePaid(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    const existingInvoice = await Invoice.findOne({
      stripeInvoiceId: invoice.id
    });

    if (existingInvoice) {
      existingInvoice.status = invoice.status;
      existingInvoice.amountPaid = invoice.amount_paid;
      existingInvoice.paidAt = new Date(invoice.status_transitions.paid_at * 1000);
      existingInvoice.invoicePdf = invoice.invoice_pdf;
      existingInvoice.hostedInvoiceUrl = invoice.hosted_invoice_url;
      await existingInvoice.save();
    } else {
      const newInvoice = new Invoice({
        subscriptionId: subscription._id,
        stripeInvoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        invoicePdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url
      });
      await newInvoice.save();
    }

    // Create notification
    const user = await User.findById(subscription.userId);
    if (user) {
      await notificationService.createNotificationByCustomerId(
        user.stripeCustomerId,
        'invoice_paid',
        'Payment Successful',
        `Your payment of $${(invoice.amount_paid / 100).toFixed(2)} has been processed successfully.`,
        { invoiceId: invoice.id, amount: invoice.amount_paid, currency: invoice.currency }
      );
    }
  } catch (error) {
    console.error('Error handling invoice.paid:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (subscription) {
      subscription.status = 'past_due';
      await subscription.save();
    }
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    const user = await User.findOne({
      stripeCustomerId: subscription.customer
    });

    if (!user) {
      console.error('User not found for subscription:', subscription.id);
      return;
    }

    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (!existingSubscription) {
      const newSubscription = new Subscription({
        userId: user._id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        priceId: subscription.items.data[0].price.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });
      await newSubscription.save();
    }
  } catch (error) {
    console.error('Error handling subscription.created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (dbSubscription) {
      const wasCanceled = dbSubscription.cancelAtPeriodEnd;
      const isNowCanceled = subscription.cancel_at_period_end;
      const statusChanged = dbSubscription.status !== subscription.status;

      dbSubscription.status = subscription.status;
      dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      dbSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      await dbSubscription.save();

      // Create notification for status changes
      const user = await User.findById(dbSubscription.userId);
      if (user) {
        if (!wasCanceled && isNowCanceled) {
          await notificationService.createNotificationByCustomerId(
            user.stripeCustomerId,
            'subscription_cancelled',
            'Subscription Cancelled',
            'Your subscription has been scheduled for cancellation at the end of the current billing period.',
            { subscriptionId: subscription.id }
          );
        } else if (wasCanceled && !isNowCanceled) {
          await notificationService.createNotificationByCustomerId(
            user.stripeCustomerId,
            'subscription_resumed',
            'Subscription Resumed',
            'Your subscription has been resumed successfully.',
            { subscriptionId: subscription.id }
          );
        } else if (statusChanged && subscription.status === 'active') {
          await notificationService.createNotificationByCustomerId(
            user.stripeCustomerId,
            'subscription_updated',
            'Subscription Updated',
            'Your subscription has been updated successfully.',
            { subscriptionId: subscription.id, status: subscription.status }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    const dbSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id
    });

    if (dbSubscription) {
      dbSubscription.status = 'canceled';
      await dbSubscription.save();
    }
  } catch (error) {
    console.error('Error handling subscription.deleted:', error);
  }
}

module.exports = router;

