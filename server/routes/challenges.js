const express = require('express');
const Challenge = require('../models/Challenge');
const { dataLayerReady, inMemoryActive } = require('../config/inMemoryDb');
const { CHALLENGES } = require('../data/challenges');

const router = express.Router();

/**
 * GET /api/challenges
 * Public catalogue. Served from MongoDB when connected, from the in-memory
 * layer in sandbox mode, or from the static seed data as a last resort.
 */
router.get('/', async (req, res, next) => {
  try {
    if (!dataLayerReady()) {
      return res.json({ success: true, challenges: CHALLENGES, demoMode: true });
    }
    const challenges = await Challenge.find({ isActive: true }).sort({ order: 1, title: 1 });
    return res.json({ success: true, challenges, demoMode: false, inMemory: inMemoryActive() });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/challenges/:slug
 * Public single challenge (includes verificationTests for the live sandbox).
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    if (!dataLayerReady()) {
      const challenge = CHALLENGES.find((c) => c.slug === slug);
      if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });
      return res.json({ success: true, challenge, demoMode: true });
    }
    const challenge = await Challenge.findOne({ slug, isActive: true });
    if (!challenge) return res.status(404).json({ message: 'Challenge not found.' });
    return res.json({ success: true, challenge, demoMode: false, inMemory: inMemoryActive() });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
