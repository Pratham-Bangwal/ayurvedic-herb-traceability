<#
Brings up full stack (Mongo + Hardhat + Backend) via Docker Compose and waits for backend health.
Usage: powershell -ExecutionPolicy Bypass -File scripts/stack-up.ps1
#>
Write-Host "Starting Docker stack..." -ForegroundColor Cyan
$composeCmd = "docker compose"  # assumes Docker Desktop new syntax

# Bring up (detached) and build
$proc = Start-Process -FilePath powershell -ArgumentList "-NoProfile","-Command","$composeCmd up --build -d" -PassThru -WindowStyle Hidden
$proc.WaitForExit()
if ($proc.ExitCode -ne 0) { Write-Host "Compose failed" -ForegroundColor Red; exit 1 }

Write-Host "Waiting for backend (health)..." -ForegroundColor Yellow
$healthy = $false
for ($i=0; $i -lt 40; $i++) {
  try {
    $resp = Invoke-RestMethod -Uri http://localhost:4000/healthz -TimeoutSec 3
    if ($resp.status -eq 'ok') { $healthy = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}
if (-not $healthy) { Write-Host "Backend not healthy after timeout." -ForegroundColor Red; exit 2 }
Write-Host "Backend is up: http://localhost:4000" -ForegroundColor Green

Write-Host "Sample commands:" -ForegroundColor Cyan
Write-Host "Create batch: curl -Method POST -Uri http://localhost:4000/api/herbs -Body '{`"name`":`"Tulsi`",`"batchId`":`"B1`",`"origin`":`"FarmA`"}' -ContentType 'application/json'" -ForegroundColor Gray
Write-Host "Trace: curl http://localhost:4000/api/herbs/B1/trace" -ForegroundColor Gray
Write-Host "Stop stack: docker compose down" -ForegroundColor Yellow
