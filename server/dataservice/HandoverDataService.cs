using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Momantza.Models;

namespace Momantza.Services
{
    public class HandoverDataService : IHandoverDataService
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<HandoverDataService> _logger;

        public HandoverDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor, ILogger<HandoverDataService> logger)
        {
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        private async Task<NpgsqlConnection> GetConnectionAsync()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                _logger.LogInformation("Connecting to database with connection string: {ConnectionString}",
                    connectionString?.Replace("Password=", "Password=***"));

                var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();
                return connection;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create database connection");
                throw;
            }
        }

        public async Task<Handover?> GetByBookingIdAsync(string bookingId)
        {
            try
            {
                _logger.LogInformation("Getting handover for booking: {BookingId}", bookingId);

                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM handovers WHERE bookingid = @bookingid";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@bookingid", bookingId);

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var handover = MapFromReader(reader);
                    _logger.LogInformation("Found handover for booking: {BookingId}", bookingId);
                    return handover;
                }

                _logger.LogInformation("No handover found for booking: {BookingId}", bookingId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting handover by booking id: {BookingId}", bookingId);
                return null;
            }
        }

        public async Task<bool> CreateAsync(Handover entity)
        {
            try
            {
                _logger.LogInformation("Creating handover for booking: {BookingId}", entity.BookingId);

                using var connection = await GetConnectionAsync();
                var sql = @"INSERT INTO handovers (bookingid, advanceamount, ebreading, handoverdate, personname, createdat, updatedat) 
                           VALUES (@bookingid, @advanceamount, @ebreading, @handoverdate, @personname, @createdat, @updatedat)";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@bookingid", entity.BookingId);
                command.Parameters.AddWithValue("@advanceamount", entity.AdvanceAmount);
                command.Parameters.AddWithValue("@ebreading", entity.EbReading);
                command.Parameters.AddWithValue("@handoverdate", entity.HandOverDate);
                command.Parameters.AddWithValue("@personname", entity.PersonName);
                command.Parameters.AddWithValue("@createdat", entity.CreatedAt);
                command.Parameters.AddWithValue("@updatedat", entity.UpdatedAt);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Create handover affected {RowsAffected} rows for booking: {BookingId}", rowsAffected, entity.BookingId);

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating handover for booking: {BookingId}", entity.BookingId);
                return false;
            }
        }

        public async Task<bool> UpdateAsync(Handover entity)
        {
            try
            {
                _logger.LogInformation("Updating handover for booking: {BookingId}", entity.BookingId);

                using var connection = await GetConnectionAsync();
                var sql = @"UPDATE handovers SET 
                           advanceamount = @advanceamount, 
                           ebreading = @ebreading, 
                           handoverdate = @handoverdate, 
                           personname = @personname, 
                           updatedat = @updatedat 
                           WHERE bookingid = @bookingid";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@bookingid", entity.BookingId);
                command.Parameters.AddWithValue("@advanceamount", entity.AdvanceAmount);
                command.Parameters.AddWithValue("@ebreading", entity.EbReading);
                command.Parameters.AddWithValue("@handoverdate", entity.HandOverDate);
                command.Parameters.AddWithValue("@personname", entity.PersonName);
                command.Parameters.AddWithValue("@updatedat", entity.UpdatedAt);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Update handover affected {RowsAffected} rows for booking: {BookingId}", rowsAffected, entity.BookingId);

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating handover for booking: {BookingId}", entity.BookingId);
                return false;
            }
        }

        public async Task<bool> UpsertHandoverAsync(string bookingId, HandoverRequest request)
        {
            try
            {
                _logger.LogInformation("Upserting handover for booking: {BookingId} with data: {@Request}", bookingId, request);

                var existingHandover = await GetByBookingIdAsync(bookingId);

                if (existingHandover != null)
                {
                    _logger.LogInformation("Updating existing handover for booking: {BookingId}", bookingId);

                    existingHandover.AdvanceAmount = request.AdvanceAmount;
                    existingHandover.EbReading = request.EbReading;
                    existingHandover.HandOverDate = request.HandOverDate;
                    existingHandover.PersonName = request.PersonName;
                    existingHandover.UpdatedAt = DateTime.UtcNow;

                    return await UpdateAsync(existingHandover);
                }
                else
                {
                    _logger.LogInformation("Creating new handover for booking: {BookingId}", bookingId);

                    var handover = new Handover
                    {
                        BookingId = bookingId,
                        AdvanceAmount = request.AdvanceAmount,
                        EbReading = request.EbReading,
                        HandOverDate = request.HandOverDate,
                        PersonName = request.PersonName,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    return await CreateAsync(handover);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error upserting handover for booking: {BookingId}", bookingId);
                return false;
            }
        }

        public async Task<bool> DeleteByBookingIdAsync(string bookingId)
        {
            try
            {
                _logger.LogInformation("Deleting handover for booking: {BookingId}", bookingId);

                using var connection = await GetConnectionAsync();
                var sql = "DELETE FROM handovers WHERE bookingid = @bookingid";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@bookingid", bookingId);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                _logger.LogInformation("Delete handover affected {RowsAffected} rows for booking: {BookingId}", rowsAffected, bookingId);

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting handover for booking: {BookingId}", bookingId);
                return false;
            }
        }

        private Handover MapFromReader(NpgsqlDataReader reader)
        {
            return new Handover
            {
                BookingId = reader["bookingid"].ToString() ?? string.Empty,
                AdvanceAmount = Convert.ToDecimal(reader["advanceamount"]),
                EbReading = Convert.ToInt32(reader["ebreading"]),
                HandOverDate = Convert.ToDateTime(reader["handoverdate"]),
                PersonName = reader["personname"].ToString() ?? string.Empty,
                CreatedAt = Convert.ToDateTime(reader["createdat"]),
                UpdatedAt = Convert.ToDateTime(reader["updatedat"])
            };
        }

        public Task<List<Handover>> GetAllAsync()
        {
            throw new NotImplementedException();
        }

        public Task<Handover?> GetByIdAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteAsync(string id)
        {
            throw new NotImplementedException();
        }

        public Task<List<Handover>> GetByOrganizationIdAsync(string organizationId)
        {
            throw new NotImplementedException();
        }

        //
        // HandOver images
        public async Task<string?> UploadHandoverImageAsync(HandoverImageUploadDto dto)
        {
            try
            {
                using var connection = await GetConnectionAsync();

                var id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                byte[]? imageBytes = null;
                string? contentType = null;

                if (dto.File != null)
                {
                    using var ms = new MemoryStream();
                    await dto.File.CopyToAsync(ms);
                    imageBytes = ms.ToArray();
                    contentType = dto.File.ContentType;
                }

                var sql = @"
     INSERT INTO handover_images 
     (id, bookingid, organizationid, category, description, imagebytes, contenttype, uploadedat, createdat)
     VALUES 
     (@id, @bookingid, @organizationid, @category, @description, @imagebytes, @contenttype, NOW(), NOW())";

                using var cmd = new NpgsqlCommand(sql, connection);

                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@bookingid", dto.BookingId);
                cmd.Parameters.AddWithValue("@organizationid", dto.OrganizationId);
                cmd.Parameters.AddWithValue("@category", dto.Category);
                cmd.Parameters.AddWithValue("@description", dto.Description ?? "");

                cmd.Parameters.AddWithValue("@imagebytes", (object?)imageBytes ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@contenttype", (object?)contentType ?? DBNull.Value);

                await cmd.ExecuteNonQueryAsync();

                return id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload handover image");
                return null;
            }
        }

        public async Task<List<HandoverImage>> GetImagesByBookingIdAsync(string bookingId)
        {
            var images = new List<HandoverImage>();

            try
            {
                using var connection = await GetConnectionAsync();

                var sql = "SELECT * FROM handover_images WHERE bookingid = @bookingid ORDER BY uploadedat DESC";
                using var cmd = new NpgsqlCommand(sql, connection);
                cmd.Parameters.AddWithValue("@bookingid", bookingId);

                using var reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    images.Add(new HandoverImage
                    {
                        Id = reader["id"].ToString(),
                        BookingId = reader["bookingid"].ToString(),
                        OrganizationId = reader["organizationid"].ToString(),
                        Category = reader["category"].ToString(),
                        Description = reader["description"].ToString(),
                        Url = reader["url"]?.ToString(),
                        ImageBytes = reader["imagebytes"] as byte[],
                        ContentType = reader["contenttype"]?.ToString(),
                        UploadedAt = Convert.ToDateTime(reader["uploadedat"]),
                        CreatedAt = Convert.ToDateTime(reader["createdat"])
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch handover images");
            }

            return images;
        }

        public async Task<HandoverImage?> GetImageByIdAsync(string id)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM handover_images WHERE id = @id";

                using var cmd = new NpgsqlCommand(sql, connection);
                cmd.Parameters.AddWithValue("@id", id);

                using var reader = await cmd.ExecuteReaderAsync();

                if (await reader.ReadAsync())
                {
                    return new HandoverImage
                    {
                        Id = reader["id"].ToString(),
                        BookingId = reader["bookingid"].ToString(),
                        OrganizationId = reader["organizationid"].ToString(),
                        Category = reader["category"].ToString(),
                        Description = reader["description"].ToString(),
                        Url = reader["url"]?.ToString(),
                        ImageBytes = reader["imagebytes"] as byte[],
                        ContentType = reader["contenttype"]?.ToString(),
                        UploadedAt = Convert.ToDateTime(reader["uploadedat"]),
                        CreatedAt = Convert.ToDateTime(reader["createdat"])
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching image");
                return null;
            }
        }

        public async Task<bool> DeleteHandoverImageAsync(string id)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "DELETE FROM handover_images WHERE id = @id";

                using var cmd = new NpgsqlCommand(sql, connection);
                cmd.Parameters.AddWithValue("@id", id);

                var rows = await cmd.ExecuteNonQueryAsync();
                return rows > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete handover image");
                return false;
            }
        }
    }
}