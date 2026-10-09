import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🎮',
    title: 'Gamified Rewards',
    text: 'Streaks, XP, rank multipliers and unlockable developer titles — from Script Rookie to Full-Stack Titan.',
  },
  {
    icon: '💻',
    title: 'Live Code Sandbox',
    text: 'A real editor with an isolated iframe sandbox that runs your assertions in real time via postMessage.',
  },
  {
    icon: '🌍',
    title: 'Fair Global Pricing',
    text: 'The curriculum is free everywhere. The official certificate uses PPP pricing — $49 standard, down to ~$10.',
  },
  {
    icon: '🪙',
    title: 'Card & Crypto Checkout',
    text: 'Localized Stripe-style elements plus a crypto gateway route — pay in your local currency.',
  },
  {
    icon: '🔥',
    title: 'Streak & Claim',
    text: 'Code every day to keep your streak, multiply your XP, and claim digital profile assets.',
  },
  {
    icon: '🚀',
    title: 'Share Progress to Win',
    text: 'Every solved challenge generates a viral-ready share card tagging @Jp_dev_1.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-block rounded-full bg-cyan-400/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 ring-1 ring-cyan-400/30">
            100% free curriculum
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">
            Learn to code. <span className="text-gradient">Free. Forever.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Free Code Hub is a gamified engineering playground: solve challenges in a live sandbox,
            build streaks, earn XP and titles, and certify your skills at a price adjusted to your
            country.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/challenges" className="btn-primary">
              Start coding — it's free 🚀
            </Link>
            <Link to="/certificate" className="btn-ghost">
              How certification works
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              ['5+', 'hands-on challenges'],
              ['$10', 'lowest certificate price'],
              ['24/7', 'sandbox access'],
            ].map(([big, small]) => (
              <div key={big} className="card p-4">
                <p className="text-3xl font-black text-gradient">{big}</p>
                <p className="mt-1 text-xs text-slate-400">{small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-3xl font-extrabold">
          Why coders <span className="text-gradient">stay</span>
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:border-cyan-400/40">
              <div className="text-3xl" aria-hidden>
                {f.icon}
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="card flex flex-col items-center gap-6 p-8 text-center lg:flex-row lg:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-white">Official Certificate, fairly priced</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Standard tier is <span className="font-bold text-white">$49 USD</span>. Thanks to
              Purchasing Power Parity, the same certificate scales with your local economy — down to
              about <span className="font-bold text-white">$10 USD equivalent</span> — and routes into
              your local currency, by card or crypto. No country is priced out.
            </p>
          </div>
          <Link to="/certificate" className="btn-primary flex-none">
            See my local price 🌍
          </Link>
        </div>
      </section>
    </div>
  );
}
