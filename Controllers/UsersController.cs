using Microsoft.AspNetCore.Mvc;
using ServiceDesk.Models;
using ServiceDesk.Services;

namespace ServiceDesk.Controllers;

// Kontroler zarządzający użytkownikami (Rejestracja, Logowanie)
[Route("api/[controller]")]
[ApiController]
public class UsersController : ControllerBase
{
    private readonly IAuthService _authService;

    public UsersController(IAuthService authService)
    {
        _authService = authService;
    }

    // Rejestracja nowego użytkownika.
    // Jeśli nazwa użytkownika to "admin" (bez względu na wielkość liter), automatycznie przypisywana jest rola "Admin".
    // W przeciwnym razie przypisywana jest rola "User".
    [HttpPost("register")]
    public async Task<ActionResult<string>> Register(UserDto request)
    {
        var user = new User
        {
            Username = request.Username,
            PasswordHash = request.Password, // Hasło zostanie zahaszowane w serwisie AuthService
            Role = request.Username.ToLower() == "admin" ? "Admin" : "User",
            Tickets = new List<Ticket>()
        };

        var result = await _authService.Register(user);
        if (result == "Username already exists.")
        {
            return BadRequest("Użytkownik o podanej nazwie już istnieje.");
        }
        return Ok(result);
    }

    // Logowanie użytkownika.
    // Zwraca token JWT w przypadku powodzenia.
    [HttpPost("login")]
    public async Task<ActionResult<string>> Login(UserDto request)
    {
        var token = await _authService.Login(request.Username, request.Password);
        if (token == null)
        {
            return BadRequest("Błędna nazwa użytkownika lub hasło.");
        }
        return Ok(token);
    }
}

// Obiekt transferu danych (DTO) dla użytkownika
public class UserDto
{
    public string Username { get; set; }
    public string Password { get; set; }
}
