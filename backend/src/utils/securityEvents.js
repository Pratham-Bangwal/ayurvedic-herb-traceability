// backend/src/utils/securityEvents.js
// Centralized helper for recording security/audit relevant events.
// Keeps a minimal, structured, append-only style interface so future persistence (DB, SIEM) is easy.

const logger = require('./logger');
let SecurityEventModel;
try {
  SecurityEventModel = require('../models/securityEventModel');
} catch (e) {
  // model not available yet
}

// Event types we anticipate expanding.
const EVENT_TYPES = [
  'auth.login.success',
  'auth.login.failure',
  'auth.login.lockout',
  'auth.user.create',
  'auth.user.create.failure',
  'geo.spoof.suspect',
  'analytics.export'
];

async function recordSecurityEvent(type, meta = {}) {
  const safeType = EVENT_TYPES.includes(type) ? type : 'custom';
  if (meta.password) delete meta.password;
  if (meta.token) delete meta.token;
  const event = { evt: safeType, ts: new Date().toISOString(), ...meta };
  logger.info(event, 'security_event');
  if (SecurityEventModel) {
    try {
      await SecurityEventModel.create({
        type: safeType,
        username: meta.username,
        ip: meta.ip,
        userAgent: meta.userAgent,
        meta: meta.meta || meta,
        ts: new Date()
      });
    } catch (e) {
      // swallow persistence issues
    }
  }
}

module.exports = { recordSecurityEvent };
