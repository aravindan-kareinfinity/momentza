using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class BillingSettings
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string GstNumber { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;
        
        [Required]
        [Range(0, 100)]
        public decimal TaxPercentage { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string HsnNumber { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string BankAccount { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(20)]
        public string IfscNumber { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string BankName { get; set; } = string.Empty;
        
        public string OrganizationId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
} 