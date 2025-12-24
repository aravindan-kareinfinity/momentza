using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/carousel")]
    public class CarouselItemController : ControllerBase
    {
        private readonly ICarouselItemDataService _carouselItemDataService;

        public CarouselItemController(ICarouselItemDataService carouselItemDataService)
        {
            _carouselItemDataService = carouselItemDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var carouselItems = await _carouselItemDataService.GetAllAsync();
                return Ok(carouselItems);
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
                var carouselItem = await _carouselItemDataService.GetByIdAsync(id);
                if (carouselItem == null)
                {
                    return NotFound(new { message = "Carousel item not found" });
                }
                return Ok(carouselItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CarouselItem carouselItem)
        {
            try
            {
                if (string.IsNullOrEmpty(carouselItem.Id))
                {
                    carouselItem.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }
                var success = await _carouselItemDataService.CreateAsync(carouselItem);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to create carousel item" });
                }
                return CreatedAtAction(nameof(GetById), new { id = carouselItem.Id }, carouselItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] CarouselItem carouselItem)
        {
            try
            {
                carouselItem.Id = id;
                var success = await _carouselItemDataService.UpdateAsync(carouselItem);
                if (!success)
                {
                    return NotFound(new { message = "Carousel item not found" });
                }
                return Ok(await _carouselItemDataService.GetByIdAsync(id));
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
                var success = await _carouselItemDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Carousel item not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("organization/{organizationId}")]
        [HttpGet("organizations/{organizationId}")]
        public async Task<IActionResult> GetByOrganization(string organizationId)
        {
            try
            {
                var carouselItems = await _carouselItemDataService.GetCarouselItemsAsync(organizationId);
                return Ok(carouselItems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("organizations/{organizationId}/active")]
        public async Task<IActionResult> GetActiveByOrganization(string organizationId)
        {
            try
            {
                var carouselItems = await _carouselItemDataService.GetCarouselItemsAsync(organizationId);
                var activeItems = carouselItems.Where(item => item.IsActive).ToList();
                return Ok(activeItems);
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
                var carouselItems = await _carouselItemDataService.GetActiveItemsAsync();
                return Ok(carouselItems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}/order")]
        public async Task<IActionResult> UpdateOrder(string id, [FromBody] UpdateOrderRequest request)
        {
            try
            {
                var success = await _carouselItemDataService.UpdateOrderAsync(id, request.Order);
                if (!success)
                {
                    return NotFound(new { message = "Carousel item not found" });
                }
                return Ok(new { message = "Order updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("organizations/{organizationId}/reorder")]
        public async Task<IActionResult> ReorderItems(string organizationId, [FromBody] ReorderRequest request)
        {
            try
            {
                // This is a simplified implementation - you might want to implement bulk reordering
                for (int i = 0; i < request.ItemIds.Count; i++)
                {
                    await _carouselItemDataService.UpdateOrderAsync(request.ItemIds[i], i + 1);
                }
                return Ok(new { message = "Items reordered successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("organizations/{organizationId}/{id}/move-up")]
        public async Task<IActionResult> MoveItemUp(string organizationId, string id)
        {
            try
            {
                var success = await _carouselItemDataService.MoveItemUpAsync(id, organizationId);
                if (!success)
                {
                    return NotFound(new { message = "Carousel item not found or cannot be moved up" });
                }
                return Ok(new { message = "Item moved up successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("organizations/{organizationId}/{id}/move-down")]
        public async Task<IActionResult> MoveItemDown(string organizationId, string id)
        {
            try
            {
                var success = await _carouselItemDataService.MoveItemDownAsync(id, organizationId);
                if (!success)
                {
                    return NotFound(new { message = "Carousel item not found or cannot be moved down" });
                }
                return Ok(new { message = "Item moved down successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }


        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleStatus(string id)
        {
            try
            {
                var success = await _carouselItemDataService.ToggleActiveAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Carousel item not found" });
                }
                return Ok(new { message = "Carousel item status toggled successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    public class UpdateOrderRequest
    {
        public int Order { get; set; }
    }

    public class ReorderRequest
    {
        public List<string> ItemIds { get; set; } = new List<string>();
        public List<string> ComponentIds { get; set; } = new List<string>();
        
    }
} 