import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import EditorSandbox from '../components/EditorSandbox';
import MarkdownLite from '../components/MarkdownLite';
import ShareProgress from '../components/ShareProgress';

export default function ChallengeDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { celebrate } = useReward();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [code, setCode] = useState('');
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [lastReward, setLastReward] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api(`/api/challenges/${slug}`);
        if (cancelled) return;
        setChallenge(data.challenge);
        setCode(data.challenge.boilerplateCode || '');
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleResults = useCallback((r) => setResults(r), []);

  const allPassed = !!results && results.length > 0 && results.every((r) => r.passed);

  const submit = async () => {
    setSubmitError(null);
    if (!user) {
      navigate('/login', { state: { from: `/challenges/${slug}` } });
      return;
    }
    setSubmitting(true);
    try {
      const data = await api('/api/progress/solve', {
        method: 'POST',
        body: { challengeSlug: slug, code },
      });
      await refreshUser();
      setLastReward(data.reward);
      celebrate({
        challengeTitle: challenge.title,
        xpAwarded: data.reward.xpAwarded,
        multiplier: data.reward.multiplier,
        multiplierBadge: data.reward.multiplierBadge,
        streak: data.reward.streak,
        experiencePoints: data.reward.experiencePoints,
        newTitles: data.reward.newTitles,
      });
    } catch (err) {
      if (err.data && err.data.verification) {
        setResults(err.data.verification.results);
      }
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-slate-400">Loading challenge…</div>;
  }
  if (error || !challenge) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-red-300">{error || 'Challenge not found.'}</p>
        <Link to="/challenges" className="btn-ghost mt-4 inline-block">
          ← Back to challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/challenges" className="text-sm text-cyan-300 hover:underline">
        ← All challenges
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-5">
        {/* Instructions */}
        <div className="lg:col-span-2">
          <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-300 ring-1 ring-cyan-400/30">
            {challenge.difficulty} · +{challenge.baseXP} XP base
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-white">{challenge.title}</h1>
          <div className="card mt-5 p-5">
            <MarkdownLite source={challenge.instructionMarkdown} />
          </div>
          <div className="card mt-4 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Verification tests ({challenge.verificationTests.length})
            </h3>
            <ul className="mt-3 space-y-2">
              {challenge.verificationTests.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 font-mono text-xs text-cyan-400">assert</span>
                  <span>{t.testDescription}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Editor + submit */}
        <div className="lg:col-span-3">
          <EditorSandbox
            boilerplateCode={challenge.boilerplateCode}
            tests={challenge.verificationTests}
            onResults={handleResults}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={submit}
              disabled={submitting || !allPassed}
              className="btn-primary"
              title={allPassed ? 'Submit your solution' : 'Pass all tests in the sandbox first'}
            >
              {submitting ? 'Submitting…' : allPassed ? 'Submit solution 🚀' : 'Pass all tests to submit'}
            </button>
            {!user && (
              <span className="text-xs text-slate-400">
                You'll need a free account to submit — takes 10 seconds.
              </span>
            )}
            {submitError && <span className="text-sm text-red-300">{submitError}</span>}
          </div>

          {lastReward && (
            <div className="mt-6">
              <ShareProgress
                challengeTitle={challenge.title}
                xpAwarded={lastReward.xpAwarded}
                streak={lastReward.streak?.current ?? 0}
                totalXP={lastReward.experiencePoints ?? 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
