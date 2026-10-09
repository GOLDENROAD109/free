const assert = require('assert');
const { runVerification } = require('../utils/verifyCode');

const addTests = [
  { testDescription: 'add(2, 3) returns 5', assertionString: 'add(2, 3) === 5' },
  { testDescription: 'add(-1, 1) returns 0', assertionString: 'add(-1, 1) === 0' },
];

// --- Correct submission passes ---
let r = runVerification('function add(a, b) { return a + b; }', addTests);
assert.strictEqual(r.passed, true);
assert.strictEqual(r.results.length, 2);
assert.ok(r.results.every((t) => t.passed));

// --- Wrong submission fails with per-test detail ---
r = runVerification('function add(a, b) { return a - b; }', addTests);
assert.strictEqual(r.passed, false);
assert.strictEqual(r.results[0].passed, false);
assert.strictEqual(r.results[1].passed, false);

// --- One failing test does not mask the others ---
r = runVerification('function add(a, b) { return a + b; }', [
  ...addTests,
  { testDescription: 'add(1, 1) returns 3', assertionString: 'add(1, 1) === 3' },
]);
assert.strictEqual(r.passed, false);
assert.strictEqual(r.results.filter((t) => t.passed).length, 2);
assert.strictEqual(r.results[2].passed, false);

// --- Runtime errors are captured, not thrown ---
r = runVerification('function add(a, b) { return a.undefined.deep; }', addTests);
assert.strictEqual(r.passed, false);
assert.ok(r.results.every((t) => typeof t.error === 'string' && t.error.length > 0));

// --- Syntax errors are captured ---
r = runVerification('function add( {', addTests);
assert.strictEqual(r.passed, false);
assert.ok(r.error && r.error.length > 0);

// --- Infinite loops are killed by the vm timeout ---
const started = Date.now();
r = runVerification('while (true) {}', addTests);
const elapsed = Date.now() - started;
assert.strictEqual(r.passed, false);
assert.ok(r.error.includes('Runtime error'), 'timeout reported as runtime error');
assert.ok(elapsed < 5000, `timeout enforced quickly (took ${elapsed}ms)`);

// --- Empty / missing submissions are rejected gracefully ---
assert.strictEqual(runVerification('', addTests).passed, false);
assert.strictEqual(runVerification('   ', addTests).passed, false);
assert.strictEqual(runVerification('function add(a,b){return a+b}', []).passed, false);

// --- Node globals do not leak into the sandbox ---
r = runVerification('typeof require', [{ testDescription: 'no require', assertionString: 'typeof require === "undefined"' }]);
assert.strictEqual(r.passed, true, 'require is not available in learner code');

console.log('✅ verify.test.js — all assertions passed');
