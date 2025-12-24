using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using Microsoft.AspNetCore.Http;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GalleryController : ControllerBase
    {
        private readonly IGalleryDataService _galleryDataService;

        public GalleryController(IGalleryDataService galleryDataService)
        {
            _galleryDataService = galleryDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var galleryItems = await _galleryDataService.GetAllAsync();
                return Ok(galleryItems);
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
                var galleryItem = await _galleryDataService.GetByIdAsync(id);
                if (galleryItem == null)
                {
                    return NotFound(new { message = "Gallery item not found" });
                }
                return Ok(galleryItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(GalleryImage galleryImage)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var success = await _galleryDataService.CreateAsync(galleryImage);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to create gallery item" });
                }
                return CreatedAtAction(nameof(GetById), new { id = galleryImage.Id }, galleryImage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> Update(string id, dynamic galleryData)
        {
            try
            {
                // Set the ID on the gallery data
                galleryData.Id = id;
                var success = await _galleryDataService.UpdateAsync(galleryData);
                if (!success)
                {
                    return NotFound(new { message = "Gallery item not found" });
                }
                return Ok(await _galleryDataService.GetByIdAsync(id));
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
                var success = await _galleryDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Gallery item not found" });
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
                var galleryItems = await _galleryDataService.GetByOrganizationAsync(organizationId);
                return Ok(galleryItems);
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
                var galleryItems = await _galleryDataService.GetActiveAsync();
                return Ok(galleryItems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("category/{category}")]
        public async Task<IActionResult> GetByCategory(string category)
        {
            try
            {
                var galleryItems = await _galleryDataService.GetByCategoryAsync(category);
                return Ok(galleryItems);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/activate")]
        public async Task<IActionResult> Activate(string id)
        {
            try
            {
                var success = await _galleryDataService.ActivateAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Gallery item not found" });
                }
                return Ok(new { message = "Gallery item activated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(string id)
        {
            try
            {
                var success = await _galleryDataService.DeactivateAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Gallery item not found" });
                }
                return Ok(new { message = "Gallery item deactivated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("organizations/{organizationId}/upload")]
        public async Task<IActionResult> UploadGalleryImage(string organizationId, [FromForm] IFormFile file, [FromForm] string title, [FromForm] string category)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file provided" });
                }

                if (string.IsNullOrEmpty(title))
                {
                    return BadRequest(new { message = "Title is required" });
                }

                if (string.IsNullOrEmpty(category))
                {
                    return BadRequest(new { message = "Category is required" });
                }

                var result = await _galleryDataService.UploadImageAsync(organizationId, file, title, category);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}/image")]
        public async Task<IActionResult> GetImage(string id)
        {
            try
            {
                var galleryItem = await _galleryDataService.GetByIdAsync(id);
                if (galleryItem == null)
                {
                    return NotFound(new { message = "Gallery item not found" });
                }

                if (galleryItem.ImageBytes == null || galleryItem.ImageBytes.Length == 0)
                {
                    return NotFound(new { message = "Image data not found" });
                }

                var contentType = galleryItem.ContentType ?? "image/jpeg";
                return File(galleryItem.ImageBytes, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
} 