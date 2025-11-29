/**
 * backend/src/index.js
 * Purpose: Express entrypoint - sets routes and middleware.
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import security dependencies
let helmet;
try {
  helmet = require('helmet');
} catch (e) {
  helmet = (req, res, next) => next(); // no-op fallback
}

// Import custom rate limiter with configurable options
const { limiters } = require('./middleware/rateLimiter');

const herbsRouter = require('./routes/herbs');
const authRouter = require('./routes/auth');
const analyticsRouter = require('./routes/analytics');
const { isMock } = require('./services/mode');

// Check if optional utilities exist
let logger, record, exposition;
try {
  logger = require('./utils/logger');
  const metrics = require('./utils/metrics');
  record = metrics.record;
  exposition = metrics.exposition;
} catch (e) {
  logger = console;
  record = () => {};
  exposition = () => '# No metrics available';
}

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
// Advanced rate limiting (skip in test)
if (process.env.NODE_ENV !== 'test') {
  // Apply general API rate limit to all routes
  app.use('/api/', limiters.api);
  
  // Apply strict rate limit to authentication endpoints
  app.use('/api/auth/', limiters.auth);
  
  // Apply very strict rate limit to sensitive operations
  app.use('/api/herbs/admin/wipe', limiters.sensitive);
  
  // Apply standard API rate limit to mutation endpoints
  app.use(
    ['/api/herbs', '/api/herbs/upload', /\/api\/herbs\/.+\/(process|events|transfer)$/],
    limiters.api
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
app.use('/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err: err.message, stack: err.stack, id: req.id }, 'unhandled_error');
  res.status(500).json({ error: { code: 'internal_error', message: 'Unexpected server error' } });
});

// Startup strategy with better error handling
if (process.env.NODE_ENV !== 'test' && !process.env.TEST_ENV) {
  const BASE_PORT = parseInt(process.env.PORT, 10) || 4000;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/herbs';

  const connectMongo = () => {
    mongoose
      .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      })
      .then(() => {
        global.mongoConnected = true;
        logger.info({ db: 'mongo', uri: MONGODB_URI }, 'Mongo connected');

        // Initialize blockchain service if available
        try {
          const blockchainService = require('./services/blockchain');
          if (blockchainService.init) blockchainService.init();
        } catch (e) {
          logger.warn('Blockchain service not available');
        }
        
        // Initialize authentication service
        try {
          const authService = require('./services/authService');
          authService.initializeUsers()
            .then(() => logger.info('Authentication service initialized'))
            .catch(err => logger.error({ err }, 'Failed to initialize authentication service'));
        } catch (e) {
          logger.error({ err: e }, 'Authentication service initialization failed');
        }

        // Seed mock data if available
        try {
          const { seedMockData } = require('./seed/seedMock');
          seedMockData();
        } catch (e) {
          logger.warn('Mock seeding not available');
        }
      })
      .catch((err) => {
        logger.warn({ err: err.message }, 'Mongo connect failed – operating without database');
      });
  };

  const server = app.listen(BASE_PORT, () => {
    logger.info({ port: BASE_PORT }, 'Backend listening');
    connectMongo();
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down');
    server.close(() => process.exit(0));
  });
}

// Helper to create and return server (for tests/E2E)
async function createServer(port = 0) {
  const BASE_PORT = port || parseInt(process.env.PORT, 10) || 4000;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/herbs';

  // In test environment we skip establishing (or re-establishing) a Mongo connection here.
  // Global setup already connects when needed; duplicating connects creates lingering TCP handles.
  if (process.env.NODE_ENV !== 'test') {
    if (!global.mongoConnected) {
      try {
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });
        global.mongoConnected = true;
      } catch (err) {
        // Ignore DB errors in non-critical startup path
      }
    }
  }

  // Ensure admin user is initialized for tests
  try {
    const authService = require('./services/authService');
    if (authService.initializeUsers) {
      await authService.initializeUsers();
    }
  } catch (e) {
    // Ignore errors
  }

  // Start server
  return new Promise((resolve) => {
    const server = app.listen(BASE_PORT, () => {
      resolve({ app, server });
    });
  });
}

module.exports = { app, createServer };
