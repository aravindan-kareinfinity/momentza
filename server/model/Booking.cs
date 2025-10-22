using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Booking
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string OrganizationId { get; set; } = string.Empty;
        
        [Required]
        public string HallId { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string CustomerName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string CustomerEmail { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string CustomerPhone { get; set; } = string.Empty;
        
        [Required]
        public DateTime EventDate { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string EventType { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string TimeSlot { get; set; } = string.Empty; // morning, evening, fullday
        
        [Required]
        [Range(1, int.MaxValue)]
        public int GuestCount { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal TotalAmount { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "pending"; // pending, confirmed, active, cancelled
        
        public bool IsActive { get; set; } = false;
        
        [MaxLength(500)]
        public string? CustomerResponse { get; set; }
        
        public DateTime? LastContactDate { get; set; }
        
        public HandOverDetails? HandOverDetails { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class HandOverDetails
    {
        [Required]
        [MaxLength(100)]
        public string PersonName { get; set; } = string.Empty;
        
        [Range(0, double.MaxValue)]
        public decimal EbReading { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal AdvanceAmount { get; set; }
        
        [Required]
        public DateTime HandOverDate { get; set; }
    }
} 