Write-Host "`n=== Smart Home - Remove ===" -ForegroundColor Red
Write-Host "This will stop and remove all containers, networks, and volumes.`n" -ForegroundColor DarkRed

$confirm = Read-Host "Are you sure? (y/N)"
if ($confirm -ne "y") {
    Write-Host "Cancelled.`n" -ForegroundColor Gray
    exit
}

$compose = Join-Path $PSScriptRoot "..\docker-compose.yml"

docker compose -f $compose down -v --rmi local --remove-orphans

Write-Host "`n[OK] All containers, volumes, and images removed.`n" -ForegroundColor Red
