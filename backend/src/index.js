/**
 * backend/src/index.js
 * Purpose: Express entrypoint - sets routes and middleware.
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const herbsRouter = require('./routes/herbs');
const logger = require('./utils/logger');
const { record, exposition } = require('./utils/metrics');

// 🔥 Import blockchain adapter selector (mock or real)
const blockchainService = require('./services/blockchain');
const { isMock } = require('./services/mode');
const { seedMockData } = require('./seed/seedMock');

const app = express();

// Security headers
app.use(helmet());

// CORS (tighten: allow origin env or localhost dev)
const allowed = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('CORS not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
// Basic rate limiting (skip in test)
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120, // per IP per minute
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  // Stricter limits for mutation endpoints
  const mutateLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
  app.use(
    ['/api/herbs', '/api/herbs/upload', /\/api\/herbs\/.+\/(process|events|transfer)$/],
    mutateLimiter
  );
}
app.use(express.urlencoded({ extended: true }));

// Correlation / Request ID middleware (simple nanoid replacement using Date+rand)
app.use((req, res, next) => {
  const rid = 'req_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  req.id = rid;
  res.setHeader('X-Request-Id', rid);
  next();
});

// Inject mock mode header when active
app.use((req, res, next) => {
  if (isMock()) res.setHeader('X-Mock-Mode', 'true');
  next();
});

app.get('/healthz', (req, res) => res.status(200).send('ok'));
// Metrics exposition
app.get('/metrics', (req, res) => {
  res.type('text/plain').send(exposition());
});

// Simple request logging (after body parsing)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    record(ms, res.statusCode);
    logger.info(
      { id: req.id, method: req.method, url: req.originalUrl, status: res.statusCode, ms },
      'req'
    );
  });
  next();
});

app.use('/api/herbs', herbsRouter);

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err: err.message, stack: err.stack, id: req.id }, 'unhandled_error');
  res.status(500).json({ error: { code: 'internal_error', message: 'Unexpected server error' } });
});

// Startup strategy: always listen first, then attempt Mongo connect (non-fatal if it fails)
if (process.env.NODE_ENV !== 'test' && !process.env.TEST_ENV) {
  const BASE_PORT = parseInt(process.env.PORT, 10) || 4000;
  const MAX_TRIES = 10;

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/herbs';

  function connectMongo() {
    (async () => {
      try {
        await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        blockchainService.init && blockchainService.init();
        await seedMockData();
        logger.info({ db: 'mongo', uri: MONGODB_URI }, 'Mongo connected');
      } catch (err) {
        logger.warn({ err: err.message }, 'Mongo connect failed – operating in memory mode');
      }
    })();
  }

  function graceful(server) {
    const shutdown = () => {
      logger.info('Shutting down');
      server.close(() => process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  function attempt(port, remaining) {
    const server = app.listen(port);
    server.once('listening', () => {
      logger.info(
        { port, mock: isMock(), attempt: MAX_TRIES - remaining + 1 },
        'Backend listening'
      );
      connectMongo();
      graceful(server);
    });
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' && remaining > 0) {
        logger.warn({ port, next: port + 1 }, 'Port in use, retrying');
        setTimeout(() => attempt(port + 1, remaining - 1), 150);
      } else {
        logger.error({ err: err.message, port }, 'Server failed to start');
        process.exit(1);
      }
    });
  }

  attempt(BASE_PORT, MAX_TRIES - 1);
}

// add at end of file
module.exports = { app };
