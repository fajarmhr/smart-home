Write-Host "`n=== Smart Home - Restart ===" -ForegroundColor Cyan

$compose = Join-Path $PSScriptRoot "..\docker-compose.yml"

docker compose -f $compose down
docker compose -f $compose up -d --build

Write-Host "`n[OK] Containers restarted." -ForegroundColor Cyan
Write-Host "Dashboard : http://localhost:8000"
Write-Host "Admin     : http://localhost:8000/admin`n"

docker compose -f $compose ps
