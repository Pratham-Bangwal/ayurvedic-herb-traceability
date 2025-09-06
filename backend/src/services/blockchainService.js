const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load full ABI from compiled contract
const abiPath = path.join(__dirname, '../../abi/HerbRegistry.json');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8')).abi;

let provider, contract;

function init() {
  const rpc = process.env.BLOCKCHAIN_RPC || 'http://127.0.0.1:8545';
  const address = process.env.HERB_REGISTRY_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;

  if (!address || !privateKey) {
    console.warn('⚠️ Missing HERB_REGISTRY_ADDRESS or PRIVATE_KEY in .env');
    return;
  }

  provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);
  contract = new ethers.Contract(address, abi, wallet);

  console.log('✅ Blockchain service connected:', address);
}

async function createBatch(batchId, owner, metadataURI) {
  if (!contract) throw new Error('Contract not initialized');
  const tx = await contract.createBatch(batchId, metadataURI);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

async function addEvent(batchId, actor, data) {
  if (!contract) throw new Error('Contract not initialized');
  const tx = await contract.addEvent(batchId, actor, data);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

async function transferOwnership(batchId, newOwner) {
  if (!contract) throw new Error('Contract not initialized');
  const tx = await contract.transferOwnership(batchId, newOwner);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

async function getBatchOwner(batchId) {
  if (!contract) throw new Error('Contract not initialized');
  return await contract.getBatchOwner(batchId);
}

async function getBatchMetadata(batchId) {
  if (!contract) throw new Error('Contract not initialized');
  return await contract.getBatchMetadata(batchId);
}

async function getBatchEvents(batchId) {
  if (!contract) throw new Error('Contract not initialized');
  return await contract.getBatchEvents(batchId);
}

module.exports = {
  init,
  createBatch,
  addEvent,
  transferOwnership,
  getBatchOwner,
  getBatchMetadata,
  getBatchEvents,
};
