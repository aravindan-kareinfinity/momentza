using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;

namespace Momantza.Services
{
    public class OrganizationsDataService : BaseDataService<Organizations>, IOrganizationsDataService
    {
        public OrganizationsDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor, "organization")
        {
        }

        protected override Organizations MapFromReader(NpgsqlDataReader reader)
        {
            return new Organizations
            {
                Id = reader["id"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                ContactPerson = reader["contactperson"].ToString() ?? string.Empty,
                ContactNo = reader["contactno"].ToString() ?? string.Empty,
                Address = reader["address"].ToString()?? string.Empty,
                About = reader["about"].ToString() ?? string.Empty,
                DefaultDomain = reader["defaultdomain"].ToString() ?? string.Empty,
                CustomDomain = reader["customdomain"]?.ToString(),
                Logo = reader["logo"]?.ToString(),
                Theme = reader["theme"] != DBNull.Value 
                    ? JsonSerializer.Deserialize<OrganizationTheme>(reader["theme"].ToString() ?? "{}") ?? new OrganizationTheme()
                    : new OrganizationTheme()
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Organizations entity)
        {
            var sql = @"INSERT INTO organization (id, name, contactperson, contactno,address, about, defaultdomain, customdomain, logo, theme, createdat, updatedat) VALUES (@id, @name, @contactperson, @contactno,@address,@about, @defaultdomain, @customdomain, @logo, @theme, @createdat, @updatedat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@contactperson"] = entity.ContactPerson,
                ["@contactno"] = entity.ContactNo,
                ["@address"] = entity.Address,
                ["@about"] = entity.About,
                ["@defaultdomain"] = entity.DefaultDomain,
                ["@customdomain"] = entity.CustomDomain,
                ["@logo"] = entity.Logo,
                ["@theme"] = entity.Theme,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            var jsonFields = new List<string> { "@theme" };
            return (sql, parameters, jsonFields);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Organizations entity)
        {
            // Update the UpdatedAt timestamp
            entity.UpdatedAt = DateTime.UtcNow;
            
            var sql = @"UPDATE organization SET name = @name, contactperson = @contactperson, contactno = @contactno,address=@address,about=@about, defaultdomain = @defaultdomain, customdomain = @customdomain, logo = @logo, theme = @theme, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@contactperson"] = entity.ContactPerson,
                ["@contactno"] = entity.ContactNo,
                ["@address"] = entity.Address,
                ["@about"] = entity.About,
                ["@defaultdomain"] = entity.DefaultDomain,
                ["@customdomain"] = entity.CustomDomain,
                ["@logo"] = entity.Logo,
                ["@theme"] = entity.Theme,
                ["@updatedat"] = entity.UpdatedAt
            };
            
            Console.WriteLine($"Generating update SQL for organization {entity.Id}:");
            Console.WriteLine($"  Logo: {entity.Logo}");
            Console.WriteLine($"  Name: {entity.Name}");
            Console.WriteLine($"  UpdatedAt: {entity.UpdatedAt}");
            
            var jsonFields = new List<string> { "@theme" };
            return (sql, parameters, jsonFields);
        }

        public async Task<bool> VerifyTableStructure()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = @"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organization' ORDER BY ordinal_position";
                using var command = new NpgsqlCommand(sql, connection);
                using var reader = await command.ExecuteReaderAsync();
                
                Console.WriteLine("Organization table structure:");
                while (await reader.ReadAsync())
                {
                    Console.WriteLine($"  {reader["column_name"]}: {reader["data_type"]}");
                }
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking table structure: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> RecreateTableAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                
                // Drop table if exists
                var dropSql = "DROP TABLE IF EXISTS organization CASCADE";
                using var dropCommand = new NpgsqlCommand(dropSql, connection);
                await dropCommand.ExecuteNonQueryAsync();
                Console.WriteLine("Dropped existing organization table");
                
                // Create table with proper structure
                var createSql = @"
                    CREATE TABLE organization (
                        id VARCHAR(50) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        contactperson VARCHAR(255),
                        contactno VARCHAR(50),
                        address TEXT,
                        about TEXT,
                        defaultdomain VARCHAR(255),
                        customdomain VARCHAR(255),
                        logo TEXT,
                        theme JSONB,
                        createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    )";
                
                using var createCommand = new NpgsqlCommand(createSql, connection);
                await createCommand.ExecuteNonQueryAsync();
                Console.WriteLine("Created new organization table with logo column");
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error recreating table: {ex.Message}");
                return false;
            }
        }

        public async Task<Organizations?> GetByDomainAsync(string domain)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                
                var sql = "SELECT * FROM organization WHERE defaultdomain = @domain OR customdomain = @domain LIMIT 1";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@domain", domain);
                
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return MapFromReader(reader);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting organization by domain: {ex.Message}");
                return null;
            }
        }

        public async Task<Organizations> GetCurrentOrganizationAsync(string domain)
        {
            try
            {
                var org = await GetByDomainAsync(domain);
                if (org != null) return org;

                // Fallback to first organization if domain not found
                var allOrgs = await GetAllAsync();
                return allOrgs.FirstOrDefault() ?? new Organizations();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting current organization: {ex.Message}");
                return new Organizations();
            }
        }

        public async Task<List<Organizations>> GetAllOrganizationsAsync()
        {
            return await GetAllAsync();
        }

        public async Task<Organizations> UpdateOrganizationAsync(string id, Organizations updates)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("Organization not found");

                // Update only the provided fields
                if (!string.IsNullOrEmpty(updates.Name)) existing.Name = updates.Name;
                if (!string.IsNullOrEmpty(updates.ContactPerson)) existing.ContactPerson = updates.ContactPerson;
                if (!string.IsNullOrEmpty(updates.ContactNo)) existing.ContactNo = updates.ContactNo;
                if (!string.IsNullOrEmpty(updates.Address)) existing.Address = updates.Address;
                if (!string.IsNullOrEmpty(updates.About)) existing.About = updates.About;
                if (!string.IsNullOrEmpty(updates.DefaultDomain)) existing.DefaultDomain = updates.DefaultDomain;
                if (!string.IsNullOrEmpty(updates.CustomDomain)) existing.CustomDomain = updates.CustomDomain;
                if (!string.IsNullOrEmpty(updates.Logo)) existing.Logo = updates.Logo;
                if (updates.Theme != null) existing.Theme = updates.Theme;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update organization");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating organization: {ex.Message}");
                throw;
            }
        }
    }

    public interface IOrganizationsDataService : IBaseDataService<Organizations>
    {
        Task<Organizations?> GetByDomainAsync(string domain);
        Task<Organizations> GetCurrentOrganizationAsync(string domain);
        Task<List<Organizations>> GetAllOrganizationsAsync();
        Task<Organizations> UpdateOrganizationAsync(string id, Organizations updates);
    }
} 