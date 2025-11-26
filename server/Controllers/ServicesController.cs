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
        public async Task<IActionResult> Update(string id, ServiceItem serviceData)
        {
            try
            {
                var updated = await _servicesDataService.UpdateBookingServiceAsync(id, serviceData);
                return Ok(updated);
            }
            catch
            {
                return NotFound(new { message = "Service not found" });
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

        [HttpGet("bookings/{bookingId}/services")]

        public async Task<ActionResult<List<ServiceItem>>> GetServicesByBookingIdAsync(string bookingId)
        {
            try
            {
                var services = await _servicesDataService.GetServicesByBookingIdAsync(bookingId);
                return Ok(services);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
        //new
        [HttpPost("Service")]
        public async Task<ActionResult<ServiceItem>> CreateService(ServiceItem service)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var serviceItem = await _servicesDataService.CreateAsyncs(service);
                return CreatedAtAction(nameof(GetById), new { id = serviceItem.Id }, serviceItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("delete/{id}")]
        public async Task<ActionResult> Deletes(string id)
        {
            try
            {
                var deleted = await _servicesDataService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { error = "Services not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }

            //

        }
    }
}