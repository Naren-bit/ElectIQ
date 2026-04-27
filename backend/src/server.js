/**
 * @fileoverview ElectIQ Express + Socket.IO server.
 * Provides AI-powered election guidance via Gemini 2.5 Flash,
 * backed by Firebase Realtime Database for persistence.
 *
 * Security features:
 *  - Helmet with strict CSP
 *  - Per-route rate limiting
 *  - Input sanitisation (HTML/XSS stripping)
 *  - Request ID tracing
 *
 * @module server
 */

'use strict';

require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const rateLimit      = require('express-rate-limit');
const { createServer } = require('http');
const { Server }     = require('socket.io');
const { randomUUID } = require('crypto');

const path           = require('path');

/* ------------------------------------------------------------------ */
/*  Environment validation                                             */
/* ------------------------------------------------------------------ */

const REQUIRED_ENV = ['GEMINI_API_KEY', 'FIREBASE_DATABASE_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[Boot] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/*  Route & service imports                                            */
/* ------------------------------------------------------------------ */

const chatRouter      = require('./routes/chat');
const quizRouter      = require('./routes/quiz');
const timelineRouter  = require('./routes/timeline');
const checklistRouter = require('./routes/checklist');
const { initFirebase }  = require('./services/firebase');
const { errorHandler }  = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

/* ------------------------------------------------------------------ */
/*  App & HTTP server                                                  */
/* ------------------------------------------------------------------ */

const app        = express();
const httpServer = createServer(app);
const io         = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Expose Socket.IO instance to route handlers
app.set('io', io);

/* ------------------------------------------------------------------ */
/*  Security middleware                                                 */
/* ------------------------------------------------------------------ */

// Request ID — accept trusted header or generate a fresh UUIDv4
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

app.use((req, _res, next) => {
  const id = (req.headers['x-request-id'] && UUID_RE.test(req.headers['x-request-id']))
    ? req.headers['x-request-id']
    : randomUUID();
  req.id = id;
  _res.setHeader('X-Request-ID', id);
  next();
});

// Input sanitisation — strip HTML tags, event handlers, javascript: URIs
app.use(express.json({ limit: '100kb' }));
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    /**
     * Recursively sanitise string values in the request body.
     * @param {*} value - Value to sanitise
     * @returns {*} Sanitised value
     */
    const sanitize = (value) => {
      if (typeof value === 'string') {
        return value
          .replace(/<[^>]*>|javascript:|data:|on\w+=/gi, '')
          .trim()
          .slice(0, 2000);
      }
      if (Array.isArray(value)) return value.map(sanitize);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, sanitize(v)])
        );
      }
      return value;
    };
    req.body = sanitize(req.body);
  }
  next();
});

// Helmet — strict Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://www.gstatic.com',
        'https://maps.googleapis.com',
        "'unsafe-inline'",
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: [
        "'self'",
        'https://*.firebaseio.com',
        'wss://*.firebaseio.com',
        'https://generativelanguage.googleapis.com',
        'https://maps.googleapis.com',
      ],
      imgSrc: ["'self'", 'data:', 'https://maps.gstatic.com', 'https://*.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// Logging
app.use(requestLogger);

/* ------------------------------------------------------------------ */
/*  Rate limiting                                                      */
/* ------------------------------------------------------------------ */

app.use('/api/', rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a minute.' },
}));

app.use('/api/chat', rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat rate limit reached. Please wait before sending again.' },
}));

/* ------------------------------------------------------------------ */
/*  Static files                                                       */
/* ------------------------------------------------------------------ */

app.use(express.static(path.join(__dirname, '../../public')));

/* ------------------------------------------------------------------ */
/*  API routes                                                         */
/* ------------------------------------------------------------------ */

app.use('/api/chat',      chatRouter);
app.use('/api/quiz',      quizRouter);
app.use('/api/timeline',  timelineRouter);
app.use('/api/checklist', checklistRouter);

// Language map endpoint
const { STATE_LANGUAGES } = require('./services/gemini');
app.get('/api/languages', (_req, res) => {
  res.json({ languages: STATE_LANGUAGES });
});

/* ------------------------------------------------------------------ */
/*  Health check                                                       */
/* ------------------------------------------------------------------ */

/**
 * @route GET /health
 * @returns {{ status: string, uptime: number, timestamp: string, version: string }}
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
  });
});

/* ------------------------------------------------------------------ */
/*  Error handler (must be last)                                       */
/* ------------------------------------------------------------------ */

app.use(errorHandler);

/* ------------------------------------------------------------------ */
/*  WebSocket                                                          */
/* ------------------------------------------------------------------ */

io.on('connection', (socket) => {
  console.log(`[WS] Connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[WS] Disconnected: ${socket.id}`));
});

/* ------------------------------------------------------------------ */
/*  Boot sequence                                                      */
/* ------------------------------------------------------------------ */

const PORT = process.env.PORT || 3001;

/**
 * Initialise Firebase and start the HTTP server.
 * Exits with code 1 on fatal errors.
 */
async function boot() {
  try {
    await initFirebase();
    console.log('[Firebase] Connected successfully');

    httpServer.listen(PORT, () => {
      console.log(`[ElectIQ] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Boot] Fatal error:', err);
    process.exit(1);
  }
}

boot();
