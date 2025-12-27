using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsDataService _settingsDataService;

        public SettingsController(ISettingsDataService settingsDataService)
        {
            _settingsDataService = settingsDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var settings = await _settingsDataService.GetAllAsync();
                return Ok(settings);
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
                var setting = await _settingsDataService.GetByIdAsync(id);
                if (setting == null)
                {
                    return NotFound(new { message = "Setting not found" });
                }
                return Ok(setting);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(MasterDataItem masterDataItem)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var success = await _settingsDataService.CreateAsync(masterDataItem);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to create setting" });
                }
                return CreatedAtAction(nameof(GetById), new { id = masterDataItem.Id }, masterDataItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> Update(string id, MasterDataItem masterDataItem)
        {
            try
            {
                masterDataItem.Id = id;
                var success = await _settingsDataService.UpdateAsync(masterDataItem);
                if (!success)
                {
                    return NotFound(new { message = "Setting not found" });
                }
                return Ok(await _settingsDataService.GetByIdAsync(id));
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
                var success = await _settingsDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Setting not found" });
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
                var settings = await _settingsDataService.GetByOrganizationAsync(organizationId);
                return Ok(settings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("key/{key}")]
        public async Task<IActionResult> GetByKey(string key, [FromQuery] string? organizationId = null)
        {
            try
            {
                var setting = await _settingsDataService.GetByKeyAsync(key, organizationId);
                if (setting == null)
                {
                    return NotFound(new { message = "Setting not found" });
                }
                return Ok(setting);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("key/{key}")]
        public async Task<IActionResult> UpdateByKey(string key, dynamic value, [FromQuery] string? organizationId = null)
        {
            try
            {
                var success = await _settingsDataService.UpdateByKeyAsync(key, value, organizationId);
                if (!success)
                {
                    return NotFound(new { message = "Setting not found" });
                }
                return Ok(new { message = "Setting updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Event Types endpoints
        [HttpGet("event-types")]
        public async Task<IActionResult> GetEventTypes()
        {
            try
            {
                var items = await _settingsDataService.GetEventTypesAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        //[HttpPost("event-types")]
        //public async Task<IActionResult> AddEventType([FromBody] AddMasterDataRequest request)
        //{
        //    try
        //    {
        //        if (!ModelState.IsValid)
        //        {
        //            return BadRequest(ModelState);
        //        }

        //        var item = await _settingsDataService.CreateEventTypeAsync(request.Name);
        //        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        //    }
        //}

        //[HttpPost("event-types/{id}")]
        //public async Task<IActionResult> UpdateEventType(string id, [FromBody] UpdateMasterDataRequest request)
        //{
        //    try
        //    {
        //        if (!ModelState.IsValid)
        //        {
        //            return BadRequest(ModelState);
        //        }

        //        var item = await _settingsDataService.UpdateEventTypeAsync(id, request.Name);
        //        return Ok(item);
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        //    }
        //}

        //[HttpPost("event-types/{id}")]
        //public async Task<IActionResult> DeleteEventType(string id)
        //{
        //    try
        //    {
        //        var success = await _settingsDataService.DeleteAsync(id);
        //        if (!success)
        //        {
        //            return NotFound(new { message = "Event type not found" });
        //        }
        //        return NoContent();
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        //    }
        //}

        // Event Types endpoints

        [HttpPost("event-types/add")]
        public async Task<IActionResult> AddEventType([FromBody] AddMasterDataRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = await _settingsDataService.CreateEventTypeAsync(request.Name);
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }

        [HttpPost("event-types/update/{id}")]
        public async Task<IActionResult> UpdateEventType(string id, [FromBody] UpdateMasterDataRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = await _settingsDataService.UpdateEventTypeAsync(id, request.Name);
            return Ok(item);
        }

        [HttpPost("event-types/delete/{id}")]
        public async Task<IActionResult> DeleteEventType(string id)
        {
            var success = await _settingsDataService.DeleteAsync(id);
            if (!success)
                return NotFound(new { message = "Event type not found" });

            return NoContent();
        }


        // Image Categories endpoints
        [HttpGet("image-categories")]
        public async Task<IActionResult> GetImageCategories()
        {
            try
            {
                var items = await _settingsDataService.GetImageCategoriesAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("image-categories/add")]
        public async Task<IActionResult> AddImageCategory([FromBody] AddMasterDataRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.CreateImageCategoryAsync(request.Name);
                return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("image-categories/update/{id}")]
        public async Task<IActionResult> UpdateImageCategory(string id, [FromBody] UpdateMasterDataRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.UpdateImageCategoryAsync(id, request.Name);
                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("image-categories/delete/{id}")]
        public async Task<IActionResult> DeleteImageCategory(string id)
        {
            try
            {
                var success = await _settingsDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Image category not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Employees endpoints
        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            try
            {
                var items = await _settingsDataService.GetEmployeesAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("employees/add")]
        public async Task<IActionResult> AddEmployee([FromBody] AddMasterDataRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.CreateEmployeeAsync(request.Name);
                return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("employees/update/{id}")]
        public async Task<IActionResult> UpdateEmployee(string id, [FromBody] UpdateMasterDataRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.UpdateEmployeeAsync(id, request.Name);
                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("employees/delete/{id}")]
        public async Task<IActionResult> DeleteEmployee(string id)
        {
            try
            {
                var success = await _settingsDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Employee not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Inventory Items endpoints
        [HttpGet("inventory-items")]
        public async Task<IActionResult> GetInventoryItems()
        {
            try
            {
                var items = await _settingsDataService.GetInventoryItemsAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("inventory-items/add")]
        public async Task<IActionResult> AddInventoryItem([FromBody] AddInventoryItemRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.CreateInventoryItemAsync(request.Name, request.Charge);
                return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("inventory-items/update/{id}")]
        public async Task<IActionResult> UpdateInventoryItem(string id, [FromBody] UpdateInventoryItemRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.UpdateInventoryItemAsync(id, request.Name, request.Charge);
                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("inventory-items/delete/{id}")]
        public async Task<IActionResult> DeleteInventoryItem(string id)
        {
            try
            {
                var success = await _settingsDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Inventory item not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Ticket Categories endpoints
        [HttpGet("ticket-categories")]
        public async Task<IActionResult> GetTicketCategories()
        {
            try
            {
                var items = await _settingsDataService.GetTicketCategoriesAsync();
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("ticket-categories/add")]
        public async Task<IActionResult> AddTicketCategory([FromBody] AddMasterDataRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.CreateTicketCategoryAsync(request.Name);
                return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("ticket-categories/update/{id}")]
        public async Task<IActionResult> UpdateTicketCategory(string id, [FromBody] UpdateMasterDataRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var item = await _settingsDataService.UpdateTicketCategoryAsync(id, request.Name);
                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("ticket-categories/delete/{id}")]
        public async Task<IActionResult> DeleteTicketCategory(string id)
        {
            try
            {
                var success = await _settingsDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Ticket category not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // Generic master data endpoints for the React client
        [HttpGet("{type}")]
        public async Task<IActionResult> GetMasterData(string type)
        {
            try
            {
                List<MasterDataItem> items = type switch
                {
                    "eventTypes" => await _settingsDataService.GetEventTypesAsync(),
                    "imageCategories" => await _settingsDataService.GetImageCategoriesAsync(),
                    "employees" => await _settingsDataService.GetEmployeesAsync(),
                    "inventoryItems" => await _settingsDataService.GetInventoryItemsAsync(),
                    "ticketCategories" => await _settingsDataService.GetTicketCategoriesAsync(),
                    _ => throw new ArgumentException($"Unknown master data type: {type}")
                };
                return Ok(items);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        //[HttpPost("{type}")]
        //public async Task<IActionResult> AddMasterData(string type, [FromBody] AddMasterDataRequest request)
        //{
        //    try
        //    {
        //        if (!ModelState.IsValid)
        //        {
        //            return BadRequest(ModelState);
        //        }

        //        MasterDataItem item = type switch
        //        {
        //            "eventTypes" => await _settingsDataService.CreateEventTypeAsync(request.Name),
        //            "imageCategories" => await _settingsDataService.CreateImageCategoryAsync(request.Name),
        //            "employees" => await _settingsDataService.CreateEmployeeAsync(request.Name),
        //            "inventoryItems" => await _settingsDataService.CreateInventoryItemAsync(request.Name, request.Charge),
        //            "ticketCategories" => await _settingsDataService.CreateTicketCategoryAsync(request.Name),
        //            _ => throw new ArgumentException($"Unknown master data type: {type}")
        //        };
        //        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        //    }
        //    catch (ArgumentException ex)
        //    {
        //        return BadRequest(new { message = ex.Message });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        //    }
        //}

        //[HttpPost("{type}/{id}")]
        //public async Task<IActionResult> DeleteMasterData(string type, string id)
        //{
        //    try
        //    {
        //        var success = await _settingsDataService.DeleteAsync(id);
        //        if (!success)
        //        {
        //            return NotFound(new { message = $"{type} not found" });
        //        }
        //        return NoContent();
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Internal server error", error = ex.Message });
        //    }
        //}
    }

    public class AddMasterDataRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal? Charge { get; set; }
    }

    public class UpdateMasterDataRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    public class AddInventoryItemRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal? Charge { get; set; }
    }

    public class UpdateInventoryItemRequest
    {
        public string Name { get; set; } = string.Empty;
        public decimal? Charge { get; set; }
    }
} 