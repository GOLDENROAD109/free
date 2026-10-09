/**
 * Minimal, dependency-free markdown renderer for challenge instructions.
 * Supports: # / ## / ### headings, - lists, **bold**, `code`, paragraphs.
 */
function inline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="text-amber-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code key={i} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MarkdownLite({ source = '' }) {
  const lines = String(source).split('\n');
  return (
    <div className="space-y-2 text-sm leading-7 text-slate-200">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-base font-bold text-cyan-300">
              {inline(line.slice(4))}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="pt-2 text-lg font-bold text-white">
              {inline(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-xl font-extrabold text-white">
              {inline(line.slice(2))}
            </h1>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <li key={i} className="ml-5 list-disc text-slate-300">
              {inline(line.slice(2))}
            </li>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}
