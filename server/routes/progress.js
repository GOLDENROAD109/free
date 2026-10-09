const express = require('express');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { requireAuth } = require('../middleware/auth');
const { requireDb } = require('../middleware/dbGuard');
const { dataLayerReady, inMemoryActive } = require('../config/inMemoryDb');
const { runVerification } = require('../utils/verifyCode');
const {
  TITLES,
  computeStreakUpdate,
  xpAward,
  titlesUnlocked,
  multiplierForStreak,
  nextTitle,
} = require('../utils/gamification');

const router = express.Router();

/**
 * POST /api/progress/solve
 * body: { challengeSlug, code }
 *
 * Verifies the submission server-side (isolated vm, hard timeout), then runs
 * the "Streak & Claim" transition: streak update, XP award with rank
 * multiplier, title unlocks, and realtime socket fan-out.
 */
router.post('/solve', requireAuth, requireDb, async (req, res, next) => {
  try {
    const { challengeSlug, code } = req.body || {};
    if (!challengeSlug) {
      return res.status(400).json({ message: 'challengeSlug is required.' });
    }
    const challenge = await Challenge.findOne({ slug: String(challengeSlug).toLowerCase(), isActive: true });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found.' });
    }

    const verification = runVerification(code || '', challenge.verificationTests);
    if (!verification.passed) {
      return res.status(422).json({
        message: 'Not quite — some assertions failed. Keep hacking!',
        verification,
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // --- Streak & Claim transition ---
    const streak = computeStreakUpdate(user.codingStreak);
    user.codingStreak = streak;

    const alreadyCompleted = user.completedChallenges.some((id) => id.equals(challenge._id));
    const multiplier = multiplierForStreak(streak.current);
    // Repeat solves still grant a small XP consolation (25% of base).
    const gained = alreadyCompleted
      ? Math.round(challenge.baseXP * 0.25)
      : xpAward(challenge.baseXP, streak.current);

    user.experiencePoints += gained;
    if (!alreadyCompleted) {
      user.completedChallenges.push(challenge._id);
    }

    const unlocked = titlesUnlocked(user.experiencePoints);
    const newTitles = unlocked.filter((t) => !user.achievedTitles.includes(t));
    user.achievedTitles = [...new Set([...user.achievedTitles, ...unlocked])];

    await user.save();

    // --- Realtime progress syncing over WebSockets ---
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${user._id}`).emit('progress:updated', {
        reason: 'challenge-solved',
        challenge: challenge.slug,
        gained,
      });
      io.to('leaderboard').emit('leaderboard:updated', {
        userId: String(user._id),
        displayName: user.displayName,
        experiencePoints: user.experiencePoints,
      });
    }

    return res.json({
      success: true,
      alreadyCompleted,
      verification,
      reward: {
        xpAwarded: gained,
        baseXP: challenge.baseXP,
        multiplier: multiplier.multiplier,
        multiplierBadge: multiplier.badge,
        streak: {
          current: streak.current,
          longest: streak.longest,
          lastActiveDate: streak.lastActiveDate,
        },
        experiencePoints: user.experiencePoints,
        achievedTitles: user.achievedTitles,
        newTitles,
        nextTitle: nextTitle(user.experiencePoints),
      },
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/progress/me
 * Full gamification profile: user, rank multiplier, next title, title table,
 * and asset-milestone progress.
 */
router.get('/me', requireAuth, requireDb, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate(
      'completedChallenges',
      'title slug difficulty baseXP category'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const { assetMilestoneProgress, msUntilNextClaimWindow } = require('../utils/gamification');
    return res.json({
      success: true,
      user: user.toPublicJSON(),
      rankMultiplier: multiplierForStreak(user.codingStreak?.current || 0),
      nextTitle: nextTitle(user.experiencePoints),
      titles: TITLES,
      assetMilestones: assetMilestoneProgress(user.codingStreak?.current || 0),
      msUntilNextClaimWindow: msUntilNextClaimWindow(),
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/progress/leaderboard
 * Public top-10 by XP (drives the realtime leaderboard socket room).
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    if (!dataLayerReady()) {
      return res.json({ success: true, leaderboard: [], demoMode: true });
    }
    const top = await User.find({})
      .sort({ experiencePoints: -1, createdAt: 1 })
      .limit(10)
      .select('displayName experiencePoints codingStreak achievedTitles localizedPaymentStatus');
    return res.json({ success: true, leaderboard: top, demoMode: false, inMemory: inMemoryActive() });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
