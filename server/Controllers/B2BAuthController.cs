using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/b2b/auth")]
    public class B2BAuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public B2BAuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("token")]
        public IActionResult GetToken([FromBody] B2BTokenRequest request)
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

            // 4️⃣ Return token
            return Ok(new { access_token = tokenString, expires_in = 600 });
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

    public class B2BTokenRequest
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
    }
}
