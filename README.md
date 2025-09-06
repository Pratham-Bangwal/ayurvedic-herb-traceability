# 🌿 Ayurvedic Herb Traceability System

End‑to‑end (Farmer → Processor → Manufacturer → Consumer) transparency for Ayurvedic herbs using off‑chain data + planned on‑chain proofs, QR codes, geo‑tagging, and AI (stub) image validation.

> Goal: Prove authenticity, origin, and handling of herbal batches; reduce counterfeits; empower farmers; build consumer trust.

---

## 🧭 Table of Contents
- [Core Demo Modules](#-core-demo-modules)
- [Architecture](#-architecture)
- [Data Model](#-data-model)
- [Quick Start (Docker)](#-quick-start-docker)
- [Quick Start (Manual Dev)](#-quick-start-manual-dev)
- [API Endpoints](#-api-endpoints)
- [Web Dashboard Features](#-web-dashboard-features)
- [Mobile Prototype](#-mobile-prototype)
- [Blockchain Layer](#-blockchain-layer)
- [IPFS / Pinning](#-ipfs--pinning)
- [Testing](#-testing)
- [Environment Variables](#-environment-variables)
- [Tech Stack](#-tech-stack)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contribution](#-contribution)
- [License / Pitch / Support](#-license--pitch--support)

---

## ✨ Core Demo Modules
| Actor | Actions | Visible Proof |
|-------|---------|---------------|
| Farmer / Collector | Register batch, geo‑tag, upload photo | Batch stored, QR generated |
| Processor / Manufacturer | Scan QR, add processing events, transfer ownership | Extended trace chain |
| Consumer | Scan QR on product | Full trace view |
| System (AI + Chain) | Image validation stub, (planned) blockchain record | Confidence score + tx metadata (planned) |

---

## 🧱 Architecture
- **frontend-web/** – React (Vite) dashboard (create, process, transfer, map, QR, public trace page).
- **mobile-app/** – React Native prototype (Farmer + Consumer flows; QR camera pending).
- **backend/** – Express API (MongoDB persistence, QR gen, AI validation stub, IPFS/Pinning integration placeholder, blockchain service stubs).
- **blockchain/** – Solidity scaffold (deploy + ABI export scripts; full logic TBD).
- **docs/** – Architecture, API spec, demo flow.
- **docker-compose.yml** – Mongo + backend (extend to add blockchain + frontend).

Off‑chain rich data (photo, geo, events) + planned minimal on‑chain proofs + QR bridge to consumer trace UI.

---

## 🗂 Data Model (Herb Batch) (Simplified)
```json
{
  "batchId": "BT001",
  "name": "Tulsi",
  "origin": "Farm A",
  "geoLocation": { "lat": 28.61, "lng": 77.23 },
  "photoCid": "Qm...",
  "metadataCid": "Qm...",
  "processingEvents": [{ "step": "Drying", "actor": "Processor1", "timestamp": "..." }],
  "ownershipTransfers": [{ "from": "Farmer", "to": "Manufacturer", "timestamp": "..." }],
  "aiValidation": { "confidence": 0.87, "label": "Tulsi", "validatedAt": "..." },
  "blockchain": { "txHash": null, "status": "pending" },
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## 🚀 Quick Start (Docker)
```powershell
# From project root
docker compose up -d --build

# Check health
curl http://localhost:4000/healthz
```

Create a batch (JSON):
```powershell
curl -Method POST -Uri http://localhost:4000/api/herbs `
  -Body '{"name":"Tulsi","batchId":"BT001","origin":"FarmA"}' `
  -ContentType 'application/json'
```

Multipart upload (with photo + geo):
```powershell
curl.exe -F "photo=@herb.jpg" -F "name=Tulsi" -F "batchId=BT002" `
  -F "lat=28.61" -F "lng=77.23" -F "origin=FarmA" `
  http://localhost:4000/api/herbs/upload
```

Trace:
```powershell
curl http://localhost:4000/api/herbs/BT001/trace
```

QR (open in browser):
```
http://localhost:4000/api/herbs/BT001/qrcode
```

Stop:
```powershell
docker compose down
```

---

## 💻 Quick Start (Manual Dev)
```powershell
# Start Mongo (if not installed locally)
docker run -d --name mongo -p 27017:27017 mongo:6

# Backend
cd backend
npm install
$env:MONGODB_URI="mongodb://localhost:27017/herbs"
npm start

# Web (new terminal at project root)
npm install
npm run start:web
# Visit: http://localhost:5173
```

---

## 📡 API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | /healthz | Service / DB status |
| POST | /api/herbs | Create batch (JSON) |
| POST | /api/herbs/create | Create batch (legacy, deprecated) |
| POST | /api/herbs/upload | Create batch (multipart with photo + geo) |
| POST | /api/herbs/:batchId/process | Add processing event |
| POST | /api/herbs/:batchId/events | Add processing event (legacy, deprecated) |
| POST | /api/herbs/:batchId/transfer | Ownership transfer |
| GET | /api/herbs/:batchId/trace | Full JSON trace |
| GET | /api/herbs/trace/:batchId | Trace alias (same payload) |
| GET | /api/trace/:batchId | (Frontend-only route served by web app UI) |
| GET | /api/herbs/:batchId/qrcode | SVG QR code |
| POST | /api/herbs/validate/image | AI image validation (stub) |

Backend responses are wrapped: `{ "data": <payload> }`. Frontend/mobile clients unwrap automatically. Example payload after unwrapping:
```json
{
  "batchId": "BT001",
  "traceUrl": "http://localhost:5173/trace/BT001",
  "qr": "data:image/png;base64,..."
}
```

---

## 🌐 Web Dashboard Features
- Batch creation (with optional lat/lng + image).
- Batch list & selection.
- Trace view: processing timeline, ownership chain, map (static), QR.
- Add processing event (inline form).
- Ownership transfer (inline form).
- Public shareable route: `/trace/:batchId`.
- MOCK_MODE aware (header `X-Mock-Mode: true`).

---

## 📱 Mobile Prototype
| Screen | Status | Notes |
|--------|--------|-------|
| FarmerUpload | Basic form | Needs direct upload integration |
| ConsumerScan | Manual batchId input | Add camera + QR scanning next (Expo / barcode scanner) |

---

## ⛓ Blockchain Layer
Current:
- Solidity scaffold + deploy + ABI export scripts.
- Backend ethers.js service stub (no mandatory on‑chain writes yet).

Planned:
1. HerbRegistry: create → process → transfer events on chain.
2. Store txHash + blockNumber per action.
3. (Optional) Hyperledger Fabric variant for permissioned networks.

---

## 📦 IPFS / Pinning
- Placeholder hashing / optional pinning (Pinata planned).
- Environment variables (Pinata API keys) used when set.
- Warning about missing Pinata keys is throttled (≤1 every 10s) to reduce log noise.
- Gateway example:
```
https://ipfs.io/ipfs/<cid>
```

---

## 🧪 Testing
Run backend tests (auto MOCK_MODE + in‑memory fallback if Mongo down):
```powershell
cd backend
npm test
```
Behavior:
- If MongoDB is unreachable, tests transparently use the in‑memory repository (no skipping).
- `MOCK_MODE` forces deterministic blockchain/IPFS/AI behavior (QR + hashes stable).
- Legacy endpoints set HTTP headers: `Deprecation: true`, `Warning: 299`, and a `Link` header pointing to the canonical successor.
- Zod validation: create/process/transfer (hex-like 0x... owner), upload (lat -90..90, lng -180..180).
- Each response adds `X-Request-Id` (also logged) for correlation.
- Optional API key auth: set `API_KEY` env and send header `X-API-Key`; role simulation via `X-Role: farmer|processor|manufacturer|consumer` auto-tags processing events and ownership transfers.
- /metrics exposes Prometheus-style counters (requests_total, errors_total, duration sums/counts).

Force mock explicitly (optional):
```powershell
cd backend
$env:MOCK_MODE="true"
npm test
```

Sample header check (PowerShell):
```powershell
curl -I http://localhost:4000/api/herbs/create
```

---

## ⚙️ Environment Variables
`backend/.env` (example):
```
PORT=4000
MONGODB_URI=mongodb://mongo:27017/herbs
BLOCKCHAIN_RPC=
HERB_REGISTRY_ADDRESS=
UPLOAD_DIR=./uploads

# Optional IPFS / Pinning
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
```
Optional:
```
PUBLIC_BASE_URL=http://localhost:4000
IPFS_API_URL=
```

---

## 🧩 Tech Stack
| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, MongoDB, Multer, QRCode, Ethers (stub), Zod validation, Pino logging |
| Observability | Request IDs, basic metrics (/metrics), structured logs |
| Frontend | React (Vite), Fetch/Axios (depending on setup), Leaflet (map) |
| Mobile | React Native (prototype) |
| Blockchain | Solidity, Hardhat script scaffold |
| Storage | MongoDB (off‑chain), IPFS (planned real pin) |
| Tooling | Docker, GitHub Actions, ESLint, Prettier |

---

## 🩺 Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| Cannot connect /healthz | Backend container not running | `docker compose ps` then `docker logs backend` |
| Mongo connect errors | Wrong URI / timing | Ensure `MONGODB_URI` matches service name (mongo) |
| `MODULE_NOT_FOUND` in container | Dependencies missing | Rebuild with `--no-cache` |
| QR blank | Batch not found | Ensure `batchId` created first |
| AI confidence same | Stub logic | Replace with real model service |
| Map empty | Missing lat/lng | Include coordinates on upload |

---

## 🛣 Roadmap
1. Real smart contract + tx linking.
2. Real IPFS pin + CIDs for photo & JSON metadata.
3. AI classifier (TensorFlow.js or microservice).
4. Auth + roles (farmer / processor / manufacturer / consumer).
5. Mobile QR scanner (camera integration).
6. Extended Docker stack (frontend + hardhat + volumes + healthchecks).
7. Metrics + Prometheus + distributed trace (using request IDs).
8. Optional Fabric chaincode path.

---

## 🤝 Contribution
```bash
git checkout -b feat/your-feature
# implement + tests
npm run lint
git commit -m "feat: add your feature"
git push
# open PR
```

---

## 📜 License / Pitch / Support
**License:** MIT  
**Pitch:** Verifiable origin + handling of Ayurvedic herbs—trust via transparency, anti‑counterfeit, better farmer recognition.  
**Support:** Open an issue (include failing command + log snippet).

---

## ⚠️ Prototype Disclaimer
Blockchain writes, AI validation, and IPFS pinning are partially / fully stubbed. Not production‑ready; use for demonstration and iteration.