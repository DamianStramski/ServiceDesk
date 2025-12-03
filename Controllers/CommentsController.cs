using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Models;
using ServiceDesk.Services;
using System.Security.Claims;

namespace ServiceDesk.Controllers;

// Kontroler zarządzający komentarzami do zgłoszeń
[Authorize]
[Route("api/[controller]")]
[ApiController]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ITicketService _ticketService;

    public CommentsController(ICommentService commentService, ITicketService ticketService)
    {
        _commentService = commentService;
        _ticketService = ticketService;
    }

    // Pobiera wszystkie komentarze dla danego zgłoszenia.
    // Sprawdza uprawnienia: Admin widzi wszystko, User tylko komentarze do swoich zgłoszeń.
    // User nie widzi komentarzy oznaczonych jako wewnętrzne (IsInternal).
    [HttpGet("ticket/{ticketId}")]
    public async Task<ActionResult<IEnumerable<Comment>>> GetCommentsByTicketId(int ticketId)
    {
        var ticket = await _ticketService.GetTicketByIdAsync(ticketId);
        if (ticket == null)
        {
            return NotFound("Zgłoszenie nie zostało znalezione.");
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (role != "Admin" && ticket.UserId != userId)
        {
            return Forbid();
        }

        var comments = await _commentService.GetCommentsByTicketIdAsync(ticketId);

        // Filtrowanie komentarzy wewnętrznych dla zwykłych użytkowników
        if (role != "Admin")
        {
            comments = comments.Where(c => !c.IsInternal);
        }

        return Ok(comments);
    }

    // Dodaje nowy komentarz do zgłoszenia.
    // Automatycznie przypisuje ID zalogowanego użytkownika i datę utworzenia.
    [HttpPost]
    public async Task<ActionResult<Comment>> PostComment(Comment comment)
    {
        var ticket = await _ticketService.GetTicketByIdAsync(comment.TicketId);
        if (ticket == null)
        {
            return NotFound("Zgłoszenie nie zostało znalezione.");
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);

        if (role != "Admin" && ticket.UserId != userId)
        {
            return Forbid();
        }

        // Tylko admin może dodawać notatki wewnętrzne
        if (role != "Admin")
        {
            comment.IsInternal = false;
        }

        comment.UserId = userId;
        comment.CreatedAt = DateTime.Now;

        var createdComment = await _commentService.AddCommentAsync(comment);

        return CreatedAtAction(nameof(GetCommentsByTicketId), new { ticketId = createdComment.TicketId }, createdComment);
    }

    // Aktualizuje treść komentarza.
    // Użytkownik może edytować tylko swoje komentarze.
    // Administrator może edytować tylko swoje notatki/komentarze.
    [HttpPut("{id}")]
    public async Task<IActionResult> PutComment(int id, Comment comment)
    {
        if (id != comment.Id)
        {
            return BadRequest();
        }

        var existingComment = await _commentService.GetCommentByIdAsync(id);
        if (existingComment == null)
        {
            return NotFound();
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var role = User.FindFirstValue(ClaimTypes.Role);

        // Sprawdzenie uprawnień do edycji
        // Admin może edytować tylko swoje komentarze (UserId == userId)
        // User może edytować tylko swoje komentarze (UserId == userId)
        if (existingComment.UserId != userId)
        {
            return Forbid();
        }

        // Aktualizacja tylko treści komentarza i flagi IsInternal (tylko dla admina)
        existingComment.Content = comment.Content;
        
        if (role == "Admin")
        {
            existingComment.IsInternal = comment.IsInternal;
        }

        // Data utworzenia, ID zgłoszenia i ID użytkownika pozostają bez zmian

        await _commentService.UpdateCommentAsync(existingComment);

        return NoContent();
    }

    // Usuwa komentarz.
    // Użytkownik może usuwać tylko swoje komentarze.
    // Administrator może usuwać tylko swoje notatki/komentarze.
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var existingComment = await _commentService.GetCommentByIdAsync(id);
        if (existingComment == null)
        {
            return NotFound();
        }

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        
        // Sprawdzenie uprawnień do usuwania
        // Każdy może usunąć tylko swój komentarz
        if (existingComment.UserId != userId)
        {
            return Forbid();
        }

        await _commentService.DeleteCommentAsync(id);

        return NoContent();
    }
}
