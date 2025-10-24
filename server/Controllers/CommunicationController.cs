using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using MomantzaApp;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]



    public class CommunicationController : ControllerBase
    {
        private readonly ICommunicationDataService _communicationService;

        public CommunicationController(ICommunicationDataService communicationService)
        {
            _communicationService = communicationService;
        }

        [HttpPost("communication")]
        public IActionResult Communication([FromBody] CommunicationRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest(new { error = "Invalid or empty request" });

                Console.WriteLine($"Request received: {System.Text.Json.JsonSerializer.Serialize(request)}");
                return Ok(new { message = "Communication received", request });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
            }
        }


        [HttpGet]
        public async Task<ActionResult<List<Communication>>> GetAll()
        {
            try
            {
                var communications = await _communicationService.GetAllAsync();
                return Ok(communications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Communication>> GetById(string id)
        {
            try
            {
                var communication = await _communicationService.GetByIdAsync(id);
                if (communication == null)
                {
                    return NotFound(new { error = "Communication not found" });
                }
                return Ok(communication);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(Communication communication)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdCommunication = await _communicationService.CreateAsync(communication);
                return CreatedAtAction(nameof(GetById), new { id = createdCommunication.Id }, createdCommunication);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Communication>> Update(string id, Communication communication)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var updatedCommunication = await _communicationService.UpdateAsync(id, communication);
                return Ok(updatedCommunication);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _communicationService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { error = "Communication not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<List<Communication>>> GetByBookingId(string bookingId)
        {
            try
            {
                var communications = await _communicationService.GetCommunicationsByBookingIdAsync(bookingId);
                return Ok(communications);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("booking/{bookingId}/communication")]
        public async Task<IActionResult> GetCommunicationsByBooking(string bookingId)
        {
            var comms = await _communicationService.GetCommunicationsByBookingIdAsync(bookingId);
            return Ok(comms);
        }
    }
}

namespace MomantzaApp
{
    public class CommunicationRequest
    {
    }
}