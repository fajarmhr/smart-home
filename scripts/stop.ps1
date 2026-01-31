Write-Host "`n=== Smart Home - Stop ===" -ForegroundColor Yellow

$compose = Join-Path $PSScriptRoot "..\docker-compose.yml"

docker compose -f $compose down

Write-Host "`n[OK] Containers stopped.`n" -ForegroundColor Yellow
