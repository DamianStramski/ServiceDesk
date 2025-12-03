Write-Host "Uruchamianie Backend (ServiceDesk API)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "dotnet run --project ServiceDesk.csproj"

Start-Sleep -Seconds 2

Write-Host "Uruchamianie Frontend (React)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Frontend; npm run dev"

Write-Host "Gotowe! Oba serwisy uruchamiają się w nowych oknach." -ForegroundColor Cyan
