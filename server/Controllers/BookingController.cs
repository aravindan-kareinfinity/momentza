using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using Microsoft.Extensions.Logging;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/bookings")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingDataService _bookingDataService;
        private readonly IHallDataService _hallDataService;
        private readonly ILogger<BookingController> _logger;

        public BookingController(IBookingDataService bookingDataService, IHallDataService hallDataService, ILogger<BookingController> logger)
        {
            _bookingDataService = bookingDataService;
            _hallDataService = hallDataService;
            _logger = logger;
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

        [HttpGet("hall-with-bookings/{hallId}")]
        public async Task<IActionResult> GetHallWithBookings(string hallId)
        {
            try
            {
                // Get hall details
                var hall = await _hallDataService.GetByIdAsync(hallId);
                if (hall == null)
                {
                    return NotFound(new { message = "Hall not found" });
                }

                // Get all bookings and filter by hall ID
                var allBookings = await _bookingDataService.GetAllAsync();
                var bookings = allBookings.Where(b => b.HallId == hallId).ToList();

                // Create response object with hall and its bookings
                var hallWithBookings = new
                {
                    Hall = hall,
                    Bookings = bookings,
                    BookingSummary = new
                    {
                        TotalBookings = bookings.Count,
                        ConfirmedBookings = bookings.Count(b => b.Status == "confirmed"),
                        ActiveBookings = bookings.Count(b => b.Status == "active"),
                        PendingBookings = bookings.Count(b => b.Status == "pending"),
                        CancelledBookings = bookings.Count(b => b.Status == "cancelled"),
                        BookedDates = bookings
                            .Select(b => new
                            {
                                Date = b.EventDate,
                                TimeSlot = b.TimeSlot,
                                Status = b.Status,
                                CustomerName = b.CustomerName,
                                EventType = b.EventType,
                                GuestCount = b.GuestCount,
                                TotalAmount = b.TotalAmount,
                                CustomerEmail = b.CustomerEmail,
                                CustomerPhone = b.CustomerPhone,
                                CreatedAt = b.CreatedAt
                            })
                            .OrderBy(b => b.Date)
                            .ToList()
                    }
                };

                return Ok(hallWithBookings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("halls-with-bookings")]
        public async Task<IActionResult> GetAllHallsWithBookings()
        {
            try
            {
                _logger.LogInformation("Getting all halls with bookings");
                
                // Get all halls and all bookings
                var halls = await _hallDataService.GetAllAsyncs();
                _logger.LogInformation("Retrieved {Count} halls", halls?.Count ?? 0);
                
                var allBookings = await _bookingDataService.GetAllAsync();
                _logger.LogInformation("Retrieved {Count} bookings", allBookings?.Count ?? 0);
                
                var hallsWithBookings = new List<object>();

                foreach (var hall in halls ?? new List<Hall>())
                {
                    if (hall == null || string.IsNullOrEmpty(hall.Id))
                    {
                        _logger.LogWarning("Skipping null or invalid hall");
                        continue;
                    }

                    // Filter bookings for this specific hall
                    var bookings = (allBookings ?? new List<Booking>())
                        .Where(b => b != null && !string.IsNullOrEmpty(b.HallId) && b.HallId == hall.Id)
                        .ToList();

                    var hallWithBookings = new
                    {
                        Hall = hall,
                        Bookings = bookings,
                        BookingSummary = new
                        {
                            TotalBookings = bookings.Count,
                            ConfirmedBookings = bookings.Count(b => b?.Status == "confirmed"),
                            ActiveBookings = bookings.Count(b => b?.Status == "active"),
                            PendingBookings = bookings.Count(b => b?.Status == "pending"),
                            CancelledBookings = bookings.Count(b => b?.Status == "cancelled"),
                            BookedDates = bookings
                                .Where(b => b != null)
                                .Select(b => new
                                {
                                    Date = b.EventDate,
                                    TimeSlot = b.TimeSlot,
                                    Status = b.Status,
                                    CustomerName = b.CustomerName,
                                    EventType = b.EventType,
                                    GuestCount = b.GuestCount,
                                    TotalAmount = b.TotalAmount,
                                    CustomerEmail = b.CustomerEmail,
                                    CustomerPhone = b.CustomerPhone,
                                    CreatedAt = b.CreatedAt
                                })
                                .OrderBy(b => b.Date)
                                .ToList()
                        }
                    };

                    hallsWithBookings.Add(hallWithBookings);
                }

                _logger.LogInformation("Returning {Count} halls with bookings", hallsWithBookings.Count);
                return Ok(hallsWithBookings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting halls with bookings: {Message}", ex.Message);
                _logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
                return StatusCode(500, new { message = "Internal server error", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet("hall-availability/{hallId}")]
        public async Task<IActionResult> GetHallAvailability(string hallId, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                // Get hall details
                var hall = await _hallDataService.GetByIdAsync(hallId);
                if (hall == null)
                {
                    return NotFound(new { message = "Hall not found" });
                }

                // Set default date range if not provided
                var start = startDate ?? DateTime.Today;
                var end = endDate ?? DateTime.Today.AddMonths(3);

                // Get bookings for this hall in the date range
                var bookings = await _bookingDataService.GetByHallIdAsync(hallId);
                var relevantBookings = bookings
                    .Where(b => b.EventDate >= start && b.EventDate <= end &&
                               (b.Status == "confirmed" || b.Status == "active"))
                    .ToList();

                // Create availability data
                var availability = new List<object>();
                var currentDate = start;

                while (currentDate <= end)
                {
                    var dateStr = currentDate.ToString("yyyy-MM-dd");
                    var dayBookings = relevantBookings.Where(b => b.EventDate.ToString("yyyy-MM-dd") == dateStr).ToList();

                    var hasFullDay = dayBookings.Any(b => b.TimeSlot == "fullday");
                    var hasMorning = dayBookings.Any(b => b.TimeSlot == "morning");
                    var hasEvening = dayBookings.Any(b => b.TimeSlot == "evening");

                    var availabilityStatus = new
                    {
                        Date = dateStr,
                        IsFullyBooked = hasFullDay || (hasMorning && hasEvening),
                        IsMorningAvailable = !hasMorning && !hasFullDay,
                        IsEveningAvailable = !hasEvening && !hasFullDay,
                        IsFullyAvailable = !hasMorning && !hasEvening && !hasFullDay,
                        Bookings = dayBookings.Select(b => new
                        {
                            TimeSlot = b.TimeSlot,
                            Status = b.Status,
                            CustomerName = b.CustomerName,
                            EventType = b.EventType
                        }).ToList()
                    };

                    availability.Add(availabilityStatus);
                    currentDate = currentDate.AddDays(1);
                }

                var result = new
                {
                    Hall = new
                    {
                        Id = hall.Id,
                        Name = hall.Name,
                        Location = hall.Location,
                        Capacity = hall.Capacity,
                        RateCard = hall.RateCard
                    },
                    DateRange = new
                    {
                        StartDate = start.ToString("yyyy-MM-dd"),
                        EndDate = end.ToString("yyyy-MM-dd")
                    },
                    Availability = availability
                };

                return Ok(result);
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
        public string Status { get; set; } = string.Empty;
    }
}