import { useReward } from '../context/RewardContext';
import ShareProgress from './ShareProgress';

/**
 * Viral success reward alert — appears bottom-right whenever a challenge is
 * solved: XP summary, multiplier badge, new titles, confetti (fired by the
 * provider) and the embedded "Share Progress to Win" card.
 */
export default function RewardToast() {
  const { reward, dismiss } = useReward();
  if (!reward) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[110] w-[min(92vw,430px)] animate-[slide-in_0.3s_ease-out] rounded-2xl border border-cyan-400/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="text-3xl" aria-hidden>
          🎉
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Challenge solved!</p>
          <p className="mt-0.5 text-xs text-slate-300">
            +{reward.xpAwarded} XP · {reward.multiplierBadge} ×{reward.multiplier} · 🔥{' '}
            {reward.streak?.current ?? 0}-day streak
          </p>
          {reward.newTitles && reward.newTitles.length > 0 && (
            <p className="mt-1 text-xs font-semibold text-amber-300">
              ⭐ New title{reward.newTitles.length > 1 ? 's' : ''}: {reward.newTitles.join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-slate-400 transition hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="mt-3">
        <ShareProgress
          compact
          challengeTitle={reward.challengeTitle}
          xpAwarded={reward.xpAwarded}
          streak={reward.streak?.current ?? 0}
          totalXP={reward.experiencePoints ?? 0}
        />
      </div>
    </div>
  );
}
