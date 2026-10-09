import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-500/15 text-green-300 ring-green-500/40',
  intermediate: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
  advanced: 'bg-red-500/15 text-red-300 ring-red-500/40',
};

export default function ChallengeList() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/api/challenges');
        if (!cancelled) {
          setChallenges(data.challenges || []);
          setDemoMode(!!data.demoMode);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedSlugs = new Set(
    (user?.completedChallenges || []).map((c) => (typeof c === 'string' ? c : c.slug))
  );

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-400">Loading challenges…</div>;
  }
  if (error) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-red-300">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Engineering Challenges</h1>
          <p className="mt-2 text-sm text-slate-400">
            Solve a challenge to earn XP, extend your streak, and unlock titles. 100% free.
          </p>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 ring-1 ring-slate-600">
          {challenges.length} challenges
        </span>
      </div>

      {inMemory && (
        <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">
          🧪 Sandbox session — <strong>fully interactive</strong>: register, solve, streaks, XP and
          checkout all work. Data lives in memory and resets when the server restarts.
        </div>
      )}
      {demoMode && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          Demo mode: the server has no data layer connected. Set <code className="font-mono">MONGO_URI</code>{' '}
          to enable persistence.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((c) => {
          const done = completedSlugs.has(c.slug);
          return (
            <Link
              key={c.slug}
              to={`/challenges/${c.slug}`}
              className="card group p-5 transition hover:-translate-y-1 hover:border-cyan-400/50"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                    DIFFICULTY_STYLES[c.difficulty] || DIFFICULTY_STYLES.beginner
                  }`}
                >
                  {c.difficulty}
                </span>
                {done ? (
                  <span className="text-sm font-bold text-green-300">✓ Solved</span>
                ) : (
                  <span className="font-mono text-xs font-bold text-cyan-300">+{c.baseXP} XP</span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-bold text-white group-hover:text-cyan-300">
                {c.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-400">{c.summary}</p>
              <p className="mt-3 text-xs text-slate-500">{c.verificationTests?.length || 0} verification tests</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
