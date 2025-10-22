using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class MasterDataItem
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string? Value { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal? Charge { get; set; }
        
        public string OrganizationId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
} 