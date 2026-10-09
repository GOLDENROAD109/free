const mongoose = require('mongoose');

/**
 * A certificate purchase order. Pricing is computed with Purchasing Power
 * Parity (see utils/ppp.js) so no country is priced out of certification.
 *
 * NOTE: payment rails are MOCKED in this build (Stripe Localized Elements /
 * crypto gateway are simulated). No real charge ever occurs — swap the mock
 * intent creation in routes/billing.js for live Stripe calls in production.
 */
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: String, default: 'official-certificate' },

    // Localized (PPP) pricing snapshot
    countryCode: { type: String, required: true },
    currency: { type: String, required: true }, // ISO 4217, lowercase (Stripe format)
    currencySymbol: { type: String, default: '$' },
    amountUSD: { type: Number, required: true }, // PPP-adjusted USD price
    localAmount: { type: Number, required: true }, // amount in the local currency
    exchangeRate: { type: Number, required: true }, // local currency units per 1 USD (mock)
    pppMultiplier: { type: Number, required: true },
    tier: { type: String, required: true }, // standard | medium | emerging

    paymentMethod: { type: String, enum: ['card', 'crypto'], default: 'card' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Mock gateway references
    mockPaymentIntentId: { type: String, default: null },
    cryptoDetails: {
      network: { type: String, default: null },
      address: { type: String, default: null },
      cryptoCurrency: { type: String, default: null },
      cryptoAmount: { type: Number, default: null },
      qrPayload: { type: String, default: null },
    },

    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
