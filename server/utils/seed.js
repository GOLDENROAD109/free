const Challenge = require('../models/Challenge');
const { CHALLENGES } = require('../data/challenges');
const { dbReady } = require('../config/db');
const { inMemoryActive } = require('../config/inMemoryDb');

/**
 * Idempotent seed handler: inserts the challenge catalogue when the
 * collection is empty. Safe to call on every boot. Skipped when the
 * in-memory layer is active (its catalogue is pre-seeded).
 */
async function seedChallenges() {
  if (inMemoryActive()) {
    console.log('[seed] Skipped — in-memory catalogue is pre-seeded.');
    return { seeded: false, reason: 'in-memory' };
  }
  if (!dbReady()) {
    console.log('[seed] Skipped — no database connection.');
    return { seeded: false, reason: 'no-db' };
  }
  try {
    const count = await Challenge.countDocuments();
    if (count > 0) {
      console.log(`[seed] ${count} challenge(s) already present — skipping seed.`);
      return { seeded: false, reason: 'already-seeded', count };
    }
    await Challenge.insertMany(CHALLENGES);
    console.log(`[seed] Inserted ${CHALLENGES.length} challenges.`);
    return { seeded: true, count: CHALLENGES.length };
  } catch (err) {
    console.warn('[seed] Seeding failed:', err.message);
    return { seeded: false, reason: 'error', error: err.message };
  }
}

module.exports = { seedChallenges };
