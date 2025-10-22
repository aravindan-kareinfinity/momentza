using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/halls")]
    public class HallController : ControllerBase
    {
        private readonly IHallDataService _hallDataService;

        public HallController(IHallDataService hallDataService)
        {
            _hallDataService = hallDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var halls = await _hallDataService.GetAllAsync();
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

        [HttpPut("{id}")]
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

        [HttpDelete("{id}")]
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