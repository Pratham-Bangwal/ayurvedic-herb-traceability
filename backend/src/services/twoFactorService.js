// backend/src/services/twoFactorService.js
// Provides TOTP (Time-based One Time Password) functionality using otplib.

const { authenticator } = require('otplib');
const crypto = require('crypto');
let TwoFactorModel;
try {
  TwoFactorModel = require('../models/twoFactorModel');
} catch (e) {
  // model not available (tests/in-memory)
}

// In-memory fallback store if DB unavailable
const memoryStore = new Map();

// Simple AES-256-GCM encryption helpers
const ENC_ALGO = 'aes-256-gcm';
function getKey() {
  const key = process.env.TWOFA_ENC_KEY || 'dev-insecure-key-please-change-32bytes!';
  return crypto.createHash('sha256').update(key).digest();
}
function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}
function decrypt(payload) {
  try {
    const raw = Buffer.from(payload, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const key = getKey();
    const decipher = crypto.createDecipheriv(ENC_ALGO, key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    return dec;
  } catch (e) {
    return null;
  }
}

function init() {
  authenticator.options = {
    step: 30,
    window: 1, // allow one step skew
  };
}

async function generateSecret(username) {
  const secret = authenticator.generateSecret();
  const label = encodeURIComponent(username || 'user');
  const issuer = encodeURIComponent(process.env.TOTP_ISSUER || 'HerbTrace');
  const otpauth = authenticator.keyuri(label, issuer, secret);
  // Persist encrypted secret (disabled until verification)
  const rec = { secretEnc: encrypt(secret), enabled: false, username };
  try {
    if (TwoFactorModel) {
      await TwoFactorModel.findOneAndUpdate({ username }, rec, { upsert: true });
    } else {
      memoryStore.set(username, { ...rec, backupCodesEnc: [] });
    }
  } catch (e) {
    // ignore persistence errors for now
  }
  return { secret, otpauth };
}

async function verifyToken(secret, token, username) {
  if (!secret || !token) return false;
  const ok = authenticator.verify({ token, secret });
  if (ok && username) {
    // Mark secret as enabled & generate backup codes if not existing
    const existing = await getUser2FA(username);
    let backupCodes = [];
    if (!existing || !existing.backupCodes || existing.backupCodes.length === 0) {
      backupCodes = generateBackupCodes();
    } else {
      backupCodes = existing.backupCodes;
    }
    const backupCodesEnc = backupCodes.map(encrypt);
    const update = {
      username,
      secretEnc: encrypt(secret),
      backupCodesEnc,
      enabled: true,
      updatedAt: new Date()
    };
    try {
      if (TwoFactorModel) {
        await TwoFactorModel.findOneAndUpdate({ username }, update, { upsert: true });
      } else {
        memoryStore.set(username, update);
      }
    } catch (e) {
      // ignore
    }
    return { ok: true, backupCodes };
  }
  return { ok: false };
}

function generateBackupCodes(count = 5) {
  return Array.from({ length: count }, () => crypto.randomBytes(4).toString('hex'));
}

async function getUser2FA(username) {
  if (!username) return null;
  try {
    if (TwoFactorModel) {
      const rec = await TwoFactorModel.findOne({ username }).lean();
      if (!rec) return null;
      return {
        username: rec.username,
        secret: decrypt(rec.secretEnc),
        backupCodes: (rec.backupCodesEnc || []).map(decrypt).filter(Boolean),
        enabled: rec.enabled
      };
    }
    if (memoryStore.has(username)) {
      const mem = memoryStore.get(username);
      return {
        username,
        secret: decrypt(mem.secretEnc),
        backupCodes: (mem.backupCodesEnc || []).map(decrypt).filter(Boolean),
        enabled: mem.enabled
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function consumeBackupCode(username, code) {
  if (!username || !code) return false;
  const data = await getUser2FA(username);
  if (!data || !data.enabled || !data.backupCodes) return false;
  if (!data.backupCodes.includes(code)) return false;
  const remaining = data.backupCodes.filter(c => c !== code);
  const backupCodesEnc = remaining.map(encrypt);
  try {
    if (TwoFactorModel) {
      await TwoFactorModel.updateOne({ username }, { backupCodesEnc });
    } else if (memoryStore.has(username)) {
      const mem = memoryStore.get(username);
      memoryStore.set(username, { ...mem, backupCodesEnc });
    }
  } catch (e) {
    return false;
  }
  return true;
}
module.exports = { init, generateSecret, verifyToken, generateBackupCodes, getUser2FA, consumeBackupCode };
