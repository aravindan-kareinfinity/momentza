using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly IServicesDataService _servicesDataService;

        public ServicesController(IServicesDataService servicesDataService)
        {
            _servicesDataService = servicesDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var services = await _servicesDataService.GetAllAsync();
                return Ok(services);
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
                var service = await _servicesDataService.GetByIdAsync(id);
                if (service == null)
                {
                    return NotFound(new { message = "Service not found" });
                }
                return Ok(service);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(ServiceItem serviceItem)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                if (string.IsNullOrEmpty(serviceItem.Id))
                {
                    serviceItem.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                var success = await _servicesDataService.CreateAsync(serviceItem);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to create service" });
                }
                return CreatedAtAction(nameof(GetById), new { id = serviceItem.Id }, serviceItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] ServiceItem serviceData)
        {
            try
            {
                // Create a new ServiceItem with the ID from route
                var updatedService = new ServiceItem
                {
                    Id = id, // Use the ID from URL route
                    Name = serviceData.Name,
                    HsnCode = serviceData.HsnCode,
                    TaxPercentage = serviceData.TaxPercentage,
                    BasePrice = serviceData.BasePrice,
                   // IsActive = serviceData.IsActive,
                    // Add other properties if needed
                   // UserId = serviceData.UserId // Make sure to include this if your model requires it
                };

                var success = await _servicesDataService.UpdateAsync(updatedService);
                if (!success)
                {
                    return NotFound(new { message = "Service not found" });
                }
                return Ok(await _servicesDataService.GetByIdAsync(id));
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
                var success = await _servicesDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Service not found" });
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
                var services = await _servicesDataService.GetByOrganizationAsync(organizationId);
                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            try
            {
                var services = await _servicesDataService.GetActiveAsync();
                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
} 