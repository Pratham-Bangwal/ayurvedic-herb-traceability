const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "artifacts/contracts/HerbRegistry.sol/HerbRegistry.json");
const destination = path.join(__dirname, "../backend/abi/HerbRegistry.json");

if (!fs.existsSync(source)) {
  console.error("❌ ABI not found, did you run `npx hardhat compile`?");
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log(`✅ ABI copied to backend/abi/HerbRegistry.json`);
