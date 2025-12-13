using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;

namespace Momantza.Services
{
    public interface IServicesDataService : IBaseDataService<ServiceItem>
    {
        Task<ServiceItem> CreateServiceAsync(ServiceItem service);
        Task<ServiceItem> UpdateServiceAsync(string id, ServiceItem updates);
        Task<bool> DeleteServiceAsync(string id);
        Task<List<ServiceItem>> GetByOrganizationAsync(string organizationId);
        Task<List<ServiceItem>> GetActiveAsync();
        Task<List<ServiceItem>> GetServicesByBookingIdAsync(string bookingId);
        Task<ServiceItem> UpdateBookingServiceAsync(string id, ServiceItem updates);
        Task<ServiceItem> UpdateSettingsServiceAsync(string id, ServiceItem updates);
        Task<ServiceItem> CreateAsyncs(ServiceItem service);
        //Task<ServiceItem> UpdateBookingServiceAsync(string id, ServiceItem updates);
        Task<bool> DeleteAsync(string id);

        Task<bool> SettingsServiceDelete(string id);
    }

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
        //new
        public ServiceItem MapReaderToService(NpgsqlDataReader reader)
        {
            return new ServiceItem
            {
                Id = reader["id"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                Price = reader["price"] != DBNull.Value ? Convert.ToDecimal(reader["price"]) : 0m,
                PayMode = reader["paymode"] != DBNull.Value ? Convert.ToBoolean(reader["paymode"]) : false,
                BookingId = reader["booking_id"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                CreatedAt = reader["created_at"] != DBNull.Value ? Convert.ToDateTime(reader["created_at"]) : DateTime.UtcNow,
                UpdatedAt = reader["updated_at"] != DBNull.Value ? Convert.ToDateTime(reader["updated_at"]) : DateTime.UtcNow
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


        public async Task<ServiceItem> CreateServiceAsync(ServiceItem service)
        {
            service.Id = Guid.NewGuid().ToString();
            service.CreatedAt = DateTime.UtcNow;
            service.UpdatedAt = DateTime.UtcNow;

            var sql = @"
                INSERT INTO services (id, name,pay_type, booking_id, created_at, updated_at,organizationid)
                VALUES (@id, @name,@paytype, @bookingId, @createdAt, @updatedAt,@organizationId)";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", service.Id);
            command.Parameters.AddWithValue("@name", service.Name);
            //   command.Parameters.AddWithValue("@paytype", service.PayType);
            command.Parameters.AddWithValue("@bookingId", service.BookingId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@createdAt", service.CreatedAt);
            command.Parameters.AddWithValue("@updatedAt", service.UpdatedAt);
            command.Parameters.AddWithValue("@organizationId", service.OrganizationId ?? (object)DBNull.Value);

            await command.ExecuteNonQueryAsync();
            return service;
        }

        // Add this explicit implementation to satisfy IBaseDataService<ServiceItem>.CreateServiceAsync(ServiceItem)
        //public async Task<bool> CreateServiceAsync(ServiceItem entity)
        //{
        //    // You can call your existing CreateServiceAsync(ServiceItem) and return true if successful
        //    await CreateServiceAsync(entity);
        //    return true;
        //}

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(ServiceItem entity)
        {
            var sql = @"UPDATE serviceitem SET name = @name, hsncode = @hsncode, taxpercentage = @taxpercentage, baseprice = @baseprice, organizationid = @organizationid, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@hsncode"] = entity.HsnCode,
                ["@taxpercentage"] = entity.TaxPercentage,
                ["@baseprice"] = entity.BasePrice,
                ["@organizationid"] = entity.OrganizationId,
                // ["@isactive"] = entity.IsActive,
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

        public async Task<List<ServiceItem>> GetServicesByBookingIdAsync(string bookingId)
        {
            var orgId = GetCurrentOrganizationId();
            var services = new List<ServiceItem>();
            var sql = "SELECT * FROM services WHERE booking_id = @bookingId OR organizationid = @organizationId ORDER BY created_at DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@bookingId", bookingId);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                services.Add(MapReaderToService(reader));
            }

            return services;
        }
        //new
        public async Task<ServiceItem> CreateAsyncs(ServiceItem service)

        {
            service.Id = Guid.NewGuid().ToString();
            service.CreatedAt = DateTime.UtcNow;
            service.UpdatedAt = DateTime.UtcNow;

            var sql = @"
                INSERT INTO services (id, name, price,paymode, booking_id, created_at, updated_at, organizationid)
                VALUES (@id, @name, @price, @paymode, @bookingId, @createdAt, @updatedAt, @organizationId)";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", service.Id);
            command.Parameters.AddWithValue("@name", service.Name);
            command.Parameters.AddWithValue("@price", service.Price);
            // command.Parameters.AddWithValue("@amount", service.Amount);
            command.Parameters.AddWithValue("@paymode", service.PayMode);
            // command.Parameters.AddWithValue("@notes", payment.Notes ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@bookingId", service.BookingId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@createdAt", service.CreatedAt);
            command.Parameters.AddWithValue("@updatedAt", service.UpdatedAt);
            command.Parameters.AddWithValue("@organizationId", service.OrganizationId ?? (object)DBNull.Value);

            await command.ExecuteNonQueryAsync();
            return service;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            
            var sql = "DELETE FROM services WHERE id = @id";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        public async Task<bool> SettingsServiceDelete(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "DELETE FROM serviceitem WHERE id = @id AND organizationid = @organizationId";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@organizationId", orgId);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        public async Task<ServiceItem> UpdateBookingServiceAsync(string id, ServiceItem updates)
        {
            var sql = @"
        UPDATE services
        SET name = @name,
            price = @price,
            paymode = @paymode,
            updated_at = @updatedAt
        WHERE id = @id
        RETURNING *;
    ";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@name", updates.Name);
            command.Parameters.AddWithValue("@price", updates.Price);
            command.Parameters.AddWithValue("@paymode", updates.PayMode);
            command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapReaderToService(reader);
            }

            throw new Exception("Service not found");
        }

        public async Task<ServiceItem> UpdateSettingsServiceAsync(string id, ServiceItem updates)
        {
            var orgId = GetCurrentOrganizationId();

            var sql = @"
        UPDATE serviceitem
        SET name = @name,
            hsncode = @hsncode,
            taxpercentage = @taxpercentage,
            baseprice = @baseprice,
            updatedat = @updatedat
        WHERE id = @id AND organizationid = @organizationId
        RETURNING *;
    ";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@name", updates.Name);
            command.Parameters.AddWithValue("@hsncode", updates.HsnCode);
            command.Parameters.AddWithValue("@taxpercentage", updates.TaxPercentage);
            command.Parameters.AddWithValue("@baseprice", updates.BasePrice);
            command.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                // CORRECT MAPPER
                return MapFromReader(reader);
            }

            throw new Exception("Service not found");
        }


    }
}