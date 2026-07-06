# run_visual_test.ps1
# Convenience wrapper to install Playwright (if missing) and run the navbar visual test.
# Run from project root:  powershell -ExecutionPolicy Bypass -File .\Testing\03_Navbar_Masjid_Selection\run_visual_test.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Backend + frontend must already be running
Write-Host "Checking frontend at http://localhost:5173 ..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "  frontend reachable" -ForegroundColor Green
} catch {
    Write-Host "  frontend is NOT reachable. Start it with:  cd frontend; npm run dev" -ForegroundColor Red
    exit 1
}

Write-Host "Checking backend at http://localhost:5000 ..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri 'http://localhost:5000/api/mosques' -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "  backend reachable" -ForegroundColor Green
} catch {
    Write-Host "  backend is NOT reachable. Start it with:  cd backend; npm run dev" -ForegroundColor Red
    exit 1
}

# Install Playwright if not present
$pwPath = Join-Path $root 'node_modules\playwright'
if (-not (Test-Path $pwPath)) {
    Write-Host "Installing playwright (dev dependency) ..." -ForegroundColor Cyan
    npm i -D playwright | Out-Null
}

# Make sure chromium browser is installed
Write-Host "Ensuring chromium browser is installed ..." -ForegroundColor Cyan
npx playwright install chromium | Out-Null

# Run the visual test
Write-Host "Running visual test ..." -ForegroundColor Cyan
node "$PSScriptRoot\visual_test.js"

Write-Host "Done. Screenshots in:  $PSScriptRoot\screenshots" -ForegroundColor Green
Write-Host "Findings JSON in:       $PSScriptRoot\visual_test_findings.json" -ForegroundColor Green
