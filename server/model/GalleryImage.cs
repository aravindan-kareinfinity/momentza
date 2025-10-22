using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class GalleryImage
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string OrganizationId { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Url { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Category { get; set; } = string.Empty;
        
        [Required]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public byte[]? ImageBytes { get; set; }
        
        public string? ContentType { get; set; }
    }
} 