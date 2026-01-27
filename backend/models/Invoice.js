const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  stripeInvoiceId: {
    type: String,
    required: true,
    unique: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'usd'
  },
  status: {
    type: String,
    required: true,
    enum: ['paid', 'open', 'void', 'uncollectible', 'draft']
  },
  paidAt: {
    type: Date
  },
  invoicePdf: {
    type: String
  },
  hostedInvoiceUrl: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);

