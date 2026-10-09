const { dataLayerReady } = require('../config/inMemoryDb');

/**
 * Guards routes that need a data layer. With MongoDB connected this always
 * passes; in sandbox/demo mode the in-memory data layer serves the same
 * routes, so this only 503s if neither layer is active (never in practice).
 */
function requireDb(req, res, next) {
  if (!dataLayerReady()) {
    return res.status(503).json({
      message:
        'No data layer available. Connect MONGO_URI or restart the server (the in-memory demo layer activates automatically).',
      demoMode: true,
    });
  }
  next();
}

module.exports = { requireDb };
