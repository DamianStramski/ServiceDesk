using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceDesk.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseProgrammability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Tickets",
                type: "datetime2",
                nullable: true);

            // Stored Procedure: GetUserTickets
            migrationBuilder.Sql(@"
                CREATE PROCEDURE GetUserTickets
                    @UserId INT
                AS
                BEGIN
                    SELECT * FROM Tickets WHERE UserId = @UserId;
                END
            ");

            // Stored Procedure: UpdateTicketStatus
            migrationBuilder.Sql(@"
                CREATE PROCEDURE UpdateTicketStatus
                    @TicketId INT,
                    @NewStatus NVARCHAR(50)
                AS
                BEGIN
                    UPDATE Tickets
                    SET Status = @NewStatus, UpdatedAt = GETDATE()
                    WHERE Id = @TicketId;
                END
            ");

            // Function: GetTicketCount
            migrationBuilder.Sql(@"
                CREATE FUNCTION GetTicketCount(@UserId INT)
                RETURNS INT
                AS
                BEGIN
                    DECLARE @Count INT;
                    SELECT @Count = COUNT(*) FROM Tickets WHERE UserId = @UserId;
                    RETURN @Count;
                END
            ");

            // Trigger: trg_UpdateTicketTimestamp
            migrationBuilder.Sql(@"
                CREATE TRIGGER trg_UpdateTicketTimestamp
                ON Tickets
                AFTER UPDATE
                AS
                BEGIN
                    SET NOCOUNT ON;
                    IF NOT UPDATE(UpdatedAt)
                    BEGIN
                        UPDATE t
                        SET t.UpdatedAt = GETDATE()
                        FROM Tickets t
                        INNER JOIN inserted i ON t.Id = i.Id;
                    END
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS trg_UpdateTicketTimestamp");
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS GetTicketCount");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS UpdateTicketStatus");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS GetUserTickets");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Tickets");
        }
    }
}
