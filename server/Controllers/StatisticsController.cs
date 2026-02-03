using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsDataService _statisticsDataService;
        private readonly IBookingDataService _bookingDataService;
        private readonly IHallDataService _hallDataService;
        private readonly IUserDataService _userDataService;

        public StatisticsController(
            IStatisticsDataService statisticsDataService,
            IBookingDataService bookingDataService,
            IHallDataService hallDataService,
            IUserDataService userDataService)
        {
            _statisticsDataService = statisticsDataService;
            _bookingDataService = bookingDataService;
            _hallDataService = hallDataService;
            _userDataService = userDataService;
        }

        // Helper: get current user and accessible hall IDs from JWT
        private async Task<(Users? user, List<string> accessibleHallIds, bool isAdmin)> GetCurrentUserWithAccessibleHallsAsync()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return (null, new List<string>(), false);
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
                    return (null, new List<string>(), false);
                }

                var user = await _userDataService.GetByIdAndOrganizationAsync(userId, organizationId);
                if (user == null)
                {
                    return (null, new List<string>(), false);
                }

                // Check if user is admin
                var isAdmin = string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase);

                // For admin, return all halls (empty list means no restriction)
                if (isAdmin)
                {
                    return (user, new List<string>(), true);
                }

                // For non-admin, return their accessible halls
                return (user, user.AccessibleHalls ?? new List<string>(), false);
            }
            catch
            {
                return (null, new List<string>(), false);
            }
        }

        // GET: /api/statistics/organizations/{organizationId}/all
        [HttpGet("organizations/{organizationId}/all")]
        public async Task<IActionResult> GetAllStatistics(string organizationId)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // ADMIN: Get organization-wide statistics (all halls)
                if (isAdmin)
                {
                    var basicStats = await _statisticsDataService.GetBasicStatisticsAsync(organizationId);
                    var leadMetrics = await _statisticsDataService.GetLeadMetricsAsync(organizationId);
                    var monthlyData = await _statisticsDataService.GetMonthlyDataAsync(organizationId);
                    var growthMetrics = await _statisticsDataService.GetGrowthMetricsAsync(organizationId);
                    var customerInsights = await _statisticsDataService.GetCustomerInsightsAsync(organizationId);
                    var statusData = await _statisticsDataService.GetStatusDataAsync(organizationId);
                    var hallUtilization = await _statisticsDataService.GetHallUtilizationAsync(organizationId);

                    var resultAll = new
                    {
                        basic = basicStats,
                        leads = leadMetrics,
                        statusDistribution = statusData,
                        hallUtilization = hallUtilization,
                        monthlyData = monthlyData,
                        growthMetrics = growthMetrics,
                        customerInsights = customerInsights,
                        chartConfig = new
                        {
                            colors = new[] { "#10B981", "#F59E0B", "#EF4444", "#6B7280", "#3B82F6", "#8B5CF6" },
                            chartTypes = new[] { "line", "bar", "pie", "doughnut" },
                            defaultChartType = "line"
                        }
                    };

                    return Ok(resultAll);
                }

                // USER (NON-ADMIN): Get statistics only for accessible halls
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);

                // Filter bookings by accessible halls
                var filteredBookings = allBookings
                    .Where(b => accessibleHallIds.Contains(b.HallId))
                    .ToList();

                var today = DateTime.Today;

                // Basic stats for filtered halls
                var basic = new
                {
                    totalBookings = filteredBookings.Count,
                    activeBookings = filteredBookings.Count(b => b.Status == "active"),
                    confirmedBookings = filteredBookings.Count(b => b.Status == "confirmed"),
                    totalRevenue = filteredBookings
                        .Where(b => b.Status != "cancelled")
                        .Sum(b => b.TotalAmount),
                    totalReviews = 0, // You might want to implement filtered reviews too
                    averageRating = 0.0
                };

                // Lead metrics for filtered halls
                var leads = new
                {
                    newLeads = filteredBookings.Count(b => b.Status == "pending"),
                    rejectedLeads = filteredBookings.Count(b => b.Status == "cancelled"),
                    confirmedLeads = filteredBookings.Count(b => b.Status == "confirmed"),
                    upcomingEvents = filteredBookings.Count(b =>
                        b.Status == "confirmed" &&
                        b.EventStartDate.Date >= today),
                    happeningEvents = filteredBookings.Count(b =>
                        b.Status == "active" ||
                        (b.Status == "confirmed" &&
                         b.EventStartDate.Date <= today &&
                         b.EventEndDate.Date >= today))
                };

                // Status distribution for filtered halls
                var colors = new[] { "#10B981", "#F59E0B", "#EF4444", "#6B7280", "#3B82F6", "#8B5CF6" };
                var statusGroups = filteredBookings
                    .GroupBy(b => b.Status)
                    .Select((g, idx) => new StatusData
                    {
                        Name = g.Key,
                        Value = g.Count(),
                        Color = colors[idx % colors.Length]
                    })
                    .ToList();

                // Hall utilization for accessible halls only
                var utilization = new List<HallUtilization>();

                // Get hall details for accessible halls
                foreach (var hallId in accessibleHallIds.Distinct())
                {
                    var hall = await _hallDataService.GetHallByIdAsync(hallId);
                    if (hall == null) continue;

                    var hallBookings = filteredBookings
                        .Where(b => b.HallId == hallId)
                        .ToList();

                    utilization.Add(new HallUtilization
                    {
                        Name = hall.Name,
                        Bookings = hallBookings.Count,
                        Revenue = hallBookings.Sum(b => b.TotalAmount)
                    });
                }

                // Monthly data for filtered halls (last 6 months)
                var sixMonthsAgo = today.AddMonths(-6);
                var filteredMonthlyData = filteredBookings
                    .Where(b =>
                    {
                        DateTime bookingDate;
                        if (b.EventDate is DateTime dt)
                            bookingDate = dt;
                        else if (DateTime.TryParse(b.EventDate.ToString(), out DateTime parsedDate))
                            bookingDate = parsedDate;
                        else
                            return false;

                        return bookingDate >= sixMonthsAgo;
                    })
                    .GroupBy(b =>
                    {
                        DateTime bookingDate;
                        if (b.EventDate is DateTime dt)
                            bookingDate = dt;
                        else
                            DateTime.TryParse(b.CreatedAt.ToString(), out bookingDate);

                        return bookingDate.ToString("MMM yyyy");
                    })
                    .OrderBy(g =>
                    {
                        // Parse month for proper ordering
                        var parts = g.Key.Split(' ');
                        if (parts.Length >= 2 && DateTime.TryParseExact(parts[0] + " 1 " + parts[1],
                            "MMM d yyyy",
                            System.Globalization.CultureInfo.InvariantCulture,
                            System.Globalization.DateTimeStyles.None,
                            out DateTime date))
                        {
                            return date;
                        }
                        return DateTime.MaxValue;
                    })
                    .Select(g => new MonthlyData
                    {
                        Month = g.Key,
                        Bookings = g.Count(),
                        Revenue = g.Sum(b => b.TotalAmount)
                    })
                    .ToList();

                // For user, get growth metrics based on their accessible halls
                var userGrowthMetrics = new GrowthMetrics
                {
                    MonthlyGrowth = 100.0m, // You might want to calculate this based on filtered data
                    CustomerRetention = 0.00m,
                    AverageBookingValue = filteredBookings.Count > 0 ?
                        filteredBookings.Where(b => b.TotalAmount > 0).Average(b => b.TotalAmount) : 0
                };

                // For user, get customer insights based on their accessible halls
                var customerBookings = filteredBookings
    .Where(b => !string.IsNullOrEmpty(b.CustomerPhone))
    .GroupBy(b => b.CustomerPhone)
    .ToList();

                var totalCustomers = customerBookings.Count;

               
                var repeatCustomers = customerBookings.Count(g => g.Count() > 1);
                var customerSatisfaction = 0.0m;

                var userCustomerInsights = new CustomerInsights
                {
                    TotalCustomers = totalCustomers,
                    RepeatCustomers = repeatCustomers, // Now correctly calculated
                    CustomerSatisfaction = customerSatisfaction
                };

                var result = new
                {
                    basic,
                    leads,
                    statusDistribution = statusGroups,
                    hallUtilization = utilization,
                    monthlyData = filteredMonthlyData,
                    growthMetrics = userGrowthMetrics,
                    customerInsights = userCustomerInsights,
                    chartConfig = new
                    {
                        colors = colors,
                        chartTypes = new[] { "line", "bar", "pie", "doughnut" },
                        defaultChartType = "line"
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/organizations/{organizationId}/basic
        [HttpGet("organizations/{organizationId}/basic")]
        public async Task<IActionResult> GetBasicStatistics(string organizationId)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // Admin gets organization-wide stats
                if (isAdmin)
                {
                    var basicStats = await _statisticsDataService.GetBasicStatisticsAsync(organizationId);
                    return Ok(basicStats);
                }

                // User gets filtered stats
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                var filteredBookings = allBookings
                    .Where(b => accessibleHallIds.Contains(b.HallId))
                    .ToList();

                var basic = new
                {
                    totalBookings = filteredBookings.Count,
                    activeBookings = filteredBookings.Count(b => b.Status == "active"),
                    confirmedBookings = filteredBookings.Count(b => b.Status == "confirmed"),
                    totalRevenue = filteredBookings
                        .Where(b => b.Status != "cancelled")
                        .Sum(b => b.TotalAmount),
                    totalReviews = 0,
                    averageRating = 0.0
                };

                return Ok(basic);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/organizations/{organizationId}/leads
        [HttpGet("organizations/{organizationId}/leads")]
        public async Task<IActionResult> GetLeadMetrics(string organizationId)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // Admin gets organization-wide stats
                if (isAdmin)
                {
                    var leadMetrics = await _statisticsDataService.GetLeadMetricsAsync(organizationId);
                    return Ok(leadMetrics);
                }

                // User gets filtered stats
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                var filteredBookings = allBookings
                    .Where(b => accessibleHallIds.Contains(b.HallId))
                    .ToList();

                var today = DateTime.Today;

                var leads = new
                {
                    newLeads = filteredBookings.Count(b => b.Status == "pending"),
                    rejectedLeads = filteredBookings.Count(b => b.Status == "cancelled"),
                    confirmedLeads = filteredBookings.Count(b => b.Status == "confirmed"),
                    upcomingEvents = filteredBookings.Count(b =>
                        b.Status == "confirmed" &&
                        b.EventStartDate.Date >= today),
                    happeningEvents = filteredBookings.Count(b =>
                        b.Status == "active" ||
                        (b.Status == "confirmed" &&
                         b.EventStartDate.Date <= today &&
                         b.EventEndDate.Date >= today))
                };

                return Ok(leads);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/organizations/{organizationId}/status-distribution
        [HttpGet("organizations/{organizationId}/status-distribution")]
        public async Task<IActionResult> GetStatusDistribution(string organizationId)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // Admin gets organization-wide stats
                if (isAdmin)
                {
                    var statusData = await _statisticsDataService.GetStatusDataAsync(organizationId);
                    return Ok(statusData);
                }

                // User gets filtered stats
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                var filteredBookings = allBookings
                    .Where(b => accessibleHallIds.Contains(b.HallId))
                    .ToList();

                var colors = new[] { "#10B981", "#F59E0B", "#EF4444", "#6B7280", "#3B82F6", "#8B5CF6" };
                var statusGroups = filteredBookings
                    .GroupBy(b => b.Status)
                    .Select((g, idx) => new StatusData
                    {
                        Name = g.Key,
                        Value = g.Count(),
                        Color = colors[idx % colors.Length]
                    })
                    .ToList();

                return Ok(statusGroups);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/organizations/{organizationId}/hall-utilization
        [HttpGet("organizations/{organizationId}/hall-utilization")]
        public async Task<IActionResult> GetHallUtilization(string organizationId)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // Admin gets organization-wide stats
                if (isAdmin)
                {
                    var hallUtilization = await _statisticsDataService.GetHallUtilizationAsync(organizationId);
                    return Ok(hallUtilization);
                }

                // User gets stats only for accessible halls
                var utilization = new List<HallUtilization>();
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);

                foreach (var hallId in accessibleHallIds.Distinct())
                {
                    var hall = await _hallDataService.GetHallByIdAsync(hallId);
                    if (hall == null) continue;

                    var hallBookings = allBookings
                        .Where(b => b.HallId == hallId)
                        .ToList();

                    utilization.Add(new HallUtilization
                    {
                        Name = hall.Name,
                        Bookings = hallBookings.Count,
                        Revenue = hallBookings.Sum(b => b.TotalAmount)
                    });
                }

                return Ok(utilization);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/monthly
        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyData([FromQuery] string? organizationId = null)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // Admin gets organization-wide stats
                if (isAdmin)
                {
                    var monthlyData = await _statisticsDataService.GetMonthlyDataAsync(organizationId);
                    return Ok(monthlyData);
                }

                // User gets filtered stats
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                var filteredBookings = allBookings
                    .Where(b => accessibleHallIds.Contains(b.HallId))
                    .ToList();

                var today = DateTime.Today;
                var sixMonthsAgo = today.AddMonths(-6);

                var filteredMonthlyData = filteredBookings
                    .Where(b =>
                    {
                        DateTime bookingDate;
                        if (b.CreatedAt is DateTime dt)
                            bookingDate = dt;
                        else if (DateTime.TryParse(b.CreatedAt.ToString(), out DateTime parsedDate))
                            bookingDate = parsedDate;
                        else
                            return false;

                        return bookingDate >= sixMonthsAgo;
                    })
                    .GroupBy(b =>
                    {
                        DateTime bookingDate;
                        if (b.CreatedAt is DateTime dt)
                            bookingDate = dt;
                        else
                            DateTime.TryParse(b.CreatedAt.ToString(), out bookingDate);

                        return bookingDate.ToString("MMM yyyy");
                    })
                    .OrderBy(g =>
                    {
                        var parts = g.Key.Split(' ');
                        if (parts.Length >= 2 && DateTime.TryParseExact(parts[0] + " 1 " + parts[1],
                            "MMM d yyyy",
                            System.Globalization.CultureInfo.InvariantCulture,
                            System.Globalization.DateTimeStyles.None,
                            out DateTime date))
                        {
                            return date;
                        }
                        return DateTime.MaxValue;
                    })
                    .Select(g => new MonthlyData
                    {
                        Month = g.Key,
                        Bookings = g.Count(),
                        Revenue = g.Sum(b => b.TotalAmount)
                    })
                    .ToList();

                return Ok(filteredMonthlyData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/organizations/{organizationId}/growth
        [HttpGet("organizations/{organizationId}/growth")]
        public async Task<IActionResult> GetGrowthMetrics(string organizationId)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // Admin gets organization-wide stats
                if (isAdmin)
                {
                    var growthMetrics = await _statisticsDataService.GetGrowthMetricsAsync(organizationId);
                    return Ok(growthMetrics);
                }

                // For user, calculate simplified growth metrics based on accessible halls
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                var filteredBookings = allBookings
                    .Where(b => accessibleHallIds.Contains(b.HallId))
                    .ToList();

                var userGrowthMetrics = new GrowthMetrics
                {
                    MonthlyGrowth = 100.0m,
                    CustomerRetention = 0.00m,
                    AverageBookingValue = filteredBookings.Count > 0 ?
                        filteredBookings.Where(b => b.TotalAmount > 0).Average(b => b.TotalAmount) : 0
                };

                return Ok(userGrowthMetrics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/organizations/{organizationId}/customer-insights
        [HttpGet("organizations/{organizationId}/customer-insights")]
        public async Task<IActionResult> GetCustomerInsights(string organizationId)
        {
            try
            {
                if (string.IsNullOrEmpty(organizationId))
                {
                    return BadRequest(new { message = "Organization ID is required" });
                }

                var (user, accessibleHallIds, isAdmin) = await GetCurrentUserWithAccessibleHallsAsync();

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid token or user not found" });
                }

                // Admin gets organization-wide stats
                if (isAdmin)
                {
                    var customerInsights = await _statisticsDataService.GetCustomerInsightsAsync(organizationId);
                    return Ok(customerInsights);
                }

                // For user, calculate customer insights based on accessible halls
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                var filteredBookings = allBookings
                    .Where(b => accessibleHallIds.Contains(b.HallId))
                    .ToList();

                var userCustomerInsights = new CustomerInsights
                {
                    TotalCustomers = filteredBookings.Select(b => b.CustomerPhone).Distinct().Count(),
                    RepeatCustomers = 0,
                    CustomerSatisfaction = 3.0m
                };

                return Ok(userCustomerInsights);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // GET: /api/statistics/chart-config
        [HttpGet("chart-config")]
        public async Task<IActionResult> GetChartConfig()
        {
            try
            {
                var chartConfig = new
                {
                    colors = new[] { "#10B981", "#F59E0B", "#EF4444", "#6B7280", "#3B82F6", "#8B5CF6" },
                    chartTypes = new[] { "line", "bar", "pie", "doughnut" },
                    defaultChartType = "line"
                };

                return Ok(chartConfig);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Keep your existing endpoints for backward compatibility
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStatistics([FromQuery] string? organizationId = null)
        {
            try
            {
                var statistics = await _statisticsDataService.GetDashboardStatisticsAsync(organizationId);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("bookings")]
        public async Task<IActionResult> GetBookingStatistics([FromQuery] string? organizationId = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var statistics = await _statisticsDataService.GetBookingStatisticsAsync(organizationId, startDate, endDate);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueStatistics([FromQuery] string? organizationId = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var statistics = await _statisticsDataService.GetRevenueStatisticsAsync(organizationId, startDate, endDate);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUserStatistics([FromQuery] string? organizationId = null)
        {
            try
            {
                var statistics = await _statisticsDataService.GetUserStatisticsAsync(organizationId);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("halls")]
        public async Task<IActionResult> GetHallStatistics([FromQuery] string? organizationId = null)
        {
            try
            {
                var statistics = await _statisticsDataService.GetHallStatisticsAsync(organizationId);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("reviews")]
        public async Task<IActionResult> GetReviewStatistics([FromQuery] string? organizationId = null)
        {
            try
            {
                var statistics = await _statisticsDataService.GetReviewStatisticsAsync(organizationId);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}