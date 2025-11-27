using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryDataService _inventoryService;

        public InventoryController(IInventoryDataService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet]
        public async Task<ActionResult<List<InventoryItem>>> GetAll()
        {
            try
            {
                var items = await _inventoryService.GetAllAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryItem>> GetById(string id)
        {
            try
            {
                var item = await _inventoryService.GetByIdAsync(id);
                if (item == null)
                {
                    return NotFound(new { error = "Inventory item not found" });
                }
                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("name/{name}")]
        public async Task<ActionResult<InventoryItem>> GetByName(string name)
        {
            try
            {
                var item = await _inventoryService.GetByNameAsync(name);
                if (item == null)
                {
                    return NotFound(new { error = "Inventory item not found" });
                }
                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<InventoryItem>> Create(InventoryItem item)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdItem = await _inventoryService.CreateAsync(item);
                return CreatedAtAction(nameof(GetById), new { id = createdItem.Id }, createdItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InventoryItem>> Update(string id, InventoryItem item)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var updatedItem = await _inventoryService.UpdateAsync(id, item);
                return Ok(updatedItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _inventoryService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { error = "Inventory item not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        //new
        [HttpGet("bookings/{bookingId}/inventory")]
        public async Task<ActionResult<List<InventoryItem>>> GetByBookingId(string bookingId)
        {
            try
            {
                var inventory = await _inventoryService.GetInventoryByBookingIdAsync(bookingId);
                return Ok(inventory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
} 