using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;

namespace Momantza.Services
{
    public class SettingsDataService : BaseDataService<MasterDataItem>, ISettingsDataService
    {
        public SettingsDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
        }

        protected override MasterDataItem MapFromReader(NpgsqlDataReader reader)
        {
            return new MasterDataItem
            {
                Id = reader["id"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                Value = reader["value"]?.ToString(),
                Charge = reader["charge"] != DBNull.Value ? Convert.ToDecimal(reader["charge"]) : null,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.UtcNow,
                UpdatedAt = reader["updatedat"] != DBNull.Value ? Convert.ToDateTime(reader["updatedat"]) : DateTime.UtcNow
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(MasterDataItem entity)
        {
            var sql = @"INSERT INTO masterdataitem (id, name, value, charge, organizationid, createdat, updatedat) VALUES (@id, @name, @value, @charge, @organizationid, @createdat, @updatedat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@value"] = entity.Value,
                ["@charge"] = entity.Charge,
                ["@organizationid"] = entity.OrganizationId,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(MasterDataItem entity)
        {
            var sql = @"UPDATE masterdataitem SET name = @name, value = @value, charge = @charge, organizationid = @organizationid, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@value"] = entity.Value,
                ["@charge"] = entity.Charge,
                ["@organizationid"] = entity.OrganizationId,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }

        public async Task<List<MasterDataItem>> GetMasterDataAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM masterdataitem ORDER BY name";
                using var command = new NpgsqlCommand(sql, connection);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<MasterDataItem>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting master data: {ex.Message}");
                return new List<MasterDataItem>();
            }
        }

        public async Task<List<MasterDataItem>> GetMasterDataByCategoryAsync(string category)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM masterdataitem WHERE organizationid = @organizationId AND value = @category ORDER BY name";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", orgId);
                command.Parameters.AddWithValue("@category", category);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<MasterDataItem>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting master data by category: {ex.Message}");
                return new List<MasterDataItem>();
            }
        }

        public async Task<MasterDataItem> CreateMasterDataItemAsync(MasterDataItem item)
        {
            try
            {
                if (string.IsNullOrEmpty(item.Id))
                {
                    item.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                if (item.CreatedAt == default)
                {
                    item.CreatedAt = DateTime.UtcNow;
                }

                if (item.UpdatedAt == default)
                {
                    item.UpdatedAt = DateTime.UtcNow;
                }

                var success = await CreateAsync(item);
                if (!success) throw new Exception("Failed to create master data item");

                return item;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating master data item: {ex.Message}");
                throw;
            }
        }

        public async Task<MasterDataItem> CreateMasterDataItemByCategoryAsync(string category, string name, decimal? charge = null)
        {
            try
            {
                var item = new MasterDataItem
                {
                    Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
                    Name = name,
                    Value = category,
                    Charge = charge,
                    OrganizationId = GetCurrentOrganizationId(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var success = await CreateAsync(item);
                if (!success) throw new Exception("Failed to create master data item");

                return item;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating master data item by category: {ex.Message}");
                throw;
            }
        }

        public async Task<MasterDataItem> UpdateMasterDataItemAsync(string id, MasterDataItem updates)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("Master data item not found");

                // Update only the provided fields
                if (!string.IsNullOrEmpty(updates.Name)) existing.Name = updates.Name;
                if (updates.Value != null) existing.Value = updates.Value;
                if (updates.Charge.HasValue) existing.Charge = updates.Charge;
                existing.UpdatedAt = DateTime.UtcNow;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update master data item");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating master data item: {ex.Message}");
                throw;
            }
        }

        public async Task<MasterDataItem> UpdateMasterDataItemByIdAsync(string id, string name, decimal? charge = null)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("Master data item not found");

                existing.Name = name;
                if (charge.HasValue) existing.Charge = charge;
                existing.UpdatedAt = DateTime.UtcNow;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update master data item");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating master data item by id: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteMasterDataItemAsync(string id)
        {
            return await DeleteAsync(id);
        }

        public async Task<bool> ToggleMasterDataItemActiveAsync(string id)
        {
            try
            {
                // Since the model doesn't have an IsActive property, we'll return true
                // You might want to add an IsActive property to the MasterDataItem model
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling master data item active status: {ex.Message}");
                return false;
            }
        }

        public async Task<List<MasterDataItem>> GetByOrganizationAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM masterdataitem WHERE organizationid = @organizationId ORDER BY name";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<MasterDataItem>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting settings by organization: {ex.Message}");
                return new List<MasterDataItem>();
            }
        }

        public override async Task<List<MasterDataItem>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM masterdataitem WHERE organizationid = @organizationId ORDER BY name";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<MasterDataItem>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<MasterDataItem?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM masterdataitem WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<MasterDataItem?> GetByKeyAsync(string key, string? organizationId = null)
        {
            var orgId = organizationId ?? GetCurrentOrganizationId();
            var sql = "SELECT * FROM masterdataitem WHERE name = @key AND organizationid = @organizationId";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@key", key);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapFromReader(reader);
            }
            return null;
        }

        public async Task<bool> UpdateByKeyAsync(string key, object value, string? organizationId = null)
        {
            try
            {
                var setting = await GetByKeyAsync(key, organizationId);
                if (setting == null) return false;

                setting.Value = value.ToString();
                setting.UpdatedAt = DateTime.UtcNow;

                return await UpdateAsync(setting);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating setting by key: {ex.Message}");
                return false;
            }
        }

        // Category-specific methods for the React client
        public async Task<List<MasterDataItem>> GetEventTypesAsync()
        {
            return await GetMasterDataByCategoryAsync("eventTypes");
        }

        public async Task<List<MasterDataItem>> GetImageCategoriesAsync()
        {
            return await GetMasterDataByCategoryAsync("imageCategories");
        }

        public async Task<List<MasterDataItem>> GetEmployeesAsync()
        {
            return await GetMasterDataByCategoryAsync("employees");
        }

        public async Task<List<MasterDataItem>> GetInventoryItemsAsync()
        {
            return await GetMasterDataByCategoryAsync("inventoryItems");
        }

        public async Task<List<MasterDataItem>> GetTicketCategoriesAsync()
        {
            return await GetMasterDataByCategoryAsync("ticketCategories");
        }

        public async Task<MasterDataItem> CreateEventTypeAsync(string name)
        {
            return await CreateMasterDataItemByCategoryAsync("eventTypes", name);
        }

        public async Task<MasterDataItem> CreateImageCategoryAsync(string name)
        {
            return await CreateMasterDataItemByCategoryAsync("imageCategories", name);
        }

        public async Task<MasterDataItem> CreateEmployeeAsync(string name)
        {
            return await CreateMasterDataItemByCategoryAsync("employees", name);
        }

        public async Task<MasterDataItem> CreateInventoryItemAsync(string name, decimal? charge = null)
        {
            return await CreateMasterDataItemByCategoryAsync("inventoryItems", name, charge);
        }

        public async Task<MasterDataItem> CreateTicketCategoryAsync(string name)
        {
            return await CreateMasterDataItemByCategoryAsync("ticketCategories", name);
        }

        public async Task<MasterDataItem> UpdateEventTypeAsync(string id, string name)
        {
            return await UpdateMasterDataItemByIdAsync(id, name);
        }

        public async Task<MasterDataItem> UpdateImageCategoryAsync(string id, string name)
        {
            return await UpdateMasterDataItemByIdAsync(id, name);
        }

        public async Task<MasterDataItem> UpdateEmployeeAsync(string id, string name)
        {
            return await UpdateMasterDataItemByIdAsync(id, name);
        }

        public async Task<MasterDataItem> UpdateInventoryItemAsync(string id, string name, decimal? charge = null)
        {
            return await UpdateMasterDataItemByIdAsync(id, name, charge);
        }

        public async Task<MasterDataItem> UpdateTicketCategoryAsync(string id, string name)
        {
            return await UpdateMasterDataItemByIdAsync(id, name);
        }
    }

    public interface ISettingsDataService : IBaseDataService<MasterDataItem>
    {
        Task<List<MasterDataItem>> GetMasterDataAsync();
        Task<List<MasterDataItem>> GetMasterDataByCategoryAsync(string category);
        Task<MasterDataItem> CreateMasterDataItemAsync(MasterDataItem item);
        Task<MasterDataItem> CreateMasterDataItemByCategoryAsync(string category, string name, decimal? charge = null);
        Task<MasterDataItem> UpdateMasterDataItemAsync(string id, MasterDataItem updates);
        Task<MasterDataItem> UpdateMasterDataItemByIdAsync(string id, string name, decimal? charge = null);
        Task<bool> DeleteMasterDataItemAsync(string id);
        Task<bool> ToggleMasterDataItemActiveAsync(string id);
        Task<List<MasterDataItem>> GetByOrganizationAsync(string organizationId);
        Task<MasterDataItem?> GetByKeyAsync(string key, string? organizationId = null);
        Task<bool> UpdateByKeyAsync(string key, object value, string? organizationId = null);
        
        // Category-specific methods
        Task<List<MasterDataItem>> GetEventTypesAsync();
        Task<List<MasterDataItem>> GetImageCategoriesAsync();
        Task<List<MasterDataItem>> GetEmployeesAsync();
        Task<List<MasterDataItem>> GetInventoryItemsAsync();
        Task<List<MasterDataItem>> GetTicketCategoriesAsync();
        
        Task<MasterDataItem> CreateEventTypeAsync(string name);
        Task<MasterDataItem> CreateImageCategoryAsync(string name);
        Task<MasterDataItem> CreateEmployeeAsync(string name);
        Task<MasterDataItem> CreateInventoryItemAsync(string name, decimal? charge = null);
        Task<MasterDataItem> CreateTicketCategoryAsync(string name);
        
        Task<MasterDataItem> UpdateEventTypeAsync(string id, string name);
        Task<MasterDataItem> UpdateImageCategoryAsync(string id, string name);
        Task<MasterDataItem> UpdateEmployeeAsync(string id, string name);
        Task<MasterDataItem> UpdateInventoryItemAsync(string id, string name, decimal? charge = null);
        Task<MasterDataItem> UpdateTicketCategoryAsync(string id, string name);
    }
} 