import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TutorialCTA from '../components/TutorialCTA';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(email, password, displayName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <div className="card p-8">
          <h1 className="text-2xl font-extrabold text-white">Join Free Code Hub 🎉</h1>
          <p className="mt-2 text-sm text-slate-400">
            Free forever. Streaks, XP, titles and a live sandbox from your very first lesson.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Display name
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="Ada Lovelace"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Password (min 6)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300 ring-1 ring-red-500/30">{error}</p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-400">
            Already a member?{' '}
            <Link to="/login" className="font-semibold text-cyan-300 hover:underline">
              Log in
            </Link>
          </p>
        </div>

        {/* Tutorial CTA panel */}
        <div className="flex flex-col justify-center">
          <div className="card border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 p-8">
            <h2 className="text-xl font-extrabold text-white">
              Learn alongside the <span className="text-gradient">community</span>
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Every lesson on Free Code Hub has a companion tutorial. Follow the creator's pipelines
              and tag <span className="font-mono text-cyan-300">@Jp_dev_1</span> when you ship.
            </p>
            <div className="mt-5">
              <TutorialCTA compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
