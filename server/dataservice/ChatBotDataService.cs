using System.Text.Json;
using Momantza.Models;
using Momantza.Services;
using MomantzaApp.Models;

namespace MomantzaApp.dataservice
{

    public interface IChatBotDataService
    {
        Task<ChatResponse> AskAsync(ChatRequest request);
    }
    public class ChatBotDataService : IChatBotDataService
    {
        private readonly IConfiguration _config;   // used to read config values (like API keys)
        private readonly IHallDataService _hallData;
        private readonly HttpClient _http;

        public ChatBotDataService(IConfiguration config, IHallDataService hallData)
        {
            _config = config;
            _hallData = hallData;
            _http = new HttpClient();
        }

        public async Task<ChatResponse> AskAsync(ChatRequest request)
        {
            //var apiKey = _config["Gemini:ApiKey"];

            if (request == null || string.IsNullOrWhiteSpace(request.message))
            {
                throw new Exception("User message is required.");
            }

            // Validate API key separately
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new Exception("Gemini API key missing.");
            }

            string hallInfo = await BuildHallInfoAsync(request);

            // Endpoint URL
            var url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent";

            // prompt training 
            var prompt = $@"
                You are MOMENTZA, an intelligent and friendly assistant for a hall booking management system.

                Your goals:
                1. Help users with hall availability, pricing, date checks, capacity, and booking-related questions.
                2. Give short, clear, human-like responses.
                3. Use the Hall Information provided below whenever relevant.
                4. If hall information is missing or 'No hall selected', politely guide the user to select a hall.
                5. Never make up hall details or availability. Only use what is provided.

                ---------------------------------------
                Hall Information:
                {hallInfo}
                ---------------------------------------

                USER MESSAGE:
                {request.message}

                ---------------------------------------

                Your response rules:
                - If the user greets (hi, hello, how are you, etc.): respond politely and ask how you can help with hall bookings.
                - If the user asks about a hall: use the hall info above.
                - If the user asks about availability:
                    - Use the provided slots.
                    - If no hall is selected, tell the user to choose a hall first.
                - If the user asks about price: respond with the hall's rates.
                - If the user asks general questions about booking: answer clearly.
                - Keep responses under 4 lines unless the user requests more details.
                - Always behave like a helpful booking assistant.

                Generate your final response now:
            ";

            var payload = new
            {
                contents = new[]
                {
                    new {
                        role = "user",
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            //Console.WriteLine("API KEY = " + apiKey);
            //Console.WriteLine("Calling Gemini: " + url);

            _http.DefaultRequestHeaders.Clear();
            _http.DefaultRequestHeaders.Add("x-goog-api-key", apiKey);

            // Call Gemini
            var response = await _http.PostAsJsonAsync(url, payload);
            string json = await response.Content.ReadAsStringAsync();

            // Parse Gemini response JSON
            using var doc = JsonDocument.Parse(json);

            // If Gemini responded with error
            if (doc.RootElement.TryGetProperty("error", out var errorObj))
            {
                string errorMessage = errorObj.GetProperty("message").GetString();
                return new ChatResponse
                {
                    reply = $"Gemini API Error: {errorMessage}",
                    suggestedactions = new List<string>()
                };
            }

            // Normal response
            var candidate = doc.RootElement.GetProperty("candidates")[0];
            var content = candidate.GetProperty("content");
            var part = content.GetProperty("parts")[0];
            string aiReply = part.GetProperty("text").GetString();

            Console.WriteLine("Loaded API KEY: test_key" );

            // Return final chatbot response
            return new ChatResponse
            {
                reply = aiReply,
                suggestedactions = GenerateSuggestedActions(request)
            };

        }

        public async Task<string> FindHallNameInTextAsync (string message)
        {
            if (string.IsNullOrEmpty(message))
                return null;
            

            var text = message.ToLowerInvariant();

            var hallList = await _hallData.GetAllHallsAsync();
            if (hallList == null || hallList.Count == 0)
                return null;

            string hallMatch = null;
            foreach(var hall in hallList)
            {
                if (string.IsNullOrWhiteSpace(hall.Name)) continue;
                var hallNameLower = hall.Name.ToLowerInvariant().Trim();

                if (text.Contains(hallNameLower))
                {
                    // pick the longest match to prefer multi-word names over single-word ones that may be substrings
                    if (hallMatch == null || hallNameLower.Length > hallMatch.Length)
                        hallMatch = hallNameLower;
                }
            }
            return hallMatch;
        }

        private async Task<string> BuildHallInfoAsync(ChatRequest req)
        {
            Hall? hall = null;

            // 1) If hall id supplied, prefer that (explicit)
            if (!string.IsNullOrEmpty(req.hallid))
            {
                hall = await _hallData.GetHallByIdAsync(req.hallid);
            }

            // 2) If no hall found from id, try to detect a hall name from the user's message
            if (hall == null)
            {
                var hallName = await FindHallNameInTextAsync(req.message ?? "");
                if (!string.IsNullOrEmpty(hallName))
                {
                    hall = await _hallData.GetHallsByNameAsync(hallName);
                }
            }

            // 3) If still not found, return a clear "not found" result so the assistant can ask for clarification
            if (hall == null)
                return "Hall not found.";

            // 4) Build base info string (name, capacity, location)
            string info = $"Hall: {hall.Name}, Capacity: {hall.Capacity}, Location: {hall.Location}.";

            // 5) If user provided a date, append availability for that date
            if (req.date != null)
            {
                var slots = await _hallData.GetAvailableTimeSlotsAsync(hall.Id, req.date.Value);
                if (slots == null || slots.Count == 0)
                {
                    info += $" No available slots on {req.date:yyyy-MM-dd}.";
                }
                else
                {
                    // join slot labels (e.g. "10:00-12:00", "14:00-16:00")
                    var slotLabels = string.Join(", ", slots.Select(s => s.Label));
                    info += $" Available Time Slots: {slotLabels}.";
                }
            }

            return info;
        }


        private List<string> GenerateSuggestedActions(ChatRequest req)
        {
            var list = new List<string>();

            if (!string.IsNullOrEmpty(req.hallid))
            {
                list.Add("Check availability for another date");
                list.Add("View hall pricing");
                list.Add("View hall gallery");
            }
            else
            {
                list.Add("Show available halls");
                list.Add("Search halls by capacity");
            }

            list.Add("Contact support");

            return list;
        }
    
    }
}
