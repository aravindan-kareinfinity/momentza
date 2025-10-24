namespace Momantza.Models
{
    public class BookingFilters
    {
       // public string? OrganizationId { get; set; }
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        public string? Status { get; set; }
        
        public string? CustomerName { get; set; }
        
        public string? EventType { get; set; }
        
        public string? HallId { get; set; }
    }
} 