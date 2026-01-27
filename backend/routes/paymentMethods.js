const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get all payment methods for a customer
router.get('/:customerId', async (req, res) => {
  try {
    const user = await User.findOne({ stripeCustomerId: req.params.customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.params.customerId,
      type: 'card',
    });

    // Get customer to find default payment method
    const customer = await stripe.customers.retrieve(req.params.customerId);
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

    res.json({
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year
        },
        isDefault: pm.id === defaultPaymentMethodId
      })),
      defaultPaymentMethodId
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new payment method
router.post('/add', [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, paymentMethodId, setAsDefault } = req.body;

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    res.json({
      message: 'Payment method added successfully',
      paymentMethodId
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set default payment method
router.post('/set-default', [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('paymentMethodId').notEmpty().withMessage('Payment method ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, paymentMethodId } = req.body;

    const user = await User.findOne({ stripeCustomerId: customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({
      message: 'Default payment method updated successfully',
      paymentMethodId
    });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove payment method
router.delete('/:paymentMethodId', async (req, res) => {
  try {
    const { paymentMethodId } = req.params;

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
