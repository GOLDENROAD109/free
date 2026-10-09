import { useMemo, useState } from 'react';

/**
 * "Share Progress to Win" — fires whenever a challenge is solved.
 * Auto-formats a social post (tagging @Jp_dev_1) and offers one-tap sharing
 * via the X intent URL, the native Web Share API, or copy-to-clipboard.
 */
export default function ShareProgress({
  challengeTitle = 'a challenge',
  xpAwarded = 0,
  streak = 0,
  totalXP = 0,
  compact = false,
}) {
  const [copied, setCopied] = useState(false);

  const shareText = useMemo(
    () =>
      `I just crushed "${challengeTitle}" on Free Code Hub! 🔥 ${streak}-day coding streak · +${xpAwarded} XP (${totalXP} XP total). ` +
      `The curriculum is 100% free — join me and start building. @Jp_dev_1 #FreeCodeHub #LearnToCode`,
    [challengeTitle, xpAwarded, streak, totalXP]
  );

  const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard unavailable (permissions / insecure context) — fail silently.
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Free Code Hub — my progress', text: shareText });
      } catch {
        /* user dismissed the share sheet */
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div
      className={`rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-fuchsia-500/10 ${
        compact ? 'p-3' : 'p-5'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <h3 className="text-base font-bold text-white">Share Progress to Win</h3>
        <span className="ml-auto rounded-full bg-cyan-400/15 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 ring-1 ring-cyan-400/30">
          viral boost
        </span>
      </div>

      <p className="mt-2 rounded-lg bg-slate-950/70 p-3 text-sm leading-6 text-slate-300 ring-1 ring-slate-700/60">
        {shareText}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={xIntentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-200"
        >
          𝕏 Share on X
        </a>
        <button
          onClick={nativeShare}
          className="rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-bold text-cyan-200 ring-1 ring-cyan-400/40 transition hover:bg-cyan-500/30"
        >
          Share…
        </button>
        <button
          onClick={copyToClipboard}
          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 ring-1 ring-slate-600 transition hover:bg-slate-700"
        >
          {copied ? '✅ Copied!' : 'Copy text'}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Tag <span className="font-mono font-bold text-cyan-300">@Jp_dev_1</span> for a chance to be
        featured on the tutorial channels.
      </p>
    </div>
  );
}
