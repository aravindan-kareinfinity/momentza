using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Momantza.Services;
using Momantza.Models;
using Momantza.Middleware;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthDataService _authService;

        public AuthController(IAuthDataService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.LoginAsync(request.Email, request.Password);
                if (result == null)
                {
                    return Unauthorized(new { message = "Invalid credentials" });
                }

                // Generate token for the user
                var token = await _authService.GenerateTokenAsync(result);
                if (string.IsNullOrEmpty(token))
                {
                    return StatusCode(500, new { message = "Failed to generate token" });
                }

                // Create response without password
                var loginResponse = new LoginResponse
                {
                    User = new UserResponse
                    {
                        Id = result.Id,
                        Email = result.Email,
                        Name = result.Name,
                        OrganizationId = result.OrganizationId,
                        Role = result.Role,
                        AccessibleHalls = result.AccessibleHalls,
                        CreatedAt = result.CreatedAt,
                        UpdatedAt = result.UpdatedAt
                    },
                    Token = token,
                    Message = "Login successful"
                };

                return Ok(loginResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString();
                var success = await _authService.LogoutAsync(token);
                if (!success)
                {
                    return BadRequest(new { message = "Logout failed" });
                }
                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserResponse>> GetCurrentUser()
        {
            try
            {
                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var user = await _authService.GetCurrentUserAsync(token);
                if (user == null)
                {
                    return Unauthorized(new { error = "Invalid token" });
                }

                // Return user without password
                var userResponse = new UserResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    Name = user.Name,
                    OrganizationId = user.OrganizationId,
                    Role = user.Role,
                    AccessibleHalls = user.AccessibleHalls,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return Ok(userResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var user = await _authService.GetCurrentUserAsync(token);
                if (user == null)
                {
                    return Unauthorized(new { error = "Invalid token" });
                }

                var success = await _authService.ChangePasswordAsync(user.Id, request.CurrentPassword, request.NewPassword);
                if (!success)
                {
                    return BadRequest(new { error = "Invalid current password" });
                }

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var success = await _authService.ResetPasswordAsync(request.Email);
                return Ok(new { message = "Password reset email sent" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Get organization from context
                var organization = HttpContext.Items["Organization"] as OrganizationContext;
                if (organization == null)
                {
                    return BadRequest(new { message = "Unable to determine organization. Please access via organization subdomain." });
                }

                Console.WriteLine($"👤 Register attempt for organization domain: {organization.Domain} (ID: {organization.OrganizationId})");

                // Register user in the specific organization
                var result = await _authService.RegisterAsync(request.Email, request.Password, request.Name, organization.OrganizationId.ToString());
                if (result == null)
                {
                    return BadRequest(new { message = "Registration failed - user may already exist in this organization" });
                }

                // Generate token for the newly registered user
                var token = await _authService.GenerateTokenAsync(result);
                if (string.IsNullOrEmpty(token))
                {
                    return StatusCode(500, new { message = "Failed to generate token" });
                }

                // Create response without password
                var registerResponse = new LoginResponse
                {
                    User = new UserResponse
                    {
                        Id = result.Id,
                        Email = result.Email,
                        Name = result.Name,
                        OrganizationId = result.OrganizationId,
                        Role = result.Role,
                        AccessibleHalls = result.AccessibleHalls,
                        CreatedAt = result.CreatedAt,
                        UpdatedAt = result.UpdatedAt
                    },
                    Token = token,
                    Message = "Registration successful"
                };

                return Ok(registerResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RefreshTokenAsync(request.RefreshToken);
                if (result == null)
                {
                    return Unauthorized(new { message = "Invalid refresh token" });
                }

                // Generate new token for the user
                var token = await _authService.GenerateTokenAsync(result);
                if (string.IsNullOrEmpty(token))
                {
                    return StatusCode(500, new { message = "Failed to generate token" });
                }

                // Create response without password
                var refreshResponse = new LoginResponse
                {
                    User = new UserResponse
                    {
                        Id = result.Id,
                        Email = result.Email,
                        Name = result.Name,
                        OrganizationId = result.OrganizationId,
                        Role = result.Role,
                        AccessibleHalls = result.AccessibleHalls,
                        CreatedAt = result.CreatedAt,
                        UpdatedAt = result.UpdatedAt
                    },
                    Token = token,
                    Message = "Token refreshed successfully"
                };

                return Ok(refreshResponse);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }
    }
}