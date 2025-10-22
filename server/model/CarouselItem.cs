using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class CarouselItem
    {
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string OrganizationId { get; set; } = string.Empty;
        
        [Required]
        public string ImageUrl { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        [Range(1, int.MaxValue)]
        public int OrderPosition { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
} 