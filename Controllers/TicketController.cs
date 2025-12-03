using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Models;
using ServiceDesk.Services;
using System.Security.Claims;

namespace ServiceDesk.Controllers;

// Kontroler zarządzający zgłoszeniami (Tickets)
[Route("api/tickets")] // Poprawiona ścieżka, aby była spójna z nazwą kontrolera w kodzie
[ApiController]
[Authorize] // Wymaga autoryzacji dla wszystkich metod
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    // Pobiera listę zgłoszeń.
    // Dla Administratora zwraca wszystkie zgłoszenia.
    // Dla zwykłego użytkownika zwraca tylko jego własne zgłoszenia.
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Ticket>>> GetTickets()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role == "Admin")
        {
            return Ok(await _ticketService.GetAllTicketsAsync());
        }
        else
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _ticketService.GetUserTicketsAsync(userId));
        }
    }

    // Pobiera szczegóły konkretnego zgłoszenia po ID.
    // Sprawdza uprawnienia: Admin widzi wszystko, User tylko swoje.
    [HttpGet("{id}")]
    public async Task<ActionResult<Ticket>> GetTicket(int id)
    {
        var ticket = await _ticketService.GetTicketByIdAsync(id);
        if (ticket == null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (role != "Admin" && ticket.UserId != userId)
        {
            return Forbid();
        }

        return ticket;
    }

    // Tworzy nowe zgłoszenie.
    // Automatycznie przypisuje ID zalogowanego użytkownika.
    [HttpPost]
    public async Task<ActionResult<Ticket>> PostTicket(Ticket ticket)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        ticket.UserId = userId;
        
        var createdTicket = await _ticketService.CreateTicketAsync(ticket);

        return CreatedAtAction(nameof(GetTicket), new { id = createdTicket.Id }, createdTicket);
    }

    // Aktualizuje istniejące zgłoszenie.
    // Sprawdza uprawnienia (czy użytkownik jest właścicielem lub adminem).
    [HttpPut("{id}")]
    public async Task<IActionResult> PutTicket(int id, Ticket ticket)
    {
        if (id != ticket.Id) return BadRequest();

        var existingTicket = await _ticketService.GetTicketByIdAsync(id);
        if (existingTicket == null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (role != "Admin" && existingTicket.UserId != userId)
        {
            return Forbid();
        }

        // Aktualizacja tylko dozwolonych pól
        existingTicket.Title = ticket.Title;
        existingTicket.Description = ticket.Description;
        existingTicket.CategoryId = ticket.CategoryId;
        existingTicket.Status = ticket.Status;
        existingTicket.Priority = ticket.Priority;
        existingTicket.UpdatedAt = DateTime.Now;

        var result = await _ticketService.UpdateTicketAsync(id, existingTicket);
        if (!result) return NotFound();

        return NoContent();
    }

    // Usuwa zgłoszenie (tylko dla Administratora).
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var result = await _ticketService.DeleteTicketAsync(id);
        if (!result) return NotFound();

        return NoContent();
    }

    // Aktualizuje tylko status zgłoszenia.
    // Administrator może ustawić dowolny status.
    // Użytkownik może zmienić status tylko na "Closed" (potwierdzenie rozwiązania).
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        var ticket = await _ticketService.GetTicketByIdAsync(id);
        if (ticket == null) return NotFound();

        // Jeśli zgłoszenie jest już zamknięte, nie można zmieniać statusu
        if (ticket.Status == "Closed")
        {
            return BadRequest("Zgłoszenie jest już zamknięte i nie można zmienić jego statusu.");
        }

        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Jeśli to nie Admin, sprawdź czy to właściciel i czy ustawia status "Closed" lub "Open" (odrzucenie rozwiązania)
        if (role != "Admin")
        {
            if (ticket.UserId != userId)
            {
                return Forbid();
            }

            if (status != "Closed" && status != "Open")
            {
                return BadRequest("Użytkownik może zmienić status tylko na 'Closed' (potwierdzenie) lub 'Open' (odrzucenie).");
            }
        }
        else // Admin
        {
            if (status == "Closed")
            {
                return BadRequest("Administrator nie może zmienić statusu na 'Closed'. Tylko użytkownik może potwierdzić rozwiązanie.");
            }
        }

        var result = await _ticketService.UpdateTicketStatusAsync(id, status);
        if (!result) return NotFound();

        return NoContent();
    }

    // Pobiera statystyki zgłoszeń (ilość zgłoszeń w każdym statusie).
    // Wykorzystuje procedurę składowaną.
    [HttpGet("statistics")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<TicketStatistic>>> GetStatistics()
    {
        var stats = await _ticketService.GetTicketStatisticsAsync();
        return Ok(stats);
    }

    // Oblicza średni czas rozwiązywania zgłoszeń (w godzinach).
    // Wykorzystuje funkcję SQL.
    [HttpGet("average-resolution-time")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<double>> GetAverageResolutionTime()
    {
        var avgTime = await _ticketService.GetAverageResolutionTimeAsync();
        return Ok(new { AverageHours = avgTime });
    }
}
