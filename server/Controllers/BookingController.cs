using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using Microsoft.Extensions.Logging;
using OfficeOpenXml;
using Momantza.Middleware;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/bookings")]
    public class BookingController : ControllerBase
    {
        private readonly IBookingDataService _bookingDataService;
        private readonly IHallDataService _hallDataService;
        private readonly IOrganizationsDataService _organizationsDataService;
        private readonly IUserDataService _userDataService;
        private readonly ILogger<BookingController> _logger;

        public BookingController(
            IBookingDataService bookingDataService,
            IHallDataService hallDataService,
            IOrganizationsDataService organizationsDataService,
            IUserDataService userDataService,
            ILogger<BookingController> logger)
        {
            _bookingDataService = bookingDataService;
            _hallDataService = hallDataService;
            _organizationsDataService = organizationsDataService;
            _userDataService = userDataService;
            _logger = logger;
        }

        // Helper: get current user and accessible hall IDs from JWT
        private async Task<(Users? user, List<string> accessibleHallIds)> GetCurrentUserWithAccessibleHallsAsync()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return (null, new List<string>());
            }

            var token = authHeader.Replace("Bearer ", "");
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);

                var userId = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                             ?? jwt.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;
                var organizationId = jwt.Claims.FirstOrDefault(c => c.Type == "organizationId")?.Value ?? string.Empty;

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(organizationId))
                {
                    return (null, new List<string>());
                }

                var user = await _userDataService.GetByIdAndOrganizationAsync(userId, organizationId);
                if (user == null)
                {
                    return (null, new List<string>());
                }

                // Admin → treat as full access (empty list means "no restriction" for callers)
                if (string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
                {
                    return (user, new List<string>());
                }

                // Manager / other roles
                var halls = user.AccessibleHalls ?? new List<string>();
                return (user, halls);
            }
            catch
            {
                return (null, new List<string>());
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var (user, accessibleHallIds) = await GetCurrentUserWithAccessibleHallsAsync();

                var bookings = await _bookingDataService.GetAllAsync();

                if (user != null && accessibleHallIds.Any())
                {
                    // Non-admin with restricted halls: filter bookings to those halls only
                    bookings = bookings.Where(b => accessibleHallIds.Contains(b.HallId)).ToList();
                }

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

        [HttpPost("{id}/update")]
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

        [HttpPost("{id}/delete")]
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
                var (user, accessibleHallIds) = await GetCurrentUserWithAccessibleHallsAsync();

                var bookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);

                if (user != null && accessibleHallIds.Any())
                {
                    bookings = bookings.Where(b => accessibleHallIds.Contains(b.HallId)).ToList();
                }

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
                var (user, accessibleHallIds) = await GetCurrentUserWithAccessibleHallsAsync();

                var bookings = await _bookingDataService.GetByStatusAsync(status);

                if (user != null && accessibleHallIds.Any())
                {
                    bookings = bookings.Where(b => accessibleHallIds.Contains(b.HallId)).ToList();
                }

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

                var (user, accessibleHallIds) = await GetCurrentUserWithAccessibleHallsAsync();

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

                if (user != null && accessibleHallIds.Any())
                {
                    bookings = bookings.Where(b => accessibleHallIds.Contains(b.HallId)).ToList();
                }

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
                var (user, accessibleHallIds) = await GetCurrentUserWithAccessibleHallsAsync();

                var statistics = await _bookingDataService.GetBookingStatisticsAsync(organizationId ?? "");

                // If manager, recalc statistics based only on accessible halls
                if (user != null && accessibleHallIds.Any())
                {
                    var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId ?? "");
                    var filtered = allBookings.Where(b => accessibleHallIds.Contains(b.HallId)).ToList();
                    var today = DateTime.Today;

                    statistics = new Momantza.Services.BookingStatistics
                    {
                        NewLeads = filtered.Count(b => b.Status == "pending"),
                        RejectedLeads = filtered.Count(b => b.Status == "cancelled"),
                        ConfirmedLeads = filtered.Count(b => b.Status == "confirmed"),
                        UpcomingEvents = filtered.Count(b =>
                            b.Status == "confirmed" && b.EventStartDate.Date >= today),
                        HappeningEvents = filtered.Count(b =>
                            b.Status == "active" || (b.Status == "confirmed" &&
                            b.EventStartDate.Date <= today && b.EventEndDate.Date >= today)),
                        TotalBookings = filtered.Count,
                        TotalRevenue = filtered
                            .Where(b => b.Status != "cancelled")
                            .Sum(b => b.TotalAmount)
                    };
                }

                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/status")]
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
                
                // Get unique organization IDs and fetch their defaultdomain
                var organizationIds = halls?
                    .Where(h => h != null && !string.IsNullOrEmpty(h.OrganizationId))
                    .Select(h => h.OrganizationId)
                    .Distinct()
                    .ToList() ?? new List<string>();
                
                var organizationDomainMap = new Dictionary<string, string>();
                foreach (var orgId in organizationIds)
                {
                    try
                    {
                        var organization = await _organizationsDataService.GetByIdAsync(orgId);
                        if (organization != null && !string.IsNullOrEmpty(organization.DefaultDomain))
                        {
                            organizationDomainMap[orgId] = organization.DefaultDomain;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error fetching organization {OrgId}: {Message}", orgId, ex.Message);
                    }
                }
                
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

                    // Get defaultdomain for this hall's organization
                    var defaultDomain = organizationDomainMap.ContainsKey(hall.OrganizationId) 
                        ? organizationDomainMap[hall.OrganizationId] 
                        : string.Empty;

                    var hallWithBookings = new
                    {
                        Hall = hall,
                        DefaultDomain = defaultDomain,
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

        [HttpPost("upload-old-bookings")]
        public async Task<IActionResult> UploadOldBookings(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Excel file is required");

            try
            {
                // 1️⃣ Auth + Organization
                var (user, _) = await GetCurrentUserWithAccessibleHallsAsync();
                if (user == null || string.IsNullOrEmpty(user.OrganizationId))
                    return Unauthorized();

                var orgId = user.OrganizationId;

                // 2️⃣ Load Excel
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;

                using var package = new ExcelPackage(stream);
                var worksheet = package.Workbook.Worksheets[0];

                if (worksheet.Dimension == null)
                    return BadRequest("Excel sheet is empty");

                var rowCount = worksheet.Dimension.Rows;
                var errors = new List<string>();

                // 3️⃣ Parse rows
                for (int row = 2; row <= rowCount; row++)
                {
                    var hallName = worksheet.Cells[row, 10].Text?.Trim();

                    if (string.IsNullOrEmpty(hallName))
                    {
                        errors.Add($"Row {row}: Hall name is missing");
                        continue;
                    }

                    var hall = await _hallDataService
                        .GetByNameAndOrganizationAsync(hallName, orgId);

                    if (hall == null)
                    {
                        errors.Add($"Row {row}: Hall '{hallName}' does not belong to this organization");
                    }
                }

                if (errors.Any())
                {
                    return BadRequest(new
                    {
                        message = "Excel validation failed. Fix errors and re-upload.",
                        errorCount = errors.Count,
                        errors
                    });
                }

                var bookings = new List<Booking>();

                for (int row = 2; row <= rowCount; row++)
                {
                    var hallName = worksheet.Cells[row, 10].Text.Trim();
                    var hall = await _hallDataService.GetByNameAndOrganizationAsync(hallName, orgId);

                    var eventDate = DateTime.Parse(worksheet.Cells[row, 4].Text);

                    var rawEventType = worksheet.Cells[row, 5].Text?.Trim().ToLower();
                    var eventType = rawEventType switch
                    {
                        "wedding" => "wedding",
                        "birthday party" => "birthday",
                        "birthday" => "birthday",
                        "corporate event" => "corporate",
                        _ => "other"
                    };

                    var roomsRequiredText = worksheet.Cells[row, 14].Text?.Trim();
                    bool roomsRequired =
                        !string.IsNullOrWhiteSpace(roomsRequiredText) &&
                        roomsRequiredText.ToLower() is "yes" or "true" or "1";

                    int freeRooms = int.TryParse(worksheet.Cells[row, 15].Text, out var fr) ? fr : 0;
                    int acRooms = int.TryParse(worksheet.Cells[row, 16].Text, out var ar) ? ar : 0;
                    int nonAcRooms = int.TryParse(worksheet.Cells[row, 17].Text, out var nar) ? nar : 0;

                    var roomDetails = new RoomsInfo
                    {
                        Charges = new RoomCharge
                        {
                            AcRoomCharges = 0,
                            NonAcRoomCharges = 0,
                            TotalRoomCharges = 0
                        },
                        RoomsCount = new Rooms
                        {
                            Free = freeRooms,
                            RentedAc = acRooms,
                            RentedNonAc = nonAcRooms
                        }
                    };

                    bookings.Add(new Booking
                    {
                        Id = Guid.NewGuid().ToString(),
                        OrganizationId = orgId,
                        HallId = hall.Id,
                        HallName = hall.Name,

                        CustomerName = worksheet.Cells[row, 1].Text,
                        CustomerEmail = worksheet.Cells[row, 2].Text,
                        CustomerPhone = worksheet.Cells[row, 3].Text,

                        Address = worksheet.Cells[row, 11].Text?.Trim(),
                        Village = worksheet.Cells[row, 12].Text?.Trim(),
                        City = worksheet.Cells[row, 13].Text?.Trim(),

                        EventDate = eventDate,
                        EventStartDate = eventDate,
                        EventEndDate = eventDate,
                        HandoverStartDate = eventDate,

                        EventType = eventType,
                        TimeSlot = worksheet.Cells[row, 6].Text?.Trim().ToLower(),
                        GuestCount = int.Parse(worksheet.Cells[row, 7].Text),
                        TotalAmount = decimal.Parse(worksheet.Cells[row, 8].Text),
                        Status = worksheet.Cells[row, 9].Text?.Trim().ToLower(),

                        RoomsRequired = roomsRequired,
                        RoomsCount = freeRooms + acRooms + nonAcRooms,
                        RoomDetails = roomDetails,

                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }

                // 4️⃣ Save bookings
                foreach (var booking in bookings)
                {
                    await _bookingDataService.CreateBookingAsync(booking);
                }

                // 5️⃣ Final response
                return Ok(new
                {
                    message = "Old bookings upload completed",
                    insertedCount = bookings.Count,
                    failedCount = errors.Count,
                    errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Excel upload failed");
                return StatusCode(500, "Excel upload failed");
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