import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  COUNTRIES,
  REGION_EMOJI,
  countriesByRegion,
  guessCountryCode,
} from '../data/countries';

const DIFFICULTY_STYLES = {
  beginner: 'bg-green-500/15 text-green-300 ring-green-500/40',
  intermediate: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
  advanced: 'bg-red-500/15 text-red-300 ring-red-500/40',
};

const TIER_STYLES = {
  standard: 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/40',
  medium: 'bg-violet-500/15 text-violet-300 ring-violet-500/40',
  emerging: 'bg-green-500/15 text-green-300 ring-green-500/40',
};

/**
 * Courses page — the free curriculum catalogue plus a world-region dropdown.
 * Selecting any country/region on Earth instantly shows the PPP-fair
 * certificate price for that region (best price for everyone, everywhere).
 */
export default function Courses() {
  const { user } = useAuth();

  // --- World region dropdown state ---
  const [country, setCountry] = useState(guessCountryCode());
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  // --- Course catalogue state ---
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [inMemory, setInMemory] = useState(false);

  // Live PPP quote whenever the selected region changes.
  useEffect(() => {
    let cancelled = false;
    setQuote(null);
    setQuoteError(null);
    (async () => {
      try {
        const data = await api(`/api/billing/pricing?country=${country}`);
        if (!cancelled) setQuote(data.quote);
      } catch (err) {
        if (!cancelled) setQuoteError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country]);

  // Course catalogue.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api('/api/challenges');
        if (!cancelled) {
          setCourses(data.challenges || []);
          setDemoMode(!!data.demoMode);
        }
      } catch (err) {
        if (!cancelled) setCoursesError(err.message);
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const regionGroups = useMemo(() => countriesByRegion(), []);
  const selected = useMemo(() => COUNTRIES.find((c) => c.code === country), [country]);
  const selectedGroup = useMemo(
    () => regionGroups.find((g) => g.countries.some((c) => c.code === country)),
    [regionGroups, country]
  );

  const completedSlugs = new Set(
    (user?.completedChallenges || []).map((c) => (typeof c === 'string' ? c : c.slug))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 ring-1 ring-cyan-400/30">
          100% free curriculum
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
          Courses for <span className="text-gradient">the whole world</span> 🌐
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          Pick your region from the dropdown — every course is free, and the official certificate is
          priced fairly for your local economy via Purchasing Power Parity.
        </p>
      </div>

      {/* World region dropdown + PPP price */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <label
            htmlFor="region-select"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            🌍 Your region — {COUNTRIES.length} countries, 6 continents
          </label>
          <select
            id="region-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            {regionGroups.map((group) => (
              <optgroup key={group.region} label={`${REGION_EMOJI[group.region] || '🌐'} ${group.region}`}>
                {group.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="mt-3 text-xs text-slate-500">
            Detected default: your timezone. Prices update instantly — no country is priced out.
          </p>

          {/* Mini stats strip */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              ['6', 'continents'],
              [String(COUNTRIES.length), 'countries'],
              ['$10', 'lowest price'],
            ].map(([big, small]) => (
              <div key={big} className="rounded-xl bg-slate-950/70 p-3 ring-1 ring-slate-700/60">
                <p className="text-xl font-black text-gradient">{big}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{small}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PPP price card for the selected region */}
        <div className="card relative overflow-hidden border-cyan-400/25 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-fuchsia-500/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Official Certificate — your region
              </h2>
              <p className="mt-1 text-lg font-extrabold text-white">
                {selected ? `${selected.name}` : '—'}
                {selectedGroup ? ` · ${REGION_EMOJI[selectedGroup.region]} ${selectedGroup.region}` : ''}
              </p>
            </div>
            {quote && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
                  TIER_STYLES[quote.tier] || TIER_STYLES.standard
                }`}
              >
                {quote.tier} tier
              </span>
            )}
          </div>

          {quoteError && <p className="mt-4 text-sm text-red-300">{quoteError}</p>}

          {quote ? (
            <div className="mt-4">
              <p className="text-4xl font-black text-white">{quote.formattedLocal}</p>
              <p className="mt-1 text-sm text-slate-300">
                ≈ {quote.formattedUSD} · {quote.discountPercent}% below the $49 standard tier
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400"
                  style={{ width: `${100 - quote.discountPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-[11px] text-slate-400">
                You pay {100 - quote.discountPercent}% of the standard price
              </p>
              <Link to="/certificate" className="btn-primary mt-5 inline-block w-full text-center">
                Get certified in {selected?.name} 🪪
              </Link>
            </div>
          ) : (
            !quoteError && <p className="mt-4 text-sm text-slate-400">Loading your local price…</p>
          )}
        </div>
      </div>

      {/* Course catalogue */}
      <div className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Course catalogue</h2>
            <p className="mt-1 text-sm text-slate-400">
              Hands-on engineering courses with a live sandbox — free for everyone.
            </p>
          </div>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300 ring-1 ring-slate-600">
            {courses.length} courses
          </span>
        </div>

        {demoMode && (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            Demo mode: the server has no database connected, so progress tracking and checkout are
            disabled. Set <code className="font-mono">MONGO_URI</code> to unlock the full experience.
          </div>
        )}

        {loadingCourses ? (
          <p className="mt-8 text-center text-slate-400">Loading courses…</p>
        ) : coursesError ? (
          <p className="mt-8 text-center text-red-300">{coursesError}</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => {
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
                      <span className="text-sm font-bold text-green-300">✓ Completed</span>
                    ) : (
                      <span className="font-mono text-xs font-bold text-cyan-300">+{c.baseXP} XP</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-white group-hover:text-cyan-300">
                    {c.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-400">{c.summary}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{c.verificationTests?.length || 0} verification tests</span>
                    <span className="font-semibold text-cyan-300 group-hover:underline">Start course →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
