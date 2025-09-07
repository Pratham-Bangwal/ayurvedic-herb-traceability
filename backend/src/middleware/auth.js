// Simple mock auth middleware using static API key and role header
// Usage: set X-API-Key to process.env.API_KEY (if defined) else pass-through.
// Role header: X-Role (farmer|processor|manufacturer|consumer)

const jwt = require('jsonwebtoken');
const allowedRoles = ['farmer', 'processor', 'manufacturer', 'consumer'];

function extractJwt(req) {
  const auth = req.header('Authorization');
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

function applyRole(req, role) {
  if (role && allowedRoles.includes(role)) {
    req.user = { ...(req.user || {}), role };
  }
}

function authOptional(req, res, next) {
  const configuredKey = process.env.API_KEY;
  if (configuredKey) {
    const key = req.header('X-API-Key');
    if (!key || key !== configuredKey) {
      return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid API key' } });
    }
  }
  // Prefer JWT if provided
  const token = extractJwt(req);
  if (token && process.env.JWT_SECRET) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role) applyRole(req, payload.role);
      req.user = { ...(req.user || {}), sub: payload.sub, iss: payload.iss };
    } catch (e) {
      return res.status(401).json({ error: { code: 'invalid_token', message: 'Invalid token' } });
    }
  }
  // Header role fallback
  const role = req.header('X-Role');
  applyRole(req, role);
  next();
}
function authRequired(req, res, next) {
  // Dev shortcut: if AUTH_DEV_MODE=1, auto-inject default role (farmer) when absent
  if (process.env.AUTH_DEV_MODE === '1') {
    if (!req.user) req.user = {};
    if (!req.user.role) req.user.role = 'farmer';
    return next();
  }
  const configuredKey = process.env.API_KEY;
  if (configuredKey) {
    const key = req.header('X-API-Key');
    if (!key || key !== configuredKey) {
      return res.status(401).json({ error: { code: 'unauthorized', message: 'Invalid API key' } });
    }
  }
  const token = extractJwt(req);
  if (process.env.JWT_SECRET) {
    if (!token)
      return res.status(401).json({ error: { code: 'auth_required', message: 'Token required' } });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.role) applyRole(req, payload.role);
      req.user = { ...(req.user || {}), sub: payload.sub, iss: payload.iss };
    } catch (e) {
      return res.status(401).json({ error: { code: 'invalid_token', message: 'Invalid token' } });
    }
  }
  // Allow header role only if JWT not enforced
  if (!process.env.JWT_SECRET) {
    const role = req.header('X-Role');
    applyRole(req, role);
  }
  if (!req.user || !req.user.role) {
    return res.status(403).json({ error: { code: 'forbidden', message: 'Role required' } });
  }
  next();
}

module.exports = { authOptional, authRequired };
