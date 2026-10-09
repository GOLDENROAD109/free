import { useEffect, useState } from 'react';

const BADGE_STYLES = {
  Bronze: 'from-amber-600 to-amber-800',
  Silver: 'from-slate-300 to-slate-500',
  Gold: 'from-yellow-300 to-amber-500',
  Platinum: 'from-cyan-200 to-slate-400',
  Diamond: 'from-cyan-400 to-blue-600',
};

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Gamification dashboard widget: micro-achievements (developer titles),
 * rank-multiplier badge, XP progress, the "Streak & Claim" countdown to the
 * next daily claim window, and digital profile asset milestones.
 *
 * Expects the payload of GET /api/progress/me.
 */
export default function StreakDashboard({ me }) {
  const [, force] = useState(0);

  // Tick every second so the claim-window countdown stays live.
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!me || !me.user) {
    return <p className="text-sm text-slate-400">Loading your stats…</p>;
  }

  const { user, rankMultiplier, nextTitle, titles, assetMilestones, msUntilNextClaimWindow } = me;
  const streak = user.codingStreak?.current || 0;
  const longest = user.codingStreak?.longest || 0;
  const xp = user.experiencePoints || 0;
  const badgeStyle = BADGE_STYLES[rankMultiplier?.badge] || BADGE_STYLES.Bronze;

  // Progress within the current XP tier (from its threshold up to the next title).
  const titleTable = titles || [];
  const currentTier = [...titleTable].reverse().find((t) => xp >= t.minXP) || titleTable[0];
  const xpInTier = nextTitle ? Math.max(0, xp - (currentTier?.minXP ?? 0)) : 0;
  const xpNeeded = nextTitle ? Math.max(1, nextTitle.minXP - (currentTier?.minXP ?? 0)) : 1;
  const xpPercent = nextTitle ? Math.min(100, Math.round((xpInTier / xpNeeded) * 100)) : 100;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Streak card */}
      <div className="card relative overflow-hidden p-5">
        <div className="absolute right-4 top-4 text-5xl" aria-hidden>
          🔥
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Streak &amp; Claim</h3>
        <p className="mt-2 text-4xl font-black text-white">
          {streak} <span className="text-lg font-semibold text-orange-300">day streak</span>
        </p>
        <p className="mt-1 text-sm text-slate-400">Personal best: {longest} days · keep it alive!</p>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const day = streak - (6 - i);
            const lit = day > 0;
            return (
              <div
                key={i}
                title={lit ? `Day ${day}` : 'Locked'}
                className={`h-2.5 rounded-full ${lit ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-slate-700'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Rank multiplier badge card */}
      <div className="card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Rank Multiplier</h3>
        <div className="mt-3 flex items-center gap-4">
          <span
            className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br text-3xl font-black text-slate-950 shadow-glow ${badgeStyle}`}
          >
            ×{rankMultiplier?.multiplier ?? 1}
          </span>
          <div>
            <p className="text-xl font-extrabold text-white">{rankMultiplier?.badge} Badge</p>
            <p className="text-sm text-slate-400">
              XP earned per solve is multiplied by {rankMultiplier?.multiplier ?? 1}. Next tier at{' '}
              {rankMultiplier?.badge === 'Diamond'
                ? '30'
                : rankMultiplier?.badge === 'Platinum'
                  ? '14'
                  : rankMultiplier?.badge === 'Gold'
                    ? '7'
                    : rankMultiplier?.badge === 'Silver'
                      ? '3'
                      : '3'}
              -day streaks.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-950/60 p-3 ring-1 ring-slate-700/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Next daily claim window
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-cyan-300">
            {formatCountdown(msUntilNextClaimWindow ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Solve any challenge before UTC midnight to extend your streak.
          </p>
        </div>
      </div>

      {/* XP + titles card */}
      <div className="card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Experience</h3>
        <p className="mt-2 text-4xl font-black text-white">
          {xp.toLocaleString()} <span className="text-lg font-semibold text-cyan-300">XP</span>
        </p>
        {nextTitle ? (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progress to {nextTitle.name}</span>
              <span>
                {xp}/{nextTitle.minXP} XP
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 transition-all"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm font-semibold text-amber-300">
            🏆 Every developer title unlocked — you are an Open Source Legend!
          </p>
        )}

        <h4 className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">
          Micro-achievements
        </h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {(user.achievedTitles || []).map((title) => (
            <span
              key={title}
              className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-200 ring-1 ring-amber-400/40"
            >
              ⭐ {title}
            </span>
          ))}
        </div>
      </div>

      {/* Digital profile assets card */}
      <div className="card p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Digital Profile Assets
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Claimable cosmetics unlocked by streak milestones.
        </p>
        <ul className="mt-4 space-y-3">
          {(assetMilestones || []).map((m) => (
            <li key={m.days}>
              <div className="flex items-center gap-3">
                <span className="text-xl" aria-hidden>
                  {m.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-slate-200">{m.label}</span>
                    <span
                      className={`ml-2 flex-none rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        m.claimed
                          ? 'bg-green-500/15 text-green-300 ring-1 ring-green-500/40'
                          : 'bg-slate-700/60 text-slate-300 ring-1 ring-slate-600'
                      }`}
                    >
                      {m.claimed ? 'Claimed' : `${m.remaining}d to go`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        m.claimed
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : 'bg-gradient-to-r from-cyan-400 to-fuchsia-400'
                      }`}
                      style={{ width: `${Math.round(m.progress * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
