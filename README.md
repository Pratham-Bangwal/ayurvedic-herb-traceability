# 🌿 Ayurvedic Herb Traceability System

Blockchain + AI assisted supply chain transparency for Ayurvedic herbs (Farm → Processor → Manufacturer → Consumer).

> Goal: Prove authenticity, origin, and handling of herbal batches; fight counterfeits; empower farmers; build consumer trust.

---

## ✨ Core Demo Modules
| Actor | Actions | Visible Proof |
|-------|---------|---------------|
| Farmer / Collector | Register batch, geo‑tag, upload photo | Batch created, QR generated |
| Processor / Manufacturer | Scan QR, add processing events, transfer ownership | Updated trace chain |
| Consumer | Scan QR on product | Full immutable trace view |
| System (AI + Chain) | Image validation stub, blockchain record stubs | Confidence score + tx metadata (planned) |

---

## 🧱 Architecture Overview
- **frontend-web/**: React (Vite) dashboard (batch creation, events, ownership transfer, map, QR, trace viewer, public trace page).
- **mobile-app/**: React Native prototype (farmer upload & consumer scan screens – QR camera pending).
- **backend/**: Node.js + Express API, MongoDB persistence, QR generation, AI validation stub, IPFS hashing stub, blockchain service (ethers fallback).
- **blockchain/**: Solidity contract scaffold + deploy & ABI export scripts (Hardhat style; real logic TBD).
- **docs/**: Architecture, API spec, demo flow.
- **docker-compose.yml**: Mongo + backend (extendable to add blockchain node & frontend).

Off‑chain rich data (photo, geo, events) + on‑chain minimal proofs (planned) + QR bridge to consumer.

---

## 🗂 Data Model (Herb Batch)
```
batchId, name, origin
geoLocation { lat, lng }
photoCid, metadataCid
processingEvents[] (step, description, timestamp)
ownershipTransfers[] (from, to, timestamp)
aiValidation { label, confidence, validatedAt }
blockchain { txHash?, status?, blockNumber? }
timestamps
```

---

## 🚀 Quick Start (Local Docker – Recommended)
```powershell
# In project root
docker compose up -d --build
# Check API health
curl http://localhost:4000/healthz
```

Create a sample batch:
```powershell
curl -Method POST -Uri http://localhost:4000/api/herbs `
  -Body '{"name":"Tulsi","batchId":"B1","origin":"FarmA"}' `
  -ContentType 'application/json'
```

View trace:
```powershell
curl http://localhost:4000/api/herbs/B1/trace
```

QR (browser):
```
http://localhost:4000/api/herbs/B1/qrcode
```

Stop:
```powershell
docker compose down
```

---

## 🔧 Manual Dev (Without Docker)
```powershell
# Start Mongo (if not installed)
docker run -d --name mongo -p 27017:27017 mongo:6

# Backend
cd backend
npm install
$env:MONGODB_URI="mongodb://localhost:27017/herbs"
npm start

# Web (in another terminal, project root)
npm install
npm run start:web
# Open http://localhost:5173
```

---

## 📡 Key API Endpoints (Current)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /healthz | Service + DB status |
| POST | /api/herbs | Create batch (JSON) |
| POST | /api/herbs/upload | Create batch (multipart: photo, geo) |
| POST | /api/herbs/:batchId/process | Add processing event |
| POST | /api/herbs/:batchId/transfer | Ownership transfer |
| GET | /api/herbs/:batchId/trace | Full trace |
| GET | /api/trace/:batchId | Public trace alias |
| GET | /api/herbs/:batchId/qrcode | SVG QR code |
| POST | /api/herbs/validate/image | AI image validation (stub) |

---

## 🖥 Web Dashboard Features
- Create batch (with optional lat/lng + image).
- List & select batches; display:
  - Processing timeline
  - Ownership chain
  - Map (Leaflet) of origin
  - QR code (server‑generated)
- Actions: add processing event, transfer ownership.
- Public trace page (shareable link with batchId).

---

## 📱 Mobile Prototype
- FarmerUpload: Form structure (needs full integration).
- ConsumerScan: Enter/scan batchId (camera/QR scanning to add).
- Next: Integrate Expo + barcode scanner, offline queue, improved UI.

---

## ⛓ Blockchain Layer (Planned Enhancements)
Current: Basic Solidity contract & deploy script scaffold; backend has ethers integration stubs (no enforced on‑chain persistence yet).
Planned:
1. Finalize HerbRegistry (create → process → transfer).
2. Persist txHash + blockNumber on batch actions.
3. Optional migration to Hyperledger Fabric (private permissioned alternative).

---

## 🧪 Testing
Backend tests (Jest/Supertest + mongodb-memory-server) cover health, basic CRUD, processing, transfer, validation (partial).
Run (from root or backend space):
```powershell
npm --workspace backend test
```

---

## 🧰 Utility Scripts
| Script | Purpose |
|--------|---------|
| run:demo | Automated local demo flow (may require adjustments) |
| stack:up | PowerShell orchestration (older version) |
| backend seed | Sample data |
| blockchain deploy | Simulated deploy + address file |
| blockchain build:abi | Export contract ABI for backend |

---

## 🔐 Security / Gaps
Missing (by design for prototype):
- Auth / RBAC (farmer vs processor vs consumer).
- Input schema validation (Joi/Zod).
- Production-grade error handling.
- Real AI model & real IPFS pinning.
Add these before production.

---

## 🧭 Roadmap (Suggested)
1. Harden Docker (add frontend + hardhat node, volumes, healthchecks).
2. Real contract interactions (record events + store txHash).
3. Actual IPFS pin (Pinata / web3.storage).
4. AI classifier MVP (TensorFlow.js or Python microservice).
5. AuthN/Z (JWT; roles).
6. Mobile camera + QR scanning (Expo).
7. Validation (Zod) + better test coverage.
8. Metrics & structured logging (pino + Prometheus).
9. Fabric feasibility (if required for enterprise compliance).

---

## ⚙️ Environment Variables (backend/.env)
```
MONGODB_URI=mongodb://mongo:27017/herbs
PORT=4000
BLOCKCHAIN_RPC_URL=<optional>
HERB_REGISTRY_ADDRESS=<after deploy>
IPFS_API_URL=<ipfs endpoint optional>
PUBLIC_BASE_URL=http://localhost:4000
```

---

## 🧩 Tech Stack
- Backend: Node.js, Express, MongoDB, Multer, Ethers.js (stub), QRCode, IPFS stub.
- Frontend: React (Vite), Leaflet.
- Mobile: React Native scaffold.
- Blockchain: Solidity + (planned Hardhat).
- DevOps: Docker, GitHub Actions (lint/test/build), ESLint + Prettier.

---

## 🩺 Troubleshooting
| Issue | Fix |
|-------|-----|
| Backend not reachable | Check `docker compose ps`; view `docker logs backend` |
| Mongo connect errors | Verify MONGODB_URI, container name |
| Module not found in container | Rebuild with `--no-cache`; ensure package.json copied first |
| QR blank | Confirm batchId exists; trace endpoint returns data |
| AI validation always low | Stub – replace with real model |

---

## 🤝 Contribution
1. Fork + branch (feat/xyz).
2. Add/adjust tests.
3. PR with concise description.
4. Ensure lint passes (`npm run lint`).

---

## 📜 License
MIT – free for use and modification.

---

## 🗣 Pitch (Short)
Authenticity engine for Ayurvedic herbs: verifiable origin, tamper‑evident chain, AI-assisted validation, consumer trust via instant QR trace.

---

## 🙋 Support
Open an issue or describe the failing command + logs snippet.