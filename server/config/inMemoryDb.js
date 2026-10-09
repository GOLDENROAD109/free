/**
 * ============================================================================
 *  IN-MEMORY DATA LAYER (sandbox / demo mode)
 * ============================================================================
 *  Activates automatically when no MongoDB connection is available. It
 *  implements exactly the slice of the Mongoose model API that the routes
 *  use (findOne / findById / find + sort/limit/select/populate, create,
 *  insertMany, countDocuments, doc.save(), doc.toPublicJSON()), backed by
 *  plain in-memory collections.
 *
 *  Result: the ENTIRE experience works with zero external services —
 *  register, login, challenge solving, streaks, XP, titles, PPP checkout,
 *  certificate confirmation and the leaderboard. Data resets on restart.
 * ============================================================================
 */
const { CHALLENGES } = require('../data/challenges');
const { dbReady } = require('./db');

let active = false;

/** ObjectId-like value: string-coercible, JSON-serializes as a plain string. */
class MemId {
  constructor(value) {
    this.value = value
      ? String(value)
      : `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
  equals(other) {
    if (other === null || other === undefined) return false;
    return String(other instanceof MemId ? other.value : other) === this.value;
  }
  toString() {
    return this.value;
  }
  toJSON() {
    return this.value;
  }
}

/** Strips attached methods, leaving storable plain data. */
function toPlain(doc) {
  const out = {};
  for (const key of Object.keys(doc)) {
    if (typeof doc[key] === 'function') continue;
    out[key] = doc[key];
  }
  return out;
}

/** Equality matcher for the flat queries used by the routes. */
function matches(doc, query) {
  return Object.entries(query || {}).every(([key, expected]) => {
    const actual = doc[key];
    if (expected instanceof MemId) return expected.equals(actual);
    if (actual instanceof MemId) return actual.equals(expected);
    return String(actual) === String(expected);
  });
}

/** Multi-key comparator for .sort({ field: 1|-1, ... }). */
function compareBy(sortSpec) {
  const keys = Object.entries(sortSpec || {});
  return (a, b) => {
    for (const [key, dir] of keys) {
      const av = a[key];
      const bv = b[key];
      if (av === bv) continue;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      const cmp = av > bv ? 1 : -1;
      return Number(dir) < 0 ? -cmp : cmp;
    }
    return 0;
  };
}

/** Field picker for .select('a b c') — always keeps _id. */
function pickFields(doc, fields) {
  const keep = String(fields || '').split(/\s+/).filter(Boolean);
  const out = { _id: doc._id };
  for (const f of keep) {
    if (f in doc) out[f] = doc[f];
  }
  return out;
}

/** Chainable + awaitable query, mirroring the Mongoose query surface we use. */
class Query {
  constructor(store, collection, finder, { single = false } = {}) {
    this._store = store;
    this._collection = collection;
    this._finder = finder;
    this._single = single;
    this._sortSpec = null;
    this._limitN = null;
    this._selectFields = null;
    this._populateSpec = null;
  }
  sort(spec) {
    this._sortSpec = spec;
    return this;
  }
  limit(n) {
    this._limitN = n;
    return this;
  }
  select(fields) {
    this._selectFields = fields;
    return this;
  }
  populate(path, fields) {
    this._populateSpec = { path, fields };
    return this;
  }
  then(onFulfilled, onRejected) {
    return Promise.resolve()
      .then(() => this._finder())
      .then((result) => {
        let docs = this._single ? (result ? [result] : []) : [...(result || [])];
        if (this._sortSpec) docs = docs.sort(compareBy(this._sortSpec));
        if (this._limitN !== null) docs = docs.slice(0, this._limitN);
        if (this._populateSpec) docs = docs.map((d) => this._applyPopulate(d));
        if (this._selectFields) docs = docs.map((d) => pickFields(d, this._selectFields));
        return this._single ? docs[0] || null : docs;
      })
      .then(onFulfilled, onRejected);
  }
  _applyPopulate(doc) {
    const { path, fields } = this._populateSpec;
    if (path === 'completedChallenges') {
      const keep = String(fields || '').split(/\s+/).filter(Boolean);
      doc.completedChallenges = (doc.completedChallenges || []).map((id) => {
        const challenge = this._store.challenges.find((c) => String(c._id) === String(id));
        if (!challenge) return id;
        const out = { _id: challenge._id };
        for (const f of keep) {
          if (f in challenge) out[f] = challenge[f];
        }
        return out;
      });
    }
    return doc;
  }
}

/** Wraps stored plain data in a document with save()/toPublicJSON(). */
function wrapDoc(store, collection, data, model) {
  const doc = { ...data };
  doc._id = data._id instanceof MemId ? data._id : new MemId(data._id);
  doc.save = async function save() {
    const plain = toPlain(doc);
    const idx = store[collection].findIndex((d) => String(d._id) === String(doc._id));
    if (idx >= 0) store[collection][idx] = plain;
    else store[collection].push(plain);
    return doc;
  };
  if (model && model.schema && model.schema.methods && model.schema.methods.toPublicJSON) {
    doc.toPublicJSON = function toPublicJSON() {
      return model.schema.methods.toPublicJSON.call(doc);
    };
  }
  return doc;
}

function createStore() {
  return {
    users: [],
    // Stable, readable ids for the seeded catalogue (challenge_<slug>).
    challenges: CHALLENGES.map((c, i) => ({
      ...c,
      _id: new MemId(`challenge_${c.slug}`),
      isActive: c.isActive !== false,
      createdAt: new Date(Date.now() + i),
      updatedAt: new Date(Date.now() + i),
    })),
    orders: [],
  };
}

/** Schema defaults mirrored for User.create(). */
function userDefaults(overrides) {
  const now = new Date();
  return {
    displayName: 'Coder',
    codingStreak: { current: 0, longest: 0, lastActiveDate: null },
    experiencePoints: 0,
    achievedTitles: ['Script Rookie'],
    completedChallenges: [],
    localizedPaymentStatus: false,
    isAdmin: false,
    ...overrides,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Replaces the Mongoose statics used by the routes with in-memory
 * implementations. Call once at boot when no DB connection exists.
 */
function activateInMemoryDb() {
  const User = require('../models/User');
  const Challenge = require('../models/Challenge');
  const Order = require('../models/Order');

  const store = createStore();
  const wrap = (collection, data, model) => wrapDoc(store, collection, data, model);

  // ---- User ----
  User.findOne = (query = {}) =>
    new Query(store, 'users', () => {
      const found = store.users.find((u) => matches(u, query));
      return found ? wrap('users', found, User) : null;
    }, { single: true });

  User.findById = (id) =>
    new Query(store, 'users', () => {
      const found = store.users.find((u) => String(u._id) === String(id));
      return found ? wrap('users', found, User) : null;
    }, { single: true });

  User.find = (query = {}) =>
    new Query(store, 'users', () =>
      store.users.filter((u) => matches(u, query)).map((u) => wrap('users', u, User))
    );

  User.create = async (data) => {
    const normalized = { ...data };
    if (normalized.email) normalized.email = String(normalized.email).toLowerCase().trim();
    const doc = wrap('users', userDefaults(normalized), User);
    store.users.push(toPlain(doc));
    return doc;
  };

  User.countDocuments = async () => store.users.length;

  // ---- Challenge ----
  Challenge.find = (query = {}) =>
    new Query(store, 'challenges', () =>
      store.challenges.filter((c) => matches(c, query)).map((c) => wrap('challenges', c, Challenge))
    );

  Challenge.findOne = (query = {}) =>
    new Query(store, 'challenges', () => {
      const found = store.challenges.find((c) => matches(c, query));
      return found ? wrap('challenges', found, Challenge) : null;
    }, { single: true });

  Challenge.countDocuments = async () => store.challenges.length;

  Challenge.insertMany = async (docs) =>
    docs.map((d) => {
      const doc = wrap(
        'challenges',
        { ...d, isActive: d.isActive !== false, createdAt: new Date(), updatedAt: new Date() },
        Challenge
      );
      store.challenges.push(toPlain(doc));
      return doc;
    });

  // ---- Order ----
  Order.create = async (data) => {
    const now = new Date();
    const doc = wrap(
      'orders',
      { product: 'official-certificate', status: 'pending', ...data, createdAt: now, updatedAt: now },
      Order
    );
    store.orders.push(toPlain(doc));
    return doc;
  };

  Order.findOne = (query = {}) =>
    new Query(store, 'orders', () => {
      const found = store.orders.find((o) => matches(o, query));
      return found ? wrap('orders', found, Order) : null;
    }, { single: true });

  Order.find = (query = {}) =>
    new Query(store, 'orders', () =>
      store.orders.filter((o) => matches(o, query)).map((o) => wrap('orders', o, Order))
    );

  active = true;
  console.log(
    '[db] 🧠 In-memory data layer active — register, solve, streaks, XP, titles, checkout and leaderboard all work with zero external services.'
  );
  return store;
}

function inMemoryActive() {
  return active;
}

/** True when any data layer (MongoDB or in-memory) can serve requests. */
function dataLayerReady() {
  return dbReady() || active;
}

module.exports = { activateInMemoryDb, inMemoryActive, dataLayerReady, MemId };
