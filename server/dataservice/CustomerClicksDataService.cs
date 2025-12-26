using Npgsql;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Momantza.Models;

namespace Momantza.Services
{
    public class CustomerClicksDataService : BaseDataService<CustomerClick>, ICustomerClicksDataService
    {
        public CustomerClicksDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
        }

        protected override CustomerClick MapFromReader(NpgsqlDataReader reader)
        {
            return new CustomerClick
            {
                Id = reader["id"].ToString() ?? string.Empty,
                CustomerId = reader["customerid"].ToString() ?? string.Empty,
                HallId = reader["hallid"].ToString() ?? string.Empty,
                CustomerName = reader["customername"].ToString() ?? string.Empty,
                CustomerEmail = reader["customeremail"].ToString() ?? string.Empty,
                CustomerPhone = reader["customerphone"].ToString() ?? string.Empty,
                EventDate = reader["eventdate"] != DBNull.Value ? Convert.ToDateTime(reader["eventdate"]) : DateTime.UtcNow,
                EventType = reader["eventtype"].ToString() ?? string.Empty,
                GuestCount = Convert.ToInt32(reader["guestcount"]),
                Message = reader["message"].ToString() ?? string.Empty,
                Timestamp = reader["timestamp"] != DBNull.Value ? Convert.ToDateTime(reader["timestamp"]) : DateTime.UtcNow,
                Rating = reader["rating"] != DBNull.Value ? Convert.ToInt32(reader["rating"]) : null,
                ImageBytes = reader["imagebytes"] != DBNull.Value ? (byte[])reader["imagebytes"] : null,
                ContentType = reader["contenttype"]?.ToString(),
                CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.UtcNow
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(CustomerClick entity)
        {
            var sql = @"INSERT INTO customerclick (id, customerid, hallid, customername, customeremail, customerphone, eventdate, eventtype, guestcount, message, timestamp, rating, organizationid, imagebytes, contenttype, createdat) VALUES (@id, @customerid, @hallid, @customername, @customeremail, @customerphone, @eventdate, @eventtype, @guestcount, @message, @timestamp, @rating, @organizationid, @imagebytes, @contenttype, @createdat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@customerid"] = entity.CustomerId,
                ["@hallid"] = entity.HallId,
                ["@customername"] = entity.CustomerName,
                ["@customeremail"] = entity.CustomerEmail,
                ["@customerphone"] = entity.CustomerPhone,
                ["@eventdate"] = entity.EventDate,
                ["@eventtype"] = entity.EventType,
                ["@guestcount"] = entity.GuestCount,
                ["@message"] = entity.Message,
                ["@timestamp"] = entity.Timestamp,
                ["@rating"] = entity.Rating,
                ["@organizationid"] = entity.OrganizationId,
                ["@imagebytes"] = entity.ImageBytes,
                ["@contenttype"] = entity.ContentType,
                ["@createdat"] = entity.CreatedAt
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(CustomerClick entity)
        {
            var sql = @"UPDATE customerclick SET customerid = @customerid, hallid = @hallid, customername = @customername, customeremail = @customeremail, customerphone = @customerphone, eventdate = @eventdate, eventtype = @eventtype, guestcount = @guestcount, message = @message, timestamp = @timestamp, rating = @rating, organizationid = @organizationid, imagebytes = @imagebytes, contenttype = @contenttype, createdat = @createdat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@customerid"] = entity.CustomerId,
                ["@hallid"] = entity.HallId,
                ["@customername"] = entity.CustomerName,
                ["@customeremail"] = entity.CustomerEmail,
                ["@customerphone"] = entity.CustomerPhone,
                ["@eventdate"] = entity.EventDate,
                ["@eventtype"] = entity.EventType,
                ["@guestcount"] = entity.GuestCount,
                ["@message"] = entity.Message,
                ["@timestamp"] = entity.Timestamp,
                ["@rating"] = entity.Rating,
                ["@organizationid"] = entity.OrganizationId,
                ["@imagebytes"] = entity.ImageBytes,
                ["@contenttype"] = entity.ContentType,
                ["@createdat"] = entity.CreatedAt
            };
            return (sql, parameters, new List<string>());
        }

        public override async Task<List<CustomerClick>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM customerclick WHERE organizationid = @organizationId ORDER BY createdat DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<CustomerClick>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<CustomerClick?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM customerclick WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<List<CustomerClick>> GetByHallIdAsync(string hallId)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM customerclick WHERE hallid = @hallId AND organizationid = @organizationId ORDER BY date DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@hallId", hallId);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<CustomerClick>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public async Task<CustomerClick> CreateCustomerClickAsync(CustomerClick click)
        {
            try
            {
                if (string.IsNullOrEmpty(click.Id))
                {
                    click.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                var success = await CreateAsync(click);
                if (!success) throw new Exception("Failed to create customer click");

                return click;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating customer click: {ex.Message}");
                throw;
            }
        }

        public async Task<CustomerClick> UpdateCustomerClickAsync(string id, CustomerClickUpdateDto updates)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("Customer click not found");

                // Update only the provided fields
                if (updates.EventDate.HasValue)
                    existing.EventDate = updates.EventDate.Value;

                if (!string.IsNullOrEmpty(updates.EventType))
                    existing.EventType = updates.EventType;

                if (!string.IsNullOrEmpty(updates.Message))
                    existing.Message = updates.Message;

                if (updates.GuestCount.HasValue)
                    existing.GuestCount = updates.GuestCount.Value;

                if (updates.Rating.HasValue)
                    existing.Rating = updates.Rating;

                if (!string.IsNullOrEmpty(updates.HallId))
                    existing.HallId = updates.HallId;

                if (!string.IsNullOrEmpty(updates.BoyName))
                    existing.BoyName = updates.BoyName;

                if (!string.IsNullOrEmpty(updates.GirlName))
                    existing.GirlName = updates.GirlName;

                // Update image ONLY if user uploads new one
                if (!string.IsNullOrEmpty(updates.ImageBase64))
                {
                    existing.ImageBytes = Convert.FromBase64String(updates.ImageBase64);
                    existing.ContentType = "image/jpeg";
                }

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update customer click");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating customer click: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteCustomerClickAsync(string id)
        {
            return await DeleteAsync(id);
        }

        public async Task<List<CustomerClick>> GetByOrganizationAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM customerclick WHERE organizationid = @organizationId ORDER BY createdat DESC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<CustomerClick>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting customer clicks by organization: {ex.Message}");
                return new List<CustomerClick>();
            }
        }

        public async Task<object> GetStatisticsAsync(string? organizationId = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT COUNT(*) as total, AVG(rating) as averageRating FROM customerclick WHERE 1=1";
                var parameters = new List<NpgsqlParameter>();

                if (!string.IsNullOrEmpty(organizationId))
                {
                    sql += " AND organizationid = @organizationId";
                    parameters.Add(new NpgsqlParameter("@organizationId", organizationId));
                }

                if (startDate.HasValue)
                {
                    sql += " AND createdat >= @startDate";
                    parameters.Add(new NpgsqlParameter("@startDate", startDate.Value));
                }

                if (endDate.HasValue)
                {
                    sql += " AND createdat <= @endDate";
                    parameters.Add(new NpgsqlParameter("@endDate", endDate.Value));
                }

                using var command = new NpgsqlCommand(sql, connection);
                foreach (var param in parameters)
                {
                    command.Parameters.Add(param);
                }
                
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        TotalClicks = Convert.ToInt32(reader["total"]),
                        AverageRating = reader["averageRating"] != DBNull.Value ? Convert.ToDouble(reader["averageRating"]) : 0.0
                    };
                }

                return new { TotalClicks = 0, AverageRating = 0.0 };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting customer click statistics: {ex.Message}");
                return new { TotalClicks = 0, AverageRating = 0.0 };
            }
        }

        public async Task<CustomerClick> UploadCustomerClickAsync(string organizationId, IFormFile file, string customerName, 
            string customerEmail, string customerPhone, DateTime? eventDate, string eventType, int? guestCount, string message, int? rating = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    throw new ArgumentException("No file provided");
                }

                // Validate file type (optional - you can customize this)
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    throw new ArgumentException("Invalid file type. Allowed types: jpg, jpeg, png, gif, pdf, doc, docx");
                }

                // Read file bytes
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                // Generate unique ID
                var id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();

                // Create customer click record
                var customerClick = new CustomerClick
                {
                    Id = id,
                    CustomerId = Guid.NewGuid().ToString(), // Generate a unique customer ID
                    HallId = string.Empty, // This can be set based on your business logic
                    CustomerName = customerName,
                    CustomerEmail = customerEmail,
                    CustomerPhone = customerPhone,
                    EventDate = eventDate.Value,
                    EventType = eventType,
                    GuestCount = guestCount.Value,
                    Message = message,
                    Timestamp = DateTime.UtcNow,
                    Rating = rating,
                    OrganizationId = organizationId,
                    ImageBytes = fileBytes, // Store the uploaded file bytes
                    ContentType = file.ContentType, // Store the content type
                    CreatedAt = DateTime.UtcNow
                };

                // Save to database
                var success = await CreateAsync(customerClick);
                if (!success)
                {
                    throw new Exception("Failed to save customer click record");
                }

                // You might want to save the file to a file system or cloud storage here
                // For now, we'll just return the customer click record
                // In a real implementation, you might want to store the file path or reference

                return customerClick;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading customer click: {ex.Message}");
                throw;
            }
        }

        public async Task<CustomerClick?> GetCustomerClickWithImageAsync(string id)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM customerclick WHERE id = @id AND organizationid = @organizationId";
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
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting customer click with image: {ex.Message}");
                return null;
            }
        }
    }

    public interface ICustomerClicksDataService : IBaseDataService<CustomerClick>
    {
        Task<List<CustomerClick>> GetByHallIdAsync(string hallId);
        Task<CustomerClick> CreateCustomerClickAsync(CustomerClick click);
        //Task<CustomerClick> UpdateCustomerClickAsync(string id, CustomerClick updates);
        Task<CustomerClick> UpdateCustomerClickAsync(string id,CustomerClickUpdateDto updates);
        Task<bool> DeleteCustomerClickAsync(string id);
        Task<List<CustomerClick>> GetByOrganizationAsync(string organizationId);
        Task<object> GetStatisticsAsync(string? organizationId = null, DateTime? startDate = null, DateTime? endDate = null);
        Task<CustomerClick> UploadCustomerClickAsync(string organizationId, IFormFile file, string customerName, string customerEmail,
            string customerPhone, DateTime? eventDate, string eventType, int? guestCount, string message, int? rating = null);
        Task<CustomerClick?> GetCustomerClickWithImageAsync(string id);
    }
} 