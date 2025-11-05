using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Http;
using Momantza.Middleware;

namespace Momantza.Services
{
    public class UserSession
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string OrganizationId { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }

    public class AuthDataService : IAuthDataService
    {
        private readonly IUserDataService _userDataService;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly string _jwtSecret;
        private readonly string _jwtIssuer;
        private readonly string _jwtAudience;
        private readonly string _connectionString;

        public AuthDataService(IUserDataService userDataService, IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
        {
            _userDataService = userDataService;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

            // Get JWT settings from configuration
            _jwtSecret = _configuration["Jwt:Secret"] ?? "1gQOKNB18uzkUCFV3lK3QUXqcfVQak15t7BKR4YPpDg=";
            _jwtIssuer = _configuration["Jwt:Issuer"] ?? "MomantzaAPI";
            _jwtAudience = _configuration["Jwt:Audience"] ?? "MomantzaClient";
        }

        // Helper method to get current organization ID from HTTP context
        private string GetCurrentOrganizationId()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context?.Items["Organization"] is OrganizationContext orgContext)
            {
                return orgContext.OrganizationId.ToString();
            }
            return string.Empty;
        }

        // Helper method to assign organization ID to entities that need it
        private void AssignOrganizationIdIfNeeded(Users user)
        {
            if (string.IsNullOrEmpty(user.OrganizationId))
            {
                var orgId = GetCurrentOrganizationId();
                if (!string.IsNullOrEmpty(orgId))
                {
                    user.OrganizationId = orgId;
                }
            }
        }

        // Replace the LoginAsync method implementation with this updated version
        public async Task<Users?> LoginAsync(string email, string password)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return null;
                }

                var user = await _userDataService.GetByEmailAndOrganizationAsync(email, orgId);

                if (user != null)
                {
                    // First try normal verification (works for bcrypt hashes)
                    var passwordVerified = VerifyPassword(password, user.Password);

                    // If verification failed and stored password looks like plain text, try direct compare and migrate
                    if (!passwordVerified && !string.IsNullOrEmpty(user.Password) && !user.Password.StartsWith("$2"))
                    {
                        if (password == user.Password)
                        {
                            // Successful plain-text match -> migrate to bcrypt
                            try
                            {
                                var newHashed = HashPassword(password);
                                var updated = await _userDataService.UpdatePasswordAsync(user.Id, newHashed);
                                if (updated)
                                {
                                    user.Password = newHashed; // keep in-memory consistent
                                    passwordVerified = true;
                                    Console.WriteLine($"Migrated plaintext password for user {user.Email} to bcrypt.");
                                }
                                else
                                {
                                    Console.WriteLine($"Failed to update hashed password for user {user.Email}.");
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error migrating password for {user.Email}: {ex.Message}");
                            }
                        }
                    }

                    if (passwordVerified)
                    {
                        // Generate JWT token for the user
                        var token = await GenerateTokenAsync(user);
                        if (!string.IsNullOrEmpty(token))
                        {
                            return user;
                        }
                    }
                }
                else
                {
                    // existing logic for no user: create admin on first-run per org
                    var existingUsers = await _userDataService.GetByOrganizationAsync(orgId);
                    if (!existingUsers.Any())
                    {
                        password = "Momantza";
                        // No users exist for this organization, create admin user
                        var adminUser = await CreateAdminUserAsync(orgId);
                        if (adminUser != null && VerifyPassword(password, adminUser.Password))
                        {
                            // Generate JWT token for the admin user
                            var token = await GenerateTokenAsync(adminUser);
                            if (!string.IsNullOrEmpty(token))
                            {
                                return adminUser;
                            }
                        }
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during login: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> LogoutAsync(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                    return false;

                // Remove "Bearer " prefix if present
                if (token.StartsWith("Bearer "))
                    token = token.Substring(7);

                // Invalidate the session
                await InvalidateSessionAsync(token);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during logout: {ex.Message}");
                return false;
            }
        }

        public async Task<Users?> GetCurrentUserAsync(string? token = null)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                    return null;

                // Remove "Bearer " prefix if present
                if (token.StartsWith("Bearer "))
                    token = token.Substring(7);

                // First validate the session
                var session = await GetSessionByTokenAsync(token);
                if (session == null || !session.IsActive || session.ExpiresAt < DateTime.UtcNow)
                {
                    return null;
                }

                if (!await ValidateTokenAsync(token))
                    return null;

                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadJwtToken(token);

                // Extract user ID from token
                var userIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return null;

                var userId = userIdClaim.Value;
                var orgId = GetCurrentOrganizationId();

                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return null;
                }

                return await _userDataService.GetByIdAndOrganizationAsync(userId, orgId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting current user: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> IsAuthenticatedAsync(string? token = null)
        {
            try
            {
                var user = await GetCurrentUserAsync(token);
                return user != null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking authentication: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                    return false;

                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtSecret);

                var tokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = _jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken validatedToken);
                return principal != null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error validating token: {ex.Message}");
                return false;
            }
        }

        public async Task<string?> GenerateTokenAsync(Users user)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtSecret);

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim("organizationId", user.OrganizationId ?? ""),
                    new Claim("role", user.Role ?? "user")
                };

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddDays(7), // Token expires in 7 days
                    Issuer = _jwtIssuer,
                    Audience = _jwtAudience,
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                // Generate refresh token
                var refreshToken = GenerateRefreshToken();

                // Store session in database
                var orgId = !string.IsNullOrEmpty(user.OrganizationId) ? user.OrganizationId : GetCurrentOrganizationId();
                await StoreSessionAsync(user.Id, orgId, tokenString, refreshToken, tokenDescriptor.Expires.Value);

                return tokenString;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating token: {ex.Message}");
                return null;
            }
        }

        public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return false;
                }

                var user = await _userDataService.GetByIdAndOrganizationAsync(userId, orgId);
                if (user == null) return false;

                if (VerifyPassword(currentPassword, user.Password))
                {
                    // Hash the new password
                    var hashedNewPassword = HashPassword(newPassword);

                    // Update only the password using the new user-data-service API
                    var success = await _userDataService.UpdatePasswordAsync(userId, hashedNewPassword);
                    return success;
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error changing password: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ResetPasswordAsync(string email)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return false;
                }

                var user = await _userDataService.GetByEmailAndOrganizationAsync(email, orgId);
                if (user == null) return false;

                // In a real application, you would send a password reset email
                // For now, we'll just return true
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error resetting password: {ex.Message}");
                return false;
            }
        }

        public async Task<Users?> RegisterAsync(string email, string password, string name, string? organizationId = null)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return null;
                }

                // Check if user already exists in this organization
                var existingUser = await _userDataService.GetByEmailAndOrganizationAsync(email, orgId);
                if (existingUser != null)
                {
                    return null; // User already exists in this organization
                }

                // Create new user (pass plain password, hashing is handled by IUserDataService.CreateUserAsync)
                var newUser = new Users
                {
                    Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
                    Email = email,
                    Name = name,
                    Password = password, // plain here — CreateUserAsync will hash
                    OrganizationId = orgId, // Always use organization ID from context
                    Role = "user", // Default role
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Ensure organization ID is set from context
                AssignOrganizationIdIfNeeded(newUser);

                // Use CreateUserAsync so password is hashed centrally
                var createdUser = await _userDataService.CreateUserAsync(newUser);
                return createdUser;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error registering user: {ex.Message}");
                return null;
            }
        }

        public async Task<Users?> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                if (string.IsNullOrEmpty(refreshToken))
                {
                    return null;
                }

                // Get session by refresh token
                var session = await GetSessionByRefreshTokenAsync(refreshToken);
                if (session == null || !session.IsActive || session.ExpiresAt < DateTime.UtcNow)
                {
                    return null;
                }

                // Get user
                var user = await _userDataService.GetByIdAsync(session.UserId);
                if (user == null)
                {
                    return null;
                }

                // Generate new tokens
                var newToken = await GenerateTokenAsync(user);
                if (string.IsNullOrEmpty(newToken))
                {
                    return null;
                }

                return user;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error refreshing token: {ex.Message}");
                return null;
            }
        }

        // Helper method to hash passwords using BCrypt
        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        // Helper method to verify password hash using BCrypt
        private bool VerifyPassword(string password, string hashedPassword)
        {
            if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hashedPassword))
                return false;

            // Quick validation: bcrypt hashes start with "$2" ($2a$, $2b$, $2y$, ...).
            // If value doesn't look like a bcrypt hash treat it as invalid (avoid exception).
            if (!hashedPassword.StartsWith("$2"))
                return false;

            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Malformed salt/hash — treat as invalid credentials
                return false;
            }
            catch (Exception)
            {
                // Any other error — be safe and treat as failed verification
                return false;
            }
        }

        // Generate refresh token
        private string GenerateRefreshToken()
        {
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes);
        }

        // Store session in database
        private async Task<bool> StoreSessionAsync(string userId, string organizationId, string accessToken, string refreshToken, DateTime expiresAt)
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                // First, deactivate any existing sessions for this user
                var deactivateSql = "UPDATE usersession SET isactive = false WHERE userid = @userId";
                using (var deactivateCommand = new NpgsqlCommand(deactivateSql, connection))
                {
                    deactivateCommand.Parameters.AddWithValue("@userId", userId);
                    await deactivateCommand.ExecuteNonQueryAsync();
                }

                // Insert new session
                var sql = @"
                    INSERT INTO usersession (id, userid, organizationid, accesstoken, refreshtoken, expiresat, createdat, updatedat, isactive)
                    VALUES (@id, @userId, @organizationId, @accessToken, @refreshToken, @expiresAt, @createdAt, @updatedAt, @isActive)";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", Guid.NewGuid().ToString());
                command.Parameters.AddWithValue("@userId", userId);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                command.Parameters.AddWithValue("@accessToken", accessToken);
                command.Parameters.AddWithValue("@refreshToken", refreshToken);
                command.Parameters.AddWithValue("@expiresAt", expiresAt);
                command.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);
                command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);
                command.Parameters.AddWithValue("@isActive", true);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error storing session: {ex.Message}");
                return false;
            }
        }

        // Get session by access token
        private async Task<UserSession?> GetSessionByTokenAsync(string accessToken)
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var sql = "SELECT * FROM usersession WHERE accesstoken = @accessToken AND isactive = true";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@accessToken", accessToken);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new UserSession
                    {
                        Id = reader["id"].ToString() ?? string.Empty,
                        UserId = reader["userid"].ToString() ?? string.Empty,
                        OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                        AccessToken = reader["accesstoken"].ToString() ?? string.Empty,
                        RefreshToken = reader["refreshtoken"].ToString() ?? string.Empty,
                        ExpiresAt = Convert.ToDateTime(reader["expiresat"]),
                        CreatedAt = Convert.ToDateTime(reader["createdat"]),
                        UpdatedAt = Convert.ToDateTime(reader["updatedat"]),
                        IsActive = Convert.ToBoolean(reader["isactive"])
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting session by token: {ex.Message}");
                return null;
            }
        }

        // Get session by refresh token
        private async Task<UserSession?> GetSessionByRefreshTokenAsync(string refreshToken)
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var sql = "SELECT * FROM usersession WHERE refreshtoken = @refreshToken AND isactive = true";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@refreshToken", refreshToken);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new UserSession
                    {
                        Id = reader["id"].ToString() ?? string.Empty,
                        UserId = reader["userid"].ToString() ?? string.Empty,
                        OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                        AccessToken = reader["accesstoken"].ToString() ?? string.Empty,
                        RefreshToken = reader["refreshtoken"].ToString() ?? string.Empty,
                        ExpiresAt = Convert.ToDateTime(reader["expiresat"]),
                        CreatedAt = Convert.ToDateTime(reader["createdat"]),
                        UpdatedAt = Convert.ToDateTime(reader["updatedat"]),
                        IsActive = Convert.ToBoolean(reader["isactive"])
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting session by refresh token: {ex.Message}");
                return null;
            }
        }

        // Invalidate session
        private async Task<bool> InvalidateSessionAsync(string accessToken)
        {
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                await connection.OpenAsync();

                var sql = "UPDATE usersession SET isactive = false WHERE accesstoken = @accessToken";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@accessToken", accessToken);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error invalidating session: {ex.Message}");
                return false;
            }
        }

        // Create admin user for organization
        private async Task<Users?> CreateAdminUserAsync(string organizationId)
        {
            try
            {
                // Create admin user with default credentials (pass plain password)
                var adminUser = new Users
                {
                    Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
                    Email = "admin", // Generate a unique email if needed
                    Name = "Administrator",
                    Password = "Momantza", // plain here; CreateUserAsync will hash
                    OrganizationId = organizationId,
                    Role = "admin", // Admin role
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Ensure organization ID is set from context
                AssignOrganizationIdIfNeeded(adminUser);

                var created = await _userDataService.CreateUserAsync(adminUser);
                if (created != null)
                {
                    Console.WriteLine($"Created admin user for organization: {organizationId}");
                    return created;
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating admin user: {ex.Message}");
                return null;
            }
        }
    }

    public interface IAuthDataService
    {
        Task<Users?> LoginAsync(string email, string password);
        Task<bool> LogoutAsync(string token);
        Task<Users?> GetCurrentUserAsync(string? token = null);
        Task<bool> IsAuthenticatedAsync(string? token = null);
        Task<bool> ValidateTokenAsync(string token);
        Task<string?> GenerateTokenAsync(Users user);
        Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
        Task<bool> ResetPasswordAsync(string email);
        Task<Users?> RegisterAsync(string email, string password, string name, string? organizationId = null);
        Task<Users?> RefreshTokenAsync(string refreshToken);
    }
}