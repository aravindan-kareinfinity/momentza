using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Npgsql;
using Momantza.Models;
using Microsoft.AspNetCore.Http;

namespace Momantza.Services
{

    public interface IPaymentDataService
    {
        Task<List<PaymentItem>> GetAllAsync();
        Task<PaymentItem?> GetByIdAsync(string id);
        Task<PaymentItem> CreateAsync(PaymentItem payment);
        Task<PaymentItem> UpdateAsync(string id, PaymentItem payment);
        Task<bool> DeleteAsync(string id);
        Task<List<PaymentItem>> GetPaymentsByBookingIdAsync(string bookingId);
        Task<List<PaymentItem>> GetPaymentsByModeAsync(string paymentMode);
        Task<List<PaymentItem>> GetPaymentsByDateRangeAsync(DateTime startDate, DateTime endDate);
    }
    public class PaymentDataService : BaseDataService<PaymentItem>, IPaymentDataService
    {
        public PaymentDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
            : base(configuration, httpContextAccessor)
        {
            EnsureTableExists();
        }

        private void EnsureTableExists()
        {
            var createTableSql = @"
                CREATE TABLE IF NOT EXISTS payments (
                    id VARCHAR(50) PRIMARY KEY,
                    date TIMESTAMP NOT NULL,
                    payment_mode VARCHAR(50) NOT NULL,
                    amount DECIMAL(18,2) NOT NULL,
                    person_name VARCHAR(100) NOT NULL,
                    notes TEXT,
                    booking_id VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    organizationid VARCHAR(50) NOT NULL
                );";

            using var connection = GetConnectionAsync().Result;
            using var command = new NpgsqlCommand(createTableSql, connection);
            command.ExecuteNonQuery();
        }

        public async Task<List<PaymentItem>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM payments WHERE organizationid = @organizationId ORDER BY created_at DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<PaymentItem>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public async Task<PaymentItem?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM payments WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<PaymentItem> CreateAsync(PaymentItem payment)
        
        {
            payment.Id = Guid.NewGuid().ToString();
            payment.CreatedAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;

            var sql = @"
                INSERT INTO payments (id, date, payment_mode, amount, person_name, notes, booking_id, created_at, updated_at, organizationid)
                VALUES (@id, @date, @paymentMode, @amount, @personName, @notes, @bookingId, @createdAt, @updatedAt, @organizationId)";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", payment.Id);
            command.Parameters.AddWithValue("@date", payment.Date);
            command.Parameters.AddWithValue("@paymentMode", payment.PaymentMode);
            command.Parameters.AddWithValue("@amount", payment.Amount);
            command.Parameters.AddWithValue("@personName", payment.PersonName);
            command.Parameters.AddWithValue("@notes", payment.Notes ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@bookingId", payment.BookingId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@createdAt", payment.CreatedAt);
            command.Parameters.AddWithValue("@updatedAt", payment.UpdatedAt);
            command.Parameters.AddWithValue("@organizationId", payment.OrganizationId ?? (object)DBNull.Value);

            await command.ExecuteNonQueryAsync();
            return payment;
        }

        public async Task<PaymentItem> UpdateAsync(string id, PaymentItem payment)
        {
            var existing = await GetByIdAsync(id);
            if (existing == null)
                throw new Exception("Payment not found");

            // Preserve booking + organization
            payment.Id = existing.Id;
            payment.BookingId = existing.BookingId;
            payment.OrganizationId = existing.OrganizationId;
            payment.CreatedAt = existing.CreatedAt;

            payment.UpdatedAt = DateTime.UtcNow;

            var sql = @"
                UPDATE payments 
                SET date = @date, payment_mode = @paymentMode, amount = @amount, 
                    person_name = @personName, notes = @notes, booking_id = @bookingId, 
                    updated_at = @updatedAt, organizationid = @organizationId
                WHERE id = @id";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            command.Parameters.AddWithValue("@date", payment.Date);
            command.Parameters.AddWithValue("@paymentMode", payment.PaymentMode);
            command.Parameters.AddWithValue("@amount", payment.Amount);
            command.Parameters.AddWithValue("@personName", payment.PersonName);
            command.Parameters.AddWithValue("@notes", payment.Notes ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@bookingId", payment.BookingId ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("@updatedAt", payment.UpdatedAt);
            command.Parameters.AddWithValue("@organizationId", payment.OrganizationId ?? (object)DBNull.Value);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            if (rowsAffected == 0)
            {
                throw new Exception("Payment not found");
            }

            return await GetByIdAsync(id) ?? throw new Exception("Payment not found after update");
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var sql = "DELETE FROM payments WHERE id = @id";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);

            var rowsAffected = await command.ExecuteNonQueryAsync();
            return rowsAffected > 0;
        }

        public async Task<List<PaymentItem>> GetPaymentsByBookingIdAsync(string bookingId)
        {
            var orgId = GetCurrentOrganizationId();
            var payments = new List<PaymentItem>();
            var sql = "SELECT * FROM payments WHERE booking_id = @bookingId ORDER BY created_at DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@bookingId", bookingId);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                payments.Add(MapFromReader(reader));
            }

            return payments;
        }

        public async Task<List<PaymentItem>> GetPaymentsByModeAsync(string paymentMode)
        {
            var orgId = GetCurrentOrganizationId();
            var payments = new List<PaymentItem>();
            var sql = "SELECT * FROM payments WHERE payment_mode = @paymentMode AND organizationid = @organizationId ORDER BY created_at DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@paymentMode", paymentMode);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                payments.Add(MapFromReader(reader));
            }

            return payments;
        }

        public async Task<List<PaymentItem>> GetPaymentsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            var orgId = GetCurrentOrganizationId();
            var payments = new List<PaymentItem>();
            var sql = "SELECT * FROM payments WHERE date >= @startDate AND date <= @endDate AND organizationid = @organizationId ORDER BY date DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@startDate", startDate);
            command.Parameters.AddWithValue("@endDate", endDate);
            command.Parameters.AddWithValue("@organizationId", orgId);

            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                payments.Add(MapFromReader(reader));
            }

            return payments;
        }

        private PaymentItem MapRowToPayment(IDataReader reader)
        {
            return new PaymentItem
            {
                Id = reader["id"].ToString() ?? "",
                Date = reader["date"] != DBNull.Value ? Convert.ToDateTime(reader["date"]) : DateTime.UtcNow,
                PaymentMode = reader["payment_mode"].ToString() ?? "",
                Amount = reader["amount"] != DBNull.Value ? Convert.ToDecimal(reader["amount"]) : 0,
                PersonName = reader["person_name"].ToString() ?? "",
                Notes = reader["notes"]?.ToString(),
                BookingId = reader["booking_id"]?.ToString(),
                CreatedAt = reader["created_at"] != DBNull.Value ? Convert.ToDateTime(reader["created_at"]) : DateTime.UtcNow,
                UpdatedAt = reader["updated_at"] != DBNull.Value ? Convert.ToDateTime(reader["updated_at"]) : DateTime.UtcNow,
                OrganizationId = reader["organizationid"].ToString() ?? ""
            };
        }

        protected override PaymentItem MapFromReader(NpgsqlDataReader reader)
        {
            return MapRowToPayment(reader);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(PaymentItem entity)
        {
            var sql = @"INSERT INTO payments (id, date, payment_mode, amount, person_name, notes, booking_id, created_at, updated_at, organizationid) 
                       VALUES (@id, @date, @paymentMode, @amount, @personName, @notes, @bookingId, @createdAt, @updatedAt, @organizationId)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@date"] = entity.Date,
                ["@paymentMode"] = entity.PaymentMode,
                ["@amount"] = entity.Amount,
                ["@personName"] = entity.PersonName,
                ["@notes"] = entity.Notes,
                ["@bookingId"] = entity.BookingId,
                ["@createdAt"] = entity.CreatedAt,
                ["@updatedAt"] = entity.UpdatedAt,
                ["@organizationId"] = entity.OrganizationId
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(PaymentItem entity)
        {
            var sql = @"UPDATE payments SET date = @date, payment_mode = @paymentMode, amount = @amount, 
                       person_name = @personName, notes = @notes, booking_id = @bookingId, 
                       updated_at = @updatedAt, organizationid = @organizationId 
                       WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@date"] = entity.Date,
                ["@paymentMode"] = entity.PaymentMode,
                ["@amount"] = entity.Amount,
                ["@personName"] = entity.PersonName,
                ["@notes"] = entity.Notes,
                ["@bookingId"] = entity.BookingId,
                ["@updatedAt"] = entity.UpdatedAt,
                ["@organizationId"] = entity.OrganizationId
            };
            return (sql, parameters, new List<string>());
        }
    }
}