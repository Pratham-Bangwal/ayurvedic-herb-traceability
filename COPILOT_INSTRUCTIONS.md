# Copilot Instructions — Ayurvedic Herb Blockchain Traceability System

> Usage Notes: This file instructs GitHub Copilot / AI assistants how to scaffold and extend the repository. Keep synchronized with architectural decisions. It is documentation only, not executed.

## Table of Contents
1. Mission
2. Tech Stack (Status)
3. Required Modules
4. Output Rules
5. Guidance for Copilot
6. Implementation Order
7. Mock & Testing Strategy
8. File Header Template
9. Environment Variables (Draft + Reference)
10. Security (Prototype Scope)
11. TODO Markers Legend
12. Acceptance Criteria (Demo-Ready)
13. Extension Guidance
14. Route Inventory (Canonical vs Legacy)
15. Mock Mode Specification
16. Testing Matrix
17. Deprecation Policy
18. Decision Log (Recent)
19. Quick Commands (Dev)
20. AI Assistant Reference (Live)
21. Editing Guidance / Maintenance

## Mission
Deliver a **demo-ready prototype** (not production) for Ayurvedic herb traceability.

Show the end-to-end flow:
- **Farmer:** Upload herb photo + GPS → Blockchain record + QR code.
- **Manufacturer:** Scan QR → Add processing/shipment → Update blockchain.
- **Consumer:** Scan QR → View entire supply chain history.

## Tech Stack (strict)
- **Blockchain:** Hyperledger Fabric (preferred) or Ethereum testnet.
   - STATUS: Currently using Ethereum/Hardhat (Solidity 0.8.20). Fabric not yet implemented (all Fabric references remain TODO:FABRIC).
- **Backend:** Node.js + Express (REST APIs for blockchain I/O, QR, auth).
   - STATUS: Implemented. Includes compatibility (legacy + canonical) herb routes.
- **Database:** MongoDB (off-chain data).
   - STATUS: Required at runtime for integration tests; test harness skips if not available.
- **Storage:** IPFS (herb images/docs).
   - STATUS: Implemented with Pinata attempt + deterministic mock fallback (hash-based) when PINATA creds absent.
- **Frontend (Web):** React.js (Manufacturer/Admin dashboard).
   - STATUS: Implemented with QR scan, batch creation, trace view.
- **Mobile:** React Native (Farmer + Consumer apps).
   - STATUS: Basic scan + upload flows stubbed; ownership transfer UI pending.
- **Maps:** Google Maps API (geo-tagging).
   - STATUS: Not yet integrated; geo fields accepted/stored.
- **QR Codes:** Open-source QR libraries.
   - STATUS: Implemented via `qrcode` package generating Data URLs.
- **Optional Add-On:** TensorFlow.js CNN for herb image validation (bonus).
   - STATUS: Placeholder AI validation service returns pseudo confidence.

## Required Modules
1. **Farmer App (React Native)**
   - Register/Login.
   - Upload herb + GPS + batch info.
   - Auto-generate + display QR.

2. **Blockchain Transactions**
   - Create batch (Farmer).
   - Update batch (Manufacturer).
   - Immutable record history.

3. **Manufacturer Dashboard (React.js)**
   - Scan QR → fetch record.
   - Add processing/shipment → push to blockchain.

4. **Consumer App (React Native)**
   - Scan QR → show complete history.
   - Display: farmer, geo-tag, process, transport.

## Output Rules
- Repo scaffold must have 4 top-level folders:
  - `/backend` → Node.js + Express APIs, blockchain connectors.
  - `/frontend-web` → React.js dashboard.
  - `/mobile-app` → React Native apps.
  - `/blockchain` → Hyperledger/Ethereum setup scripts.
- Each folder must include a `README.md` with setup + run instructions.
- Every file: comment header with **purpose + usage**.
- Include **mock data + test scripts** so demo runs without full blockchain deployment.
- Prioritize **clarity, modularity, and runnable examples**.

## Guidance for Copilot
- Scaffold each module in minimal, functional form.
- Always create **API stubs first** (`createBatch`, `updateBatch`, `getBatchHistory`).
- Use **sample/mock blockchain connectors** if Fabric/Ethereum not yet configured.
- Prefer **concise modular files** over single monoliths.
- Add TODOs where manual blockchain setup is required.
- Generate **QR workflow** end-to-end before styling UI.

## Implementation Order (Recommended)
1. Backend folder + API route stubs + mock blockchain adapter + in-memory/Mongo mock.
2. QR generation & retrieval endpoints.
3. React Native farmer upload flow (mock API integration).
4. React web dashboard: QR scan (use browser camera lib) + update batch.
5. Consumer scan & timeline view.
6. IPFS integration (mock fallback if not configured) + file upload service.
7. Replace mock blockchain adapter with real Fabric/Ethereum scripts under `/blockchain`.
8. Optional TensorFlow.js model stub (simple placeholder classification call).

## Mock & Testing Strategy
- Provide a `MOCK_MODE` env flag to bypass real blockchain/IPFS.
- Supply sample JSON fixture: `sample-batches.json` with 2–3 batches.
- Add minimal Jest tests (or similar) for API stubs to ensure responses conform to contract.
- Include a script to seed mock data into Mongo (or in-memory if Mongo absent).

STATUS UPDATE:
- Current tests: Jest + Supertest integration tests (skipped automatically if Mongo not reachable) plus new pure unit tests for utility functions (`buildTraceLinks`, response helpers).
- `mongodb-memory-server` removed due to Windows postinstall failures; revisit if cross-platform reliability improves.
- Need to add: sample fixture + seeding script (not yet present), explicit `MOCK_MODE` branching (partial implicit mocks exist: IPFS & AI validation).
- Recommended next: Introduce service abstraction for herb persistence to allow full controller unit tests without Mongo.

## File Header Template (Apply To Every Source File)
```
// Purpose: <short purpose>
// Usage: <how this file/module is used or imported>
// Notes: <mock, TODOs, integration points>
```

## Key Environment Variables (Draft)
- `PORT` (backend)
- `MONGO_URI` (optional if mock)
- `IPFS_GATEWAY_URL`
- `BLOCKCHAIN_MODE` (mock|fabric|ethereum)
- `FABRIC_CONNECTION_PROFILE`
- `ETH_RPC_URL`
- `GOOGLE_MAPS_API_KEY`
- `JWT_SECRET`
- `MOCK_MODE` (true/false)

### Environment Variable Reference Table
| Variable | Purpose | Default / Behavior | Required for Demo | Notes |
|----------|---------|--------------------|-------------------|-------|
| PORT | Backend HTTP port | 4000 (if unspecified) | No | Exposed in docker compose |
| MONGO_URI | Mongo connection string | mongodb://localhost:27017/herbs | Yes (integration) | Tests skip if unreachable |
| BLOCKCHAIN_MODE | Select blockchain adapter | mock (implied) | No | Explicit value not yet enforced |
| ETH_RPC_URL | Ethereum RPC endpoint | Hardhat local (if running) | No (unless real chain) | Needed for real on-chain execution |
| FABRIC_CONNECTION_PROFILE | Path to Fabric profile | – | No | FUTURE when Fabric added |
| IPFS_GATEWAY_URL | IPFS gateway base | https://ipfs.io/ipfs | No | Used for public content links |
| PINATA_JWT | Auth for Pinata uploads | – | No | Absence triggers deterministic mock CID |
| FRONTEND_BASE_URL | Link base for trace QR | http://localhost:3000 | No | Should match deployed frontend URL |
| GOOGLE_MAPS_API_KEY | Maps embed/JS API | – | No | Not yet integrated |
| JWT_SECRET | Sign auth tokens | development-secret | No | Replace in any semi-public demo |
| MOCK_MODE | Force mock services | false (implicit partial mocks) | No | TODO: Central enforcement |

> ACTION: When adding a new env var, update BOTH the draft list and the reference table.

## Security (Prototype Scope)
- JWT auth stub only (NOT production hardened).
- Basic input validation; TODO markers for stricter schema.

## TODO Markers Legend
- `TODO:FABRIC` Fabric-specific implementation needed.
- `TODO:ETH` Ethereum implementation.
- `TODO:IPFS` Replace mock with IPFS client call.
- `TODO:MODEL` Integrate TensorFlow.js model.

## Acceptance Criteria For "Demo-Ready"
- Can create & list batches via REST (mock blockchain).
- Farmer app can upload (stores metadata + mock image ref) and receives QR.
- Manufacturer dashboard scans QR and updates status.
- Consumer app scans same QR and sees chronological history.
- All without requiring real Fabric network (mock path) but ready to plug in.

## Extension Guidance
When real Fabric network is prepared:
- Implement gateway connection in `/blockchain/fabric/connection.js`.
- Map API calls to chaincode functions (`CreateBatch`, `UpdateBatch`).
- Ensure deterministic field names to keep mock + real parity.

---
Update this file whenever architecture, stack, or workflow assumptions change.

---

## Route Inventory (Canonical vs Legacy)
| Domain | Canonical Route | Legacy / Alias | Method | Purpose | Notes |
|--------|-----------------|----------------|--------|---------|-------|
| Herb Creation | /api/herbs | /api/herbs/create | POST | Create batch + optional media | Legacy kept for backward compatibility |
| Add Event | /api/herbs/:batchId/process | /api/herbs/:batchId/events | POST | Append processing/shipment event | Standardizing on "process" |
| Trace | /api/herbs/:batchId/trace | /api/herbs/trace/:batchId | GET | Full history & metadata | Two shapes accepted |
| Ownership Transfer | /api/herbs/:batchId/transfer | – | POST | Record ownership change | UI pending |
| QR Code | /api/herbs/:batchId/qr | – | GET | Returns QR DataURL / link | Utility function used |
| AI Validation | /api/herbs/validate | – | POST | Stub confidence scoring | To be replaced by model (TODO:MODEL) |

Deprecation Plan (proposed): Announce in README once ownership transfer UI shipped; remove legacy endpoints after 2 minor iterations with warning headers (see Deprecation Policy).

## Mock Mode Specification
Status: INITIAL IMPLEMENTATION COMPLETE.

Implemented (`MOCK_MODE=true`):
1. `services/mode.js` helper.
2. Blockchain adapter selector (`services/blockchain/index.js`) + in-memory mock (`blockchainMock.js`).
3. IPFS service short-circuits to deterministic CIDs even if keys present.
4. Seeding of sample batches via `seed/seedMock.js` + `seed/sample-batches.json`.
5. Response header `X-Mock-Mode: true` middleware.

Pending Enhancements:
- Optional persistence of mock blockchain log to file for post-run inspection.
- In-memory fallback when Mongo absent (currently seeds only if Mongo connects successfully).
Completed Additions:
- Deterministic AI validation confidence hashing (2025-09-04).

## Testing Matrix
| Layer | Tooling | Present | Gaps | Action |
|-------|---------|---------|------|--------|
| Unit (utilities) | Jest | YES (`trace`, `response`) | More helpers | Add controller adapter tests |
| Unit (controllers) | Jest + mocks | NO | Missing DI layer | Introduce service abstraction |
| Integration (API) | Jest + Supertest | CONDITIONAL (skipped w/out Mongo) | Coverage partial | Provide docker Mongo script |
| Blockchain Adapter | Hardhat tests | PARTIAL (separate) | No integration wiring | Add adapter contract mapping tests |
| E2E Web | Playwright/Cypress | NO | None | Add smoke for create→trace flow |
| Mobile | Detox/Jest | NO | None | Add scan + trace retrieval test |

## Deprecation Policy (Draft)
1. Mark legacy endpoints in `api-contract.yaml` with `deprecated: true` (DONE for current legacy routes).
2. Add `Warning` response header for calls to legacy routes: `299 - Deprecated route, use <canonical>` (TODO).
3. Provide migration notice in README one cycle before removal.
4. Remove code only after: (a) clients updated, (b) two tagged releases with warnings.

## Decision Log (Recent)
| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-09-04 | Keep legacy herb routes temporarily | Avoid breaking existing clients | Dual maintenance until deprecation window |
| 2025-09-04 | Drop mongodb-memory-server | Windows install instability | Tests skip without DB; need alternative mock strategy |
| 2025-09-04 | Extract `buildTraceLinks` util | Enable pure unit test | Added first DB-independent tests |
| 2025-09-04 | Standardize response wrapper | Client simplification | Added interceptor + consistent contract |
| 2025-09-04 | Enhance mobile consumer timeline | Align mobile with web trace detail | Added events, transfers, map preview |

## Quick Commands (Dev) (PowerShell)
```powershell
# Run backend (assumes dependencies installed)
cd backend; npm start

# Run backend tests (unit + integration if Mongo up)
cd backend; npm test

# Launch Hardhat local node (if using real contract interactions)
cd blockchain; npx hardhat node

# Run contract deployment script
cd blockchain; npx hardhat run scripts/deploy.js --network localhost

# Frontend dev server
cd frontend-web; npm run dev

# Mobile (Metro bundler example)
cd mobile-app; npm start
```

> Optional: Create a unified `scripts/dev.ps1` orchestrating backend + frontend + Hardhat with background jobs.

## AI Assistant Reference (Do Not Remove)
This section is a living quick-reference for future AI contributions. Keep concise; update when routes, responses, or testing approach changes.

### Current Implementation Snapshot (2025-09-04)
- Active blockchain path: Ethereum (Hardhat) only. Fabric not wired.
- Canonical herb creation route: `POST /api/herbs` (legacy kept: `POST /api/herbs/create`).
- Event addition canonical: `POST /api/herbs/:batchId/process` (legacy alias: `POST /api/herbs/:batchId/events`).
- Trace retrieval: `GET /api/herbs/:batchId/trace` plus alias `GET /api/herbs/trace/:batchId`.
- Ownership transfer: `POST /api/herbs/:batchId/transfer`.
- QR generation: `GET /api/herbs/:batchId/qr`.
- AI validation stub: `POST /api/herbs/validate` (returns pseudo-confidence update).

### Response Shape (Standardized)
All successful responses: `{ data: <payload> }`
Error responses (helper): `{ error: { code, message } }`
Frontend & mobile clients unwrap `data` automatically via interceptor/utility.

### Utilities
`buildTraceLinks(batchId)` → returns `{ traceUrl, qrDataURL }` using `FRONTEND_BASE_URL` or default `http://localhost:3000`.

### Testing Strategy
- Unit: Pure utilities (no DB) located under `backend/tests/unit` (execute even when Mongo absent).
- Integration: API tests conditionally skipped if Mongo not reachable at startup (see `tests/setup.js`).
- Gap: No controller/service unit tests yet; add using repository pattern or dependency injection mocks.

### Environment Flags & Defaults
- `FRONTEND_BASE_URL` used for QR/trace links.
- `MOCK_MODE` planned (partial implicit mocks: IPFS fallback + AI validation stub). Needs explicit conditional branches.
- `PINATA_JWT` optional; absence triggers deterministic mock CID logic.

### Known Gaps / TODO (High Priority)
1. Add ownership transfer UI component(s) to web + mobile.
2. Implement `MOCK_MODE` fully (skip blockchain & external calls deterministically).
3. Provide seeding script & sample fixture (`sample-batches.json`).
4. Add controller/service unit tests (mock persistence + blockchain/IPFS layers).
5. Integrate basic maps/geolocation visualization (read-only) on trace view.
6. Consolidate deprecated routes removal plan + sunset timeline.

### Code Quality / CI Suggestions
- Add lint (ESLint) + format (Prettier) with pre-commit hook.
- Add GitHub Action job: install, spin up Mongo (docker), run unit + integration tests, artifact test reports.

### Migration Notes
- When implementing Fabric: keep same field names as Ethereum path to avoid client changes.
- Abstract blockchain calls behind an interface (e.g., `blockchainAdapter.createBatch(...)`).

### Editing Guidance for AI
- Preserve backward compatibility for legacy endpoints until explicit removal.
- Always update: this reference section + `api-contract.yaml` + `README.md` when modifying public routes.
- Add unit tests for any new pure functions or helpers concurrently with implementation.

### Maintenance Checklist (Perform When Making Architectural Change)
1. Update Route Inventory (canonical/legacy columns).
2. Sync OpenAPI (`api-contract.yaml`).
3. Revise Environment Variable Table if new config added.
4. Append Decision Log entry.
5. Add/adjust tests (unit + integration) to cover new behavior.
6. Update README feature list / setup instructions.
7. Confirm CI/lint scripts (once added) still pass.

---
