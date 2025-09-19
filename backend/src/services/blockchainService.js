const { ethers } = require('ethers');
// No static filesystem access needed; ABI is loaded within init()

let provider, contract;

function init() {
  const rpc = process.env.BLOCKCHAIN_RPC || 'http://127.0.0.1:8545';
  const address = process.env.HERB_REGISTRY_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;

  if (!address || !privateKey) {
    console.warn('⚠️ Missing HERB_REGISTRY_ADDRESS or PRIVATE_KEY in .env');
    return;
  }

  try {
    provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Load ABI safely
    let contractAbi;
    try {
      const artifact = require('../../abi/HerbRegistry.json');
      contractAbi = artifact.abi || artifact;
    } catch (abiError) {
      console.warn('⚠️ ABI file not found, using minimal ABI');
      contractAbi = [
        'function createBatch(string batchId, string metadataURI)',
        'function addEvent(string batchId, string actor, string data)',
        'function transferOwnership(string batchId, address newOwner)',
      ];
    }

    contract = new ethers.Contract(address, contractAbi, wallet);
    console.log('✅ Blockchain service connected:', address);
  } catch (error) {
    console.warn('⚠️ Blockchain connection failed:', error.message);
    contract = null;
  }
}

async function createBatch(batchId, owner, metadataURI) {
  if (!contract) {
    console.warn('Contract not initialized, using mock response');
    return { txHash: '0x' + Date.now().toString(16), mock: true };
  }
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
