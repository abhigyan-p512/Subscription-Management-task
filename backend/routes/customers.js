const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

router.post('/create', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const customer = await stripe.customers.create({
      email,
    });

    const user = new User({
      email,
      stripeCustomerId: customer.id
    });

    await user.save();

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId
      }
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:customerId', async (req, res) => {
  try {
    const user = await User.findOne({ stripeCustomerId: req.params.customerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

