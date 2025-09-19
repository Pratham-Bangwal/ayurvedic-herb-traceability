# Demo Checklist & Recovery

## Preflight (5 min before)
- docker compose up -d
- Backend health: http://localhost:4000/healthz → ok
- Open web: http://localhost:5173
- Ensure JWT_SECRET in backend env; admin creds ready (admin/admin123)
- Keep one known batchId copied in clipboard

## Live Steps
1) Create batch with minimal fields; show QR in response
2) Open trace page; highlight timeline + map placeholder
3) Add processing event; refresh trace
4) Transfer ownership; show chain of custody
5) Admin login → show analytics & browse

## Fallbacks
- If Mongo down: in-memory mock still returns trace; proceed with demo
- If login fails: verify JWT_SECRET set; skip analytics and continue
- If CORS blocks web: demo backend endpoints via terminal quick calls
- If QR/trace slow: use known pre-created batchId

## Quick Smoke (PowerShell)
```powershell
# Login
Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'

# Create minimal batch
Invoke-RestMethod -Uri "http://localhost:4000/api/herbs" -Method POST -ContentType "application/json" -Body '{"batchId":"BT-PITCH","name":"Tulsi","farmerName":"Demo"}'

# Trace
Invoke-RestMethod -Uri "http://localhost:4000/api/herbs/BT-PITCH/trace" -Method GET
```
