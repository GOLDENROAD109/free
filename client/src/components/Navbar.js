import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const link =
    'rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white';
  const active = ({ isActive }) => `${link} ${isActive ? 'bg-slate-800 text-white' : ''}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-lg font-black text-slate-950">
            F
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Free<span className="text-cyan-400">Code</span>Hub
          </span>
        </Link>

        <div className="ml-6 hidden items-center gap-1 md:flex">
          <NavLink to="/courses" className={active}>
            Courses
          </NavLink>
          <NavLink to="/challenges" className={active}>
            Challenges
          </NavLink>
          <NavLink to="/dashboard" className={active}>
            Dashboard
          </NavLink>
          <NavLink to="/certificate" className={active}>
            Certificate
          </NavLink>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <span className="hidden items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300 ring-1 ring-orange-500/30 sm:flex">
              🔥 {user.codingStreak?.current || 0}-day streak
            </span>
          )}
          {user ? (
            <>
              <span className="hidden text-sm text-slate-300 sm:block">
                {user.displayName} · {user.experiencePoints} XP
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link}>
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-slate-950 shadow-glow transition hover:opacity-90"
              >
                Start free
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
