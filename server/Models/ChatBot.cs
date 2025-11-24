namespace MomantzaApp.Models
{
    public class ChatRequest
    {
        public string message { get; set; }
        public string? hallid { get; set; }
        public DateTime? date { get; set; }
    }

    public class ChatResponse
    {
        public string reply { get; set; }
        public List<string> suggestedactions { get; set; } = new();
    }
}
