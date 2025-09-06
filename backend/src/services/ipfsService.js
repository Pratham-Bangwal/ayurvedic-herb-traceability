// backend/src/services/ipfsService.js
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data'); // ✅ use Node's form-data package
const stream = require('stream');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const { isMock } = require('./mode');
const logger = require('../utils/logger');

let __lastPinataWarn = 0;
function maybeWarnPinata(message) {
  const now = Date.now();
  if (now - __lastPinataWarn > 10_000) { // throttle every 10s
    __lastPinataWarn = now;
    logger.warn(message);
  }
}

async function addFileBuffer(buffer, fileName = 'herb.jpg') {
  if (isMock() || !PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
    maybeWarnPinata('Pinata keys missing or mock mode – using demo CID');
    const cid = 'demo-' + crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32);
    return { cid };
  }
  try {
    const formData = new FormData();

    // ✅ wrap buffer as a stream so FormData accepts it
    const readStream = new stream.PassThrough();
    readStream.end(buffer);

    formData.append('file', readStream, { filename: fileName });

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });

    return { cid: res.data.IpfsHash };
  } catch (err) {
    logger.error({ err: err.response?.data || err.message }, 'Pinata file upload failed, using demo CID');
    const cid = 'demo-' + crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32);
    return { cid };
  }
}

async function addJSON(obj) {
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
  logger.error({ err: err.response?.data || err.message }, 'Pinata JSON upload failed, using demo CID');
    const cid =
      'demo-' + crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 32);
    return { cid };
  }
}

module.exports = { addFileBuffer, addJSON };
