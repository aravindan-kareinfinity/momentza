using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class ServiceItem
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string HsnCode { get; set; } = string.Empty;
        
        [Required]
        [Range(0, 100)]
        public decimal TaxPercentage { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal BasePrice { get; set; }
        
        public bool IsActive { get; set; }
        
        public string OrganizationId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
} 