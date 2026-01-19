using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Booking
    {
        public string Id { get; set; } = string.Empty;
        public string OrganizationId { get; set; } = string.Empty;
        public string HallId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Village { get; set; } = string.Empty;

        [JsonProperty("eventStartDate")]
        public DateTime EventStartDate { get; set; }

        [JsonProperty("eventEndDate")]
        public DateTime EventEndDate { get; set; }

        // Keep EventDate for backward compatibility
        public DateTime EventDate { get; set; }

        public string EventType { get; set; } = string.Empty;
        public string TimeSlot { get; set; } = string.Empty;
        public int GuestCount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string CustomerResponse { get; set; } = string.Empty;
        public DateTime? LastContactDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string Notes { get; set; } = string.Empty;
        public bool RoomsRequired { get; set; }
        public int RoomsCount { get; set; }
        public string HallName { get; set; } = string.Empty;
    }

    public class HandOverDetails
    {
        [Required]
        [MaxLength(100)]
        public string PersonName { get; set; } = string.Empty;
        
        [Range(0, double.MaxValue)]
        public decimal EbReading { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal AdvanceAmount { get; set; }
        
        [Required]
        public DateTime HandOverDate { get; set; }
    }

   

} 