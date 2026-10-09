const mongoose = require('mongoose');

/**
 * Tracks consecutive active coding days (UTC calendar days).
 * - `current`  : length of the active streak right now
 * - `longest`  : best streak ever achieved (feeds rank-multiplier badges)
 * - `lastActiveDate` : ISO date (YYYY-MM-DD, UTC) of the last counted activity
 */
const codingStreakSchema = new mongoose.Schema(
  {
    current: { type: Number, default: 0, min: 0 },
    longest: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    displayName: { type: String, default: 'Coder', trim: true, maxlength: 40 },

    // ---- Gamification: "Streak & Claim" model ----
    codingStreak: { type: codingStreakSchema, default: () => ({}) },
    experiencePoints: { type: Number, default: 0, min: 0 },
    achievedTitles: { type: [String], default: ['Script Rookie'] },
    completedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],

    // ---- Global balanced paywall flag ----
    // True once the localized (PPP-adjusted) certificate purchase is confirmed.
    localizedPaymentStatus: { type: Boolean, default: false },

    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ experiencePoints: -1 });

/** Shape returned to clients — never leaks the password hash. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: String(this._id),
    email: this.email,
    displayName: this.displayName,
    codingStreak: {
      current: this.codingStreak?.current ?? 0,
      longest: this.codingStreak?.longest ?? 0,
      lastActiveDate: this.codingStreak?.lastActiveDate ?? null,
    },
    experiencePoints: this.experiencePoints,
    achievedTitles: this.achievedTitles,
    completedChallenges: this.completedChallenges,
    localizedPaymentStatus: this.localizedPaymentStatus,
    isAdmin: this.isAdmin,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
