using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class InventoryItem
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        public int Unit { get; set; } = 0;

        [Required]
        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        public string orgId { get; set; } = string.Empty;

        public string BookingId { get; set; } = string.Empty;
            
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}