# ServiceDesk System

System do zarządzania zgłoszeniami serwisowymi (Helpdesk) stworzony w technologiach .NET 7 (Backend) i React (Frontend).

## Funkcjonalności

### Użytkownik
- Rejestracja i logowanie.
- Tworzenie i przeglądanie zgłoszeń.
- Komentowanie zgłoszeń.
- Potwierdzanie lub odrzucanie rozwiązań.

### Administrator
- Zarządzanie wszystkimi zgłoszeniami.
- Zmiana statusów i priorytetów.
- Dodawanie notatek wewnętrznych (niewidocznych dla użytkowników).
- Przegląd statystyk (Dashboard).
- Generowanie raportów PDF.

## Technologie

- **Backend**: ASP.NET Core Web API, Entity Framework Core, SQL Server.
- **Frontend**: React, Vite, Axios, CSS Modules.
- **Inne**: QuestPDF (raporty), Recharts (wykresy).

## Uruchomienie

1.  **Baza danych**: Skonfiguruj `appsettings.json` i uruchom `dotnet ef database update`.
2.  **Backend**: `cd ServiceDesk` -> `dotnet run`.
3.  **Frontend**: `cd Frontend` -> `npm install` -> `npm run dev`.
