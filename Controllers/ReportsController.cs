using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ServiceDesk.Services;

namespace ServiceDesk.Controllers;

// Kontroler odpowiedzialny za generowanie raportów
[Route("api/[controller]")]
[ApiController]
public class ReportsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public ReportsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    // Endpoint do generowania raportu PDF z listą zgłoszeń (tylko dla Administratora)
    [HttpGet("tickets-pdf")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetTicketsReport()
    {
        // Pobranie wszystkich zgłoszeń z serwisu
        var tickets = await _ticketService.GetAllTicketsAsync();

        // Tworzenie dokumentu PDF przy użyciu biblioteki QuestPDF
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11));

                // Nagłówek raportu
                page.Header()
                    .Text("Raport Zgłoszeń ServiceDesk")
                    .SemiBold().FontSize(20).FontColor(Colors.Blue.Medium);

                // Treść raportu - tabela
                page.Content()
                    .PaddingVertical(1, Unit.Centimetre)
                    .Table(table =>
                    {
                        // Definicja kolumn
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(40); // ID
                            columns.RelativeColumn(3);  // Tytuł
                            columns.RelativeColumn(2);  // Status
                            columns.RelativeColumn(2);  // Priorytet
                            columns.RelativeColumn(2);  // Data
                        });

                        // Nagłówek tabeli
                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("ID");
                            header.Cell().Element(CellStyle).Text("Tytuł");
                            header.Cell().Element(CellStyle).Text("Status");
                            header.Cell().Element(CellStyle).Text("Priorytet");
                            header.Cell().Element(CellStyle).Text("Data");

                            static IContainer CellStyle(IContainer container)
                            {
                                return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
                            }
                        });

                        // Wiersze tabeli z danymi
                        foreach (var ticket in tickets)
                        {
                            table.Cell().Element(CellStyle).Text(ticket.Id.ToString());
                            table.Cell().Element(CellStyle).Text(ticket.Title);
                            table.Cell().Element(CellStyle).Text(TranslateStatus(ticket.Status));
                            table.Cell().Element(CellStyle).Text(TranslatePriority(ticket.Priority));
                            table.Cell().Element(CellStyle).Text(ticket.CreatedAt.ToString("yyyy-MM-dd HH:mm"));

                            static IContainer CellStyle(IContainer container)
                            {
                                return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten3).PaddingVertical(5);
                            }
                        }
                    });

                // Stopka z numeracją stron
                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Strona ");
                        x.CurrentPageNumber();
                    });
            });
        });

        // Generowanie pliku i zwrot jako odpowiedź
        var pdf = document.GeneratePdf();
        return File(pdf, "application/pdf", $"Raport_Zgloszen_{DateTime.Now:yyyyMMdd}.pdf");
    }

    // Metoda pomocnicza do tłumaczenia statusów na język polski
    private string TranslateStatus(string status)
    {
        return status switch
        {
            "New" => "Nowy",
            "Open" => "Otwarty",
            "Resolved" => "Rozwiązany",
            "Closed" => "Zamknięty",
            _ => status
        };
    }

    // Metoda pomocnicza do tłumaczenia priorytetów na język polski
    private string TranslatePriority(string? priority)
    {
        return priority switch
        {
            "Low" => "Niski",
            "Medium" => "Średni",
            "High" => "Wysoki",
            _ => priority ?? "-"
        };
    }
}
