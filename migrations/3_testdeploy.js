const TestDeploy = artifacts.require("TestDeploy");

module.exports = async function (deployer) {
  await deployer.deploy(TestDeploy);
  const instance = await TestDeploy.deployed();
  console.log("✅ TestDeploy deployed at:", instance.address);
};
