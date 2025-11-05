using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/bookings/{bookingId}/handover")]
    public class HandoverController : ControllerBase
    {
        private readonly IHandoverDataService _handoverDataService;
        private readonly IBookingDataService _bookingDataService;
        private readonly ILogger<HandoverController> _logger;

        public HandoverController(IHandoverDataService handoverDataService, IBookingDataService bookingDataService, ILogger<HandoverController> logger)
        {
            _handoverDataService = handoverDataService;
            _bookingDataService = bookingDataService;
            _logger = logger;
        }

        [HttpPost]
        [HttpPut]
        [HttpPatch]
        public async Task<IActionResult> UpsertHandover(string bookingId, [FromBody] HandoverRequest request)
        {
            try
            {
                _logger.LogInformation("Handover request received for booking: {BookingId} with data: {@Request}", bookingId, request);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state for handover request: {@ModelState}", ModelState);
                    return BadRequest(ModelState);
                }

                // Verify booking exists
                var booking = await _bookingDataService.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    _logger.LogWarning("Booking not found: {BookingId}", bookingId);
                    return NotFound(new { message = "Booking not found" });
                }

                _logger.LogInformation("Booking found: {BookingId}, proceeding with handover", bookingId);

                var success = await _handoverDataService.UpsertHandoverAsync(bookingId, request);
                if (!success)
                {
                    _logger.LogError("Failed to save handover details for booking: {BookingId}", bookingId);
                    return StatusCode(500, new { message = "Failed to save handover details" });
                }

                // Update booking status to active
                var statusUpdated = await _bookingDataService.UpdateStatusAsync(bookingId, "active");
                  if (!statusUpdated)
                  {
                      _logger.LogWarning("Handover saved but failed to update booking status for: {BookingId}", bookingId);
                  }

                  _logger.LogInformation("Handover completed successfully for booking: {BookingId}", bookingId);

                  return Ok(new
                  {
                      message = "Handover details saved successfully",
                      bookingId = bookingId,
                      handoverDetails = request
                  });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Internal server error during handover for booking: {BookingId}", bookingId);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetHandover(string bookingId)
        {
            try
            {
                // Verify booking exists
                var booking = await _bookingDataService.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    return NotFound(new { message = "Booking not found" });
                }

                var handover = await _handoverDataService.GetByBookingIdAsync(bookingId);
                if (handover == null)
                {
                    return NotFound(new { message = "Handover details not found" });
                }

                return Ok(handover);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting handover for booking: {BookingId}", bookingId);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteHandover(string bookingId)
        {
            try
            {
                // Verify booking exists
                var booking = await _bookingDataService.GetByIdAsync(bookingId);
                if (booking == null)
                {
                    return NotFound(new { message = "Booking not found" });
                }

                var success = await _handoverDataService.DeleteByBookingIdAsync(bookingId);
                if (!success)
                {
                    return NotFound(new { message = "Handover details not found" });
                }

                return Ok(new { message = "Handover details deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting handover for booking: {BookingId}", bookingId);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}