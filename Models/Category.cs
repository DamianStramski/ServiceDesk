
using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.Models;

public class Category
{
    public int Id { get; set; }
    [Required]
    [MaxLength(50)]
    public string Name { get; set; }
    public List<Ticket> Tickets { get; set; }
}
