using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using Momantza.Middleware;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/b2b/user")]
    public class B2BUserController : ControllerBase
    {
        private readonly IBookingDataService _bookingDataService;
        private readonly IUserDataService _userDataService;
        private readonly ILogger<B2BUserController> _logger;
        private readonly OrganizationContext _organizationContext;

        public B2BUserController(
            IBookingDataService bookingDataService,
            IUserDataService userDataService,
            ILogger<B2BUserController> logger,
            OrganizationContext organizationContext)
        {
            _bookingDataService = bookingDataService;
            _userDataService = userDataService;
            _logger = logger;
            _organizationContext = organizationContext;
        }

        /// <summary>
        /// Check if user exists by mobile number and return user info
        /// </summary>
        [HttpPost("check")]
        public async Task<IActionResult> CheckUser([FromBody] CheckUserRequest request)
        {
            try
            {
                // Get calling company from middleware
                var callingCompany = HttpContext.Items["CallingCompany"]?.ToString();
                _logger.LogInformation("B2B check user request from {CallingCompany} for mobile {MobileNumber}", callingCompany, request.MobileNumber);

                // Search for bookings by customer phone number
                var allBookings = await _bookingDataService.GetAllAsync();
                var userBookings = allBookings
                    .Where(b => !string.IsNullOrEmpty(b.CustomerPhone) && 
                                b.CustomerPhone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "") == 
                                request.MobileNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", ""))
                    .ToList();

                // Check if user exists (has bookings or is registered user)
                var exists = userBookings.Any();
                
                // Check if user is admin (search for user by email if available, or check role)
                bool isAdmin = false;
                if (exists)
                {
                    // Try to find user by email from bookings
                    var firstBooking = userBookings.FirstOrDefault();
                    if (firstBooking != null && !string.IsNullOrEmpty(firstBooking.CustomerEmail))
                    {
                        var users = await _userDataService.GetAllAsync();
                        var user = users.FirstOrDefault(u => u.Email == firstBooking.CustomerEmail);
                        if (user != null && (user.Role == "admin" || user.Role == "Admin" || user.Role == "ADMIN"))
                        {
                            isAdmin = true;
                        }
                    }
                }

                var response = new CheckUserResponse
                {
                    Exists = exists,
                    HasAppointments = userBookings.Any(),
                    IsAdmin = isAdmin
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking user by mobile number");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Get appointments/bookings by mobile number
        /// </summary>
        [HttpPost("appointments/by-mobile")]
        public async Task<IActionResult> GetAppointmentsByMobile([FromBody] GetAppointmentsByMobileRequest request)
        {
            try
            {
                var callingCompany = HttpContext.Items["CallingCompany"]?.ToString();
                _logger.LogInformation("B2B get appointments request from {CallingCompany} for mobile {MobileNumber}", callingCompany, request.MobileNumber);

                // Get all bookings and filter by phone number
                var allBookings = await _bookingDataService.GetAllAsync();
                var normalizedPhone = request.MobileNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
                
                var bookings = allBookings
                    .Where(b => !string.IsNullOrEmpty(b.CustomerPhone) && 
                                b.CustomerPhone.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "") == normalizedPhone)
                    .OrderByDescending(b => b.EventDate)
                    .ToList();

                // Convert bookings to appointment-like format for consistency
                var appointments = bookings.Select(b => new
                {
                    id = b.Id,
                    organisationid = b.OrganizationId,
                    customerName = b.CustomerName,
                    customerEmail = b.CustomerEmail,
                    customerPhone = b.CustomerPhone,
                    appointmentdate = b.EventDate,
                    eventDate = b.EventDate,
                    eventType = b.EventType,
                    status = b.Status,
                    totalAmount = b.TotalAmount,
                    guestCount = b.GuestCount,
                    hallName = b.HallName,
                    notes = b.Notes,
                    createdAt = b.CreatedAt
                }).ToList();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments by mobile number");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all appointments/bookings (for admin users)
        /// </summary>
        [HttpPost("appointments/all")]
        public async Task<IActionResult> GetAllAppointments([FromBody] GetAllAppointmentsRequest request)
        {
            try
            {
                var callingCompany = HttpContext.Items["CallingCompany"]?.ToString();
                _logger.LogInformation("B2B get all appointments request from {CallingCompany}", callingCompany);

                // Get all bookings
                var allBookings = await _bookingDataService.GetAllAsync();
                
                // Filter by organization if provided
                var bookings = string.IsNullOrEmpty(request.OrganizationId)
                    ? allBookings
                    : allBookings.Where(b => b.OrganizationId == request.OrganizationId).ToList();

                var appointments = bookings
                    .OrderByDescending(b => b.EventDate)
                    .Select(b => new
                    {
                        id = b.Id,
                        organisationid = b.OrganizationId,
                        customerName = b.CustomerName,
                        customerEmail = b.CustomerEmail,
                        customerPhone = b.CustomerPhone,
                        appointmentdate = b.EventDate,
                        eventDate = b.EventDate,
                        eventType = b.EventType,
                        status = b.Status,
                        totalAmount = b.TotalAmount,
                        guestCount = b.GuestCount,
                        hallName = b.HallName,
                        notes = b.Notes,
                        createdAt = b.CreatedAt
                    }).ToList();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all appointments");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class CheckUserRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
    }

    public class CheckUserResponse
    {
        public bool Exists { get; set; }
        public bool HasAppointments { get; set; }
        public bool IsAdmin { get; set; }
    }

    public class GetAppointmentsByMobileRequest
    {
        public string MobileNumber { get; set; } = string.Empty;
    }

    public class GetAllAppointmentsRequest
    {
        public string? OrganizationId { get; set; }
    }
}
