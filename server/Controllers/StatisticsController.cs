using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

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

                // Admin → treat as full access (empty list means "no restriction")
                if (string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
                {
                    return (user, new List<string>());
                }

                return (user, user.AccessibleHalls ?? new List<string>());
            }
            catch
            {
                return (null, new List<string>());
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

                var (user, accessibleHallIds) = await GetCurrentUserWithAccessibleHallsAsync();

                // Admin or no restrictions -> keep existing org-wide statistics
                if (user == null || !accessibleHallIds.Any())
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

                // Manager / non-admin: compute statistics only for accessible halls
                var allBookings = await _bookingDataService.GetBookingsByOrganizationAsync(organizationId);
                var filtered = allBookings.Where(b => accessibleHallIds.Contains(b.HallId)).ToList();
                var today = DateTime.Today;

                // Basic stats
                var basic = new
                {
                    totalBookings = filtered.Count,
                    activeBookings = filtered.Count(b => b.Status == "active"),
                    confirmedBookings = filtered.Count(b => b.Status == "confirmed"),
                    totalRevenue = filtered.Where(b => b.Status != "cancelled").Sum(b => b.TotalAmount),
                    // Reviews still org-wide for now
                    totalReviews = 0,
                    averageRating = 0.0
                };

                // Lead metrics
                var leads = new
                {
                    newLeads = filtered.Count(b => b.Status == "pending"),
                    rejectedLeads = filtered.Count(b => b.Status == "cancelled"),
                    confirmedLeads = filtered.Count(b => b.Status == "confirmed"),
                    upcomingEvents = filtered.Count(b =>
                        b.Status == "confirmed" && b.EventStartDate.Date >= today),
                    happeningEvents = filtered.Count(b =>
                        b.Status == "active" ||
                        (b.Status == "confirmed" &&
                         b.EventStartDate.Date <= today &&
                         b.EventEndDate.Date >= today))
                };

                // Status distribution
                var colors = new[] { "#10B981", "#F59E0B", "#EF4444", "#6B7280", "#3B82F6", "#8B5CF6" };
                var statusGroups = filtered
                    .GroupBy(b => b.Status)
                    .Select((g, idx) => new StatusData
                    {
                        Name = g.Key,
                        Value = g.Count(),
                        Color = colors[idx % colors.Length]
                    })
                    .ToList();

                // Hall utilization (for accessible halls only)
                var utilization = new List<HallUtilization>();
                var hallsById = new Dictionary<string, Hall>();

                foreach (var hallId in accessibleHallIds.Distinct())
                {
                    var hall = await _hallDataService.GetHallByIdAsync(hallId);
                    if (hall == null) continue;

                    hallsById[hallId] = hall;
                }

                var byHall = filtered.GroupBy(b => b.HallId);
                foreach (var g in byHall)
                {
                    if (!hallsById.TryGetValue(g.Key, out var hall)) continue;

                    utilization.Add(new HallUtilization
                    {
                        Name = hall.Name,
                        Bookings = g.Count(),
                        Revenue = g.Sum(b => b.TotalAmount)
                    });
                }

                // Monthly data (last 6 months based on booking createdAt)
                var sixMonthsAgo = today.AddMonths(-6);
                var filteredMonthlyData = filtered
                    .Where(b => (b.CreatedAt is DateTime dt ? dt : DateTime.Parse(b.CreatedAt.ToString()!)) >= sixMonthsAgo)
                    .GroupBy(b => (b.CreatedAt is DateTime dt ? dt : DateTime.Parse(b.CreatedAt.ToString()!))
                                  .ToString("MMM"))
                    .OrderBy(g => g.Key)
                    .Select(g => new MonthlyData
                    {
                        Month = g.Key,
                        Bookings = g.Count(),
                        Revenue = g.Sum(b => b.TotalAmount)
                    })
                    .ToList();

                // Growth metrics & customer insights: reuse org-wide for now
                var orgGrowthMetrics = await _statisticsDataService.GetGrowthMetricsAsync(organizationId);
                var orgCustomerInsights = await _statisticsDataService.GetCustomerInsightsAsync(organizationId);

                var result = new
                {
                    basic,
                    leads,
                    statusDistribution = statusGroups,
                    hallUtilization = utilization,
                    monthlyData = filteredMonthlyData,
                    growthMetrics = orgGrowthMetrics,
                    customerInsights = orgCustomerInsights,
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

                var basicStats = await _statisticsDataService.GetBasicStatisticsAsync(organizationId);
                return Ok(basicStats);
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

                var leadMetrics = await _statisticsDataService.GetLeadMetricsAsync(organizationId);
                return Ok(leadMetrics);
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

                var statusData = await _statisticsDataService.GetStatusDataAsync(organizationId);
                return Ok(statusData);
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

                var hallUtilization = await _statisticsDataService.GetHallUtilizationAsync(organizationId);
                return Ok(hallUtilization);
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
                var monthlyData = await _statisticsDataService.GetMonthlyDataAsync(organizationId);
                return Ok(monthlyData);
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

                var growthMetrics = await _statisticsDataService.GetGrowthMetricsAsync(organizationId);
                return Ok(growthMetrics);
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

                var customerInsights = await _statisticsDataService.GetCustomerInsightsAsync(organizationId);
                return Ok(customerInsights);
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