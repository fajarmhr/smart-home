Write-Host "`n=== Smart Home - Start ===" -ForegroundColor Green

$compose = Join-Path $PSScriptRoot "..\docker-compose.yml"

docker compose -f $compose up -d --build

Write-Host "`n[OK] Containers started." -ForegroundColor Green
Write-Host "Dashboard : http://localhost:8000"
Write-Host "Admin     : http://localhost:8000/admin`n"

docker compose -f $compose ps
