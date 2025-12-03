using ServiceDesk.Models;

namespace ServiceDesk.Services;

// Interfejs serwisu obsługującego logikę biznesową zgłoszeń
public interface ITicketService
{
    Task<IEnumerable<Ticket>> GetAllTicketsAsync(); // Pobierz wszystkie zgłoszenia
    Task<IEnumerable<Ticket>> GetUserTicketsAsync(int userId); // Pobierz zgłoszenia użytkownika
    Task<Ticket?> GetTicketByIdAsync(int id); // Pobierz zgłoszenie po ID
    Task<Ticket> CreateTicketAsync(Ticket ticket); // Utwórz nowe zgłoszenie
    Task<bool> UpdateTicketAsync(int id, Ticket ticket); // Zaktualizuj zgłoszenie
    Task<bool> DeleteTicketAsync(int id); // Usuń zgłoszenie
    Task<bool> UpdateTicketStatusAsync(int id, string status); // Zaktualizuj status zgłoszenia
    
    // Metody wykorzystujące procedury składowane i funkcje SQL
    Task<IEnumerable<TicketStatistic>> GetTicketStatisticsAsync(); // Pobierz statystyki
    Task<double> GetAverageResolutionTimeAsync(); // Pobierz średni czas rozwiązania
}
