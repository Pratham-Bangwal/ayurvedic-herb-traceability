// Blockchain interaction service with graceful fallback.
const { ethers } = require('ethers');

const REG_ABI = [
  'function registerBatch(string batchId, bytes32 metadataHash, uint256 harvestedAt) external',
  'function transferOwnership(string batchId, address newOwner) external',
  'function getBatch(string batchId) external view returns (tuple(string batchId, bytes32 metadataHash, address farmer, uint256 harvestedAt, address currentOwner))'
];

function getContract() {
  const addr = process.env.HERB_REGISTRY_ADDRESS;
  const rpc = process.env.BLOCKCHAIN_RPC_URL;
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!addr || !rpc || !pk) return null; // fallback to placeholder
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  return new ethers.Contract(addr, REG_ABI, wallet);
}

async function recordHerbOnChain(herb) {
  try {
    const c = getContract();
    if (!c) return { txHash: '0xplaceholder', batchId: herb.batchId };
    const harvestedAt = Math.floor(new Date(herb.harvestedAt || Date.now()).getTime() / 1000);
    const metaHash = ethers.keccak256(ethers.toUtf8Bytes(herb.batchId)); // placeholder metadata hash
    const tx = await c.registerBatch(herb.batchId, metaHash, harvestedAt);
    const receipt = await tx.wait();
    return { txHash: receipt.transactionHash, batchId: herb.batchId, registryAddress: c.target }; 
  } catch (e) {
    return { error: e.message, txHash: '0xerror', batchId: herb.batchId };
  }
}

async function transferOwnership(batchId, newOwner) {
  try {
    const c = getContract();
    if (!c) return { txHash: '0xplaceholder', batchId, newOwner };
    const tx = await c.transferOwnership(batchId, newOwner);
    const receipt = await tx.wait();
    return { txHash: receipt.transactionHash, batchId, newOwner };
  } catch (e) {
    return { error: e.message, txHash: '0xerror', batchId, newOwner };
  }
}

async function getOnChainBatch(batchId) {
  try {
    const c = getContract();
    if (!c) return { batchId, currentOwner: '0xOwner', simulated: true };
    const b = await c.getBatch(batchId);
    return { batchId: b.batchId, metadataHash: b.metadataHash, farmer: b.farmer, harvestedAt: Number(b.harvestedAt) * 1000, currentOwner: b.currentOwner, registryAddress: c.target };
  } catch (e) {
    return { error: e.message, batchId };
  }
}

module.exports = { recordHerbOnChain, transferOwnership, getOnChainBatch };
