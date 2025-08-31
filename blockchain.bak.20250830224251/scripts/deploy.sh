#!/usr/bin/env bash
set -euo pipefail

echo "[deploy] Starting smart contract deployment..."
if [ ! -f package.json ]; then
	echo "Run from blockchain directory"; exit 1;
fi
npx hardhat compile || { echo 'Compile failed'; exit 1; }
ADDR_FILE="deployment-address.json"
node - <<'NODE'
const fs=require('fs');
// Placeholder: In real script interact with hre to deploy
const address='0x' + 'a'.repeat(40);
fs.writeFileSync('deployment-address.json', JSON.stringify({HerbRegistry:address},null,2));
console.log('Simulated deploy address', address);
NODE
echo "[deploy] Wrote $ADDR_FILE"
echo "[deploy] Done."
