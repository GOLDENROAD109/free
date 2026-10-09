import { useEffect, useRef, useState } from 'react';

/**
 * Builds the HTML document that runs inside the sandboxed <iframe>.
 *
 * The document evaluates every verification test's `assertionString` against
 * the learner's code via `new Function(...)`, renders a pretty results panel,
 * and reports the structured results back to the parent window through a
 * `postMessage` handshake (`{ source: 'fch-sandbox', type: 'FCH_RESULTS' }`).
 *
 * The payload is JSON-escaped with `<` -> `\u003c` so learner code can never
 * break out of the inline <script> tag.
 */
export function buildSandboxDocument(userCode, tests) {
  const payload = JSON.stringify({ code: userCode, tests }).replace(/</g, '\\u003c');
  const lines = [
    '<!DOCTYPE html>',
    '<html><head><meta charset="utf-8" />',
    '<style>',
    'body{margin:0;background:#0b1020;color:#c7d2e8;font-family:ui-monospace,Menlo,Consolas,monospace;padding:12px;box-sizing:border-box;}',
    'h4{margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:#64748b;}',
    '.row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;margin-bottom:6px;font-size:13px;}',
    '.pass{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.4);color:#86efac;}',
    '.fail{background:rgba(239,68,68,.10);border:1px solid rgba(239,68,68,.4);color:#fca5a5;}',
    '.dot{width:10px;height:10px;border-radius:9999px;flex:none;}',
    '.pass .dot{background:#22c55e;box-shadow:0 0 8px #22c55e;}',
    '.fail .dot{background:#ef4444;box-shadow:0 0 8px #ef4444;}',
    '.lbl{min-width:0;word-break:break-word;}',
    '.err{flex-basis:100%;font-size:11px;opacity:.85;word-break:break-word;}',
    '.summary{margin-top:10px;font-size:12px;color:#94a3b8;}',
    '</style></head><body>',
    '<h4>Test Results</h4>',
    '<div id="out"></div>',
    '<script>',
    `var payload = ${payload};`,
    'var results = [];',
    'payload.tests.forEach(function (t) {',
    '  try {',
    '    var fn = new Function(payload.code + "\\n;return (" + t.assertionString + ");");',
    '    var ok = fn();',
    '    results.push({ testDescription: t.testDescription, passed: !!ok, error: null });',
    '  } catch (e) {',
    '    results.push({ testDescription: t.testDescription, passed: false, error: String(e && e.message ? e.message : e) });',
    '  }',
    '});',
    'var out = document.getElementById("out");',
    'var passedCount = results.filter(function (r) { return r.passed; }).length;',
    'results.forEach(function (r) {',
    '  var div = document.createElement("div");',
    '  div.className = "row " + (r.passed ? "pass" : "fail");',
    '  var dot = document.createElement("span"); dot.className = "dot";',
    '  var lbl = document.createElement("span"); lbl.className = "lbl";',
    '  lbl.textContent = (r.passed ? "PASS" : "FAIL") + " — " + r.testDescription;',
    '  div.appendChild(dot); div.appendChild(lbl);',
    '  if (r.error) { var err = document.createElement("div"); err.className = "err"; err.textContent = r.error; div.appendChild(err); }',
    '  out.appendChild(div);',
    '});',
    'var summary = document.createElement("div");',
    'summary.className = "summary";',
    'summary.textContent = passedCount + "/" + results.length + " assertions passing";',
    'out.appendChild(summary);',
    'window.parent.postMessage({ source: "fch-sandbox", type: "FCH_RESULTS", results: results }, "*");',
    '<\/script>',
    '</body></html>',
  ];
  return lines.join('\n');
}

/**
 * High-fidelity code editor + live sandbox.
 *
 * Layout: editor textarea (with Tab-key support) on the left, the isolated
 * iframe on the right. Every keystroke (debounced) rebuilds the sandbox
 * document as a Blob URI and re-runs the assertions in real time. Results
 * stream back via postMessage and gate the parent's submit button.
 */
export default function EditorSandbox({
  boilerplateCode = '',
  tests = [],
  onResults,
  autoRunDelay = 700,
  minHeight = 420,
}) {
  const [code, setCode] = useState(boilerplateCode);
  const [results, setResults] = useState(null);
  const [runNonce, setRunNonce] = useState(0);
  const [blobUrl, setBlobUrl] = useState('');
  const iframeRef = useRef(null);
  const onResultsRef = useRef(onResults);
  onResultsRef.current = onResults;

  // Rebuild the Blob URI sandbox document (debounced) on every code change.
  useEffect(() => {
    const handle = setTimeout(() => {
      const doc = buildSandboxDocument(code, tests);
      const blob = new Blob([doc], { type: 'text/html' });
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    }, autoRunDelay);
    return () => clearTimeout(handle);
  }, [code, tests, runNonce, autoRunDelay]);

  // postMessage handshake listener — only accept messages from our iframe.
  useEffect(() => {
    const handler = (event) => {
      const data = event.data;
      if (!data || data.source !== 'fch-sandbox' || data.type !== 'FCH_RESULTS') return;
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      setResults(data.results);
      if (onResultsRef.current) onResultsRef.current(data.results);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const passedCount = results ? results.filter((r) => r.passed).length : 0;
  const allPassed = !!results && results.length > 0 && passedCount === results.length;
  const failed = results ? results.filter((r) => !r.passed) : [];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd, value } = el;
    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    setCode(next);
    // Restore the caret after React re-renders the textarea.
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 2;
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/60 px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-2 font-mono text-xs text-slate-400">
          sandbox.html · isolated iframe · blob URI · postMessage handshake
        </span>
        <button
          onClick={() => setRunNonce((n) => n + 1)}
          className="ml-auto rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-200 ring-1 ring-cyan-400/40 transition hover:bg-cyan-500/25"
        >
          ▶ Run tests
        </button>
        <button
          onClick={() => {
            setCode(boilerplateCode);
            setResults(null);
          }}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-600"
        >
          Reset
        </button>
      </div>

      {/* Editor + sandbox panes */}
      <div className="grid md:grid-cols-2">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          aria-label="Code editor"
          style={{ minHeight }}
          className="h-full w-full resize-none bg-[#0b1020] p-4 font-mono text-sm leading-6 text-cyan-100 outline-none placeholder:text-slate-600"
          placeholder="Write your code here — tests run automatically…"
        />
        <div className="border-t border-slate-700 bg-[#0b1020] md:border-l md:border-t-0">
          <iframe
            ref={iframeRef}
            title="Free Code Hub live code sandbox"
            sandbox="allow-scripts"
            src={blobUrl || undefined}
            style={{ minHeight }}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Results strip (mirrors the iframe's postMessage payload) */}
      <div className="border-t border-slate-700 bg-slate-950/80 px-4 py-3">
        {results === null ? (
          <p className="text-sm text-slate-400">
            Write code on the left — assertions execute automatically in the sandbox…
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                allPassed
                  ? 'bg-green-500/15 text-green-300 ring-1 ring-green-500/40'
                  : 'bg-red-500/15 text-red-300 ring-1 ring-red-500/40'
              }`}
            >
              {passedCount}/{results.length} tests passing
            </span>
            {failed.map((r, i) => (
              <span key={i} className="font-mono text-xs text-red-300">
                ✕ {r.testDescription}
                {r.error ? ` — ${r.error}` : ''}
              </span>
            ))}
            {allPassed && (
              <span className="text-xs font-semibold text-green-300">
                🎉 All assertions passed — submit your solution!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
