const hre = require("hardhat");
async function main() {
  const HerbRegistry = await hre.ethers.getContractFactory("HerbRegistry");
  const herb = await HerbRegistry.deploy();
  await herb.deployed();
  console.log("HerbRegistry deployed to:", herb.address);
}
main().catch((err) => { console.error(err); process.exit(1); });
