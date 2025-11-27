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

    //

    public class HandoverImage
    {
        public string Id { get; set; }
        public string BookingId { get; set; }
        public string OrganizationId { get; set; }
        public string Category { get; set; }
        public string? Description { get; set; }
        public string? Url { get; set; }
        public byte[]? ImageBytes { get; set; }
        public string? ContentType { get; set; }
        public DateTime UploadedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class HandoverImageUploadDto
    {
        public string? BookingId { get; set; }
        public string? OrganizationId { get; set; }
        public string Category { get; set; }
        public string? Description { get; set; }
        public IFormFile? File { get; set; }
    }
}