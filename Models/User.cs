using System.Net.Sockets;
using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.Models;

// Model reprezentujący użytkownika systemu
public class User
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Username { get; set; } // Nazwa użytkownika (unikalna)
    
    [Required]
    public string PasswordHash { get; set; } // Zahaszowane hasło
    
    [MaxLength(20)]
    public string Role { get; set; } = "User"; // Rola użytkownika (Admin lub User)
    
    public List<Ticket> Tickets { get; set; } // Lista zgłoszeń utworzonych przez użytkownika
}
