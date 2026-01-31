Write-Host "`n=== Smart Home - Interactive Shell ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "  [1] web (Django bash)"
Write-Host "  [2] redis (sh)"
Write-Host "  [3] Django manage.py shell"
Write-Host ""

$choice = Read-Host "Select container"

switch ($choice) {
    "1" {
        Write-Host "`nConnecting to web container...`n" -ForegroundColor Cyan
        docker exec -it smart-home-web bash
    }
    "2" {
        Write-Host "`nConnecting to redis container...`n" -ForegroundColor Cyan
        docker exec -it smart-home-redis sh
    }
    "3" {
        Write-Host "`nOpening Django shell...`n" -ForegroundColor Cyan
        docker exec -it smart-home-web python manage.py shell
    }
    default {
        Write-Host "Invalid choice.`n" -ForegroundColor Red
    }
}
