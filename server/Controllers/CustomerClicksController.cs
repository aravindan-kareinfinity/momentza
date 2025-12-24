using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    public class CustomerClickUploadRequest
    {
        public string? Id { get; set; }
        public string? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerPhone { get; set; }
        public DateTime? EventDate { get; set; }
        public string? EventType { get; set; }
        public int? GuestCount { get; set; }
        public string? Message { get; set; }
        public int? Rating { get; set; }
        public string? HallId { get; set; }
        public string? BoyName { get; set; }
        public string? GirlName { get; set; }
        public string? ImageBase64 { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Route("api/customer-clicks")]
    public class CustomerClicksController : ControllerBase
    {
        private readonly ICustomerClicksDataService _customerClicksDataService;

        public CustomerClicksController(ICustomerClicksDataService customerClicksDataService)
        {
            _customerClicksDataService = customerClicksDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var clicks = await _customerClicksDataService.GetAllAsync();
                return Ok(clicks);
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
                var click = await _customerClicksDataService.GetByIdAsync(id);
                if (click == null)
                {
                    return NotFound(new { message = "Customer click not found" });
                }
                return Ok(click);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(CustomerClick customerClick)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var success = await _customerClicksDataService.CreateAsync(customerClick);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to create customer click" });
                }
                return CreatedAtAction(nameof(GetById), new { id = customerClick.Id }, customerClick);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> Update(string id, dynamic clickData)
        {
            try
            {
                // Set the ID on the click data
                clickData.Id = id;
                var success = await _customerClicksDataService.UpdateAsync(clickData);
                if (!success)
                {
                    return NotFound(new { message = "Customer click record not found" });
                }
                return Ok(await _customerClicksDataService.GetByIdAsync(id));
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
                var success = await _customerClicksDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Customer click not found" });
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
                var clicks = await _customerClicksDataService.GetByOrganizationAsync(organizationId);
                return Ok(clicks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics([FromQuery] string? organizationId = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var statistics = await _customerClicksDataService.GetStatisticsAsync(organizationId, startDate, endDate);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("hall/{hallId}/customer-clicks")]
        public async Task<IActionResult> GetCustomerClicksByHall(string hallId)
        {
            try
            {
                var clicks = await _customerClicksDataService.GetByHallIdAsync(hallId);
                return Ok(clicks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadCustomerClick(CustomerClickUploadRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { message = "Request body is required" });
                }

                // Set default values for optional parameters
                request.CustomerName ??= "Anonymous";
                request.CustomerEmail ??= "no-email@example.com";
                request.CustomerPhone ??= "No Phone";
                request.EventDate ??= DateTime.UtcNow.AddDays(30); // Default to 30 days from now
                request.EventType ??= "General";
                request.GuestCount ??= 1;
                request.Message ??= "No message provided";
                request.Rating ??= 5;

                // Get the current organization ID from the context
                var organizationId = GetCurrentOrganizationId();

                // Create CustomerClick object from request
                var customerClick = new CustomerClick
                {
                    Id = request.Id,
                    CustomerId = request.CustomerId ?? $"customer-{DateTime.Now.Ticks}",
                    HallId = request.HallId,
                    CustomerName = request.CustomerName,
                    CustomerEmail = request.CustomerEmail,
                    CustomerPhone = request.CustomerPhone,
                    EventDate = request.EventDate?.Date ?? DateTime.Now,
                    EventType = request.EventType,
                    GuestCount = request.GuestCount ?? 1,
                    Message = request.Message,
                    Rating = request.Rating,
                    BoyName = request.BoyName,
                    GirlName = request.GirlName,
                    Timestamp = DateTime.Now,
                    CreatedAt = DateTime.Now
                };

                // Handle image data from base64
                if (!string.IsNullOrEmpty(request.ImageBase64))
                {
                    try
                    {
                        var imageBytes = Convert.FromBase64String(request.ImageBase64);
                        customerClick.ImageBytes = imageBytes;
                        customerClick.ContentType = "image/jpeg"; // Default content type
                    }
                    catch (Exception ex)
                    {
                        return BadRequest(new { message = "Invalid image data format", error = ex.Message });
                    }
                }

                // Check if this is a create or update operation
                bool isUpdate = !string.IsNullOrEmpty(request.Id);
                bool success;

                if (isUpdate)
                {
                    // Update existing customer click
                    success = await _customerClicksDataService.UpdateAsync(customerClick);
                    if (!success)
                    {
                        return NotFound(new { message = "Customer click not found for update" });
                    }
                }
                else
                {
                    // Create new customer click
                    customerClick.Id = Guid.NewGuid().ToString();
                    success = await _customerClicksDataService.CreateAsync(customerClick);
                    if (!success)
                    {
                        return StatusCode(500, new { message = "Failed to create customer click" });
                    }
                }

                // Return the created/updated customer click
                var result = await _customerClicksDataService.GetByIdAsync(customerClick.Id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        private string GetCurrentOrganizationId()
        {
            // This method should get the organization ID from the current context
            // You might need to implement this based on your authentication/authorization setup
            // For now, I'll return a placeholder - you should replace this with your actual implementation
            return HttpContext.Items["OrganizationId"]?.ToString() ?? string.Empty;
        }

        [HttpGet("{id}/image")]
        public async Task<IActionResult> GetImage(string id)
        {
            try
            {
                var customerClick = await _customerClicksDataService.GetCustomerClickWithImageAsync(id);
                if (customerClick == null)
                {
                    return NotFound(new { message = "Customer click not found" });
                }

                if (customerClick.ImageBytes == null || customerClick.ImageBytes.Length == 0)
                {
                    return NotFound(new { message = "Image data not found" });
                }

                var contentType = customerClick.ContentType ?? "application/octet-stream";
                return File(customerClick.ImageBytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
} 