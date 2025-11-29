<#!
Manual Presentation Demo Script
Runs a full happy-path flow against the backend for live presentation.
Usage (PowerShell 5+):
  powershell -ExecutionPolicy Bypass -File scripts/manual-demo.ps1
Optional params:
  -Port 4000 -BatchId DEMO123 -BaseUrl http://localhost:4000 -AdminUser admin -AdminPass admin123
#>
param(
  [int]$Port = 4000,
  [string]$BatchId = "DEMO" + (Get-Date -Format "HHmmss"),
  [string]$BaseUrl = "http://localhost:4000",
  [string]$AdminUser = $(if($env:ADMIN_USERNAME){$env:ADMIN_USERNAME}else{'admin'}),
  [string]$AdminPass = $(if($env:ADMIN_PASSWORD){$env:ADMIN_PASSWORD}else{'admin123'})
)

Write-Host "=== Herb Traceability Manual Demo ===" -ForegroundColor Cyan
Write-Host "Port: $Port  Batch: $BatchId" -ForegroundColor DarkGray

Push-Location backend 2>$null
if (-not (Test-Path package.json)) { Pop-Location; Write-Error "Run from repo root"; exit 1 }

if (-not (Test-Path node_modules)) {
  Write-Host "Installing backend deps..." -ForegroundColor Yellow
  npm install | Out-Null
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
$env:PORT = $Port
$backendJob = Start-Job -ScriptBlock { npm start | Write-Output }

# Wait for health
Write-Host "Waiting for /healthz..." -ForegroundColor Yellow
$healthy = $false
for ($i=0; $i -lt 30; $i++) {
  try {
    $resp = Invoke-RestMethod -Method GET -Uri "$BaseUrl/healthz" -TimeoutSec 3
    if ($resp -eq 'ok') { $healthy = $true; break }
  } catch {}
  Start-Sleep -Milliseconds 500
}
if (-not $healthy) { Write-Host "Backend did not become healthy" -ForegroundColor Red; Stop-Job $backendJob; Receive-Job $backendJob | Out-Null; exit 1 }
Write-Host "Backend healthy." -ForegroundColor Green

# Step 1: Public create herb (open endpoint)
Write-Host "Creating herb batch (open endpoint)..." -ForegroundColor Yellow
$createBody = @{ name = 'Tulsi'; batchId = $BatchId } | ConvertTo-Json
$create = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/herbs" -ContentType 'application/json' -Body $createBody
$create.data | Format-List | Out-String | Write-Host

# Step 2: Login as admin
Write-Host "Authenticating admin..." -ForegroundColor Yellow
$loginBody = @{ username = $AdminUser; password = $AdminPass } | ConvertTo-Json
$login = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/auth/login" -ContentType 'application/json' -Body $loginBody
$token = $login.data.token
if (-not $token) { Write-Host "Failed to obtain token" -ForegroundColor Red; goto Cleanup }
Write-Host "Token acquired (truncated): $($token.Substring(0,25))..." -ForegroundColor Green

$authHeader = @{ Authorization = "Bearer $token" }

# Step 3: Add processing event
Write-Host "Adding processing event..." -ForegroundColor Yellow
$procBody = @{ actor = 'ProcessorA'; data = 'sun-dried' } | ConvertTo-Json
$proc = Invoke-RestMethod -Method POST -Headers $authHeader -Uri "$BaseUrl/api/herbs/$BatchId/process" -ContentType 'application/json' -Body $procBody
($proc.data.processingEvents | Select-Object -First 1) | Format-List | Out-String | Write-Host

# Step 4: Transfer ownership
Write-Host "Transferring ownership..." -ForegroundColor Yellow
$transferBody = @{ newOwner = '0xABC123DEF' } | ConvertTo-Json
$transfer = Invoke-RestMethod -Method POST -Headers $authHeader -Uri "$BaseUrl/api/herbs/$BatchId/transfer" -ContentType 'application/json' -Body $transferBody
($transfer.data.ownershipTransfers | Select-Object -Last 1) | Format-List | Out-String | Write-Host

# Step 5: Trace retrieval
Write-Host "Retrieving trace..." -ForegroundColor Yellow
$trace = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/herbs/$BatchId/trace"
$trace.data | Select-Object batchId name farmerName createdAt | Format-List | Out-String | Write-Host

# Step 6: Analytics
Write-Host "Fetching analytics distribution..." -ForegroundColor Yellow
$dist = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/analytics/herb-distribution"
"Count: $($dist.data.Length)" | Write-Host

# Optional: QR code (SVG) save
Write-Host "Saving QR code SVG..." -ForegroundColor Yellow
$qrcodePath = Join-Path (Get-Location) "qr-$BatchId.svg"
Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/herbs/$BatchId/qrcode" -OutFile $qrcodePath
Write-Host "QR saved to $qrcodePath" -ForegroundColor Green

# Optional: Verify herb image if sample exists
$sampleImage = Resolve-Path ../herb.jpg -ErrorAction SilentlyContinue
if ($sampleImage) {
  Write-Host "Verifying herb image (sample) ..." -ForegroundColor Yellow
  try {
    # PowerShell multipart form upload
    $verify = Invoke-WebRequest -Method POST -Uri "$BaseUrl/api/herbs/verify" -Form @{ batchId = $BatchId; file = Get-Item $sampleImage } -Headers $authHeader -ErrorAction Stop
    Write-Host "Verification status: $($verify.StatusCode)" -ForegroundColor Green
  } catch {
    Write-Host "Image verification skipped (multipart not supported in this shell version)." -ForegroundColor DarkYellow
  }
}

Write-Host "=== Demo Flow Complete ===" -ForegroundColor Cyan
Write-Host "Press Enter to stop server..." -ForegroundColor DarkGray
[Console]::ReadLine() | Out-Null

:Cleanup
if ($backendJob) { Stop-Job $backendJob -ErrorAction SilentlyContinue | Out-Null; Receive-Job $backendJob | Out-Null }
Pop-Location 2>$null
