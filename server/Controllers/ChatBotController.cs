using MediatR;
using Microsoft.AspNetCore.Mvc;
using MomantzaApp.dataservice;
using MomantzaApp.Models;

namespace MomantzaApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class ChatBotController : ControllerBase
    {
        private readonly IChatBotDataService _chatBotService;

        public ChatBotController(IChatBotDataService chatBotService)
        {
            _chatBotService = chatBotService;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask (ChatRequest req)
        {
            try
            {
                if (req == null || string.IsNullOrWhiteSpace(req.message))
                {
                    return BadRequest(new { message = "Message cannot be empty" });
                }

                var response = await _chatBotService.AskAsync(req);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Internal server error",
                    error = ex.Message
                });
            }
        }
    }
}
