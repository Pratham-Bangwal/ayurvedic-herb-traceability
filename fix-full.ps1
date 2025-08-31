# fix-full.ps1
# Full auto-fix for Ayurvedic Herb Traceability repo on Windows (PowerShell)
# - Backs up existing files it will overwrite with .bak.TIMESTAMP
# - Writes fixed docker-compose, backend, frontend, blockchain, mobile scaffold files
# Usage (PowerShell): Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\fix-full.ps1

function Backup-IfExists {
    param([string]$path)
    if (Test-Path $path) {
        $ts = (Get-Date).ToString("yyyyMMddHHmmss")
        $bak = "$path.bak.$ts"
        Write-Host "Backing up $path -> $bak"
        Copy-Item -Force -Recurse $path $bak
    }
}

function Write-File {
    param([string]$path, [string]$content)
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $content | Out-File -FilePath $path -Encoding utf8 -Force
    Write-Host "Wrote: $path"
}

Write-Host "== Ayurvedic Herb Traceability - Full Auto-Fix =="

# --- Root files ---
Backup-IfExists -path ".\docker-compose.yml"
$dockerCompose = @'
version: "3.9"
services:
  mongo:
    image: mongo:6
    container_name: mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.runCommand({ ping: 1 }).ok"]
      interval: 10s
      timeout: 5s
      retries: 5

  blockchain:
    build:
      context: ./blockchain
    container_name: hardhat-node
    command: ["npx", "hardhat", "node", "--hostname", "0.0.0.0", "--port", "8545"]
    ports:
      - "8545:8545"
    volumes:
      - ./blockchain:/usr/src/app
    healthcheck:
      test: ["CMD-SHELL", "curl -sS http://localhost:8545 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend
    env_file:
      - ./backend/.env
    environment:
      - MONGODB_URI=${MONGODB_URI:-mongodb://mongo:27017/herbs}
      - PORT=4000
    depends_on:
      mongo:
        condition: service_healthy
      blockchain:
        condition: service_healthy
    ports:
      - "4000:4000"
    volumes:
      - ./backend:/usr/src/app
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:4000/healthz || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 12

  web:
    build:
      context: ./frontend-web
      dockerfile: Dockerfile
    container_name: frontend
    environment:
      - VITE_API_URL=http://backend:4000
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ./frontend-web:/usr/src/app

volumes:
  mongo_data:
'@
Write-File -path ".\docker-compose.yml" -content $dockerCompose

Backup-IfExists -path ".\.gitignore"
$gitignore = @'
node_modules/
.env
/dist
/build
uploads/
.DS_Store
.vscode/
'@
Write-File -path ".\.gitignore" -content $gitignore

Backup-IfExists -path ".\package.json"
$rootPkg = @'
{
  "name": "ayurvedic-herb-traceability",
  "private": true,
  "version": "0.1.0",
  "workspaces": ["backend", "frontend-web", "mobile-app", "blockchain"],
  "scripts": {
    "start:all": "docker-compose up --build",
    "start:backend": "npm --workspace backend run dev",
    "start:web": "npm --workspace frontend-web run dev",
    "start:blockchain": "npm --workspace blockchain run node",
    "lint": "echo lint placeholder"
  }
}
'@
Write-File -path ".\package.json" -content $rootPkg

# --- blockchain ---
Backup-IfExists -path ".\blockchain"
# package.json
$blockchainPkg = @'
{
  "name": "blockchain",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "node": "npx hardhat node",
    "compile": "npx hardhat compile",
    "test": "npx hardhat test",
    "deploy": "node scripts/deploy.js"
  },
  "devDependencies": {
    "hardhat": "^2.17.0",
    "@nomiclabs/hardhat-ethers": "^2.2.2",
    "ethers": "^6.9.0"
  }
}
'@
Write-File -path ".\blockchain\package.json" -content $blockchainPkg

$hardhat = @'
require("@nomiclabs/hardhat-ethers");
module.exports = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      chainId: 1337
    }
  }
};
'@
Write-File -path ".\blockchain\hardhat.config.js" -content $hardhat

$herbSol = @'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title HerbRegistry - simple on-chain registry for herb batches
contract HerbRegistry {
    struct Event {
        uint256 timestamp;
        string actor;
        string data; // small string/JSON for demo
    }

    struct Batch {
        string batchId;
        address owner;
        string metadataURI; // optional IPFS or off-chain pointer
        Event[] events;
    }

    mapping(string => Batch) private batches;
    string[] public batchIds;

    event BatchCreated(string batchId, address owner, string metadataURI);
    event BatchUpdated(string batchId, string actor, string data);

    function createBatch(string calldata batchId, address owner, string calldata metadataURI) external {
        require(bytes(batchId).length > 0, "batchId required");
        require(batches[batchId].owner == address(0), "batch exists");
        Batch storage b = batches[batchId];
        b.batchId = batchId;
        b.owner = owner;
        b.metadataURI = metadataURI;
        batchIds.push(batchId);
        emit BatchCreated(batchId, owner, metadataURI);
    }

    function addEvent(string calldata batchId, string calldata actor, string calldata data) external {
        require(batches[batchId].owner != address(0), "batch missing");
        Batch storage b = batches[batchId];
        b.events.push(Event(block.timestamp, actor, data));
        emit BatchUpdated(batchId, actor, data);
    }

    function getBatchOwner(string calldata batchId) external view returns (address) {
        return batches[batchId].owner;
    }

    function getBatchMetadata(string calldata batchId) external view returns (string memory) {
        return batches[batchId].metadataURI;
    }
}
'@
Write-File -path ".\blockchain\contracts\HerbRegistry.sol" -content $herbSol

$deployJs = @'
const hre = require("hardhat");
async function main() {
  const HerbRegistry = await hre.ethers.getContractFactory("HerbRegistry");
  const herb = await HerbRegistry.deploy();
  await herb.deployed();
  console.log("HerbRegistry deployed to:", herb.address);
}
main().catch((err) => { console.error(err); process.exit(1); });
'@
Write-File -path ".\blockchain\scripts\deploy.js" -content $deployJs

# --- backend ---
Backup-IfExists -path ".\backend"
$backendPkg = @'
{
  "name": "backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "dotenv": "^16.0.0",
    "ethers": "^6.9.0",
    "express": "^4.18.2",
    "mongoose": "^7.3.1",
    "multer": "^1.4.5-lts.1",
    "qrcode": "^1.5.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
'@
Write-File -path ".\backend\package.json" -content $backendPkg

$backendDocker = @'
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["node", "src/index.js"]
'@
Write-File -path ".\backend\Dockerfile" -content $backendDocker

$backendEnv = @'
PORT=4000
MONGODB_URI=mongodb://mongo:27017/herbs
BLOCKCHAIN_RPC=http://blockchain:8545
HERB_REGISTRY_ADDRESS=
UPLOAD_DIR=./uploads
'@
Write-File -path ".\backend\.env" -content $backendEnv

$indexJs = @'
/**
 * backend/src/index.js
 * Purpose: Express entrypoint - sets routes and middleware.
 */
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const herbsRouter = require("./routes/herbs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (req, res) => res.status(200).send("ok"));

app.use("/api/herbs", herbsRouter);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/herbs";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`Backend listening on ${port}`));
  })
  .catch((err) => { console.error("Mongo connection error:", err); process.exit(1); });
'@
Write-File -path ".\backend\src\index.js" -content $indexJs

$herbModel = @'
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GeoSchema = new Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], default: [0, 0] }
});

const EventSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  actor: String,
  data: String
}, { _id: false });

const HerbSchema = new Schema({
  batchId: { type: String, required: true, unique: true },
  farmerName: String,
  geo: GeoSchema,
  metadataURI: String,
  imagePath: String,
  processingEvents: [EventSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = require("mongoose").model("Herb", HerbSchema);
'@
Write-File -path ".\backend\src\models\herbModel.js" -content $herbModel

$blockchainService = @'
const { ethers } = require("ethers");

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
    provider = new ethers.providers.JsonRpcProvider(rpc);
    if (address) {
      const signer = provider.getSigner(0);
      contract = new ethers.Contract(address, ABI, signer);
    } else {
      contract = null;
    }
  } catch (err) {
    console.error("Blockchain init error:", err.message);
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
'@
Write-File -path ".\backend\src\services\blockchainService.js" -content $blockchainService

$herbsRoute = @'
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Herb = require("../models/herbModel");
const bc = require("../services/blockchainService");
const qrcode = require("qrcode");

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

bc.init();

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { batchId, farmerName, lat, lng, metadataURI } = req.body;
    if (!batchId) return res.status(400).json({ error: "batchId required" });

    const herb = new Herb({
      batchId,
      farmerName,
      geo: { type: "Point", coordinates: [parseFloat(lng || 0), parseFloat(lat || 0)] },
      metadataURI: metadataURI || "",
      imagePath: req.file ? path.relative(process.cwd(), req.file.path) : ""
    });
    await herb.save();

    await bc.createBatchOnChain(batchId, "0x0000000000000000000000000000000000000000", metadataURI || "");

    const traceUrl = `${req.protocol}://${req.get("host")}/api/herbs/trace/${encodeURIComponent(batchId)}`;
    const qrDataURL = await qrcode.toDataURL(traceUrl);

    return res.json({ herb, qr: qrDataURL, traceUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.post("/update", express.json(), async (req, res) => {
  try {
    const { batchId, actor, data } = req.body;
    if (!batchId) return res.status(400).json({ error: "batchId required" });
    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: "batch not found" });

    herb.processingEvents.push({ actor, data });
    await herb.save();

    await bc.addEventOnChain(batchId, actor, data);
    return res.json({ herb });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/trace/:batchId", async (req, res) => {
  try {
    const batchId = req.params.batchId;
    const herb = await Herb.findOne({ batchId }).lean();
    if (!herb) return res.status(404).json({ error: "batch not found" });

    return res.json({
      herb,
      chain: { mock: true, notes: "Chain integration works when HERB_REGISTRY_ADDRESS set" }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
'@
Write-File -path ".\backend\src\routes\herbs.js" -content $herbsRoute

# Ensure uploads dir
if (-not (Test-Path ".\backend\uploads")) { New-Item -ItemType Directory -Path ".\backend\uploads" | Out-Null }

# --- frontend-web ---
Backup-IfExists -path ".\frontend-web"
$frontendPkg = @'
{
  "name": "frontend-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.6.0",
    "@vitejs/plugin-react": "^4.1.0"
  }
}
'@
Write-File -path ".\frontend-web\package.json" -content $frontendPkg

$frontendDocker = @'
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
'@
Write-File -path ".\frontend-web\Dockerfile" -content $frontendDocker

$indexHtml = @'
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Herb Trace Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@
Write-File -path ".\frontend-web\index.html" -content $indexHtml

$mainJsx = @'
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(<App />);
'@
Write-File -path ".\frontend-web\src\main.jsx" -content $mainJsx

$appJsx = @'
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ batchId: "", farmerName: "", lat: "", lng: "" });

  async function create(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("batchId", form.batchId);
    formData.append("farmerName", form.farmerName);
    formData.append("lat", form.lat);
    formData.append("lng", form.lng);
    try {
      const res = await axios.post(`${API}/api/herbs/create`, formData, { headers: { "Content-Type": "multipart/form-data" }});
      setMessage("Created: " + res.data.traceUrl);
    } catch (err) {
      setMessage("Error: " + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Manufacturer Dashboard - Demo</h2>
      <form onSubmit={create}>
        <input placeholder="Batch ID" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })} required />
        <input placeholder="Farmer name" value={form.farmerName} onChange={(e) => setForm({ ...form, farmerName: e.target.value })} />
        <input placeholder="lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
        <input placeholder="lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
        <button type="submit">Create</button>
      </form>
      <div style={{ marginTop: 20 }}>{message}</div>
    </div>
  );
}
'@
Write-File -path ".\frontend-web\src\App.jsx" -content $appJsx

# --- mobile-app minimal stub ---
Backup-IfExists -path ".\mobile-app"
$mobilePkg = @'
{
  "name": "mobile-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "expo start"
  },
  "dependencies": {
    "expo": "^48.0.0",
    "react": "18.2.0",
    "react-native": "0.72.0"
  }
}
'@
Write-File -path ".\mobile-app\package.json" -content $mobilePkg

$mobileApp = @'
import React from "react";
import { View, Text } from "react-native";

export default function App() {
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <Text>Mobile app demo: scan QR from backend response</Text>
    </View>
  );
}
'@
Write-File -path ".\mobile-app\App.js" -content $mobileApp

# final message
Write-Host "== Finish: Files written and backed up where applicable =="
Write-Host "Next steps:"
Write-Host "  1) In PowerShell run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass"
Write-Host "  2) Then run: docker-compose up --build"
Write-Host "  3) Backend: http://localhost:4000  Frontend: http://localhost:3000"
Write-Host "If you previously committed node_modules, delete them now (recommended):"
Write-Host "  git rm -r --cached node_modules"
Write-Host "  Remove node_modules folders manually if needed."
