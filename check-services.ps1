param(
    [int]$intervalSeconds = 120,
    [string]$logFile = "health-monitor.log"
)

Write-Host "=== Ayurvedic Herb Traceability: Continuous Health Monitor ===`n"

# Restart counters
$restartCount = @{
    mongo = 0
    blockchain = 0
    backend = 0
    frontend = 0
}

function Write-Log($message, $level="INFO") {
    $timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    $line = "[$timestamp][$level] $message"
    $line | Out-File -FilePath $logFile -Append -Encoding utf8
    Write-Host $line
}

function Restart-Container($name) {
    Write-Log "Restarting container: $name..." "WARN"
    docker restart $name | Out-Null
    Start-Sleep -Seconds 5
    $restartCount[$name]++
    Write-Log "$name restarted (total restarts: $($restartCount[$name]))."
}

function Test-Checks {
    # 1. Mongo
    try {
        $mongo = docker inspect --format='{{.State.Health.Status}}' mongo
        if ($mongo -eq "healthy") {
            Write-Log "Mongo healthy ✅"
        } else {
            Write-Log "Mongo unhealthy ($mongo)." "ERROR"
            Restart-Container "mongo"
        }
    } catch {
        Write-Log "Mongo container not found." "ERROR"
    }

    # 2. Blockchain
    try {
        $resp = Invoke-WebRequest -Uri http://localhost:8545 `
            -Method POST `
            -ContentType "application/json" `
            -Body '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' `
            -UseBasicParsing -TimeoutSec 5
        Write-Log "Blockchain RPC OK: $($resp.Content) ✅"
    } catch {
        Write-Log "Blockchain RPC failed." "ERROR"
        Restart-Container "blockchain"
    }

    # 3. Backend
    try {
        $backend = Invoke-WebRequest -Uri http://localhost:4000/healthz -UseBasicParsing -TimeoutSec 5
        Write-Log "Backend OK ($($backend.StatusCode)) ✅"
    } catch {
        Write-Log "Backend down." "ERROR"
        Restart-Container "backend"
    }

    # 4. Frontend
    try {
        $frontend = Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 5
        Write-Log "Frontend OK ($($frontend.StatusCode)) ✅"
    } catch {
        Write-Log "Frontend down." "ERROR"
        Restart-Container "frontend"
    }

    Write-Log "Containers status check complete."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host "`n--- Next check in $intervalSeconds seconds ---`n"
}

# Main loop
try {
    while ($true) {
        Test-Checks
        Start-Sleep -Seconds $intervalSeconds
    }
} finally {
    Write-Log "Health monitor stopped manually." "WARN"
    Write-Host "👋 Monitor stopped. Restart counts:" ($restartCount | Out-String)
}
