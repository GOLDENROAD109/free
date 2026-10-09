const assert = require('assert');
const {
  TITLES,
  computeStreakUpdate,
  xpAward,
  titlesUnlocked,
  nextTitle,
  multiplierForStreak,
  assetMilestoneProgress,
  msUntilNextClaimWindow,
  utcDayString,
} = require('../utils/gamification');

const daysFromNow = (offset) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};

// --- First ever activity starts a streak at 1 ---
let s = computeStreakUpdate({ current: 0, longest: 0, lastActiveDate: null }, new Date());
assert.strictEqual(s.current, 1);
assert.strictEqual(s.longest, 1);
assert.strictEqual(s.lastActiveDate, utcDayString(new Date()));

// --- Same-day activity does not double-count ---
s = computeStreakUpdate({ current: 3, longest: 3, lastActiveDate: utcDayString(new Date()) }, new Date());
assert.strictEqual(s.current, 3, 'same day: streak unchanged');
assert.strictEqual(s.longest, 3);

// --- Consecutive day extends the streak ---
s = computeStreakUpdate(
  { current: 3, longest: 3, lastActiveDate: utcDayString(daysFromNow(-1)) },
  new Date()
);
assert.strictEqual(s.current, 4, 'yesterday -> today: +1');
assert.strictEqual(s.longest, 4);

// --- A gap resets the streak to 1 but preserves the record ---
s = computeStreakUpdate(
  { current: 10, longest: 12, lastActiveDate: utcDayString(daysFromNow(-3)) },
  new Date()
);
assert.strictEqual(s.current, 1, 'gap: reset to 1');
assert.strictEqual(s.longest, 12, 'longest never decreases');

// --- Defensive defaults ---
s = computeStreakUpdate(undefined, new Date());
assert.strictEqual(s.current, 1);

// --- XP awards scale with the rank multiplier ---
assert.strictEqual(xpAward(50, 0), 50, 'Bronze x1.0');
assert.strictEqual(xpAward(50, 2), 50, 'below Silver: still x1.0');
assert.strictEqual(xpAward(50, 3), 63, 'Silver x1.25 rounds to 63');
assert.strictEqual(xpAward(50, 7), 75, 'Gold x1.5');
assert.strictEqual(xpAward(100, 14), 175, 'Platinum x1.75');
assert.strictEqual(xpAward(100, 30), 200, 'Diamond x2.0');

// --- Multiplier badges ---
assert.strictEqual(multiplierForStreak(0).badge, 'Bronze');
assert.strictEqual(multiplierForStreak(3).badge, 'Silver');
assert.strictEqual(multiplierForStreak(7).badge, 'Gold');
assert.strictEqual(multiplierForStreak(14).badge, 'Platinum');
assert.strictEqual(multiplierForStreak(30).badge, 'Diamond');
assert.strictEqual(multiplierForStreak(365).badge, 'Diamond', 'caps at Diamond');

// --- Title unlocks ---
assert.deepStrictEqual(titlesUnlocked(0), ['Script Rookie']);
const at1300 = titlesUnlocked(1300);
assert.ok(at1300.includes('Script Rookie'));
assert.ok(at1300.includes('Bug Squasher'));
assert.ok(at1300.includes('Commit Cadet'));
assert.ok(at1300.includes('Merge Warrior'));
assert.ok(at1300.includes('Full-Stack Titan'));
assert.ok(!at1300.includes('Open Source Legend'));
assert.strictEqual(titlesUnlocked(99999).length, TITLES.length, 'all titles at high XP');

// --- Next title to chase ---
assert.strictEqual(nextTitle(0).name, 'Bug Squasher');
assert.strictEqual(nextTitle(100).name, 'Commit Cadet');
assert.strictEqual(nextTitle(99999), null, 'no next title when all unlocked');

// --- Digital asset milestones ("claim" half of Streak & Claim) ---
const milestones = assetMilestoneProgress(8);
assert.strictEqual(milestones.length, 4);
assert.strictEqual(milestones[0].claimed, true, '3-day asset claimed at 8 days');
assert.strictEqual(milestones[1].claimed, true, '7-day asset claimed at 8 days');
assert.strictEqual(milestones[2].claimed, false, '14-day asset locked at 8 days');
assert.strictEqual(milestones[2].remaining, 6);
assert.ok(Math.abs(milestones[0].progress - 1) < 1e-9);

// --- Claim window countdown is positive and <= 24h ---
const ms = msUntilNextClaimWindow(new Date());
assert.ok(ms > 0 && ms <= 24 * 60 * 60 * 1000, 'next claim window within 24h');

console.log('✅ gamification.test.js — all assertions passed');
