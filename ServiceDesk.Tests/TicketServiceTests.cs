using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ServiceDesk.Data;
using ServiceDesk.Models;
using ServiceDesk.Services;
using Xunit;

namespace ServiceDesk.Tests;

public class TicketServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateTicket_SetsCreatedAtAndPreservesUserId()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var service = new TicketService(context);

        var user = new User { Id = 1, Username = "testuser", PasswordHash = "hash", Role = "User" };
        var category = new Category { Id = 1, Name = "IT Support" };
        context.Users.Add(user);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var ticket = new Ticket
        {
            Title = "Test Ticket",
            Description = "Test Description",
            UserId = user.Id,
            CategoryId = category.Id
        };

        // Act
        var result = await service.CreateTicketAsync(ticket);

        // Assert
        Assert.NotEqual(default(DateTime), result.CreatedAt);
        Assert.Equal(user.Id, result.UserId);
        Assert.Equal("Test Ticket", result.Title);
    }

    [Fact]
    public async Task GetUserTickets_ReturnsOnlyUserTickets()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var service = new TicketService(context);

        var user1 = new User { Id = 1, Username = "user1", PasswordHash = "hash", Role = "User" };
        var user2 = new User { Id = 2, Username = "user2", PasswordHash = "hash", Role = "User" };
        var category = new Category { Id = 1, Name = "IT Support" };
        
        context.Users.AddRange(user1, user2);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        context.Tickets.Add(new Ticket { Title = "Ticket 1", Description = "Desc", UserId = 1, CategoryId = 1 });
        context.Tickets.Add(new Ticket { Title = "Ticket 2", Description = "Desc", UserId = 1, CategoryId = 1 });
        context.Tickets.Add(new Ticket { Title = "Ticket 3", Description = "Desc", UserId = 2, CategoryId = 1 });
        await context.SaveChangesAsync();

        // Act
        var result = await service.GetUserTicketsAsync(1);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, ticket => Assert.Equal(1, ticket.UserId));
    }

    [Fact]
    public async Task UpdateTicketStatus_ChangesStatusCorrectly()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var service = new TicketService(context);

        var user = new User { Id = 1, Username = "testuser", PasswordHash = "hash", Role = "User" };
        var category = new Category { Id = 1, Name = "IT Support" };
        context.Users.Add(user);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var ticket = new Ticket
        {
            Title = "Test",
            Description = "Test",
            UserId = 1,
            CategoryId = 1,
            Status = "New"
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        // Act
        var result = await service.UpdateTicketStatusAsync(ticket.Id, "In Progress");

        // Assert
        Assert.True(result);
        var updatedTicket = await context.Tickets.FindAsync(ticket.Id);
        Assert.Equal("In Progress", updatedTicket.Status);
        Assert.NotNull(updatedTicket.UpdatedAt);
    }
}
