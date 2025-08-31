// Placeholder ABI export: copies HerbRegistry ABI from Hardhat artifacts if present
const fs = require('fs');
const path = require('path');

const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'HerbRegistry.sol', 'HerbRegistry.json');
const outDir = path.join(__dirname, '..', '..', 'backend', 'src', 'abi');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

if (fs.existsSync(artifactPath)) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  fs.writeFileSync(path.join(outDir, 'HerbRegistry.json'), JSON.stringify(artifact.abi, null, 2));
  console.log('ABI exported to backend/src/abi/HerbRegistry.json');
} else {
  console.warn('Artifact not found, compile first');
}