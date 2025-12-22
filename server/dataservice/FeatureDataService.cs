using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Momantza.Services;
using MomantzaApp.model;
using Npgsql;

namespace MomantzaApp.DataService
{
    public interface IFeatureDataService
    {
        Task<List<FeatureItem>> GetAllAsync();
        Task<List<FeatureItem>> GetByBookingIdAsync(string bookingId);
        Task<FeatureItem?> GetByIdAsync(string id);
        Task<FeatureItem> CreateAsync(FeatureItem feature);
        Task<FeatureItem> UpdateAsync(string id, FeatureItem feature);
        Task<bool> DeleteAsync(string id);
    }

    public class FeatureDataService : BaseDataService<FeatureItem>, IFeatureDataService
    {
        public FeatureDataService(IConfiguration config, IHttpContextAccessor accessor)
            : base(config, accessor)
        {
            EnsureTableExists();
        }

        private void EnsureTableExists()
        {
            var sql = @"
                CREATE TABLE IF NOT EXISTS features (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    price DECIMAL(18,2) NOT NULL DEFAULT 0,
                    quantity INTEGER NOT NULL DEFAULT 1,
                    booking_id VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    organizationid VARCHAR(50) NOT NULL
                );";

            using var conn = GetConnectionAsync().Result;
            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.ExecuteNonQuery();
        }

        // GET ALL FEATURES FOR ORGANIZATION
        public async Task<List<FeatureItem>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM features WHERE organizationid = @org ORDER BY created_at DESC";

            using var conn = await GetConnectionAsync();
            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@org", orgId);

            using var reader = await cmd.ExecuteReaderAsync();
            var list = new List<FeatureItem>();

            while (await reader.ReadAsync())
                list.Add(MapFromReader(reader));

            return list;
        }

        // GET BY BOOKING ID
        public async Task<List<FeatureItem>> GetByBookingIdAsync(string bookingId)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = @"SELECT * FROM features 
                        WHERE booking_id = @bookingId 
                        OR organizationid = @org 
                        ORDER BY created_at DESC";

            using var conn = await GetConnectionAsync();
            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("@bookingId", bookingId);
            cmd.Parameters.AddWithValue("@org", orgId);

            using var reader = await cmd.ExecuteReaderAsync();
            var list = new List<FeatureItem>();

            while (await reader.ReadAsync())
                list.Add(MapFromReader(reader));

            return list;
        }

        public async Task<FeatureItem?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM features WHERE id = @id AND organizationid = @org";

            using var conn = await GetConnectionAsync();
            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@org", orgId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                return MapFromReader(reader);

            return null;
        }

        // CREATE FEATURE
        public async Task<FeatureItem> CreateAsync(FeatureItem feature)
        {
            feature.Id = Guid.NewGuid().ToString();
            feature.CreatedAt = DateTime.UtcNow;
            feature.UpdatedAt = DateTime.UtcNow;
            feature.OrganizationId = GetCurrentOrganizationId();

            var sql = @"
                INSERT INTO features 
                (id, name, price, quantity, booking_id, created_at, updated_at, organizationid)
                VALUES 
                (@id, @name, @price, @quantity, @bookingId, @createdAt, @updatedAt, @organizationId)";

            using var conn = await GetConnectionAsync();
            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("@id", feature.Id);
            cmd.Parameters.AddWithValue("@name", feature.Name);
            cmd.Parameters.AddWithValue("@price", feature.Price);
            cmd.Parameters.AddWithValue("@quantity", feature.Quantity);
            cmd.Parameters.AddWithValue("@bookingId", feature.BookingId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@createdAt", feature.CreatedAt);
            cmd.Parameters.AddWithValue("@updatedAt", feature.UpdatedAt);
            cmd.Parameters.AddWithValue("@organizationId", feature.OrganizationId);

            await cmd.ExecuteNonQueryAsync();

            return feature;
        }

        // UPDATE FEATURE
        public async Task<FeatureItem> UpdateAsync(string id, FeatureItem feature)
        {
            var existing = await GetByIdAsync(id);
            if (existing == null)
                throw new Exception("Feature not found");

            feature.OrganizationId = existing.OrganizationId;
            feature.UpdatedAt = DateTime.UtcNow;

            var sql = @"
                UPDATE features
                SET name = @name,
                    price = @price,
                    quantity = @quantity,
                    booking_id = @bookingId,
                    updated_at = @updatedAt,
                    organizationid = @organizationId
                WHERE id = @id";

            using var conn = await GetConnectionAsync();
            using var cmd = new NpgsqlCommand(sql, conn);

            cmd.Parameters.AddWithValue("@id", id);
            cmd.Parameters.AddWithValue("@name", feature.Name);
            cmd.Parameters.AddWithValue("@price", feature.Price);
            cmd.Parameters.AddWithValue("@quantity", feature.Quantity);
            cmd.Parameters.AddWithValue("@bookingId", feature.BookingId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@updatedAt", feature.UpdatedAt);
            cmd.Parameters.AddWithValue("@organizationId", feature.OrganizationId);

            await cmd.ExecuteNonQueryAsync();

            return await GetByIdAsync(id) ?? feature;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var sql = "DELETE FROM features WHERE id = @id";

            using var conn = await GetConnectionAsync();
            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);

            var rows = await cmd.ExecuteNonQueryAsync();
            return rows > 0;
        }

        // MAP DATABASE → MODEL
        protected override FeatureItem MapFromReader(NpgsqlDataReader reader)
        {
            return new FeatureItem
            {
                Id = reader["id"].ToString()!,
                Name = reader["name"].ToString()!,
                Price = Convert.ToDecimal(reader["price"]),
                Quantity = Convert.ToInt32(reader["quantity"]),
                BookingId = reader["booking_id"]?.ToString(),
                CreatedAt = Convert.ToDateTime(reader["created_at"]),
                UpdatedAt = Convert.ToDateTime(reader["updated_at"]),
                OrganizationId = reader["organizationid"].ToString()!
            };
        }

        // NOT USED (but BaseDataService requires them)
        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields)
            GenerateInsertSql(FeatureItem entity)
        {
            throw new NotImplementedException("Use CreateAsync instead.");
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields)
            GenerateUpdateSql(FeatureItem entity)
        {
            throw new NotImplementedException("Use UpdateAsync instead.");
        }
    }
}
