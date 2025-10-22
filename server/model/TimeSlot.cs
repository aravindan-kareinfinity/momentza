using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class TimeSlot
    {
        [Required]
        [MaxLength(50)]
        public string Value { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Label { get; set; } = string.Empty;
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }
    }
} 