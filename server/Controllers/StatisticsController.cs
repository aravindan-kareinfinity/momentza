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