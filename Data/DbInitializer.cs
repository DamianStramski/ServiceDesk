using ServiceDesk.Models;

namespace ServiceDesk.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        // Wyszukaj kategorie
        if (!context.Categories.Any())
        {
            var categories = new Category[]
            {
                new Category { Name = "Sprzęt (Hardware)" },
                new Category { Name = "Oprogramowanie (Software)" },
                new Category { Name = "Sieć i Internet" },
                new Category { Name = "Dostęp i Konta" },
                new Category { Name = "Inne" }
            };

            foreach (var c in categories)
            {
                context.Categories.Add(c);
            }
            context.SaveChanges();
        }

        // Wyszukaj admina
        if (!context.Users.Any(u => u.Username == "admin"))
        {
            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Role = "Admin",
                Tickets = new List<Ticket>()
            };

            context.Users.Add(adminUser);
            context.SaveChanges();
        }
    }
}
