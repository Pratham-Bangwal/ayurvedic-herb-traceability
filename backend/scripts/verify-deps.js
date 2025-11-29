#!/usr/bin/env node
/**
 * Simple dependency verification script.
 * Ensures critical runtime packages resolve before starting the app.
 */

const required = [ 'bcryptjs', 'jsonwebtoken', 'express' ];
const missing = [];
for (const mod of required) {
  try {
    require.resolve(mod);
  } catch (e) {
    missing.push(mod);
  }
}

if (missing.length) {
  console.error('\n[verify-deps] Missing required modules:', missing.join(', '));
  process.exit(1);
}

console.log('[verify-deps] All critical modules present.');
