using System;
using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.Models;

// Model reprezentujący komentarz do zgłoszenia
public class Comment
{
    public int Id { get; set; }
    
    [Required]
    public string Content { get; set; } // Treść komentarza
    
    public DateTime CreatedAt { get; set; } = DateTime.Now; // Data dodania
    
    public int TicketId { get; set; } // ID zgłoszenia, do którego należy komentarz
    public Ticket? Ticket { get; set; }
    
    public int UserId { get; set; } // ID autora komentarza
    public User? User { get; set; }

    public bool IsInternal { get; set; } = false; // Czy notatka jest wewnętrzna (tylko dla admina)
}
