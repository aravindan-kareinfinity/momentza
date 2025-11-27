namespace MomantzaApp.model
{
    public class FeatureItem
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        //public string? Description { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string OrganizationId { get; set; } = "";
        public string BookingId { get; set; } = "";
    }
}