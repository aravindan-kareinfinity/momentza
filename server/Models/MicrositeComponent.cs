using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class MicrositeComponent
    {
        [Key]
        public string Id { get; set; } = string.Empty;

                [Required]
        public string Type { get; set; } = string.Empty;
        
        [Required]
        public int OrderPosition { get; set; }
        
        [Required]
        public bool IsActive { get; set; } = true;
        
        public string? OrganizationId { get; set; }
        
        // Configuration data stored as flexible object (can be JSON object or MicrositeComponentConfig)
        public object? Config { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
