using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Npgsql;
using Momantza.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;

namespace Momantza.Services
{
    public interface IInventoryDataService
    {
        Task<List<InventoryItem>> GetAllAsync();
        Task<InventoryItem?> GetByIdAsync(string id);
        Task<InventoryItem> CreateAsync(InventoryItem item);
        Task<InventoryItem> UpdateAsync(string id, InventoryItem item);
        Task<bool> DeleteAsync(string id);
        Task<InventoryItem?> GetByNameAsync(string name);
    }

    public class InventoryDataService : BaseDataService<InventoryItem>, IInventoryDataService
    {
        public InventoryDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
            EnsureTableExists();
        }

        private void EnsureTableExists()
        {
            var createTableSql = @"
                CREATE TABLE IF NOT EXISTS inventory_items (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    quantity INTEGER NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    organizationid VARCHAR(50),
                    description text,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );";

            using var connection = GetConnectionAsync().Result;
            using var command = new NpgsqlCommand(createTableSql, connection);
            command.ExecuteNonQuery();
        }

        public override async Task<List<InventoryItem>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM inventory_items WHERE organizationid = @organizationId ORDER BY name";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<InventoryItem>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<InventoryItem?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM inventory_items WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<InventoryItem> CreateAsync(InventoryItem item)
        {
            item.Id = Guid.NewGuid().ToString();
            var sql = @"
        INSERT INTO inventory_items (id, name, quantity, description, price, notes, organizationid)
        VALUES (@id, @name, @quantity, @description, @price, @notes, @organizationid)";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);

            command.Parameters.AddWithValue("@id", item.Id);
            command.Parameters.AddWithValue("@name", item.Name);
            command.Parameters.AddWithValue("@quantity", item.Quantity);
            command.Parameters.AddWithValue("@description", item.Description ?? "");
            command.Parameters.AddWithValue("@price", item.Price);
            command.Parameters.AddWithValue("@notes", item.Notes ?? "");
            command.Parameters.AddWithValue("@organizationid", item.orgId);

            await command.ExecuteNonQueryAsync();
            return item;
        }

        public async Task<InventoryItem> UpdateAsync(string id, InventoryItem item)
        {
            var sql = @"
                UPDATE inventory_items 
                SET name = @name, quantity = @quantity, price = @price, notes = @notes, updated_at = CURRENT_TIMESTAMP
                WHERE id = @id";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@name", item.Name);
            command.Parameters.AddWithValue("@quantity", item.Quantity);
            command.Parameters.AddWithValue("@price", item.Price);
            command.Parameters.AddWithValue("@notes", item.Notes ?? "");

            var rowsAffected = await command.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new Exception("Inventory item not found");
            }

            return await GetByIdAsync(id) ?? throw new Exception("Inventory item not found after update");
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var sql = "DELETE FROM inventory_items WHERE id = @id";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        public async Task<InventoryItem?> GetByNameAsync(string name)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM inventory_items WHERE name = @name AND organizationid = @organizationId";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@name", name);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapFromReader(reader);
            }
            return null;
        }

        private InventoryItem MapRowToInventoryItem(IDataReader reader)
        {
            return new InventoryItem
            {
                Id = reader["id"].ToString() ?? "",
                Name = reader["name"].ToString() ?? "",
                Quantity = Convert.ToInt32(reader["quantity"]),
                Price = Convert.ToDecimal(reader["price"]),
                Notes = reader["notes"]?.ToString() ?? "",
                orgId = reader["organizationid"]?.ToString() ?? ""
            };
        }

        protected override InventoryItem MapFromReader(NpgsqlDataReader reader)
        {
            return MapRowToInventoryItem(reader);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(InventoryItem entity)
        {
            var sql = @"INSERT INTO inventory_items (id, name, quantity, price, notes, organizationid, created_at, updated_at) 
                VALUES (@id, @name, @quantity, @price, @notes, @organizationid, @created_at, @updated_at)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@quantity"] = entity.Quantity,
                ["@price"] = entity.Price,
                ["@notes"] = entity.Notes ?? "",
                ["@organizationid"] = entity.orgId,
                ["@created_at"] = DateTime.UtcNow,
                ["@updated_at"] = DateTime.UtcNow
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(InventoryItem entity)
        {
            var sql = @"UPDATE inventory_items 
                SET name = @name, quantity = @quantity, price = @price, notes = @notes, updated_at = @updated_at 
                WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@name"] = entity.Name,
                ["@quantity"] = entity.Quantity,
                ["@price"] = entity.Price,
                ["@notes"] = entity.Notes ?? "",
                ["@updated_at"] = DateTime.UtcNow
            };
            return (sql, parameters, new List<string>());
        }
    }
}