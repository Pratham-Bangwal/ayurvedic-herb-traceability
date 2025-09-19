// backend/src/services/ipfsService.js
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET_API_KEY;

function mockCid(data) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return `Qm${hash.slice(0, 44)}`;
}

async function addFileBuffer(buffer) {
  if (!PINATA_API_KEY) {
    return { cid: mockCid(buffer), mock: true };
  }

  try {
    const formData = new FormData();
    // In Node, append Buffer directly; provide a filename so Pinata accepts it
    formData.append('file', buffer, { filename: 'upload.bin' });

    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
    });

    return { cid: response.data.IpfsHash };
  } catch (error) {
    console.warn('IPFS upload failed, using mock:', error.message);
    return { cid: mockCid(buffer), mock: true };
  }
}

async function addJSON(data) {
  if (!PINATA_API_KEY) {
    return { cid: mockCid(data), mock: true };
  }

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
        'Content-Type': 'application/json',
      },
    });

    return { cid: response.data.IpfsHash };
  } catch (error) {
    console.warn('IPFS JSON upload failed, using mock:', error.message);
    return { cid: mockCid(data), mock: true };
  }
}

module.exports = { addFileBuffer, addJSON };
// End of module
