# 🚀 Free Code Hub

A gamified, full-stack learning platform engineered to rival freeCodeCamp — with aggressive
retention mechanics, social virality, **Purchasing Power Parity (PPP) certificate pricing for
every country on Earth**, and a live, isolated code sandbox.

> **Stack:** MongoDB · Express · React (Vite) · Node.js · Tailwind CSS · Socket.IO

---

## ✨ Features

### 🎮 Gamified Rewards System ("Streak & Claim")
- `codingStreak` tracks **consecutive active coding days** (UTC calendar days) with a
  `current` / `longest` / `lastActiveDate` model.
- Solving a challenge awards **XP** scaled by a **rank-multiplier badge**
  (Bronze ×1.0 → Silver ×1.25 → Gold ×1.5 → Platinum ×1.75 → Diamond ×2.0).
- Unlockable developer titles: **Script Rookie → Bug Squasher → Commit Cadet → Merge Warrior →
  Full-Stack Titan → Open Source Legend** (+ **Certified Pro**).
- A rich **confetti particle celebration** fires on every solve (dependency-free canvas engine).
- The dashboard widget shows micro-achievements, the multiplier badge, a **countdown to the next
  daily claim window**, and **digital profile assets** claimable at streak milestones.

### 🌍 Global Balanced Paywall (PPP)
- Curriculum + software testing sandbox: **100% free, everywhere**.
- Official Certificate: paid tier — `POST /api/billing/checkout`.
- The pricing engine inspects **geographical country headers** (`x-country-code`, `cf-ipcountry`,
  `x-geo-country`), explicit country/currency fields, or query params, and **dynamically scales**
  the standard **$49 USD** tier by a per-country PPP multiplier, clamped to a **~$10 floor**.
- Local currency routing (Stripe Localized Elements / crypto gateway **mocks**) so no country is
  priced out. Example: India → **$12.74 (₹1,057)**, Nigeria → **$10.78 (₦16,170)**, US → **$49**.
- Confirming a purchase flips `localizedPaymentStatus`, grants **+500 XP** and the
  **Certified Pro** title.

### 🖥️ Live Editor Sandbox
- `components/EditorSandbox.js` maps user input into a **stateless HTML5 `<iframe>` Blob URI**
  sandbox that executes assertions in real time via a structured **`postMessage` handshake**.
- The server re-verifies every submission in an isolated Node `vm` context with a hard timeout.

### 📣 Virality & Branding
- Globally branded **Free Code Hub**; footer + auth screens carry prominent CTAs to the creator's
  pipelines: **Instagram Tutorials** (https://instagram.com) and **YouTube Complete Masterclass**
  (https://youtube.com).
- Every solved challenge generates a **"Share Progress to Win"** card that auto-formats a social
  post tagging **@Jp_dev_1** (X intent / Web Share / copy-to-clipboard).

### ⚡ Realtime
- Socket.IO rooms (`user:<id>`, `leaderboard`) push progress updates to the client instantly.

---

## 📁 File Structure

```
free-code-hub/
├── package.json                  # root scripts (install:all, dev:server, dev:client, build, test)
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── server.js                 # Express engine: DB config, security headers, Socket.IO, seeds
│   ├── config/db.js              # Mongoose connection + demo-mode detection
│   ├── models/
│   │   ├── User.js               # email, password, codingStreak, experiencePoints,
│   │   │                         # achievedTitles[], completedChallenges[], localizedPaymentStatus
│   │   ├── Challenge.js          # title, slug, instructionMarkdown, boilerplateCode,
│   │   │                         # verificationTests[] { testDescription, assertionString }
│   │   └── Order.js              # PPP order snapshot + mock payment references
│   ├── routes/
│   │   ├── auth.js               # register / login (JWT)
│   │   ├── challenges.js         # public catalogue (+ demo-mode fallback)
│   │   ├── progress.js           # solve (vm verification + Streak & Claim), /me, leaderboard
│   │   └── billing.js            # PPP pricing, checkout, confirm, orders
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── dbGuard.js            # graceful 503 in demo mode
│   ├── utils/
│   │   ├── ppp.js                # PPP pricing engine (55+ countries, currency routing)
│   │   ├── gamification.js       # streak, XP, multipliers, titles, asset milestones
│   │   ├── verifyCode.js         # isolated vm test runner with timeout
│   │   └── seed.js               # idempotent challenge seeding
│   ├── data/challenges.js        # seed catalogue (5 challenges)
│   └── tests/                    # ppp / gamification / verify test suites
└── client/
    ├── package.json
    ├── vite.config.js            # JSX-in-.js support + /api & /socket.io proxy
    ├── tailwind.config.js / postcss.config.js / index.html
    └── src/
        ├── main.js / index.css / App.js   # router, layout, socket wiring, confetti layer
        ├── api/client.js                  # fetch wrapper (JWT, same-origin)
        ├── context/                       # AuthContext, RewardContext
        ├── data/countries.js              # country selector + timezone guess
        ├── components/
        │   ├── EditorSandbox.js           # Blob-URI iframe sandbox + postMessage handshake
        │   ├── Navbar.js / Footer.js      # Footer carries Instagram + YouTube CTAs
        │   ├── TutorialCTA.js             # viral tutorial anchors (also on auth screens)
        │   ├── ConfettiBurst.js           # canvas confetti celebration
        │   ├── ShareProgress.js           # "Share Progress to Win" viral card
        │   ├── StreakDashboard.js         # streaks, XP, badges, claim countdown, assets
        │   ├── RewardToast.js             # viral success reward alert
        │   └── MarkdownLite.js            # instruction renderer
        └── pages/                         # Home, ChallengeList, ChallengeDetail,
                                           # Dashboard, Login, Register, CertificateCheckout
```

---

## 🏃 Quick Start

```bash
# 1. Install everything
npm run install:all

# 2. Configure the API (optional — without MONGO_URI the app runs in demo mode)
cp server/.env.example server/.env   # then edit MONGO_URI / JWT_SECRET

# 3. Run the API (http://localhost:5000)
npm run dev:server

# 4. Run the web app (http://localhost:5173, proxies /api + /socket.io)
npm run dev:client
```

**Demo mode:** if `MONGO_URI` is unset the API still boots — the challenge catalogue and PPP
pricing work immediately; account/progress/checkout routes return a clear `503` until a database
is configured.

**Tests** (PPP engine, gamification engine, sandbox verifier):

```bash
npm test          # from the repo root, or: npm --prefix server test
```

**Production build:**

```bash
npm run build     # client -> client/dist (serve behind the API or any static host)
```

---

## 🔌 API Overview

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness probe |
| POST | `/api/auth/register` | — | Create account, returns JWT |
| POST | `/api/auth/login` | — | Log in, returns JWT |
| GET | `/api/challenges` | — | Challenge catalogue |
| GET | `/api/challenges/:slug` | — | Challenge detail incl. verification tests |
| POST | `/api/progress/solve` | ✅ | Verify code, run Streak & Claim, award XP/titles |
| GET | `/api/progress/me` | ✅ | Profile + multiplier + titles + asset milestones |
| GET | `/api/progress/leaderboard` | — | Top 10 by XP |
| GET | `/api/billing/pricing?country=IN` | — | PPP-localized certificate quote |
| POST | `/api/billing/checkout` | ✅ | Create pending order + mock payment intent |
| POST | `/api/billing/confirm` | ✅ | Confirm (mock) → `localizedPaymentStatus`, +500 XP |
| GET | `/api/billing/orders` | ✅ | Order history |

### PPP pricing example

```bash
curl "http://localhost:5000/api/billing/pricing?country=IN"
# -> { priceUSD: 12.74, localAmount: 1057.42, currency: "inr", tier: "emerging", discountPercent: 74, ... }
```

---

## 🧩 Gamification model

```
streak.current  : consecutive active UTC days (same day = no double count, gap = reset to 1)
streak.longest  : personal best (never decreases)
XP award        : round(challenge.baseXP * multiplier(streak.current))
titles          : unlocked at 0 / 100 / 300 / 600 / 1200 / 2500 XP
assets          : claimable digital cosmetics at 3 / 7 / 14 / 30-day streaks
```

---

## 🗺️ Remaining Roadmap (not yet implemented)

**Payments & pricing**
1. Live Stripe integration: real PaymentIntents + Localized Payment Element + `payment_intent.succeeded` webhook (signature-verified) replacing the mock intents.
2. Real crypto gateway (Coinbase Commerce / BTCPay Server) or on-chain payment verification replacing the mock USDT quote.
3. Live PPP exchange-rate feed (e.g. exchangerate.host) instead of mock reference rates; Stripe currency-specific minor units (JPY/KRW have 0 decimals).

**Platform features**
4. More courses & learning paths (JavaScript, algorithms, React, Node tracks) with prerequisites and unlock progression.
5. Leaderboard UI page (the API + socket events already exist) — global, weekly, and friends boards.
6. Verifiable digital credentials: PDF certificate generation + public verification page (ID/QR), optionally anchored on-chain (hash) or as W3C Verifiable Credentials.
7. Daily "Streak & Claim" login reward (the countdown exists; add the claim action + reward chest).
8. Social layer: profiles, follow, activity feed, challenge comments, referral program.
9. Admin dashboard: manage challenges/users/orders, analytics, seed editor.
10. i18n + RTL support, light/dark theme toggle, PWA with offline lessons, streak push notifications.

**Production hardening**
11. Auth: email verification, password reset, refresh tokens, auth rate-limiting + lockout.
12. Security: production CORS allowlist, CSP via helmet, secure cookies, HTTPS, learner-code isolation in child processes/containers (Node `vm` is not a hard security boundary).
13. DevOps: Docker + docker-compose, GitHub Actions CI (test/build/deploy), deploy to Render/Railway/Fly + Vercel, MongoDB Atlas with backups.
14. Observability: Sentry error tracking, structured logging, uptime monitoring.

**Testing**
15. Integration tests (supertest) for every route — the in-memory layer makes this easy (no DB needed).
16. E2E tests (Playwright) for the register → solve → celebrate → checkout journey.
17. Load tests for the solve endpoint and Socket.IO fan-out.

## ⚠️ Demo & Safety Notes

- **Payments are simulated.** `checkout` returns a Stripe-style mock `clientSecret` and an
  optional USDT (ERC-20) crypto quote. No real charge ever occurs. Wire in live Stripe
  PaymentIntents + webhooks (or a real crypto gateway) for production.
- Exchange rates in `server/utils/ppp.js` are **mock reference rates** — refresh them from a
  rates provider in production.
- Learner code runs in an isolated `vm` context (server) and a sandboxed `allow-scripts` iframe
  (client) with a hard execution timeout.
