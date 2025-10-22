using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Reviews
    {
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string OrganizationId { get; set; } = string.Empty;
        
        public string? HallId { get; set; } // Optional - can be organization-wide review
        
        [Required]
        public string CustomerName { get; set; } = string.Empty;
        
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        
        [Required]
        public string Comment { get; set; } = string.Empty;
        
        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;
        
        public bool IsEnabled { get; set; }
    }
} 