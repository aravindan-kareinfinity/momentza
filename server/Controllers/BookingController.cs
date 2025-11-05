using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/bookings")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingDataService _bookingDataService;

        public BookingController(IBookingDataService bookingDataService)
        {
            _bookingDataService = bookingDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var bookings = await _bookingDataService.GetAllAsync();
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var booking = await _bookingDataService.GetByIdAsync(id);
                if (booking == null)
                {
                    return NotFound(new { message = "Booking not found" });
                }
                return Ok(booking);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(Booking booking)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdBooking = await _bookingDataService.CreateBookingAsync(booking);
                return CreatedAtAction(nameof(GetById), new { id = createdBooking.Id }, createdBooking);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Booking booking)
        {
            try
            {
                booking.Id = id;
                var success = await _bookingDataService.UpdateAsync(booking);
                if (!success)
                {
                    return NotFound(new { message = "Booking not found" });
                }
                return Ok(await _bookingDataService.GetByIdAsync(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var success = await _bookingDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Booking not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(string userId)
        {
            try
            {
                var bookings = await _bookingDataService.GetByUserAsync(userId);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("hall/{hallId}")]
        public async Task<IActionResult> GetByHall(string hallId)
        {
            try
            {
                var bookings = await _bookingDataService.GetByHallIdAsync(hallId);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("organization/{organizationId}")]
        public async Task<IActionResult> GetByOrganization(string organizationId)
        {
            try
            {
                var bookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("date/{date}")]
        public async Task<IActionResult> GetByDate(DateTime date)
        {
            try
            {
                var bookings = await _bookingDataService.GetByDateAsync(date);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            try
            {
                var bookings = await _bookingDataService.GetByStatusAsync(status);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search(BookingSearchRequest request)
        {
            try
            {


                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var filters = new BookingFilters
                {
                    OrganizationId = request.OrganizationId,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    Status = request.Status,
                    CustomerName = request.CustomerName,
                    EventType = request.EventType,
                    HallId = request.HallId
                };

                var bookings = await _bookingDataService.SearchBookingsAsync(request.OrganizationId ?? "", filters);
                return Ok(bookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics([FromQuery] string? organizationId = null)
        {
            try
            {
                var statistics = await _bookingDataService.GetBookingStatisticsAsync(organizationId ?? "");
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(string id, UpdateStatusRequest request)
        {
            try
            {
                var success = await _bookingDataService.UpdateStatusAsync(id, request.Status);
                if (!success)
                {
                    return NotFound(new { message = "Booking not found" });
                }
                return Ok(new { message = "Status updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class BookingSearchRequest
    {
        public string? UserId { get; set; }
        public string? HallId { get; set; }
        public string? OrganizationId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public string? CustomerName { get; set; }
        public string? EventType { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string reason { get; set; }

        public string Status { get; set; } = string.Empty;
    }
}