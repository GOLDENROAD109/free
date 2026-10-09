const mongoose = require('mongoose');

/**
 * A single executable assertion. `assertionString` is a JavaScript
 * expression evaluated against the learner's submitted code inside an
 * isolated `vm` context (server) and an isolated <iframe> sandbox (client).
 * Example: "add(2, 3) === 5"
 */
const verificationTestSchema = new mongoose.Schema(
  {
    testDescription: { type: String, required: true, trim: true },
    assertionString: { type: String, required: true },
  },
  { _id: false }
);

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'],
    },
    summary: { type: String, default: '', trim: true },
    instructionMarkdown: { type: String, required: true },
    boilerplateCode: { type: String, default: '' },
    verificationTests: {
      type: [verificationTestSchema],
      default: [],
      validate: {
        validator: (tests) => Array.isArray(tests) && tests.length > 0,
        message: 'A challenge needs at least one verification test',
      },
    },
    category: { type: String, default: 'fundamentals', trim: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    baseXP: { type: Number, default: 50, min: 10 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

challengeSchema.index({ order: 1, slug: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
