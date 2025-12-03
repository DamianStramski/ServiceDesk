using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.Models;

// Model reprezentujący zgłoszenie serwisowe
public class Ticket
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } // Tytuł zgłoszenia
    
    [Required]
    public string Description { get; set; } // Opis problemu
    
    [MaxLength(50)]
    public string Status { get; set; } = "New"; // Status (New, Open, Resolved, Closed)
    
    [MaxLength(20)]
    public string Priority { get; set; } = "Medium"; // Priorytet (Low, Medium, High)
    
    public DateTime CreatedAt { get; set; } = DateTime.Now; // Data utworzenia
    public DateTime? UpdatedAt { get; set; } // Data ostatniej modyfikacji
    
    public int UserId { get; set; } // ID autora zgłoszenia
    public User? User { get; set; }
    
    public int CategoryId { get; set; } // ID kategorii (opcjonalne w tej wersji)
    public Category? Category { get; set; }
    
    public List<Comment>? Comments { get; set; } // Lista komentarzy do zgłoszenia
}
