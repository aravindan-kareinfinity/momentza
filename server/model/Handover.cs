namespace Momantza.Models
{
    public class Handover
    {
        public string BookingId { get; set; } = string.Empty;
        public decimal AdvanceAmount { get; set; }
        public int EbReading { get; set; }
        public DateTime HandOverDate { get; set; }
        public string PersonName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class HandoverRequest
    {
        public decimal AdvanceAmount { get; set; }
        public int EbReading { get; set; }
        public DateTime HandOverDate { get; set; }
        public string PersonName { get; set; } = string.Empty;
    }
}