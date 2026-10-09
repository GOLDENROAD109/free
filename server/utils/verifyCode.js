const vm = require('vm');

/**
 * Server-side verification of a learner's submitted code against a
 * challenge's verificationTests. Runs inside Node's `vm` module with a
 * hard timeout so hostile/buggy submissions (e.g. `while (true) {}`)
 * can never hang the API.
 *
 * Each test's `assertionString` is evaluated as a JavaScript expression in
 * the same scope as the submitted code, e.g. "add(2, 3) === 5".
 *
 * @param {string} code - learner-submitted source code
 * @param {Array<{testDescription: string, assertionString: string}>} tests
 * @returns {{passed: boolean, results: Array, error: string|null}}
 */
function runVerification(code, tests) {
  const safeTests = Array.isArray(tests) ? tests : [];
  const results = safeTests.map((t) => ({
    testDescription: t.testDescription,
    passed: false,
    error: null,
  }));

  if (!code || !String(code).trim()) {
    return { passed: false, results, error: 'No code submitted.' };
  }
  if (safeTests.length === 0) {
    return { passed: false, results, error: 'Challenge has no verification tests.' };
  }

  // Wrap each assertion in its own try/catch so one failing test does not
  // mask the outcome of the others.
  const wrappedAssertions = safeTests
    .map(
      (t, i) =>
        `try { results[${i}].passed = !!(${t.assertionString}); }` +
        ` catch (e) { results[${i}].error = String(e && e.message ? e.message : e); }`
    )
    .join('\n');

  const scriptSource = [
    '"use strict";',
    `const results = ${JSON.stringify(results)};`,
    String(code),
    wrappedAssertions,
    'results;',
  ].join('\n');

  // Minimal sandbox: no Node globals leak into learner code.
  const sandbox = {
    console: { log() {}, info() {}, warn() {}, error() {} },
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Date,
    RegExp,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  };

  try {
    const out = vm.runInNewContext(scriptSource, sandbox, {
      timeout: 1500, // ms — infinite loops are killed here
      filename: 'learner-submission.js',
    });
    const finalResults = (Array.isArray(out) ? out : results).map((r, i) => ({
      testDescription: safeTests[i] ? safeTests[i].testDescription : `Test ${i + 1}`,
      passed: !!(r && r.passed),
      error: (r && r.error) || null,
    }));
    return { passed: finalResults.every((r) => r.passed), results: finalResults, error: null };
  } catch (err) {
    return {
      passed: false,
      results,
      error: `Runtime error while executing submission: ${err && err.message ? err.message : String(err)}`,
    };
  }
}

module.exports = { runVerification };
