# Ayurvedic Herb Blockchain Traceability System

Prototype monorepo for end‑to‑end supply chain traceability of Ayurvedic herbs.

## ⚡ Super Simple How To Use (Fast Demo)
Pick ONE option below.

### Option 1: Easiest (Docker – one command)
1. Install Docker Desktop (https://www.docker.com/products/docker-desktop) and start it.
2. From the project root run (auto waits for health):
	```powershell
	npm run stack:up
	```
	(This wraps `docker compose up --build -d` and polls health.)
3. Verify:
	```powershell
	curl http://localhost:4000/healthz
	```
	Expected: `{ "status": "ok", ... }`
4. Try creating a batch:
	```powershell
	curl -Method POST -Uri http://localhost:4000/api/herbs -Body '{"name":"Tulsi","batchId":"B1","origin":"FarmA"}' -ContentType 'application/json'
	```
5. Trace it:
	```powershell
	curl http://localhost:4000/api/herbs/B1/trace
	```
6. Stop everything when done:
	```powershell
	docker compose down
	```
Optional: view running containers:
```powershell
docker ps
```

### Option 2: Manual (no Docker)
1. Install Node.js (LTS) + have MongoDB running locally (or use MongoDB Atlas URI).
2. Copy `.env.example` to `backend/.env` and adjust `MONGO_URI` (example already works if you use Docker for Mongo later).
3. Install all dependencies (from repo root):
	```powershell
	npm install
	```
4. Start only the backend:
	```powershell
	npm run dev:backend
	```
5. (Later you can start the web UI) `npm run dev:web` (if script present) – but for now you can test with curl / Postman.

### Fast Automated Demo (creates + traces a batch automatically)
Run:
```powershell
npm run run:demo
```
Follow on-screen steps; press Enter to stop when finished.

### Quick API Flow (copy & paste examples)
Open a NEW PowerShell window (backend must already be running on port 4000).

1. Create a herb batch (no image):
	```powershell
	curl -Method POST -Uri http://localhost:4000/api/herbs -Body '{"name":"Tulsi","batchId":"BATCH100","origin":"Kerala"}' -ContentType 'application/json'
	```
2. List all batches:
	```powershell
	curl http://localhost:4000/api/herbs
	```
3. Add a processing event (drying example):
	```powershell
	curl -Method POST -Uri http://localhost:4000/api/herbs/BATCH100/process -Body '{"type":"drying","location":"Warehouse 1","notes":"Low heat"}' -ContentType 'application/json'
	```
4. Transfer ownership:
	```powershell
	curl -Method POST -Uri http://localhost:4000/api/herbs/BATCH100/transfer -Body '{"newOwner":"ManufacturerCo"}' -ContentType 'application/json'
	```
5. Get full trace:
	```powershell
	curl http://localhost:4000/api/herbs/BATCH100/trace
	```
6. Get QR code (PNG image): open in browser:
	http://localhost:4000/api/herbs/BATCH100/qrcode

### Upload With Image (PowerShell example)
Have an image named `leaf.jpg` in the current folder.
```powershell
curl -Method POST -Uri http://localhost:4000/api/herbs/upload `
  -Form name=Ashwagandha `
  -Form batchId=BATCH200 `
  -Form origin=Rajasthan `
  -Form harvestedAt=2024-12-01 `
  -Form photo=@"$(Resolve-Path ./leaf.jpg)"
```

Then trace it:
```powershell
curl http://localhost:4000/api/herbs/BATCH200/trace
```

### Public Consumer Trace Page (Web)
After you later start the web frontend, open:
```
http://localhost:5173/trace/BATCH100
```

### If Something Fails
- Check backend logs in the terminal.
- Make sure port 4000 not used by something else.
- If Mongo connection fails in manual mode: verify `MONGO_URI` in `backend/.env`.

---

## Structure
- **blockchain/** → Smart contracts + deployment scripts
- **backend/** → Node.js + Express API + blockchain connector
- **frontend-web/** → React dashboard for manufacturers
- **mobile-app/** → React Native app for farmers + consumers
- **docs/** → Architecture + API specs

## Quick Start
# Docker (Backend + Mongo + Hardhat Node)
```bash
docker compose up --build
```
Backend: http://localhost:4000

```bash
# Install all workspace dependencies
npm install

# Start backend (production mode)
npm run start:backend

# Or run backend in dev mode with auto-reload
npm run dev:backend

# Start web frontend (placeholder tooling)
npm run start:web

# Start mobile app (placeholder tooling / future Expo)
npm run start:mobile
```

## Notes
- Web & mobile scripts are placeholders; replace with Vite / Expo later.
- See `docs/setup-guide.md` for extended environment setup & next steps.

## Roadmap (Initial)
1. MongoDB integration & env configuration
2. Solidity smart contract (batch registry) + Hardhat setup
3. Vite React UI with basic pages & API integration
4. Expo React Native app with QR code generation & scanning
5. On-chain event listener to sync chain state to MongoDB

## Dev Utilities
- Seed sample data: `npm --workspace backend run seed`
- CI workflow: `.github/workflows/ci.yml` runs tests on push/PR to main.

## License
TBD
