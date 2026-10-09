const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/dbGuard');
const { computeCertificatePrice, buildCryptoQuote } = require('../utils/ppp');
const {
  computeStreakUpdate,
  titlesUnlocked,
  multiplierForStreak,
} = require('../utils/gamification');

const router = express.Router();

/**
 * Country/currency detection for PPP routing.
 * Priority: body field -> geo headers (ISO 3166-1 alpha-2) -> query param.
 */
function detectCountryInput(req, body = {}) {
  return (
    body.countryCode ||
    body.currency ||
    req.headers['x-country-code'] ||
    req.headers['cf-ipcountry'] ||
    req.headers['x-geo-country'] ||
    req.query.country ||
    null
  );
}

/**
 * GET /api/billing/pricing?country=IN
 * (or ?country=INR — currency codes are accepted too)
 * Returns the PPP-adjusted localized quote for the Official Certificate.
 * Public — used by the checkout page to render local pricing live.
 */
router.get('/pricing', (req, res) => {
  const quote = computeCertificatePrice(detectCountryInput(req));
  return res.json({ success: true, quote });
});

/**
 * POST /api/billing/checkout
 * body: { countryCode?, currency?, paymentMethod?: 'card' | 'crypto' }
 *
 * Computes the PPP-localized price, creates a pending Order, and returns a
 * MOCK payment intent (Stripe-style clientSecret / crypto gateway quote).
 * Swap the mock intent creation for live Stripe PaymentIntents in production.
 */
router.post('/checkout', requireAuth, requireDb, async (req, res, next) => {
  try {
    const method = req.body && req.body.paymentMethod === 'crypto' ? 'crypto' : 'card';
    const quote = computeCertificatePrice(detectCountryInput(req, req.body || {}));

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.localizedPaymentStatus) {
      return res.status(400).json({ message: 'The Official Certificate is already active on this account.' });
    }

    const mockIntentId = `pi_mock_fch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const order = await Order.create({
      user: user._id,
      product: 'official-certificate',
      countryCode: quote.countryCode,
      currency: quote.currency,
      currencySymbol: quote.currencySymbol,
      amountUSD: quote.priceUSD,
      localAmount: quote.localAmount,
      exchangeRate: quote.exchangeRate,
      pppMultiplier: quote.pppMultiplier,
      tier: quote.tier,
      paymentMethod: method,
      status: 'pending',
      mockPaymentIntentId: mockIntentId,
      cryptoDetails: method === 'crypto' ? buildCryptoQuote(quote) : undefined,
    });

    return res.status(201).json({
      success: true,
      orderId: String(order._id),
      // Stripe-style mock fields — replace with a real PaymentIntent + Elements.
      clientSecret: `mock_secret_${mockIntentId}`,
      paymentIntentId: mockIntentId,
      publishableKey: process.env.STRIPE_MOCK_PUBLISHABLE_KEY || 'pk_test_mock_free_code_hub',
      paymentMethod: method,
      quote,
      cryptoDetails: order.cryptoDetails || null,
      note: 'DEMO MODE: simulated payment. No real charge occurs.',
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/billing/confirm
 * body: { orderId, paymentIntentId }
 *
 * Mock confirmation (production: Stripe webhook `payment_intent.succeeded`
 * verified by signature). Marks the order paid, flips the user's
 * localizedPaymentStatus flag, grants a certification XP bonus + the
 * "Certified Pro" title, and syncs progress over WebSockets.
 */
router.post('/confirm', requireAuth, requireDb, async (req, res, next) => {
  try {
    const { orderId, paymentIntentId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required.' });
    }
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (order.status === 'paid') {
      const user = await User.findById(req.user.id);
      return res.json({ success: true, alreadyPaid: true, order, user: user ? user.toPublicJSON() : null });
    }
    if (paymentIntentId && order.mockPaymentIntentId && paymentIntentId !== order.mockPaymentIntentId) {
      return res.status(400).json({ message: 'Payment intent does not match this order.' });
    }

    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.localizedPaymentStatus = true;

    // Certification bonus: +500 XP, streak counts as activity, title unlock.
    const BONUS_XP = 500;
    const streak = computeStreakUpdate(user.codingStreak);
    user.codingStreak = streak;
    user.experiencePoints += BONUS_XP;
    const unlocked = new Set([...user.achievedTitles, ...titlesUnlocked(user.experiencePoints), 'Certified Pro']);
    const newTitles = [...unlocked].filter((t) => !user.achievedTitles.includes(t));
    user.achievedTitles = [...unlocked];
    await user.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${user._id}`).emit('progress:updated', {
        reason: 'certificate-purchased',
        bonusXP: BONUS_XP,
      });
      io.to('leaderboard').emit('leaderboard:updated', {
        userId: String(user._id),
        displayName: user.displayName,
        experiencePoints: user.experiencePoints,
      });
    }

    return res.json({
      success: true,
      order,
      bonusXP: BONUS_XP,
      newTitles,
      rankMultiplier: multiplierForStreak(streak.current),
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/billing/orders
 * The current user's order history.
 */
router.get('/orders', requireAuth, requireDb, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
