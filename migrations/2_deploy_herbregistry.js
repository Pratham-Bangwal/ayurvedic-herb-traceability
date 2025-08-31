const HerbRegistry = artifacts.require("HerbRegistry");

module.exports = async function (deployer) {
  await deployer.deploy(HerbRegistry);
  const instance = await HerbRegistry.deployed();

  console.log("✅ HerbRegistry deployed at:", instance.address);

  // Run export script after deploy
  const exportScript = require("../blockchain/scripts/export-contracts.js");
  await new Promise((resolve, reject) => {
    exportScript((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
