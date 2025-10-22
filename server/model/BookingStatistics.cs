namespace Momantza.Models
{
    public class BookingStatistics
    {
        public int NewLeads { get; set; }
        
        public int RejectedLeads { get; set; }
        
        public int ConfirmedLeads { get; set; }
        
        public int UpcomingEvents { get; set; }
        
        public int HappeningEvents { get; set; }
        
        public int TotalBookings { get; set; }
        
        public decimal TotalRevenue { get; set; }
    }
} 