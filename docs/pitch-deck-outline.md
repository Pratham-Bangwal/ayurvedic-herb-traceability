# Pitch Deck Outline — Ayurvedic Herb Traceability

Aim: 7–10 slides, 6–8 minutes. Each slide has 2–4 talking points.

1) Title — Vision & One‑liner
- "Verifiable origin for Ayurvedic herbs — from farm to consumer"
- Problem + promise in one sentence

2) Problem
- Counterfeits, opacity, quality issues, weak farmer recognition
- Compliance friction for exports

3) Solution Overview
- QR-based verification + blockchain traceability
- Secure admin + analytics

4) Architecture
- React frontend, Node/Express backend, MongoDB, Solidity contract
- IPFS (mocked now, Pinata-ready); Docker for orchestration

5) Key Features
- Batch creation with geo/photo, QR generation
- Trace view (events, ownership, map placeholder)
- Admin analytics; JWT-protected list + data wipe (mock-only)

6) Demo (Flow Snapshot)
- Create → Trace → Event → Transfer → Admin Analytics
- 60-second QR and trace highlight

7) Security & Data Strategy
- JWT for admin, rate limits, CORS, validation
- On-chain vs off-chain: cost/privacy balance

8) Blockchain & Roadmap
- Mock chain now; real-chain toggle via envs
- Next: real IPFS pinning, role expansion, mobile scanner, L2/perf

9) Impact
- Trust for consumers, premium for farmers, compliance for exporters
- Easy integration for manufacturers

10) Ask & Next Steps (optional)
- Pilot partners, data model alignment, regulatory sandbox
