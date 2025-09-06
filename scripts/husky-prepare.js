#!/usr/bin/env node
/* Safe husky prepare script: avoids hard failure if husky not yet installed */
const { execSync } = require('child_process');
try {
  require.resolve('husky');
} catch (e) {
  console.log('[husky-prepare] husky not installed, skipping hooks setup');
  process.exit(0);
}
try {
  execSync('npx husky install', { stdio: 'inherit' });
  console.log('[husky-prepare] husky installed');
} catch (e) {
  console.warn('[husky-prepare] husky install failed (non-fatal):', e.message);
}
