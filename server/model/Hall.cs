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

        //[Required]
        //[Range(1, int.MaxValue)]
        public int Capacity { get; set; }

        [Required]
        public string OrganizationId { get; set; } = string.Empty;

        public HallAmenities Amenities { get; set; } = new();

        public List<HallFeature> Features { get; set; } = new();

        public RateCard RateCard { get; set; } = new();

        public Coordinates Coordinates { get; set; } = new();

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

    public class Coordinates
    {
        [Range(0, double.MaxValue)]
        public decimal lat { get; set; }

        [Range(0, double.MaxValue)]

        public decimal lng { get; set; }
    }

    public class HallAmenities
    {
        public string FoodType { get; set; } = "both";
        public CapacityInfo Capacity { get; set; } = new();
        public RoomInfo Rooms { get; set; } = new();
        public FacilityInfo Facilities { get; set; } = new();
        public List<string> rules { get; set; } = new();
    }

    public class CapacityInfo
    {
        public int Hall { get; set; }
        public int Dining { get; set; }
        public int Parking { get; set; }
    }

    public class RoomInfo
    {
        public int Free { get; set; }
        public int RentedAc { get; set; }
        public int RentedNonAc { get; set; }
    }

    public class FacilityInfo
    {
        public bool Generator { get; set; }
        public bool AirConditioning { get; set; }
    }
}