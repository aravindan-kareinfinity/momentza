using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly IUserDataService _userDataService;

        public UserController(IUserDataService userDataService)
        {
            _userDataService = userDataService;
        }

        private async Task<Users?> GetCurrentUserFromBearerTokenAsync()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return null;
            }

            var token = authHeader.Replace("Bearer ", "");
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwt = handler.ReadJwtToken(token);

                var userId = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                             ?? jwt.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;
                var organizationId = jwt.Claims.FirstOrDefault(c => c.Type == "organizationId")?.Value ?? string.Empty;

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(organizationId))
                {
                    return null;
                }

                return await _userDataService.GetByIdAndOrganizationAsync(userId, organizationId);
            }
            catch
            {
                return null;
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                // If logged in, restrict results based on role:
                // - admin: all users in organization
                // - others: only (current user + admins)
                var currentUser = await GetCurrentUserFromBearerTokenAsync();

                if (currentUser != null && !string.IsNullOrEmpty(currentUser.OrganizationId))
                {
                    var orgUsers = await _userDataService.GetUsersByOrganizationAsync(currentUser.OrganizationId);

                    if (string.Equals(currentUser.Role, "admin", StringComparison.OrdinalIgnoreCase))
                    {
                        return Ok(orgUsers);
                    }

                    var filtered = orgUsers
                        .Where(u =>
                            string.Equals(u.Role, "admin", StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(u.Id, currentUser.Id, StringComparison.OrdinalIgnoreCase))
                        .GroupBy(u => u.Id)
                        .Select(g => g.First())
                        .ToList();

                    return Ok(filtered);
                }

                // Fallback (no valid token): keep previous behavior
                var users = await _userDataService.GetAllAsync();
                return Ok(users);
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
                var user = await _userDataService.GetByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(Users user)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                //user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password, BCrypt.Net.BCrypt.GenerateSalt(12));
                var success = await _userDataService.CreateUserAsync(user);
                if (success == null)
                {
                    return StatusCode(500, new { message = "Failed to create user" });
                }
                return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("update")]
        public async Task<IActionResult> Update(Users user)
        {
            try
            {
                var success = await _userDataService.UpdateUserAsync(user.Id, user);
                if (success == null)
                {
                    return NotFound(new { message = "User not found" });
                }
                return Ok(await _userDataService.GetByIdAsync(user.Id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("delete/{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var success = await _userDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "User not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            try
            {
                var user = await _userDataService.GetByEmailAsync(email);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }
                return Ok(user);
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
                var users = await _userDataService.GetByOrganizationAsync(organizationId);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}