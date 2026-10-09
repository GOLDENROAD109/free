const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { requireDb } = require('../middleware/dbGuard');

const router = express.Router();

/**
 * POST /api/auth/register
 * body: { email, password, displayName? }
 */
router.post('/register', requireDb, async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email,
      password: passwordHash,
      displayName: (displayName && String(displayName).trim()) || String(email).split('@')[0],
    });
    const token = signToken(user);
    return res.status(201).json({ success: true, token, user: user.toPublicJSON() });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post('/login', requireDb, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = signToken(user);
    return res.json({ success: true, token, user: user.toPublicJSON() });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
