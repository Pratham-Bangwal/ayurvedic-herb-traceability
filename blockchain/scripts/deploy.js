const hre = require("hardhat");

async function main() {
  const HerbRegistry = await hre.ethers.getContractFactory("HerbRegistry");
  const herbRegistry = await HerbRegistry.deploy();

  // ethers v6 uses waitForDeployment
  await herbRegistry.waitForDeployment();

  console.log("HerbRegistry deployed to:", await herbRegistry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
