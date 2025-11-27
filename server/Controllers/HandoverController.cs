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

        //// Handover images controller part

        [HttpPost("images")]
        public async Task<IActionResult> UploadHandoverImage(
    string bookingId,
    [FromForm] HandoverImageUploadDto dto)
        {
            try
            {
                _logger.LogInformation("Uploading handover image for booking: {BookingId}", bookingId);

                // Ensure correct bookingId is applied
                dto.BookingId = bookingId;

                // Validate booking exists
                var booking = await _bookingDataService.GetByIdAsync(bookingId);
                if (booking == null)
                    return NotFound(new { message = "Booking not found" });

                // Validate image file
                if (dto.File == null || dto.File.Length == 0)
                    return BadRequest(new { message = "Image file is required" });

                // Get organization ID from context (middleware fills this)
                var orgId = dto.OrganizationId;

                if (string.IsNullOrEmpty(orgId))
                {
                    orgId = HttpContext.Items["OrganizationId"]?.ToString();
                }

                if (string.IsNullOrEmpty(orgId))
                {
                    return BadRequest(new { message = "Missing organization id" });
                }

                dto.OrganizationId = orgId;

                var id = await _handoverDataService.UploadHandoverImageAsync(dto);

                if (id == null)
                    return StatusCode(500, new { message = "Failed to upload image" });

                return Ok(new { message = "Image uploaded successfully", id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading handover image");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("images")]
        public async Task<IActionResult> GetHandoverImages(string bookingId)
        {
            try
            {
                var booking = await _bookingDataService.GetByIdAsync(bookingId);
                if (booking == null)
                    return NotFound(new { message = "Booking not found" });

                var images = await _handoverDataService.GetImagesByBookingIdAsync(bookingId);
                return Ok(images);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching images for booking: {BookingId}", bookingId);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("images/{imageId}")]
        public async Task<IActionResult> GetHandoverImage(string bookingId, string imageId)
        {
            try
            {
                var img = await _handoverDataService.GetImageByIdAsync(imageId);

                if (img == null)
                    return NotFound(new { message = "Image not found" });

                if (img.ImageBytes == null)
                    return NotFound(new { message = "No image data" });

                return File(img.ImageBytes, img.ContentType ?? "application/octet-stream");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching image file");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteHandoverImage(string bookingId, string imageId)
        {
            try
            {
                var deleted = await _handoverDataService.DeleteHandoverImageAsync(imageId);
                if (!deleted)
                    return NotFound(new { message = "Image not found" });

                return Ok(new { message = "Image deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting handover image");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}