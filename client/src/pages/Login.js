import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TutorialCTA from '../components/TutorialCTA';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/dashboard');
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
          <h1 className="text-2xl font-extrabold text-white">Welcome back, coder 👋</h1>
          <p className="mt-2 text-sm text-slate-400">Log in to keep your streak alive.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
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
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-400">
            No account?{' '}
            <Link to="/register" className="font-semibold text-cyan-300 hover:underline">
              Register free
            </Link>
          </p>
        </div>

        {/* Tutorial CTA panel */}
        <div className="flex flex-col justify-center">
          <div className="card border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-8">
            <h2 className="text-xl font-extrabold text-white">
              Prefer to learn on <span className="text-gradient">video &amp; shorts?</span>
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              The full Free Code Hub curriculum is mirrored by the creator's tutorial pipelines —
              bite-sized lessons on Instagram and the complete masterclass on YouTube.
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
