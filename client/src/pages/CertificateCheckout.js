import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import { COUNTRIES, guessCountryCode } from '../data/countries';

/**
 * Certificate checkout — Global Balanced Paywall with PPP pricing.
 *
 * Flow: pick a country -> GET /api/billing/pricing (PPP quote in the local
 * currency) -> POST /api/billing/checkout (mock Stripe-style intent or crypto
 * gateway quote) -> POST /api/billing/confirm (simulated payment success).
 */
export default function CertificateCheckout() {
  const { user, refreshUser } = useAuth();
  const { celebrate } = useReward();

  const [country, setCountry] = useState(guessCountryCode());
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [method, setMethod] = useState('card');

  const [order, setOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Live PPP quote whenever the country changes.
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

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === country),
    [country]
  );

  const checkout = async () => {
    setError(null);
    setOrder(null);
    try {
      const data = await api('/api/billing/checkout', {
        method: 'POST',
        body: { countryCode: country, paymentMethod: method },
      });
      setOrder(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmPayment = async () => {
    if (!order) return;
    setConfirming(true);
    setError(null);
    try {
      const data = await api('/api/billing/confirm', {
        method: 'POST',
        body: { orderId: order.orderId, paymentIntentId: order.paymentIntentId },
      });
      setDone(true);
      await refreshUser();
      celebrate({
        challengeTitle: 'Official Developer Certificate',
        xpAwarded: data.bonusXP || 500,
        multiplier: data.rankMultiplier?.multiplier || 1,
        multiplierBadge: data.rankMultiplier?.badge || 'Bronze',
        streak: user?.codingStreak,
        experiencePoints: data.user?.experiencePoints ?? 0,
        newTitles: data.newTitles || ['Certified Pro'],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-extrabold text-white">Official Certificate Checkout</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        The curriculum and sandbox are free. The official certificate uses{' '}
        <span className="font-semibold text-cyan-300">Purchasing Power Parity</span> pricing — the
        standard $49 tier scales with your economy and routes into your local currency. No country is
        priced out.
      </p>

      {/* Country picker */}
      <div className="card mt-8 p-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Your country (drives PPP pricing)
        </label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        {quoteError && <p className="mt-2 text-sm text-red-300">{quoteError}</p>}

        {quote && (
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/10 p-5 text-center ring-1 ring-cyan-400/30">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your price</p>
              <p className="mt-2 text-3xl font-black text-white">{quote.formattedLocal}</p>
              <p className="mt-1 text-xs text-slate-400">{quote.formattedUSD} equivalent</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 p-5 text-center ring-1 ring-slate-700">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tier</p>
              <p className="mt-2 text-xl font-black capitalize text-white">{quote.tier}</p>
              <p className="mt-1 text-xs text-slate-400">PPP multiplier ×{quote.pppMultiplier}</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 p-5 text-center ring-1 ring-slate-700">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">You save</p>
              <p className="mt-2 text-xl font-black text-green-300">{quote.discountPercent}%</p>
              <p className="mt-1 text-xs text-slate-400">
                vs. the ${quote.basePriceUSD} standard tier
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment method + action */}
      <div className="card mt-6 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Payment method</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMethod('card')}
            className={`rounded-xl border p-4 text-left transition ${
              method === 'card'
                ? 'border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/50'
                : 'border-slate-600 bg-slate-950/60 hover:border-slate-400'
            }`}
          >
            <p className="text-sm font-bold text-white">💳 Card (localized elements)</p>
            <p className="mt-1 text-xs text-slate-400">
              Stripe-style localized payment element in {quote?.currency.toUpperCase() || 'your currency'}.
            </p>
          </button>
          <button
            onClick={() => setMethod('crypto')}
            className={`rounded-xl border p-4 text-left transition ${
              method === 'crypto'
                ? 'border-fuchsia-400 bg-fuchsia-400/10 ring-1 ring-fuchsia-400/50'
                : 'border-slate-600 bg-slate-950/60 hover:border-slate-400'
            }`}
          >
            <p className="text-sm font-bold text-white">🪙 Crypto gateway</p>
            <p className="mt-1 text-xs text-slate-400">Pay with USDT on Ethereum (ERC-20).</p>
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300 ring-1 ring-red-500/30">
            {error}
          </p>
        )}

        {!user ? (
          <p className="mt-5 text-sm text-slate-400">
            <Link to="/login" className="font-semibold text-cyan-300 hover:underline">
              Log in
            </Link>{' '}
            or{' '}
            <Link to="/register" className="font-semibold text-cyan-300 hover:underline">
              register free
            </Link>{' '}
            to purchase your certificate.
          </p>
        ) : user.localizedPaymentStatus ? (
          <p className="mt-5 rounded-xl bg-green-500/10 p-4 text-sm font-semibold text-green-300 ring-1 ring-green-500/30">
            ✅ Your Official Developer Certificate is already active.{' '}
            <Link to="/dashboard" className="underline">
              View it on your dashboard
            </Link>
          </p>
        ) : (
          <div className="mt-5">
            {!order ? (
              <button onClick={checkout} disabled={!quote} className="btn-primary">
                Continue to payment — {quote ? quote.formattedLocal : '…'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-950/70 p-4 ring-1 ring-slate-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Simulated payment session
                  </p>
                  <p className="mt-2 font-mono text-xs text-slate-300 break-all">
                    clientSecret: {order.clientSecret}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-400 break-all">
                    publishableKey: {order.publishableKey}
                  </p>
                  <p className="mt-2 text-xs text-amber-300">
                    {order.note || 'DEMO MODE: no real charge occurs.'}
                  </p>
                  {order.cryptoDetails && (
                    <div className="mt-4 rounded-lg bg-fuchsia-500/10 p-3 ring-1 ring-fuchsia-400/30">
                      <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-200">
                        Crypto gateway quote
                      </p>
                      <p className="mt-1 text-sm text-white">
                        Send {order.cryptoDetails.cryptoAmount} {order.cryptoDetails.cryptoCurrency} on{' '}
                        {order.cryptoDetails.network}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-300 break-all">
                        {order.cryptoDetails.address}
                      </p>
                    </div>
                  )}
                </div>
                <button onClick={confirmPayment} disabled={confirming} className="btn-primary">
                  {confirming ? 'Confirming…' : 'Simulate payment success ✅'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {done && (
        <div className="mt-6 rounded-2xl border border-green-400/40 bg-green-500/10 p-6 text-center">
          <p className="text-4xl" aria-hidden>
            🎓
          </p>
          <h2 className="mt-3 text-2xl font-extrabold text-white">You're certified!</h2>
          <p className="mt-2 text-sm text-slate-300">
            Country: {selectedCountry?.name} · Paid:{' '}
            <span className="font-bold text-white">{quote?.formattedLocal}</span> ({quote?.formattedUSD})
            · +500 XP bonus and the <span className="font-bold text-amber-300">Certified Pro</span>{' '}
            title unlocked.
          </p>
          <Link to="/dashboard" className="btn-primary mt-5 inline-block">
            Go to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
