using ServiceDesk.Models;

namespace ServiceDesk.Services;

// Interfejs serwisu autentykacji
public interface IAuthService
{
    Task<string> Register(User user); // Rejestracja użytkownika
    Task<string?> Login(string username, string password); // Logowanie użytkownika
}
