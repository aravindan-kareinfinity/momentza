using Microsoft.AspNetCore.Mvc;
using Momantza.Services;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsDataService _statisticsDataService;

        public StatisticsController(IStatisticsDataService statisticsDataService)
        {
            _statisticsDataService = statisticsDataService;
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

                // Get all statistics data using the new methods
                var basicStats = await _statisticsDataService.GetBasicStatisticsAsync(organizationId);
                var leadMetrics = await _statisticsDataService.GetLeadMetricsAsync(organizationId);
                var monthlyData = await _statisticsDataService.GetMonthlyDataAsync(organizationId);
                var growthMetrics = await _statisticsDataService.GetGrowthMetricsAsync(organizationId);
                var customerInsights = await _statisticsDataService.GetCustomerInsightsAsync(organizationId);
                var statusData = await _statisticsDataService.GetStatusDataAsync(organizationId);
                var hallUtilization = await _statisticsDataService.GetHallUtilizationAsync(organizationId);

                // Transform the data to match frontend expectations
                var result = new
                {
                    // Basic statistics - dashboard overview
                    basic = basicStats,

                    // Lead metrics
                    leads = leadMetrics,

                    // Direct data from services
                    statusDistribution = statusData,
                    hallUtilization = hallUtilization,
                    monthlyData = monthlyData,
                    growthMetrics = growthMetrics,
                    customerInsights = customerInsights,

                    // Chart configuration
                    chartConfig = new
                    {
                        colors = new[] { "#10B981", "#F59E0B", "#EF4444", "#6B7280", "#3B82F6", "#8B5CF6" },
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