using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/halls")]
    public class HallController : ControllerBase
    {
        private readonly IHallDataService _hallDataService;
        private readonly IUserDataService _userDataService;

        public HallController(IHallDataService hallDataService, IUserDataService userDataService)
        {
            _hallDataService = hallDataService;
            _userDataService = userDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                // Try to read current user from Authorization header (if present)
                var authHeader = Request.Headers["Authorization"].ToString();
                string? token = null;
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
                {
                    token = authHeader.Replace("Bearer ", "");
                }

                if (!string.IsNullOrEmpty(token))
                {
                    try
                    {
                        var handler = new JwtSecurityTokenHandler();
                        var jwt = handler.ReadJwtToken(token);

                        var userId = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                                     ?? jwt.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;
                        var role = jwt.Claims.FirstOrDefault(c => c.Type == "role")?.Value ?? "user";
                        var organizationId = jwt.Claims.FirstOrDefault(c => c.Type == "organizationId")?.Value ?? string.Empty;

                        if (!string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(organizationId))
                        {
                            var user = await _userDataService.GetByIdAndOrganizationAsync(userId, organizationId);

                            if (user != null)
                            {
                                // Admins: can see all halls in organization
                                if (string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
                                {
                                    var adminHalls = await _hallDataService.GetAllAsync();
                                    return Ok(adminHalls);
                                }

                                // Managers / other roles: only halls in AccessibleHalls
                                if (user.AccessibleHalls != null && user.AccessibleHalls.Any())
                                {
                                    var restrictedHalls = await _hallDataService.GetAccessibleHallsAsync(
                                        organizationId,
                                        user.AccessibleHalls
                                    );
                                    return Ok(restrictedHalls);
                                }

                                // Authenticated but no accessible halls configured
                                return Ok(new List<Hall>());
                            }
                        }
                    }
                    catch (Exception)
                    {
                        // If token parsing fails, fall through to default behavior
                    }
                }

                // No valid authenticated user (or token issues) -> keep existing public behavior (all halls for org)
                var halls = await _hallDataService.GetAllAsync();
                return Ok(halls);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet ("enable")]
        public async Task<IActionResult> GetsAll()
        {
            try
            {
                var halls = await _hallDataService.GetEnableAsync();
                return Ok(halls);
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
                var hall = await _hallDataService.GetByIdAsync(id);
                if (hall == null)
                {
                    return NotFound(new { message = "Hall not found" });
                }
                return Ok(hall);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(Hall hall)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdHall = await _hallDataService.CreateHallAsync(hall);
                return CreatedAtAction(nameof(GetById), new { id = createdHall.Id }, createdHall);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/update")]
        public async Task<IActionResult> Update(string id, Hall hall)
        {
            try
            {
                var updatedHall = await _hallDataService.UpdateHallAsync(id, hall);
                return Ok(updatedHall);
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
                var success = await _hallDataService.DeleteHallAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Hall not found" });
                }
                return NoContent();
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
                var halls = await _hallDataService.GetHallsByOrganizationAsync(organizationId);
                return Ok(halls);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveHalls()
        {
            try
            {
                var halls = await _hallDataService.GetActiveHallsAsync();
                return Ok(halls);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}/available-slots")]
        [HttpGet("{id}/timeslots")]
        public async Task<IActionResult> GetAvailableTimeSlots(string id, [FromQuery] DateTime date)
        {
            try
            {
                var slots = await _hallDataService.GetAvailableTimeSlotsAsync(id, date);
                return Ok(slots);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("capacity-range")]
        public async Task<IActionResult> GetByCapacityRange([FromQuery] int minCapacity, [FromQuery] int maxCapacity)
        {
            try
            {
                var halls = await _hallDataService.GetByCapacityRangeAsync(minCapacity, maxCapacity);
                return Ok(halls);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}