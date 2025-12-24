using Microsoft.AspNetCore.Mvc;
using Momantza.Models;
using MomantzaApp.DataService;
using MomantzaApp.model;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeatureController : ControllerBase
    {
        private readonly IFeatureDataService _featureService;

        public FeatureController(IFeatureDataService featureService)
        {
            _featureService = featureService;
        }

        // GET: api/features
        [HttpGet]
        public async Task<ActionResult<List<FeatureItem>>> GetAll()
        {
            try
            {
                var features = await _featureService.GetAllAsync();
                return Ok(features);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/feature/booking/{bookingId}
        [HttpGet("booking/{bookingId}")]
        public async Task<ActionResult<List<FeatureItem>>> GetByBookingId(string bookingId)
        {
            try
            {
                var features = await _featureService.GetByBookingIdAsync(bookingId);
                return Ok(features);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // GET: api/features/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<FeatureItem>> GetById(string id)
        {
            try
            {
                var feature = await _featureService.GetByIdAsync(id);
                if (feature == null)
                    return NotFound(new { error = "Feature not found" });

                return Ok(feature);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/features
        [HttpPost]
        public async Task<ActionResult<FeatureItem>> Create(FeatureItem feature)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var createdFeature = await _featureService.CreateAsync(feature);
                return CreatedAtAction(nameof(GetById), new { id = createdFeature.Id }, createdFeature);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // PUT: api/features/{id}
        [HttpPost("{id}")]
        public async Task<ActionResult<FeatureItem>> Update(string id, FeatureItem feature)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var updatedFeature = await _featureService.UpdateAsync(id, feature);
                return Ok(updatedFeature);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // DELETE: api/features/{id}
        [HttpPost("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _featureService.DeleteAsync(id);
                if (!deleted)
                    return NotFound(new { error = "Feature not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
