// blockchain/scripts/export-contracts.js
const fs = require("fs");
const path = require("path");

module.exports = function(callback) {
  try {
    // Load artifact from Truffle build
    const path = require("path");
    const artifact = require(path.join(__dirname, "../../build/contracts/HerbRegistry.json"));


    // Grab first networkId (Ganache changes every run, so dynamic)
    const networkId = Object.keys(artifact.networks)[0];
    if (!networkId) throw new Error("❌ No networks found in HerbRegistry.json");

    const address = artifact.networks[networkId].address;

    const output = {
      address,
      abi: artifact.abi,
    };

    // Write into backend folder
    const target = path.resolve(__dirname, "../../backend/contract/HerbRegistry.json");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(output, null, 2));

    console.log("✅ Exported HerbRegistry ABI+address to backend/contract/HerbRegistry.json");
    callback();
  } catch (err) {
    console.error("❌ Failed to export contract:", err);
    callback(err);
  }
};
