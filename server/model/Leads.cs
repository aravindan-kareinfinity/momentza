namespace MomantzaApp.model
{
    public class Leads
    {
        //public string Id { get; set; }

        public string Name { get; set; }
        public string Mobile { get; set; }
        public string? Email { get; set; }
        public string? City { get; set; }
        public string? Message { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
