import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import StreakDashboard from '../components/StreakDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/api/progress/me');
        if (!cancelled) setMe(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-white">Your Dashboard</h1>
        <p className="mt-3 text-slate-400">Log in to see your streaks, XP, titles and certificates.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="btn-ghost">
            Log in
          </Link>
          <Link to="/register" className="btn-primary">
            Create free account
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-400">Loading your stats…</div>;
  }
  if (error) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-red-300">{error}</div>;
  }

  const completed = me?.user?.completedChallenges || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-white">
        Hey, <span className="text-gradient">{me.user.displayName}</span> 👋
      </h1>
      <p className="mt-2 text-sm text-slate-400">Your gamification command center.</p>

      <div className="mt-8">
        <StreakDashboard me={me} />
      </div>

      {/* Certificate status */}
      <div className="card mt-6 flex flex-col items-center gap-4 p-6 sm:flex-row">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">Official Certificate</h3>
          <p className="mt-1 text-sm text-slate-400">
            {me.user.localizedPaymentStatus
              ? '✅ Active — your Official Developer Certificate is unlocked and linked to your profile.'
              : 'Certification is the only paid feature — and it is priced for your country via PPP.'}
          </p>
        </div>
        {!me.user.localizedPaymentStatus && (
          <Link to="/certificate" className="btn-primary flex-none">
            Get certified 🌍
          </Link>
        )}
      </div>

      {/* Completed challenges */}
      <div className="card mt-6 p-6">
        <h3 className="text-lg font-bold text-white">Solved challenges ({completed.length})</h3>
        {completed.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            Nothing yet — <Link to="/challenges" className="text-cyan-300 hover:underline">pick your first challenge</Link>!
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {completed.map((c) => (
              <Link
                key={typeof c === 'string' ? c : c.slug}
                to={`/challenges/${typeof c === 'string' ? c : c.slug}`}
                className="rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-bold text-green-300 ring-1 ring-green-500/40 transition hover:bg-green-500/20"
              >
                ✓ {typeof c === 'string' ? c : c.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
