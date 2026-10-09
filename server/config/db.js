const mongoose = require('mongoose');

/**
 * Establishes the MongoDB connection used by every Mongoose model.
 *
 * If MONGO_URI is not configured the server still boots in "demo mode":
 * read-only challenge catalogue and PPP pricing keep working, while
 * account / progress / checkout routes answer 503 with a clear message.
 *
 * @param {string} [mongoUri] - optional explicit URI (falls back to env).
 * @returns {Promise<import('mongoose').Connection|null>}
 */
async function connectDB(mongoUri) {
  const uri = mongoUri || process.env.MONGO_URI;
  if (!uri) {
    console.warn('[db] MONGO_URI is not set — running in DEMO MODE (in-memory challenge catalogue, no persistence).');
    return null;
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    console.warn('[db] Continuing in DEMO MODE — set MONGO_URI for full functionality.');
    return null;
  }
}

/** True when Mongoose currently holds an open connection. */
function dbReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, dbReady };
