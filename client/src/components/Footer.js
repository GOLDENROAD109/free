import { Link } from 'react-router-dom';
import TutorialCTA from './TutorialCTA';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950">
      {/* Viral tutorial CTA band */}
      <div className="mx-auto max-w-6xl px-4 pt-10">
        <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-fuchsia-500/10 p-6 shadow-glow sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="lg:w-1/3">
              <h2 className="text-2xl font-extrabold text-white">
                Level up faster with the <span className="text-gradient">free tutorials</span>
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Short, brutal, beautiful coding lessons every day. Follow the pipelines that built
                Free Code Hub — and tag <span className="font-mono text-cyan-300">@Jp_dev_1</span> when
                you ship something.
              </p>
            </div>
            <div className="lg:w-2/3">
              <TutorialCTA />
            </div>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-sm font-black text-slate-950">
              F
            </span>
            <span className="font-extrabold">
              Free<span className="text-cyan-400">Code</span>Hub
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            A 100% free, gamified coding curriculum with a live sandbox, streaks, XP, developer
            titles, and fairly-priced official certificates for every country.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Platform</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <Link to="/courses" className="hover:text-cyan-300">
                Courses
              </Link>
            </li>
            <li>
              <Link to="/challenges" className="hover:text-cyan-300">
                Challenges
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-cyan-300">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/certificate" className="hover:text-cyan-300">
                Official Certificate
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Creator</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-300"
              >
                Instagram — daily tutorials 📸
              </a>
            </li>
            <li>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-300"
              >
                YouTube — complete masterclass ▶️
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Free Code Hub · Learn free, certify fairly. Built with the MERN
        stack. Payments are simulated in this demo build.
      </div>
    </footer>
  );
}
