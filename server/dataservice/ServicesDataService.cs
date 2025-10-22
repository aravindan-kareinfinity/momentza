using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;

namespace Momantza.Services
{
    public class ServicesDataService : BaseDataService<ServiceItem>, IServicesDataService
    {
        public ServicesDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
        }

        protected override ServiceItem MapFromReader(NpgsqlDataReader reader)
        {
            return new ServiceItem
            {
                Id = reader["id"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                HsnCode = reader["hsncode"].ToString() ?? string.Empty,
                TaxPercentage = Convert.ToDecimal(reader["taxpercentage"]),
                BasePrice = Convert.ToDecimal(reader["baseprice"]),
                CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.UtcNow,
                UpdatedAt = reader["updatedat"] != DBNull.Value ? Convert.ToDateTime(reader["updatedat"]) : DateTime.UtcNow
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(ServiceItem entity)
        {
            var sql = @"INSERT INTO serviceitem (id, name, hsncode, taxpercentage, baseprice, organizationid, isactive, createdat, updatedat) VALUES (@id, @name, @hsncode, @taxpercentage, @baseprice, @organizationid, @isactive, @createdat, @updatedat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@hsncode"] = entity.HsnCode,
                ["@taxpercentage"] = entity.TaxPercentage,
                ["@baseprice"] = entity.BasePrice,
                ["@organizationid"] = entity.OrganizationId,
                ["@isactive"] = entity.IsActive,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(ServiceItem entity)
        {
            var sql = @"UPDATE serviceitem SET name = @name, hsncode = @hsncode, taxpercentage = @taxpercentage, baseprice = @baseprice, organizationid = @organizationid, isactive = @isactive, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@hsncode"] = entity.HsnCode,
                ["@taxpercentage"] = entity.TaxPercentage,
                ["@baseprice"] = entity.BasePrice,
                ["@organizationid"] = entity.OrganizationId,
                ["@isactive"] = entity.IsActive,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }

        public override async Task<List<ServiceItem>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM serviceitem WHERE organizationid = @organizationId AND isactive = true ORDER BY name";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<ServiceItem>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<ServiceItem?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM serviceitem WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<ServiceItem> CreateServiceAsync(ServiceItem service)
        {
            try
            {
                if (string.IsNullOrEmpty(service.Id))
                {
                    service.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                if (service.CreatedAt == default)
                {
                    service.CreatedAt = DateTime.UtcNow;
                }

                if (service.UpdatedAt == default)
                {
                    service.UpdatedAt = DateTime.UtcNow;
                }
                if (string.IsNullOrEmpty(service.Id))
                {
                    service.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }
                var success = await CreateAsync(service);
                if (!success) throw new Exception("Failed to create service");

                return service;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating service: {ex.Message}");
                throw;
            }
        }

        public async Task<ServiceItem> UpdateServiceAsync(string id, ServiceItem updates)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("Service not found");

                // Update only the provided fields
                if (!string.IsNullOrEmpty(updates.Name)) existing.Name = updates.Name;
                if (!string.IsNullOrEmpty(updates.HsnCode)) existing.HsnCode = updates.HsnCode;
                if (updates.TaxPercentage > 0) existing.TaxPercentage = updates.TaxPercentage;
                if (updates.BasePrice > 0) existing.BasePrice = updates.BasePrice;
                existing.UpdatedAt = DateTime.UtcNow;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update service");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating service: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteServiceAsync(string id)
        {
            return await DeleteAsync(id);
        }

        public async Task<List<ServiceItem>> GetByOrganizationAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM serviceitem WHERE organizationid = @organizationId ORDER BY name";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<ServiceItem>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting services by organization: {ex.Message}");
                return new List<ServiceItem>();
            }
        }

        public async Task<List<ServiceItem>> GetActiveAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM serviceitem WHERE isactive = true ORDER BY name";
                using var command = new NpgsqlCommand(sql, connection);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<ServiceItem>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting active services: {ex.Message}");
                return new List<ServiceItem>();
            }
        }
    }

    public interface IServicesDataService : IBaseDataService<ServiceItem>
    {
        Task<ServiceItem> CreateServiceAsync(ServiceItem service);
        Task<ServiceItem> UpdateServiceAsync(string id, ServiceItem updates);
        Task<bool> DeleteServiceAsync(string id);
        Task<List<ServiceItem>> GetByOrganizationAsync(string organizationId);
        Task<List<ServiceItem>> GetActiveAsync();
    }
} 