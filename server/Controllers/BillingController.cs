using Microsoft.AspNetCore.Mvc;
using Momantza.Services;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly IBillingDataService _billingDataService;

        public BillingController(IBillingDataService billingDataService)
        {
            _billingDataService = billingDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var billings = await _billingDataService.GetAllAsync();
                return Ok(billings);
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
                var billing = await _billingDataService.GetByIdAsync(id);
                if (billing == null)
                {
                    return NotFound(new { message = "Billing record not found" });
                }
                return Ok(billing);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(dynamic billingData)
        {
            try
            {
                var createdBilling = await _billingDataService.CreateAsync(billingData);
                return CreatedAtAction(nameof(GetById), new { id = createdBilling.Id }, createdBilling);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> Update(string id, dynamic billingData)
        {
            try
            {
                // Set the ID on the billing data
                billingData.Id = id;
                var success = await _billingDataService.UpdateAsync(billingData);
                if (!success)
                {
                    return NotFound(new { message = "Billing record not found" });
                }
                return Ok(await _billingDataService.GetByIdAsync(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var success = await _billingDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Billing record not found" });
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
                var billings = await _billingDataService.GetByOrganizationAsync(organizationId);
                return Ok(billings);
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
                var billings = await _billingDataService.GetByUserAsync(userId);
                return Ok(billings);
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
                var billings = await _billingDataService.GetByStatusAsync(status);
                return Ok(billings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _billingDataService.GetBillingSettingsAsync();
            return Ok(settings);
        }

        [HttpPost("settings")]
        public async Task<IActionResult> UpdateSettings(Momantza.Models.BillingSettings settings)
        {
            var updated = await _billingDataService.UpdateBillingSettingsAsync(settings);
            return Ok(updated);
        }
    }
} 