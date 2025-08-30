# Copilot Instructions — Ayurvedic Herb Blockchain Traceability System

> Usage Notes: This file instructs GitHub Copilot / AI assistants how to scaffold and extend the repository. Keep synchronized with architectural decisions. It is documentation only, not executed.

## Mission
Deliver a **demo-ready prototype** (not production) for Ayurvedic herb traceability.

Show the end-to-end flow:
- **Farmer:** Upload herb photo + GPS → Blockchain record + QR code.
- **Manufacturer:** Scan QR → Add processing/shipment → Update blockchain.
- **Consumer:** Scan QR → View entire supply chain history.

## Tech Stack (strict)
- **Blockchain:** Hyperledger Fabric (preferred) or Ethereum testnet.
- **Backend:** Node.js + Express (REST APIs for blockchain I/O, QR, auth).
- **Database:** MongoDB (off-chain data).
- **Storage:** IPFS (herb images/docs).
- **Frontend (Web):** React.js (Manufacturer/Admin dashboard).
- **Mobile:** React Native (Farmer + Consumer apps).
- **Maps:** Google Maps API (geo-tagging).
- **QR Codes:** Open-source QR libraries.
- **Optional Add-On:** TensorFlow.js CNN for herb image validation (bonus).

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
