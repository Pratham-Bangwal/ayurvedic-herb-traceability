const { JsonRpcProvider, Wallet, Contract } = require("ethers");

// Minimal ABI subset
const ABI = [
  "function createBatch(string batchId, address owner, string metadataURI)",
  "function addEvent(string batchId, string actor, string data)",
  "event BatchCreated(string batchId, address owner, string metadataURI)",
  "event BatchUpdated(string batchId, string actor, string data)"
];

let provider, contract;

function init() {
  const rpc = process.env.BLOCKCHAIN_RPC || "http://blockchain:8545";
  const address = process.env.HERB_REGISTRY_ADDRESS || "";

  try {
    provider = new JsonRpcProvider(rpc);

    // Use a Ganache private key or .env variable
    const privateKey =
      process.env.PRIVATE_KEY ||
      "0x90f3c60e6919fb8e083a933bd2bc7d10ec863987a415e471b412907a292750e3"; // Ganache default[0]

    const wallet = new Wallet(privateKey, provider);

    if (address) {
      contract = new Contract(address, ABI, wallet);
      console.log("✅ Blockchain service connected:", address);
    } else {
      console.warn("⚠️ HERB_REGISTRY_ADDRESS not set, blockchain calls will be mocked");
      contract = null;
    }
  } catch (err) {
    console.error("Blockchain init error:", err);
    contract = null;
  }
}

async function createBatchOnChain(batchId, ownerAddr, metadataURI) {
  if (!contract) return { mock: true, batchId };
  const tx = await contract.createBatch(batchId, ownerAddr, metadataURI);
  await tx.wait();
  return tx;
}

async function addEventOnChain(batchId, actor, data) {
  if (!contract) return { mock: true, batchId, actor, data };
  const tx = await contract.addEvent(batchId, actor, data);
  await tx.wait();
  return tx;
}

module.exports = { init, createBatchOnChain, addEventOnChain };
