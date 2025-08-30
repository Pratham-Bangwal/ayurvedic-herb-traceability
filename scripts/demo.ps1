<#
Simple PowerShell demo script to spin up backend (expects Mongo running: via Docker or local) and run a minimal flow.
Usage:
  powershell -ExecutionPolicy Bypass -File scripts/demo.ps1
#>

Write-Host "=== Ayurvedic Herb Traceability Demo ===" -ForegroundColor Cyan

# Step 1: Install dependencies if node_modules missing
if (-Not (Test-Path "node_modules")) {
  Write-Host "Installing workspace dependencies..." -ForegroundColor Yellow
  npm install
}

# Step 2: Start backend in background (job)
Write-Host "Starting backend (dev)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
  npm run dev:backend | Write-Output
}

Start-Sleep -Seconds 5

# Step 3: Health check loop
$healthOk = $false
for ($i=0; $i -lt 20; $i++) {
  try {
    $resp = Invoke-RestMethod -Method GET -Uri http://localhost:4000/healthz -TimeoutSec 3
    if ($resp.status -eq 'ok') { $healthOk = $true; break }
  } catch { Start-Sleep -Milliseconds 500 }
}
if (-Not $healthOk) {
  Write-Host "Backend failed to become healthy. Stopping." -ForegroundColor Red
  Stop-Job $backendJob | Out-Null
  Receive-Job $backendJob | Out-Null
  exit 1
}
Write-Host "Backend healthy." -ForegroundColor Green

# Step 4: Create batch
Write-Host "Creating batch BATCHDEMO..." -ForegroundColor Yellow
$create = Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/herbs -ContentType 'application/json' -Body '{"name":"DemoHerb","batchId":"BATCHDEMO","origin":"TestFarm"}'
$create | ConvertTo-Json -Depth 6

# Step 5: Add processing event
Write-Host "Adding processing event..." -ForegroundColor Yellow
$proc = Invoke-RestMethod -Method POST -Uri http://localhost:4000/api/herbs/BATCHDEMO/process -ContentType 'application/json' -Body '{"type":"drying","location":"Shed 1","notes":"Low temp"}'
$proc | ConvertTo-Json -Depth 6

# Step 6: Trace retrieval
Write-Host "Getting trace..." -ForegroundColor Yellow
$trace = Invoke-RestMethod -Method GET -Uri http://localhost:4000/api/herbs/BATCHDEMO/trace
$trace | ConvertTo-Json -Depth 8

Write-Host "Demo complete. Press Enter to stop backend." -ForegroundColor Cyan
[Console]::ReadLine() | Out-Null
Stop-Job $backendJob | Out-Null
Receive-Job $backendJob | Out-Null
Write-Host "Stopped." -ForegroundColor Cyan
