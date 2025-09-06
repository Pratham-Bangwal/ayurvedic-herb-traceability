const qrcode = require('qrcode');

/**
 * buildTraceLinks
 * Purpose: Construct trace URL and a QR code DataURL.
 * Inputs: batchId (string)
 * Env: FRONTEND_BASE_URL fallback http://localhost:3000
 */
async function buildTraceLinks(batchId) {
  if (!batchId) throw new Error('batchId required');
  const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const traceUrl = `${frontendBase.replace(/\/$/, '')}/trace/${encodeURIComponent(batchId)}`;
  const qrDataURL = await qrcode.toDataURL(traceUrl);
  return { traceUrl, qrDataURL };
}

module.exports = { buildTraceLinks };
