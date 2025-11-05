using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Npgsql;
using Momantza.Models;
using Microsoft.AspNetCore.Http;

namespace Momantza.Services
{
    public interface ITicketDataService
    {
        Task<List<TicketItem>> GetAllAsync();
        Task<TicketItem?> GetByIdAsync(string id);
        Task<TicketItem> CreateAsync(TicketItem ticket);
        Task<TicketItem> UpdateAsync(string id, TicketItem ticket);
        Task<bool> DeleteAsync(string id);
        Task<List<TicketItem>> GetTicketsByBookingIdAsync(string bookingId);
        Task<TicketItem> UpdateTicketStatusAsync(string id, string status);
        Task<List<TicketItem>> GetTicketsByStatusAsync(string status);
        Task<List<TicketItem>> GetTicketsByAssignedToAsync(string assignedTo);
    }

    public class TicketDataService : BaseDataService<TicketItem>, ITicketDataService
    {
        public TicketDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
            EnsureTableExists();
        }

        private void EnsureTableExists()
        {
            var createTableSql = @"
                CREATE TABLE IF NOT EXISTS tickets (
                    id VARCHAR(50) PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    description TEXT NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    assigned_to VARCHAR(100) NOT NULL,
                    priority VARCHAR(20) NOT NULL,
                    booking_id VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    organizationid VARCHAR(50);
                );";

            using var connection = GetConnectionAsync().Result;
            using var command = new NpgsqlCommand(createTableSql, connection);
            command.ExecuteNonQuery();
        }



        public async Task<List<TicketItem>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM tickets WHERE organizationid = @organizationId ORDER BY created_at DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<TicketItem>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public async Task<TicketItem?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM tickets WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<TicketItem> CreateAsync(TicketItem ticket)
        {
            ticket.Id = Guid.NewGuid().ToString();
            ticket.CreatedAt = DateTime.UtcNow;
            ticket.UpdatedAt = DateTime.UtcNow;

            var sql = @"
                INSERT INTO tickets (id, title, description, category, status, assigned_to, priority, booking_id, created_at, updated_at,organizationid)
                VALUES (@id, @title, @description, @category, @status, @assignedTo, @priority, @bookingId, @createdAt, @updatedAt,@organizationId)";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", ticket.Id);
            command.Parameters.AddWithValue("@title", ticket.Title);
            command.Parameters.AddWithValue("@description", ticket.Description);
            command.Parameters.AddWithValue("@category", ticket.Category);
            command.Parameters.AddWithValue("@status", ticket.Status);
            command.Parameters.AddWithValue("@assignedTo", ticket.AssignedTo);
            command.Parameters.AddWithValue("@priority", ticket.Priority);
            command.Parameters.AddWithValue("@bookingId", ticket.BookingId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@createdAt", ticket.CreatedAt);
            command.Parameters.AddWithValue("@updatedAt", ticket.UpdatedAt);
            command.Parameters.AddWithValue("@organizationId", ticket.OrganizationId ?? (object)DBNull.Value);

            await command.ExecuteNonQueryAsync();
            return ticket;
        }

        public async Task<TicketItem> UpdateAsync(string id, TicketItem ticket)
        {
            ticket.UpdatedAt = DateTime.UtcNow;

            var sql = @"
                UPDATE tickets 
                SET title = @title, description = @description, category = @category, 
                    status = @status, assigned_to = @assignedTo, priority = @priority, 
                    booking_id = @bookingId, updated_at = @updatedAt , organizationid = @organizationId,
                WHERE id = @id";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@title", ticket.Title);
            command.Parameters.AddWithValue("@description", ticket.Description);
            command.Parameters.AddWithValue("@category", ticket.Category);
            command.Parameters.AddWithValue("@status", ticket.Status);
            command.Parameters.AddWithValue("@assignedTo", ticket.AssignedTo);
            command.Parameters.AddWithValue("@priority", ticket.Priority);
            command.Parameters.AddWithValue("@bookingId", ticket.BookingId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@updatedAt", ticket.UpdatedAt);
            command.Parameters.AddWithValue("@organizationId", ticket.OrganizationId ?? (object)DBNull.Value);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new Exception("Ticket not found");
            }

            return await GetByIdAsync(id) ?? throw new Exception("Ticket not found after update");
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var sql = "DELETE FROM tickets WHERE id = @id";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        public async Task<List<TicketItem>> GetTicketsByBookingIdAsync(string bookingId)
        {
            var orgId = GetCurrentOrganizationId();
            var tickets = new List<TicketItem>();
            var sql = "SELECT * FROM tickets WHERE booking_id = @bookingId OR organizationid = @organizationId ORDER BY created_at DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@bookingId", bookingId);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tickets.Add(MapFromReader(reader));
            }

            return tickets;
        }

        public async Task<TicketItem> UpdateTicketStatusAsync(string id, string status)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "UPDATE tickets SET status = @status, updated_at = @updatedAt WHERE id = @id AND organizationid = @organizationId";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@status", status);
            command.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);
            command.Parameters.AddWithValue("@organizationId", orgId);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new Exception("Ticket not found");
            }

            return await GetByIdAsync(id) ?? throw new Exception("Ticket not found after update");
        }

        public async Task<List<TicketItem>> GetTicketsByStatusAsync(string status)
        {
            var orgId = GetCurrentOrganizationId();
            var tickets = new List<TicketItem>();
            var sql = "SELECT * FROM tickets WHERE status = @status AND organizationid = @organizationId ORDER BY created_at DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@status", status);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tickets.Add(MapFromReader(reader));
            }

            return tickets;
        }

        public async Task<List<TicketItem>> GetTicketsByAssignedToAsync(string assignedTo)
        {
            var orgId = GetCurrentOrganizationId();
            var tickets = new List<TicketItem>();
            var sql = "SELECT * FROM tickets WHERE assigned_to = @assignedTo AND organizationid = @organizationId ORDER BY created_at DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@assignedTo", assignedTo);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tickets.Add(MapFromReader(reader));
            }

            return tickets;
        }

        private TicketItem MapRowToTicket(IDataReader reader)
        {
            return new TicketItem
            {
                Id = reader["id"].ToString() ?? "",
                Title = reader["title"].ToString() ?? "",
                Description = reader["description"].ToString() ?? "",
                Category = reader["category"].ToString() ?? "",
                Status = reader["status"].ToString() ?? "",
                AssignedTo = reader["assigned_to"].ToString() ?? "",
                Priority = reader["priority"].ToString() ?? "",
                BookingId = reader["booking_id"]?.ToString(),
                CreatedAt = reader["created_at"] != DBNull.Value ? Convert.ToDateTime(reader["created_at"]) : DateTime.UtcNow,
                UpdatedAt = reader["updated_at"] != DBNull.Value ? Convert.ToDateTime(reader["updated_at"]) : DateTime.UtcNow,
                OrganizationId = reader["organizationid"].ToString() ?? ""
            };
        }

        protected override TicketItem MapFromReader(NpgsqlDataReader reader)
        {
            return MapRowToTicket(reader);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(TicketItem entity)
        {
            var sql = @"INSERT INTO ticketitem (id, title, description, category, status, assignedto, priority, bookingid, createdat, updatedat) VALUES (@id, @title, @description, @category, @status, @assignedto, @priority, @bookingid, @createdat, @updatedat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@title"] = entity.Title,
                ["@description"] = entity.Description,
                ["@category"] = entity.Category,
                ["@status"] = entity.Status,
                ["@assignedto"] = entity.AssignedTo,
                ["@priority"] = entity.Priority,
                ["@bookingid"] = entity.BookingId,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(TicketItem entity)
        {
            var sql = @"UPDATE ticketitem SET title = @title, description = @description, category = @category, status = @status, assignedto = @assignedto, priority = @priority, bookingid = @bookingid, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@title"] = entity.Title,
                ["@description"] = entity.Description,
                ["@category"] = entity.Category,
                ["@status"] = entity.Status,
                ["@assignedto"] = entity.AssignedTo,
                ["@priority"] = entity.Priority,
                ["@bookingid"] = entity.BookingId,
                ["@updatedat"] = entity.UpdatedAt
            };
            return (sql, parameters, new List<string>());
        }
    }
} 