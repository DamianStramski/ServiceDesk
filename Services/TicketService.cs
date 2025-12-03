using Microsoft.EntityFrameworkCore;
using ServiceDesk.Data;
using ServiceDesk.Models;

namespace ServiceDesk.Services;

// Implementacja serwisu zgłoszeń
public class TicketService : ITicketService
{
    private readonly AppDbContext _context;

    public TicketService(AppDbContext context)
    {
        _context = context;
    }

    // Pobiera wszystkie zgłoszenia wraz z powiązanymi danymi (Użytkownik, Kategoria, Komentarze)
    public async Task<IEnumerable<Ticket>> GetAllTicketsAsync()
    {
        return await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Category)
            .Include(t => t.Comments)
            .ToListAsync();
    }

    // Pobiera zgłoszenia przypisane do konkretnego użytkownika
    public async Task<IEnumerable<Ticket>> GetUserTicketsAsync(int userId)
    {
        return await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Category)
            .Include(t => t.Comments)
            .Where(t => t.UserId == userId)
            .ToListAsync();
    }

    // Pobiera szczegóły pojedynczego zgłoszenia
    public async Task<Ticket?> GetTicketByIdAsync(int id)
    {
        return await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Category)
            .Include(t => t.Comments)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    // Tworzy nowe zgłoszenie w bazie danych
    public async Task<Ticket> CreateTicketAsync(Ticket ticket)
    {
        ticket.CreatedAt = DateTime.Now;
        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();
        return ticket;
    }

    // Aktualizuje istniejące zgłoszenie
    public async Task<bool> UpdateTicketAsync(int id, Ticket ticket)
    {
        if (id != ticket.Id) return false;

        // Oznaczamy encję jako zmodyfikowaną, jeśli nie jest śledzona
        if (_context.Entry(ticket).State == EntityState.Detached)
        {
            _context.Entry(ticket).State = EntityState.Modified;
        }

        try
        {
            await _context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TicketExists(id)) return false;
            throw;
        }
    }

    // Usuwa zgłoszenie z bazy danych
    public async Task<bool> DeleteTicketAsync(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return false;

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    // Aktualizuje tylko status zgłoszenia
    public async Task<bool> UpdateTicketStatusAsync(int id, string status)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return false;

        ticket.Status = status;
        ticket.UpdatedAt = DateTime.Now; // Trigger w bazie również może to obsłużyć
        await _context.SaveChangesAsync();
        return true;
    }

    private bool TicketExists(int id)
    {
        return _context.Tickets.Any(t => t.Id == id);
    }

    // Wykonaj procedurę składowaną GetTicketStatistics
    public async Task<IEnumerable<TicketStatistic>> GetTicketStatisticsAsync()
    {
        return await _context.Set<TicketStatistic>()
            .FromSqlRaw("EXEC GetTicketStatistics")
            .ToListAsync();
    }

    // Wywołaj funkcję SQL CalculateAverageResolutionTime
    public async Task<double> GetAverageResolutionTimeAsync()
    {
        var result = await _context.Database
            .SqlQueryRaw<double>("SELECT dbo.CalculateAverageResolutionTime() AS Value")
            .ToListAsync();
        
        return result.FirstOrDefault();
    }
}
