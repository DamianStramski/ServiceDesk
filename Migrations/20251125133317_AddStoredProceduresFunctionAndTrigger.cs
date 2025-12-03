using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceDesk.Migrations
{
    /// <inheritdoc />
    public partial class AddStoredProceduresFunctionAndTrigger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Stored Procedure 1: GetTicketStatistics
            migrationBuilder.Sql(@"
                CREATE PROCEDURE GetTicketStatistics
                AS
                BEGIN
                    SET NOCOUNT ON;
                    SELECT 
                        Status,
                        COUNT(*) as Count
                    FROM Tickets
                    GROUP BY Status
                END
            ");

            // Stored Procedure 2: GetUserTicketsWithDetails
            migrationBuilder.Sql(@"
                CREATE PROCEDURE GetUserTicketsWithDetails
                    @UserId INT
                AS
                BEGIN
                    SET NOCOUNT ON;
                    SELECT 
                        t.Id, 
                        t.Title, 
                        t.Description, 
                        t.Status, 
                        t.CreatedAt, 
                        t.UpdatedAt,
                        u.Username,
                        c.Name as CategoryName,
                        (SELECT COUNT(*) FROM Comments WHERE TicketId = t.Id) as CommentCount
                    FROM Tickets t
                    INNER JOIN Users u ON t.UserId = u.Id
                    INNER JOIN Categories c ON t.CategoryId = c.Id
                    WHERE t.UserId = @UserId
                    ORDER BY t.CreatedAt DESC
                END
            ");

            // Function: CalculateAverageResolutionTime
            migrationBuilder.Sql(@"
                CREATE FUNCTION dbo.CalculateAverageResolutionTime()
                RETURNS FLOAT
                AS
                BEGIN
                    DECLARE @AvgHours FLOAT
                    
                    SELECT @AvgHours = AVG(DATEDIFF(HOUR, CreatedAt, UpdatedAt))
                    FROM Tickets
                    WHERE Status = 'Resolved' AND UpdatedAt IS NOT NULL
                    
                    RETURN ISNULL(@AvgHours, 0)
                END
            ");

            // Trigger: UpdateTicketModifiedDate
            migrationBuilder.Sql(@"
                CREATE TRIGGER UpdateTicketModifiedDate
                ON Tickets
                AFTER UPDATE
                AS
                BEGIN
                    SET NOCOUNT ON;
                    
                    UPDATE Tickets
                    SET UpdatedAt = GETDATE()
                    FROM Tickets t
                    INNER JOIN inserted i ON t.Id = i.Id
                    WHERE t.UpdatedAt = i.UpdatedAt OR i.UpdatedAt IS NULL
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop in reverse order
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS UpdateTicketModifiedDate");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS dbo.CalculateAverageResolutionTime");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS GetUserTicketsWithDetails");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS GetTicketStatistics");
        }
    }
}
