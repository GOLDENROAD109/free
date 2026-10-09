require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const { connectDB, dbReady } = require('./config/db');
const { activateInMemoryDb } = require('./config/inMemoryDb');
const { seedChallenges } = require('./utils/seed');

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const progressRoutes = require('./routes/progress');
const billingRoutes = require('./routes/billing');

const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// WebSockets — real-time progress syncing (per-user rooms + leaderboard room)
// ---------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);

io.on('connection', (socket) => {
  // Clients join rooms explicitly: `user:<id>` for private progress sync,
  // `leaderboard` for global XP updates.
  socket.on('join', (room) => {
    if (typeof room === 'string' && /^(user:[A-Za-z0-9]+|leaderboard)$/.test(room)) {
      socket.join(room);
    }
  });
  socket.on('join-leaderboard', () => socket.join('leaderboard'));
  socket.emit('welcome', {
    message: 'Connected to the Free Code Hub realtime progress feed.',
    socketId: socket.id,
  });
});

// ---------------------------------------------------------------------------
// Security headers, CORS, parsing, logging, rate limiting
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests — slow down and keep coding. 🐢' },
});
app.use('/api/', apiLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Free Code Hub API',
    version: '1.0.0',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/billing', billingRoutes);

// ---------------------------------------------------------------------------
// Frontend: serve the production build (client/dist) when it exists, with an
// SPA fallback so deep links like /courses keep working. When no build exists
// yet, GET / returns a styled landing page — the API port always has output.
// ---------------------------------------------------------------------------
const fs = require('fs');
const path = require('path');

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const clientIndex = path.join(clientDist, 'index.html');
const hasClientBuild = fs.existsSync(clientIndex);

const LANDING_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Free Code Hub API</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f172a;color:#e2e8f0;font-family:ui-monospace,Menlo,Consolas,monospace;padding:24px;box-sizing:border-box}
  .card{max-width:560px;width:100%;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
  h1{margin:0 0 4px;font-size:26px}
  .grad{background:linear-gradient(90deg,#22d3ee,#e879f9);-webkit-background-clip:text;background-clip:text;color:transparent}
  p{color:#94a3b8;line-height:1.7;font-size:14px}
  a{color:#22d3ee;text-decoration:none}
  a:hover{text-decoration:underline}
  ul{padding-left:18px;line-height:2;font-size:14px}
  code{background:#0f172a;padding:2px 7px;border-radius:6px;color:#e879f9;font-size:12px}
  .badge{display:inline-block;background:rgba(34,211,238,.12);border:1px solid rgba(34,211,238,.4);color:#67e8f9;border-radius:9999px;padding:3px 12px;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
</style>
</head>
<body>
  <div class="card">
    <span class="badge">API running</span>
    <h1>Free <span class="grad">Code Hub</span> API</h1>
    <p>The backend is up. This port serves the API — the web app is served from here once built, or from the Vite dev server.</p>
    <ul>
      <li><a href="/api/health">/api/health</a> — liveness probe</li>
      <li><a href="/api/challenges">/api/challenges</a> — course catalogue</li>
      <li><a href="/api/billing/pricing?country=US">/api/billing/pricing</a> — PPP certificate pricing</li>
    </ul>
    <p>To see the full UI: <code>npm run build</code> then restart this server, or run <code>npm run dev:client</code> and open port 5173.</p>
  </div>
</body>
</html>`;

if (hasClientBuild) {
  app.use(express.static(clientDist));
  // SPA fallback: deep links (/courses, /challenges/:slug, ...) return the app shell.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) return next();
    res.sendFile(clientIndex);
  });
  console.log('[server] Serving the built Free Code Hub client from client/dist');
} else {
  app.get('/', (req, res) => {
    res.type('html').send(LANDING_HTML);
  });
  console.log('[server] No client build found — GET / shows a landing page. Run `npm run build` (client) to serve the full app from this port.');
}

// 404 + error handlers
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
  });
});

// ---------------------------------------------------------------------------
// Boot: database -> seeds -> HTTP + WebSocket listener
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  if (dbReady()) {
    await seedChallenges();
  } else {
    // Sandbox / demo mode: full experience on the in-memory data layer.
    activateInMemoryDb();
  }
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] 🚀 Free Code Hub API listening on http://0.0.0.0:${PORT}`);
  });
})();

module.exports = { app, server, io };
