using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;


namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MicrositeController : ControllerBase
    {
        private readonly IMicrositeComponentDataService _componentDataService;

        public MicrositeController(IMicrositeComponentDataService componentDataService)
        {
            _componentDataService = componentDataService;
        }

        [HttpGet("organizations/{organizationId}/components")]
        public async Task<IActionResult> GetComponents(string organizationId)
        {
            try
            {
                var components = await _componentDataService.GetByOrganizationAsync(organizationId);
                return Ok(components);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("components")]
        public async Task<IActionResult> CreateComponent(MicrositeComponent component)
        {
            try
            {
                // Debug logging - log the entire component object
                Console.WriteLine($"Received component: {System.Text.Json.JsonSerializer.Serialize(component)}");
                Console.WriteLine($"Component Type: '{component.Type}' (Length: {component.Type?.Length ?? 0})");
                Console.WriteLine($"Component OrderPosition: {component.OrderPosition}");
                Console.WriteLine($"Component IsActive: {component.IsActive}");
                Console.WriteLine($"Component OrganizationId: '{component.OrganizationId}'");
                
                // Manual validation for required fields
                if (string.IsNullOrEmpty(component.Type))
                {
                    Console.WriteLine("Component type is null or empty");
                    return BadRequest(new { message = "Component type is required" });
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .Select(x => new { Field = x.Key, Errors = x.Value.Errors.Select(e => e.ErrorMessage) })
                        .ToList();
                    
                    Console.WriteLine($"ModelState validation errors: {string.Join(", ", errors.Select(e => $"{e.Field}: {string.Join(", ", e.Errors)}"))}");
                    return BadRequest(new { message = "Validation failed", errors });
                }

                component.Id = Guid.NewGuid().ToString();
                component.CreatedAt = DateTime.UtcNow;
                component.UpdatedAt = DateTime.UtcNow;

                var success = await _componentDataService.CreateAsync(component);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to create component" });
                }

                return CreatedAtAction(nameof(GetComponent), new { id = component.Id }, component);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("components/{id}")]
        public async Task<IActionResult> GetComponent(string id)
        {
            try
            {
                var component = await _componentDataService.GetByIdAsync(id);
                if (component == null)
                {
                    return NotFound(new { message = "Component not found" });
                }
                return Ok(component);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("components/{id}")]
        public async Task<IActionResult> UpdateComponent(string id, MicrositeComponent component)
        {
            try
            {
                // Debug logging
                Console.WriteLine($"Updating component {id} with: {System.Text.Json.JsonSerializer.Serialize(component)}");
                
                if (!ModelState.IsValid)
                {
                    var errors = ModelState
                        .Where(x => x.Value.Errors.Count > 0)
                        .Select(x => new { Field = x.Key, Errors = x.Value.Errors.Select(e => e.ErrorMessage) })
                        .ToList();
                    
                    Console.WriteLine($"ModelState validation errors: {string.Join(", ", errors.Select(e => $"{e.Field}: {string.Join(", ", e.Errors)}"))}");
                    return BadRequest(new { message = "Validation failed", errors });
                }

                // Get the existing component
                var existingComponent = await _componentDataService.GetByIdAsync(id);
                if (existingComponent == null)
                {
                    return NotFound(new { message = "Component not found" });
                }

                // Ensure Type field is preserved (it's required and shouldn't change)
                if (string.IsNullOrEmpty(existingComponent.Type))
                {
                    return BadRequest(new { message = "Component type is required and cannot be empty" });
                }

                // Update the component with the new data, preserving required fields
                existingComponent.Config = component.Config;
                existingComponent.OrderPosition = component.OrderPosition;
                existingComponent.IsActive = component.IsActive;
                existingComponent.OrganizationId = component.OrganizationId ?? existingComponent.OrganizationId;
                existingComponent.UpdatedAt = DateTime.UtcNow;

                var success = await _componentDataService.UpdateAsync(existingComponent);
                if (!success)
                {
                    return NotFound(new { message = "Component not found" });
                }

                return Ok(await _componentDataService.GetByIdAsync(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("components/{id}")]
        public async Task<IActionResult> DeleteComponent(string id)
        {
            try
            {
                var success = await _componentDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Component not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("organizations/{organizationId}/reorder")]
        public async Task<IActionResult> ReorderComponents(string organizationId, [FromBody] ReorderRequest request)
        {
            try
            {
                if (request?.ComponentIds == null || !request.ComponentIds.Any())
                {
                    return BadRequest(new { message = "Component IDs are required" });
                }

                var success = await _componentDataService.ReorderComponentsAsync(organizationId, request.ComponentIds);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to reorder components" });
                }

                return Ok(new { message = "Components reordered successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPatch("components/{id}/toggle")]
        public async Task<IActionResult> ToggleComponent(string id, [FromBody] ToggleRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { message = "Request body is required" });
                }

                var success = await _componentDataService.ToggleActiveAsync(id, request.IsActive);
                if (!success)
                {
                    return NotFound(new { message = "Component not found" });
                }

                var component = await _componentDataService.GetByIdAsync(id);
                return Ok(component);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }

    //public class ReorderRequest
    //{
    //    public List<string> ComponentIds { get; set; } = new List<string>();
    //}

    public class ToggleRequest
    {
        public bool IsActive { get; set; }
    }


} 