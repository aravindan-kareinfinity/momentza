using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using System;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/reviews")]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewDataService _reviewDataService;

        public ReviewController(IReviewDataService reviewDataService)
        {
            _reviewDataService = reviewDataService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var reviews = await _reviewDataService.GetAllAsync();
                return Ok(reviews);
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
                var review = await _reviewDataService.GetByIdAsync(id);
                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }
                return Ok(review);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Reviews review)
        {
            try
            {
                var createdReview = await _reviewDataService.CreateReviewAsync(review);
                return CreatedAtAction(nameof(GetById), new { id = createdReview.Id }, createdReview);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Reviews review)
        {
            try
            {
                review.Id = id;
                var success = await _reviewDataService.UpdateAsync(review);
                if (!success)
                {
                    return NotFound(new { message = "Review not found" });
                }
                return Ok(await _reviewDataService.GetByIdAsync(id));
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
                var success = await _reviewDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Review not found" });
                }
                return NoContent();
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
                var reviews = await _reviewDataService.GetByUserAsync(userId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("hall/{hallId}")]
        public async Task<IActionResult> GetByHall(string hallId)
        {
            try
            {
                var reviews = await _reviewDataService.GetReviewsByHallAsync(hallId);
                return Ok(reviews);
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
                var reviews = await _reviewDataService.GetByOrganizationAsync(organizationId);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("rating/{rating}")]
        public async Task<IActionResult> GetByRating(int rating)
        {
            try
            {
                var reviews = await _reviewDataService.GetByRatingAsync(rating);
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("average-rating/{hallId}")]
        public async Task<IActionResult> GetAverageRating(string hallId)
        {
            try
            {
                var averageRating = await _reviewDataService.GetAverageRatingAsync(hallId);
                return Ok(new { averageRating });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("all-including-disabled")]
        public async Task<IActionResult> GetAllIncludingDisabled()
        {
            try
            {
                var reviews = await _reviewDataService.GetAllReviewsIncludingDisabledAsync();
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPatch("{id}/toggle-enabled")]
        public async Task<IActionResult> ToggleEnabled(string id, [FromBody] Reviews review)
        {
            try
            {
                var success = await _reviewDataService.ToggleReviewEnabledAsync(id, review.IsEnabled);
                if (!success)
                {
                    return NotFound(new { message = "Review not found" });
                }
                return Ok(new { message = $"Review {(review.IsEnabled ? "enabled" : "disabled")} successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

    }

}