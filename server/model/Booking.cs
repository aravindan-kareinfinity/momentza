using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        [JsonProperty("handoverStartDatde")]
        public DateTime HandoverStartDate { get; set; }



        // Keep EventDate for backward compatibility
        public DateTime EventDate { get; set; }

        public string EventType { get; set; } = string.Empty;
        public string TimeSlot { get; set; } = string.Empty;
        public int GuestCount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public string? CustomerResponse { get; set; }
        public DateTime? LastContactDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string Notes { get; set; } = string.Empty;
        public bool RoomsRequired { get; set; }
        public int RoomsCount { get; set; }
        public string HallName { get; set; } = string.Empty;

        [Column(TypeName = "jsonb")]
        public  RoomsInfo RoomDetails  { get; set; }
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
    //new
    public class RoomsInfo
    {
        public RoomCharge Charges { get; set; } = new();
        public Rooms RoomsCount { get; set; } = new();
       
    }

    public class RoomCharge
    {
        public int AcRoomCharges { get; set; } = new();

        public int NonAcRoomCharges { get; set; } = new();

        public int TotalRoomCharges { get; set; } = new();
    }

    public class Rooms
    {
        public int Free { get; set; } = new();

        public int RentedAc { get; set; } = new();

        public int RentedNonAc { get; set; } = new();
    }

} 