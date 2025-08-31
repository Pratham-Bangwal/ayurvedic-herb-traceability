Write-Host "🧹 Cleaning repository..."

# --- 1. Remove all .bak files and directories ---
Get-ChildItem -Path . -Recurse -Force -Include *.bak,*bak.* | ForEach-Object {
    try {
        if ($_.PSIsContainer) {
            Remove-Item -Recurse -Force -Confirm:$false $_.FullName
            Write-Host "Removed directory: $($_.FullName)"
        } else {
            Remove-Item -Force -Confirm:$false $_.FullName
            Write-Host "Removed file: $($_.FullName)"
        }
    } catch {
        Write-Warning "Could not remove: $($_.FullName)"
    }
}

# --- 2. Remove logs and tmp files ---
$junk = @("*.log", "project-structure.txt", "health-monitor.log")
foreach ($pattern in $junk) {
    Get-ChildItem -Path . -Recurse -Force -Include $pattern | ForEach-Object {
        try {
            Remove-Item -Force -Confirm:$false $_.FullName
            Write-Host "Removed junk: $($_.FullName)"
        } catch {
            Write-Warning "Could not remove: $($_.FullName)"
        }
    }
}

# --- 3. Ensure .env files are ignored ---
$gitignore = ".gitignore"
$envEntries = @(".env", "backend/.env", "frontend-web/.env", "mobile-app/.env")
if (Test-Path $gitignore) {
    $current = Get-Content $gitignore
    foreach ($entry in $envEntries) {
        if ($current -notcontains $entry) {
            Add-Content -Path $gitignore -Value $entry
            Write-Host "Added to .gitignore: $entry"
        }
    }
} else {
    Set-Content -Path $gitignore -Value ($envEntries -join "`n")
    Write-Host "Created new .gitignore with .env rules."
}

# --- 4. Ensure build outputs are ignored ---
$buildEntries = @("frontend-web/dist", "backend/node_modules", "frontend-web/node_modules", "blockchain/node_modules")
$current = Get-Content $gitignore
foreach ($entry in $buildEntries) {
    if ($current -notcontains $entry) {
        Add-Content -Path $gitignore -Value $entry
        Write-Host "Added to .gitignore: $entry"
    }
}

Write-Host "✅ Cleanup complete. Now run:"
Write-Host "   git add ."
Write-Host "   git commit -m 'cleanup: remove bak/logs and update gitignore'"
Write-Host "   git push"
