using ServiceDesk.Models;

namespace ServiceDesk.Services;

// Interfejs serwisu obsługującego komentarze
public interface ICommentService
{
    Task<IEnumerable<Comment>> GetCommentsByTicketIdAsync(int ticketId); // Pobierz komentarze dla zgłoszenia
    Task<Comment> AddCommentAsync(Comment comment); // Dodaj komentarz
    Task<Comment?> GetCommentByIdAsync(int id); // Pobierz komentarz po ID
    Task UpdateCommentAsync(Comment comment); // Zaktualizuj komentarz
    Task DeleteCommentAsync(int id); // Usuń komentarz
}
