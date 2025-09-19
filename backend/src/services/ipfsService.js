// backend/src/services/ipfsService.js
const axios = require('axios');
const crypto = require('crypto');

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
    formData.append('file', new Blob([buffer]));
    
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET,
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
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET,
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
  if (isMock() || !PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    maybeWarnPinata('Pinata keys missing or mock mode – using demo CID');
    const cid =
      'demo-' + crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 32);
    return { cid };
  }

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', obj, {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    return { cid: res.data.IpfsHash };
  } catch (err) {
    logger.error(
      { err: err.response?.data || err.message },
      'Pinata JSON upload failed, using demo CID'
    );
    const cid =
      'demo-' + crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 32);
    return { cid };
  }


module.exports = { addFileBuffer, addJSON };
