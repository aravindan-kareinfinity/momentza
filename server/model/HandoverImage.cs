namespace MomantzaApp.model
{
    public class HandoverImage
    {
        public string Id { get; set; }
        public string BookingId { get; set; }
        public Guid OrganizationId { get; set; }
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
        public string BookingId { get; set; }
        public Guid OrganizationId { get; set; }
        public string Category { get; set; }
        public string? Description { get; set; }
        public IFormFile? File { get; set; }
    }
}
