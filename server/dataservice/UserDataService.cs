using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;

namespace Momantza.Services
{
    public class UserDataService : BaseDataService<Users>, IUserDataService
    {
        public UserDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
        }

        protected override Users MapFromReader(NpgsqlDataReader reader)
        {
            return new Users
            {
                Id = reader["id"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                Email = reader["email"].ToString() ?? string.Empty,
                Password = reader["password"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                AccessibleHalls = reader["accessiblehalls"] != DBNull.Value
                    ? JsonSerializer.Deserialize<List<string>>(reader["accessiblehalls"].ToString() ?? "[]") ?? new List<string>()
                    : new List<string>(),
                Role = reader["role"].ToString() ?? string.Empty
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Users entity)
        {
            var sql = @"INSERT INTO users (id, email, name, password, role, organizationid, accessiblehalls, createdat, updatedat) VALUES (@id, @email, @name, @password, @role, @organizationid, @accessiblehalls, @createdat, @updatedat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@email"] = entity.Email,
                ["@name"] = entity.Name,
                ["@password"] = entity.Password,
                ["@role"] = entity.Role,
                ["@organizationid"] = entity.OrganizationId,
                ["@accessiblehalls"] = entity.AccessibleHalls,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            var jsonFields = new List<string> { "@accessiblehalls" };
            return (sql, parameters, jsonFields);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Users entity)
        {
            var sql = @"UPDATE users SET email = @email, name = @name, role = @role, organizationid = @organizationid, accessiblehalls = @accessiblehalls, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@email"] = entity.Email,
                ["@name"] = entity.Name,
                ["@role"] = entity.Role,
                ["@organizationid"] = entity.OrganizationId,
                ["@accessiblehalls"] = entity.AccessibleHalls,
                ["@updatedat"] = entity.UpdatedAt
            };
            var jsonFields = new List<string> { "@accessiblehalls" };
            return (sql, parameters, jsonFields);
        }

        public async Task<Users?> GetByEmailAsync(string email)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return null;
                }

                return await GetByEmailAndOrganizationAsync(email, orgId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user by email: {ex.Message}");
                return null;
            }
        }

        public async Task<List<Users>> GetByRoleAsync(string role)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM users WHERE role = @role";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@role", role);

                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Users>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting users by role: {ex.Message}");
                return new List<Users>();
            }
        }

        public async Task<List<Users>> GetUsersByOrganizationAsync(string organizationId)
        {
            return await GetByOrganizationIdAsync(organizationId);
        }

        public async Task<Users> CreateUserAsync(Users user)
        {
            try
            {
                if (string.IsNullOrEmpty(user.Id))
                {
                    user.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                // Hash password here (centralized)
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password, BCrypt.Net.BCrypt.GenerateSalt(12));
                var success = await CreateAsync(user);
                if (!success) throw new Exception("Failed to create user");

                return user;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating user: {ex.Message}");
                throw;
            }
        }

        public async Task<Users> UpdateUserAsync(string id, Users updates)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("User not found");

                // Update only the provided fields
                if (!string.IsNullOrEmpty(updates.Name)) existing.Name = updates.Name;
                if (!string.IsNullOrEmpty(updates.Email)) existing.Email = updates.Email;
                if (!string.IsNullOrEmpty(updates.OrganizationId)) existing.OrganizationId = updates.OrganizationId;
                if (updates.AccessibleHalls != null) existing.AccessibleHalls = updates.AccessibleHalls;
                if (!string.IsNullOrEmpty(updates.Role)) existing.Role = updates.Role;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update user");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating user: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteUserAsync(string id)
        {
            return await DeleteAsync(id);
        }

        public async Task<Users?> GetUserByIdAsync(string id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<List<Users>> GetByOrganizationAsync(string organizationId)
        {
            return await GetUsersByOrganizationAsync(organizationId);
        }

        public async Task<Users?> GetByEmailAndOrganizationAsync(string email, string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM users WHERE email = @email AND organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@email", email);
                command.Parameters.AddWithValue("@organizationId", organizationId);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return MapFromReader(reader);
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user by email and organization: {ex.Message}");
                return null;
            }
        }

        public async Task<Users?> GetByEmailAndOrganizationLoginAsync(string email)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM users WHERE email = @email";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@email", email);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return MapFromReader(reader);
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user by email and organization: {ex.Message}");
                return null;
            }
        }

        public async Task<Users?> GetByIdAndOrganizationAsync(string id, string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM users WHERE id = @id AND organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@organizationId", organizationId);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return MapFromReader(reader);
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user by id and organization: {ex.Message}");
                return null;
            }
        }

        public override async Task<Users?> GetByIdAsync(string id)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return null;
                }

                return await GetByIdAndOrganizationAsync(id, orgId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user by id: {ex.Message}");
                return null;
            }
        }

        public override async Task<List<Users>> GetAllAsync()
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                if (string.IsNullOrEmpty(orgId))
                {
                    Console.WriteLine("No organization ID found in context");
                    return new List<Users>();
                }

                return await GetByOrganizationAsync(orgId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all users: {ex.Message}");
                return new List<Users>();
            }
        }

        public async Task<bool> UpdatePasswordAsync(string id, string hashedPassword)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "UPDATE users SET password = @password, updatedat = @updatedat WHERE id = @id";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@password", hashedPassword);
                command.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
                command.Parameters.AddWithValue("@id", id);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating password for user {id}: {ex.Message}");
                return false;
            }
        }
    }

    public interface IUserDataService : IBaseDataService<Users>
    {
        Task<Users?> GetByEmailAsync(string email);
        Task<Users?> GetByEmailAndOrganizationAsync(string email, string organizationId);
        Task<Users?> GetByEmailAndOrganizationLoginAsync(string email);
        Task<Users?> GetByIdAndOrganizationAsync(string id, string organizationId);
        Task<List<Users>> GetByRoleAsync(string role);
        Task<List<Users>> GetUsersByOrganizationAsync(string organizationId);
        Task<Users> CreateUserAsync(Users user);
        Task<Users> UpdateUserAsync(string id, Users updates);
        Task<bool> DeleteUserAsync(string id);
        Task<Users?> GetUserByIdAsync(string id);
        Task<List<Users>> GetByOrganizationAsync(string organizationId);
        Task<bool> UpdatePasswordAsync(string id, string hashedPassword);
    }
}