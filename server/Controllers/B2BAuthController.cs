using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Momantza.Services;
using Momantza.Models;
using System.ComponentModel.DataAnnotations;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/b2b/auth")]
    public class B2BAuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IAuthDataService _authService;
        private readonly IHallDataService _hallDataService;
        private readonly IUserDataService _userDataService;
        private readonly ILogger<B2BAuthController> _logger;

        public B2BAuthController(IConfiguration configuration, IAuthDataService authService, IHallDataService hallDataService, IUserDataService userDataService, ILogger<B2BAuthController> logger)
        {
            _configuration = configuration;
            _authService = authService;
            _hallDataService = hallDataService;
            _userDataService = userDataService;
            _logger = logger;
        }

        /// <summary>
        /// Get B2B authentication token for server-to-server communication
        /// </summary>
        /// <param name="request">B2B token request containing client credentials and optional user info</param>
        /// <returns>B2B token response with access token and optional user context</returns>
        /// <response code="200">Returns the B2B access token</response>
        /// <response code="401">Invalid client credentials</response>
        /// <response code="500">B2B authentication not configured</response>
        [HttpPost("token")]
        [ProducesResponseType(typeof(Services.B2BTokenResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetToken([FromBody] B2BTokenRequest request)
        {
            // 1️⃣ Validate client credentials
            if (!ValidateClient(request.ClientId, request.ClientSecret))
            {
                return Unauthorized(new { message = "Invalid client credentials" });
            }

            // 2️⃣ Create claims for the server token
            var claims = new[]
            {
                new Claim("client_id", request.ClientId),
                new Claim("company", request.Company),
                new Claim("scope", "read"),
                new Claim(JwtRegisteredClaimNames.Iss, request.Company),
                new Claim(JwtRegisteredClaimNames.Aud, "momantza-api")
            };

            // 3️⃣ Generate token
            var secretKey = _configuration["B2BAuth:SharedSecret"];
            if (string.IsNullOrEmpty(secretKey))
            {
                return StatusCode(500, new { message = "B2B authentication not configured" });
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: request.Company,
                audience: "momantza-api",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(10),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // 4️⃣ Get user details if mobile or email is provided
            LoginResponse? userResponse = null;
            if (!string.IsNullOrEmpty(request.Mobile) || !string.IsNullOrEmpty(request.Email))
            {
                try
                {
                    userResponse = await GetUserResponseByMobileOrEmail(request.Mobile, request.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get user response for mobile/email in B2B token request");
                    // Continue without user context if lookup fails
                }
            }

            // 5️⃣ Return token and user context if available
            var response = new Services.B2BTokenResponse
            {
                AccessToken = tokenString,
                ExpiresIn = 600,
                User = userResponse
            };

            return Ok(response);
        }

        private async Task<LoginResponse?> GetUserResponseByMobileOrEmail(string? mobile, string? email)
        {
            if (string.IsNullOrEmpty(mobile) && string.IsNullOrEmpty(email))
            {
                return null;
            }

            // Get user by email (momentza uses email for login)
            Users? user = null;
            if (!string.IsNullOrEmpty(email))
            {
                // Use UserDataService to get user by email (same as login does)
                user = await _userDataService.GetByEmailAndOrganizationLoginAsync(email);
            }
            else if (!string.IsNullOrEmpty(mobile))
            {
                // If only mobile is provided, try to find user by mobile
                // Note: This may need to be implemented based on your user model
                return null;
            }

            if (user == null)
            {
                return null;
            }

            // Generate token for the user
            var token = await _authService.GenerateTokenAsync(user);
            if (string.IsNullOrEmpty(token))
            {
                return null;
            }

            // Load halls based on user role and accessible halls (same as login)
            List<Hall> halls;
            if (string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
            {
                // Admin: all halls for the organization
                halls = await _hallDataService.GetHallsByOrganizationAsync(user.OrganizationId);
            }
            else if (user.AccessibleHalls != null && user.AccessibleHalls.Any())
            {
                // Manager/other roles: only halls in AccessibleHalls
                halls = await _hallDataService.GetAccessibleHallsAsync(
                    user.OrganizationId,
                    user.AccessibleHalls
                );
            }
            else
            {
                // No accessible halls defined
                halls = new List<Hall>();
            }

            // Create response (same structure as login)
            return new LoginResponse
            {
                User = new UserResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    Name = user.Name,
                    OrganizationId = user.OrganizationId,
                    Role = user.Role,
                    AccessibleHalls = user.AccessibleHalls,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                },
                Token = token,
                Message = "User details retrieved",
                Halls = halls
            };
        }

        /// <summary>
        /// Refresh B2B authentication token using refresh token
        /// </summary>
        /// <param name="request">Refresh token request</param>
        /// <returns>New login response with refreshed token</returns>
        /// <response code="200">Returns refreshed token and user details</response>
        /// <response code="400">Invalid request</response>
        /// <response code="401">Invalid refresh token</response>
        [HttpPost("refresh-token")]
        [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequest request)
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

                // Load halls based on user role and accessible halls (same as login)
                List<Hall> halls;
                if (string.Equals(result.Role, "admin", StringComparison.OrdinalIgnoreCase))
                {
                    // Admin: all halls for the organization
                    halls = await _hallDataService.GetHallsByOrganizationAsync(result.OrganizationId);
                }
                else if (result.AccessibleHalls != null && result.AccessibleHalls.Any())
                {
                    // Manager/other roles: only halls in AccessibleHalls
                    halls = await _hallDataService.GetAccessibleHallsAsync(
                        result.OrganizationId,
                        result.AccessibleHalls
                    );
                }
                else
                {
                    // No accessible halls defined
                    halls = new List<Hall>();
                }

                // Create response without password (same structure as login)
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
                    Message = "Token refreshed successfully",
                    Halls = halls
                };

                return Ok(refreshResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing B2B token");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        private bool ValidateClient(string clientId, string clientSecret)
        {
            // For demo, hardcoded clients. Replace with DB/config in production.
            return (clientId, clientSecret) switch
            {
                ("appointza-client", "appointza-secret") => true,
                ("latrexa-client", "latrexa-secret") => true,
                ("momantza-client", "momantza-secret") => true,
                ("campusza-client", "campusza-secret") => true,
                _ => false
            };
        }
    }
}
