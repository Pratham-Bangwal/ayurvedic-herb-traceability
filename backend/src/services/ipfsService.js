// Simple placeholder IPFS service; later replace with ipfs-http-client.
const crypto = require('crypto');
const fs = require('fs');
let realClient;
if (process.env.IPFS_API_URL) {
  try {
    const { create } = require('ipfs-http-client');
    realClient = create({ url: process.env.IPFS_API_URL });
  } catch {}
}

async function addFile(filePath) {
  const data = fs.readFileSync(filePath);
  if (realClient) {
    const added = await realClient.add(data);
    return { cid: added.cid.toString() };
  }
  const cid = 'demo-' + crypto.createHash('sha256').update(data).digest('hex').slice(0, 32);
  return { cid };
}

async function addJSON(obj) {
  const json = JSON.stringify(obj);
  if (realClient) {
    const added = await realClient.add(json);
    return { cid: added.cid.toString() };
  }
  const cid = 'demo-' + crypto.createHash('sha256').update(json).digest('hex').slice(0, 32);
  return { cid };
}

module.exports = { addFile, addJSON };