using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Communication
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string BookingId { get; set; } = string.Empty;
        
        [Required]
        public DateTime Date { get; set; }
        
        [Required]
        public DateTime Time { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string FromPerson { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string ToPerson { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(1000)]
        public string Detail { get; set; } = string.Empty;
        
        public string OrganizationId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
} 