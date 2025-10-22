using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;

namespace Momantza.Services
{
    public class BillingDataService : BaseDataService<BillingSettings>, IBillingDataService
    {
        public BillingDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
        }

        protected override BillingSettings MapFromReader(NpgsqlDataReader reader)
        {
            return new BillingSettings
            {
                Id = reader["id"].ToString() ?? string.Empty,
                CompanyName = reader["companyname"].ToString() ?? string.Empty,
                GstNumber = reader["gstnumber"].ToString() ?? string.Empty,
                Address = reader["address"].ToString() ?? string.Empty,
                TaxPercentage = Convert.ToDecimal(reader["taxpercentage"]),
                HsnNumber = reader["hsnnumber"].ToString() ?? string.Empty,
                BankAccount = reader["bankaccount"].ToString() ?? string.Empty,
                IfscNumber = reader["ifscnumber"].ToString() ?? string.Empty,
                BankName = reader["bankname"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.UtcNow,
                UpdatedAt = reader["updatedat"] != DBNull.Value ? Convert.ToDateTime(reader["updatedat"]) : DateTime.UtcNow
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(BillingSettings entity)
        {
            var sql = @"INSERT INTO billingsettings (id, companyname, gstnumber, address, taxpercentage, hsnnumber, bankaccount, ifscnumber, bankname, organizationid, createdat, updatedat) VALUES (@id, @companyname, @gstnumber, @address, @taxpercentage, @hsnnumber, @bankaccount, @ifscnumber, @bankname, @organizationid, @createdat, @updatedat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@companyname"] = entity.CompanyName,
                ["@gstnumber"] = entity.GstNumber,
                ["@address"] = entity.Address,
                ["@taxpercentage"] = entity.TaxPercentage,
                ["@hsnnumber"] = entity.HsnNumber,
                ["@bankaccount"] = entity.BankAccount,
                ["@ifscnumber"] = entity.IfscNumber,
                ["@bankname"] = entity.BankName,
                ["@organizationid"] = entity.OrganizationId,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(BillingSettings entity)
        {
            var sql = @"UPDATE billingsettings SET companyname = @companyname, gstnumber = @gstnumber, address = @address, taxpercentage = @taxpercentage, hsnnumber = @hsnnumber, bankaccount = @bankaccount, ifscnumber = @ifscnumber, bankname = @bankname, organizationid = @organizationid, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@companyname"] = entity.CompanyName,
                ["@gstnumber"] = entity.GstNumber,
                ["@address"] = entity.Address,
                ["@taxpercentage"] = entity.TaxPercentage,
                ["@hsnnumber"] = entity.HsnNumber,
                ["@bankaccount"] = entity.BankAccount,
                ["@ifscnumber"] = entity.IfscNumber,
                ["@bankname"] = entity.BankName,
                ["@organizationid"] = entity.OrganizationId,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }

        public async Task<BillingSettings> GetBillingSettingsAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM billingsettings WHERE id = 'default'";
                using var command = new NpgsqlCommand(sql, connection);
                
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return MapFromReader(reader);
                }

                // Return default settings if none found
                return new BillingSettings
                {
                    Id = "default",
                    CompanyName = "Royal Wedding Halls",
                    GstNumber = "27AAAPL1234C1Z5",
                    Address = "123 Main Street, City, State - 123456",
                    TaxPercentage = 18,
                    HsnNumber = "997111",
                    BankAccount = "1234567890",
                    IfscNumber = "ICIC0001234",
                    BankName = "ICICI Bank",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting billing settings: {ex.Message}");
                return new BillingSettings();
            }
        }

        public async Task<BillingSettings> UpdateBillingSettingsAsync(BillingSettings settings)
        {
            try
            {
                // Check if settings exist
                var existing = await GetBillingSettingsAsync();
                if (existing.CompanyName == "Royal Wedding Halls" && existing.GstNumber == "27AAAPL1234C1Z5")
                {
                    // Create new settings
                    settings.Id = "default";
                    settings.CompanyName = string.IsNullOrEmpty(settings.CompanyName) ? existing.CompanyName : settings.CompanyName;
                    settings.GstNumber = string.IsNullOrEmpty(settings.GstNumber) ? existing.GstNumber : settings.GstNumber;
                    settings.Address = string.IsNullOrEmpty(settings.Address) ? existing.Address : settings.Address;
                    settings.TaxPercentage = settings.TaxPercentage == 0 ? existing.TaxPercentage : settings.TaxPercentage;
                    settings.HsnNumber = string.IsNullOrEmpty(settings.HsnNumber) ? existing.HsnNumber : settings.HsnNumber;
                    settings.BankAccount = string.IsNullOrEmpty(settings.BankAccount) ? existing.BankAccount : settings.BankAccount;
                    settings.IfscNumber = string.IsNullOrEmpty(settings.IfscNumber) ? existing.IfscNumber : settings.IfscNumber;
                    settings.BankName = string.IsNullOrEmpty(settings.BankName) ? existing.BankName : settings.BankName;
                    settings.CreatedAt = DateTime.UtcNow;
                    settings.UpdatedAt = DateTime.UtcNow;

                    var success = await CreateAsync(settings);
                    if (!success) throw new Exception("Failed to create billing settings");
                }
                else
                {
                    // Update existing settings
                    settings.UpdatedAt = DateTime.UtcNow;
                    var success = await UpdateAsync(settings);
                    if (!success) throw new Exception("Failed to update billing settings");
                }

                return settings;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating billing settings: {ex.Message}");
                throw;
            }
        }

        public async Task<List<BillingSettings>> GetByOrganizationAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM billingsettings WHERE organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<BillingSettings>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting billing settings by organization: {ex.Message}");
                return new List<BillingSettings>();
            }
        }

        public async Task<List<BillingSettings>> GetByUserAsync(string userId)
        {
            try
            {
                // Since billing settings are organization-based, we'll return empty list for user-specific queries
                return new List<BillingSettings>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting billing settings by user: {ex.Message}");
                return new List<BillingSettings>();
            }
        }

        public async Task<List<BillingSettings>> GetByStatusAsync(string status)
        {
            try
            {
                // Since billing settings don't have a status field, we'll return all settings
                return await GetAllAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting billing settings by status: {ex.Message}");
                return new List<BillingSettings>();
            }
        }

        public override async Task<List<BillingSettings>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM billingsettings WHERE organizationid = @organizationId ORDER BY createdat DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<BillingSettings>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<BillingSettings?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM billingsettings WHERE id = @id AND organizationid = @organizationId";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapFromReader(reader);
            }
            return null;
        }
    }

    public interface IBillingDataService : IBaseDataService<BillingSettings>
    {
        Task<BillingSettings> GetBillingSettingsAsync();
        Task<BillingSettings> UpdateBillingSettingsAsync(BillingSettings settings);
        Task<List<BillingSettings>> GetByOrganizationAsync(string organizationId);
        Task<List<BillingSettings>> GetByUserAsync(string userId);
        Task<List<BillingSettings>> GetByStatusAsync(string status);
    }
} 