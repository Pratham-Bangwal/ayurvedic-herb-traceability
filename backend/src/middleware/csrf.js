// backend/src/middleware/csrf.js
// Lightweight stateless CSRF protection using HMAC of (secret + identity + time-slice)
// Route / method agnostic so a single token can be reused within validity window.
// For demo purposes; in production consider double-submit cookie or SameSite=strict cookies.

const crypto = require('crypto');

const DEFAULT_WINDOW_MIN = 15; // token valid for 15-minute slices

function getSecret() {
  return process.env.CSRF_SECRET || (process.env.JWT_SECRET ? process.env.JWT_SECRET : 'dev_csrf_secret_change_me');
}

function timeSlice(windowMinutes = DEFAULT_WINDOW_MIN) {
  return Math.floor(Date.now() / (1000 * 60 * windowMinutes));
}

function baseIdentity(req) {
  // If authenticated via JWT we have req.user.sub else fallback to IP
  return (req.user && req.user.sub) || req.ip || 'anon';
}

function signToken(parts) {
  const h = crypto.createHmac('sha256', getSecret());
  h.update(parts.join('|'));
  return h.digest('base64url');
}

function generateCsrf(identity) {
  const slice = timeSlice();
  return signToken([identity, slice]);
}

// Middleware to attach a fresh CSRF token for safe retrieval endpoints if desired
function attachCsrfToken(req, res, next) {
  const id = baseIdentity(req);
  const token = generateCsrf(id);
  res.setHeader('X-CSRF-Token', token);
  next();
}

// Validation middleware for mutating requests
function verifyCsrf(req, res, next) {
  // Idempotent / safe methods skip
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();

  // Allow disabling via env or automatically in test environment
  if (process.env.CSRF_DISABLE === '1' || (process.env.NODE_ENV === 'test' && !process.env.CSRF_ENFORCE_IN_TEST)) return next();

  const provided = req.header('X-CSRF-Token');
  if (!provided) {
    return res.status(403).json({ error: { code: 'csrf_missing', message: 'CSRF token required' } });
  }

  const id = baseIdentity(req);
  const expectedCurrent = generateCsrf(id);
  const expectedPrev = signToken([id, timeSlice() - 1]); // allow previous window for skew

  if (provided !== expectedCurrent && provided !== expectedPrev) {
    return res.status(403).json({ error: { code: 'csrf_invalid', message: 'Invalid CSRF token' } });
  }
  next();
}

module.exports = { attachCsrfToken, verifyCsrf };
