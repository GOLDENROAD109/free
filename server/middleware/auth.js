const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fch-dev-secret-change-me';

/** Issues a signed JWT for a user document. */
function signToken(user) {
  return jwt.sign({ id: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

/** Express middleware — requires `Authorization: Bearer <token>`. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = { requireAuth, signToken, JWT_SECRET };
