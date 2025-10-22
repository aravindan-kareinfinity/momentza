using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class TicketItem
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "open"; // open, in-progress, completed
        
        [Required]
        [MaxLength(100)]
        public string AssignedTo { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(10)]
        public string Priority { get; set; } = "medium"; // low, medium, high
        
        public string? BookingId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
} 