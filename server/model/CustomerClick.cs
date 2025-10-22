using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class CustomerClick
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string CustomerId { get; set; } = string.Empty;
        
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
        [Range(1, int.MaxValue)]
        public int GuestCount { get; set; }
        
        [Required]
        [MaxLength(1000)]
        public string Message { get; set; } = string.Empty;
        
        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        
        public string OrganizationId { get; set; } = string.Empty;

        [Range(1, 5)]
        public int? Rating { get; set; }
        
        public byte[]? ImageBytes { get; set; }
        
        public string? ContentType { get; set; }
        
        [MaxLength(100)]
        public string? BoyName { get; set; }
        
        [MaxLength(100)]
        public string? GirlName { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
} 