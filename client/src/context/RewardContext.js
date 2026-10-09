import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const RewardContext = createContext(null);

/**
 * Holds the "viral success reward alert" state. `celebrate(payload)` fires
 * the confetti burst and shows the reward toast with the embedded
 * "Share Progress to Win" card.
 */
export function RewardProvider({ children }) {
  const [reward, setReward] = useState(null);
  const [confettiNonce, setConfettiNonce] = useState(0);

  const celebrate = useCallback((payload) => {
    setReward(payload);
    setConfettiNonce((n) => n + 1);
  }, []);

  const dismiss = useCallback(() => setReward(null), []);

  const value = useMemo(
    () => ({ reward, celebrate, dismiss, confettiNonce }),
    [reward, celebrate, dismiss, confettiNonce]
  );

  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>;
}

export function useReward() {
  const ctx = useContext(RewardContext);
  if (!ctx) throw new Error('useReward must be used inside <RewardProvider>');
  return ctx;
}
