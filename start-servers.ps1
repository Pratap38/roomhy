# PowerShell script to start both servers on Windows
Write-Host "🚀 Starting RoomHy Platform..." -ForegroundColor Green
Write-Host ""

# Kill any existing node processes
Write-Host "🔄 Cleaning up old processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force 2>$null
Start-Sleep -Seconds 1

# Start backend on port 5001
Write-Host "📦 Starting Backend on port 5001..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "roomhy-backend"
$null = Start-Process -WindowStyle Normal -FilePath "cmd" -ArgumentList "/c cd /d `"$backendPath`" && node server.js" -PassThru
Start-Sleep -Seconds 3

# Start frontend on port 5000
Write-Host "🌐 Starting Frontend on port 5000..." -ForegroundColor Cyan
$frontendPath = $PSScriptRoot
$null = Start-Process -WindowStyle Normal -FilePath "cmd" -ArgumentList "/c cd /d `"$frontendPath`" && node frontend-server.js" -PassThru
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Both servers started!" -ForegroundColor Green
Write-Host "   Frontend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "   Backend:   http://localhost:5001" -ForegroundColor Yellow
Write-Host "   API URL:   http://localhost:5001/api/*" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Remember to update API_URL in your code to: http://localhost:5001" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Enter to open the frontend..." -ForegroundColor Gray
Read-Host

# Open in browser
Start-Process "http://localhost:5000"
