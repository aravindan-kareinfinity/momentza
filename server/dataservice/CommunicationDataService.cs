using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Npgsql;
using Momantza.Models;
using Microsoft.AspNetCore.Http;

namespace Momantza.Services
{
    public interface ICommunicationDataService
    {
        Task<List<Communication>> GetAllAsync();
        Task<Communication?> GetByIdAsync(string id);
        Task<Communication> CreateAsync(Communication communication);
        Task<Communication> UpdateAsync(string id, Communication communication);
        Task<bool> DeleteAsync(string id);
        Task<List<Communication>> GetCommunicationsByBookingIdAsync(string bookingId);
    }

    public class CommunicationDataService : BaseDataService<Communication>, ICommunicationDataService
    {
        public CommunicationDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
            EnsureTableExists();
        }

        private void EnsureTableExists()
        {
            var createTableSql = @"
                CREATE TABLE IF NOT EXISTS communications (
                    id VARCHAR(50) PRIMARY KEY,
                    booking_id VARCHAR(50) NOT NULL,
                    date TIMESTAMP WITH TIME ZONE NOT NULL,
                    time TIMESTAMP WITH TIME ZONE NOT NULL,
                    from_person VARCHAR(100) NOT NULL,
                    to_person VARCHAR(100) NOT NULL,
                    detail TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );";

            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();
            using var command = new NpgsqlCommand(createTableSql, connection);
            command.ExecuteNonQuery();
        }

        public override async Task<List<Communication>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM communications WHERE organizationid = @organizationId ORDER BY created_at DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Communication>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public async Task<Communication?> GetByIdAsync(string id)
        {
            var sql = "SELECT * FROM communications WHERE id = @id";

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapRowToCommunication(reader);
            }

            return null;
        }

        public async Task<Communication> CreateAsync(Communication communication)
        {
            communication.Id = Guid.NewGuid().ToString();
            communication.CreatedAt = DateTime.UtcNow;

            var sql = @"
                INSERT INTO communications (id, booking_id, date, time, from_person, to_person, detail, created_at)
                VALUES (@id, @bookingId, @date, @time, @fromPerson, @toPerson, @detail, @createdAt)";

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", communication.Id);
            command.Parameters.AddWithValue("@bookingId", communication.BookingId);
            command.Parameters.AddWithValue("@date", communication.Date);
            command.Parameters.AddWithValue("@time", communication.Time);
            command.Parameters.AddWithValue("@fromPerson", communication.FromPerson);
            command.Parameters.AddWithValue("@toPerson", communication.ToPerson);
            command.Parameters.AddWithValue("@detail", communication.Detail);
            command.Parameters.AddWithValue("@createdAt", communication.CreatedAt);

            await command.ExecuteNonQueryAsync();
            return communication;
        }

        public async Task<Communication> UpdateAsync(string id, Communication communication)
        {
            var sql = @"
                UPDATE communications 
                SET booking_id = @bookingId, date = @date, time = @time, 
                    from_person = @fromPerson, to_person = @toPerson, detail = @detail
                WHERE id = @id";

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@bookingId", communication.BookingId);
            command.Parameters.AddWithValue("@date", communication.Date);
            command.Parameters.AddWithValue("@time", communication.Time);
            command.Parameters.AddWithValue("@fromPerson", communication.FromPerson);
            command.Parameters.AddWithValue("@toPerson", communication.ToPerson);
            command.Parameters.AddWithValue("@detail", communication.Detail);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new Exception("Communication not found");
            }

            return await GetByIdAsync(id) ?? throw new Exception("Communication not found after update");
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var sql = "DELETE FROM communications WHERE id = @id";

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        public async Task<List<Communication>> GetCommunicationsByBookingIdAsync(string bookingId)
        {
            var communications = new List<Communication>();
            var sql = "SELECT * FROM communications WHERE booking_id = @bookingId ORDER BY created_at DESC";

            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@bookingId", bookingId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                communications.Add(MapRowToCommunication(reader));
            }

            return communications;
        }

        private Communication MapRowToCommunication(IDataReader reader)
        {
            return new Communication
            {
                Id = reader["id"].ToString() ?? "",
                BookingId = reader["booking_id"].ToString() ?? "",
                Date = reader["date"] != DBNull.Value ? Convert.ToDateTime(reader["date"]) : DateTime.MinValue,
                Time = reader["time"] != DBNull.Value ? Convert.ToDateTime(reader["time"]) : DateTime.MinValue,
                FromPerson = reader["from_person"].ToString() ?? "",
                ToPerson = reader["to_person"].ToString() ?? "",
                Detail = reader["detail"].ToString() ?? "",
                CreatedAt = reader["created_at"] != DBNull.Value ? Convert.ToDateTime(reader["created_at"]) : DateTime.UtcNow
            };
        }

        protected override Communication MapFromReader(NpgsqlDataReader reader)
        {
            return MapRowToCommunication(reader);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Communication entity)
        {
            var sql = @"INSERT INTO communication (id, bookingid, date, time, fromperson, toperson, detail, organizationid, createdat) VALUES (@id, @bookingid, @date, @time, @fromperson, @toperson, @detail, @organizationid, @createdat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@bookingid"] = entity.BookingId,
                ["@date"] = entity.Date,
                ["@time"] = entity.Time,
                ["@fromperson"] = entity.FromPerson,
                ["@toperson"] = entity.ToPerson,
                ["@detail"] = entity.Detail,
                ["@organizationid"] = entity.OrganizationId,
                ["@createdat"] = entity.CreatedAt
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Communication entity)
        {
            var sql = @"UPDATE communication SET bookingid = @bookingid, date = @date, time = @time, fromperson = @fromperson, toperson = @toperson, detail = @detail, organizationid = @organizationid, createdat = @createdat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@bookingid"] = entity.BookingId,
                ["@date"] = entity.Date,
                ["@time"] = entity.Time,
                ["@fromperson"] = entity.FromPerson,
                ["@toperson"] = entity.ToPerson,
                ["@detail"] = entity.Detail,
                ["@organizationid"] = entity.OrganizationId,
                ["@createdat"] = entity.CreatedAt
            };
            return (sql, parameters, new List<string>());
        }
    }
} 