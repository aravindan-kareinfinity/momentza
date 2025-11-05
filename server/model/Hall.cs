using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Hall
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Location { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        [Required]
        [Range(1, int.MaxValue)]
        public int Capacity { get; set; }

        [Required]
        public string OrganizationId { get; set; } = string.Empty;

        public List<HallFeature> Features { get; set; } = new();

        public RateCard RateCard { get; set; } = new();

        public List<string> Gallery { get; set; } = new();

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class HallFeature
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal Charge { get; set; }
    }

    public class RateCard
    {
        [Range(0, double.MaxValue)]
        public decimal MorningRate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal EveningRate { get; set; }

        [Range(0, double.MaxValue)]
        public decimal FullDayRate { get; set; }
    }
}