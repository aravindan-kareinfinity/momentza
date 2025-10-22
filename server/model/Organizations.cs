using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Organizations
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string ContactPerson { get; set; } = string.Empty;
        
        [MaxLength(20)]
        public string ContactNo { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string DefaultDomain { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string? CustomDomain { get; set; }
        
        [MaxLength(500)]
        public string? Logo { get; set; }
        
        public OrganizationTheme Theme { get; set; } = new();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class OrganizationTheme
    {
        [MaxLength(7)]
        public string PrimaryColor { get; set; } = "#8B5CF6";
        
        [MaxLength(7)]
        public string SecondaryColor { get; set; } = "#F3F4F6";
    }
} 