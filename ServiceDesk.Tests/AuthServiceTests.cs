using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ServiceDesk.Data;
using ServiceDesk.Models;
using ServiceDesk.Services;
using Xunit;

namespace ServiceDesk.Tests;

// Klasa testowa dla usługi uwierzytelniania
public class AuthServiceTests
{
    // Metoda pomocnicza tworząca kontekst bazy danych w pamięci (In-Memory)
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            // Używa unikalnej nazwy bazy danych (GUID), aby zapewnić izolację testów
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    // Metoda pomocnicza tworząca atrapę (Mock) konfiguracji
    private IConfiguration GetMockConfiguration()
    {
        var configurationMock = new Mock<IConfiguration>();
        var configSectionMock = new Mock<IConfigurationSection>();
        
        // Konfiguruje atrapę sekcji, aby zwracała sekretny klucz JWT
        configSectionMock.Setup(x => x.Value).Returns("my super secret key that is at least 64 characters long for hmac sha512 signature verification");
        // Konfiguruje atrapę konfiguracji, aby zwracała sekcję Token
        configurationMock.Setup(x => x.GetSection("AppSettings:Token")).Returns(configSectionMock.Object);
        
        return configurationMock.Object;
    }

    [Fact]
    // Test: Logowanie z nieprawidłowym hasłem powinno zwrócić null
    public async Task LoginWithWrongPassword_ReturnsNull()
    {
        // Aranżacja (Arrange)
        using var context = GetInMemoryDbContext();
        var config = GetMockConfiguration();
        var service = new AuthService(context, config);

        var user = new User
        {
            Username = "testuser",
            // Haszowanie poprawnego hasła
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword"),
            Role = "User"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Działanie (Act)
        var result = await service.Login("testuser", "wrongpassword");

        // Asercja (Assert)
        Assert.Null(result); // Oczekujemy null
    }

    [Fact]
    // Test: Rejestracja istniejącej nazwy użytkownika powinna zwrócić błąd
    public async Task RegisterExistingUsername_ReturnsError()
    {
        // Aranżacja (Arrange)
        using var context = GetInMemoryDbContext();
        var config = GetMockConfiguration();
        var service = new AuthService(context, config);

        var existingUser = new User
        {
            Username = "testuser",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            Role = "User"
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        // Działanie (Act)
        var newUser = new User
        {
            Username = "testuser",
            PasswordHash = "newpassword",
            Role = "User"
        };
        var result = await service.Register(newUser);

        // Asercja (Assert)
        Assert.Equal("Username already exists.", result); // Oczekujemy konkretnego komunikatu o błędzie
    }
}