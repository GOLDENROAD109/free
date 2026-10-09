/**
 * ============================================================================
 *  GAMIFIED REWARDS SYSTEM — "Streak & Claim" algorithmic model
 * ============================================================================
 *  - codingStreak tracks consecutive active coding days (UTC calendar days)
 *  - experiencePoints (XP) accumulate per solved challenge
 *  - rank-multiplier badges scale XP gains with the streak length
 *  - developer titles unlock at XP thresholds
 * ============================================================================
 */

/** Unlockable developer titles, ordered by XP threshold. */
const TITLES = [
  { name: 'Script Rookie', minXP: 0 },
  { name: 'Bug Squasher', minXP: 100 },
  { name: 'Commit Cadet', minXP: 300 },
  { name: 'Merge Warrior', minXP: 600 },
  { name: 'Full-Stack Titan', minXP: 1200 },
  { name: 'Open Source Legend', minXP: 2500 },
];

/**
 * Rank-multiplier badges. Ordered from the highest streak requirement down;
 * the first badge whose `days` requirement is met applies.
 */
const MULTIPLIER_BADGES = [
  { days: 30, multiplier: 2.0, badge: 'Diamond', color: 'from-cyan-400 to-blue-600' },
  { days: 14, multiplier: 1.75, badge: 'Platinum', color: 'from-slate-200 to-slate-500' },
  { days: 7, multiplier: 1.5, badge: 'Gold', color: 'from-yellow-300 to-amber-500' },
  { days: 3, multiplier: 1.25, badge: 'Silver', color: 'from-slate-300 to-slate-500' },
  { days: 0, multiplier: 1.0, badge: 'Bronze', color: 'from-amber-600 to-amber-800' },
];

/** Digital profile assets claimable at streak milestones ("claim" half of the model). */
const ASSET_MILESTONES = [
  { days: 3, label: 'Animated Neon Avatar Frame', icon: '🖼️' },
  { days: 7, label: 'Holographic Badge Pack', icon: '💠' },
  { days: 14, label: 'Legendary Profile Banner', icon: '🌌' },
  { days: 30, label: 'Quantum Coder Crown', icon: '👑' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** @returns {string} ISO date (YYYY-MM-DD) in UTC for the given instant. */
function utcDayString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Whole-day difference between two ISO day strings (b - a). */
function dayDiff(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
}

/**
 * "Streak & Claim" state transition. Called whenever a user performs a
 * counted activity (solving a challenge, confirming a purchase).
 *
 * Rules:
 *  - activity on the same UTC day   -> streak unchanged
 *  - activity the day after the last -> streak + 1
 *  - any larger gap                 -> streak resets to 1
 *  - `longest` never decreases
 *
 * @param {{current?: number, longest?: number, lastActiveDate?: string|null}} streak
 * @param {Date} [now]
 * @returns {{current: number, longest: number, lastActiveDate: string}}
 */
function computeStreakUpdate(streak, now = new Date()) {
  const today = utcDayString(now);
  const last = streak && streak.lastActiveDate ? streak.lastActiveDate : null;
  const prevCurrent = streak && streak.current ? streak.current : 0;
  const prevLongest = streak && streak.longest ? streak.longest : 0;

  let current;
  if (last === today) {
    current = prevCurrent; // already counted today
  } else if (last && dayDiff(last, today) === 1) {
    current = prevCurrent + 1; // consecutive day — extend the streak
  } else {
    current = 1; // first activity ever, or the streak lapsed
  }

  return {
    current,
    longest: Math.max(prevLongest, current),
    lastActiveDate: today,
  };
}

/** @returns the rank-multiplier badge object for a streak length. */
function multiplierForStreak(streakDays) {
  const days = Math.max(0, Number(streakDays) || 0);
  return MULTIPLIER_BADGES.find((b) => days >= b.days) || MULTIPLIER_BADGES[MULTIPLIER_BADGES.length - 1];
}

/**
 * XP awarded for solving a challenge: baseXP scaled by the streak multiplier.
 * @param {number} baseXP - the challenge's base XP value
 * @param {number} streakDays - current streak length
 * @returns {number} rounded XP award
 */
function xpAward(baseXP, streakDays) {
  const { multiplier } = multiplierForStreak(streakDays);
  return Math.round(baseXP * multiplier);
}

/** @returns {string[]} every title the given XP total has unlocked. */
function titlesUnlocked(experiencePoints) {
  const xp = Number(experiencePoints) || 0;
  return TITLES.filter((t) => xp >= t.minXP).map((t) => t.name);
}

/** @returns {object|null} the next title to chase, or null if all are unlocked. */
function nextTitle(experiencePoints) {
  const xp = Number(experiencePoints) || 0;
  return TITLES.find((t) => xp < t.minXP) || null;
}

/** @returns {{days:number, remaining:number, claimed:boolean, ...}} per asset milestone. */
function assetMilestoneProgress(streakDays) {
  const days = Math.max(0, Number(streakDays) || 0);
  return ASSET_MILESTONES.map((m) => ({
    ...m,
    progress: Math.min(1, days / m.days),
    remaining: Math.max(0, m.days - days),
    claimed: days >= m.days,
  }));
}

/** Milliseconds until the next UTC midnight (next "Streak & Claim" window). */
function msUntilNextClaimWindow(now = new Date()) {
  const nextMidnight = new Date(now);
  nextMidnight.setUTCHours(24, 0, 0, 0);
  return Math.max(0, nextMidnight.getTime() - now.getTime());
}

module.exports = {
  TITLES,
  MULTIPLIER_BADGES,
  ASSET_MILESTONES,
  utcDayString,
  dayDiff,
  computeStreakUpdate,
  multiplierForStreak,
  xpAward,
  titlesUnlocked,
  nextTitle,
  assetMilestoneProgress,
  msUntilNextClaimWindow,
};
