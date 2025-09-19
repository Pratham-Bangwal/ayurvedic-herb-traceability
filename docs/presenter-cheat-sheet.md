# Presenter Cheat Sheet — Ayurvedic Herb Traceability

Use this 1-pager during the presentation. It has the pitch, demo script, FAQs, fallbacks, and key endpoints.

## One‑liner
Blockchain-backed traceability for Ayurvedic herb batches, from farm to consumer, with QR verification and secure admin controls.

## Why it matters
- Stops counterfeits; builds consumer trust
- Verifiable provenance for export compliance (AYUSH/ISO 22005)
- Fair recognition for farmers; transparent supply chain data

## High-level architecture
- Frontend: React + Vite (5173) — batch creation, trace view, admin dashboard
- Backend: Node.js/Express (4000) — REST API, MongoDB, QR generator, JWT admin auth
- Blockchain: Solidity HerbRegistry (Hardhat/Ganache) — mock by default, switchable to real RPC
- Storage: MongoDB for off-chain data, IPFS mocked (Pinata-ready via env)
- Mobile: React Native prototype (scan/trace demo path)

## URLs & creds
- Web: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/healthz
- Admin login: username=admin, password=admin123 (JWT)

## Demo flow (5–7 minutes)
1) Create a batch (1–2 min)
- Fill: Batch ID, Herb Name, Farmer, Location, optional photo, lat/lng
- Submit — show success with QR and traceUrl

2) View trace & QR (1 min)
- Click trace link or open /trace/:batchId
- Show timeline, map placeholder, metadata

3) Add processing event (1 min)
- In trace view, add event: “Drying at 40°C, 4h” → refresh shows event

4) Transfer ownership (30 s)
- Transfer to “Processor Ltd.” → show updated chain of custody

5) Admin analytics (1–2 min)
- Show Admin → login (admin/admin123)
- Reveal Analytics + Browse; point out totals, organic %, recent batches
- Optional: Wipe All Data (mock-only) to show reset capability

Tip: Keep one pre-created batch ready as a fallback.

## Key endpoints (happy path)
- POST /api/auth/login → { token }
- POST /api/herbs → create batch (JSON)
- POST /api/herbs/upload → create with file + geo
- GET /api/herbs/:batchId/trace → full trace
- GET /api/herbs/:batchId/qrcode → SVG QR
- POST /api/herbs/:batchId/process → add event
- POST /api/herbs/:batchId/transfer → ownership
- GET /api/herbs → list (admin only)
- POST /api/herbs/admin/wipe → admin only, MOCK_MODE true

## Data model highlights
- Herb: batchId, name/herbName, farmerName, farmLocation, geo { Point [lng,lat] }, quantity, unit, organicCertified, notes, photoIpfsCid, processingEvents[], ownershipTransfers[], createdAt

## Security snapshot
- JWT-based admin role guard: authRequired + requireRole('admin')
- CORS limited to configured origins; basic rate limiting
- Request ID + metrics; validation with Zod; Multer upload limits

## Blockchain strategy
- Demo: MOCK_MODE=true uses in-memory blockchain adapter (pseudo tx/hash)
- Real mode: ethers → HerbRegistry on configured RPC with PRIVATE_KEY
- Toggle via env: MOCK_MODE, BLOCKCHAIN_RPC, HERB_REGISTRY_ADDRESS, PRIVATE_KEY

## Likely questions (answers)
- Why blockchain? Immutable, organization‑agnostic provenance; anti-counterfeit.
- On‑chain vs off‑chain? Minimal anchors/events on‑chain; rich data off‑chain for cost/privacy.
- IPFS? Mocked in demo; Pinata keys enable real pinning.
- Privacy/GDPR? No personal data on-chain; off-chain data minimization and access control.
- Scaling? Off-chain reads; batch writes; can move to L2/permissioned chain.
- Security? JWT for admin endpoints; CORS/ratelimits; future: signed QR payloads.
- Offline usage? Roadmap: offline capture + later sync (mobile).

## Risks & mitigations
- Infra down → mock fallback; health checks, seed data
- Auth misconfig → fixed envs in compose; admin-only guarded routes
- Data quality → Zod validation; lat/lng bounds; file size limits

## Troubleshooting quick checks
- Backend up? GET /healthz = ok
- Admin login fails? Ensure JWT_SECRET present; check docker compose envs
- CORS errors? Confirm Frontend origin matches CORS_ORIGINS
- Empty list? GET /api/herbs needs admin JWT; create batch first

## Pre-demo checklist
- docker compose up -d
- Verify http://localhost:4000/healthz returns ok
- Open http://localhost:5173 and perform a quick batch create
- Keep one known batchId handy (fallback)
- Have admin creds ready: admin/admin123

---

Prepared for: Live demo + Q&A
