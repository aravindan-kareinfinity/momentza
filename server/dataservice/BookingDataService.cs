using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;

namespace Momantza.Services
{
    public class BookingDataService : BaseDataService<Booking>, IBookingDataService
    {
        public BookingDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor,"bookings")
        {
        }

        protected override Booking MapFromReader(NpgsqlDataReader reader)
        {
            return new Booking
            {
                Id = reader["id"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                HallId = reader["hallid"].ToString() ?? string.Empty,
                CustomerName = reader["customername"].ToString() ?? string.Empty,
                CustomerEmail = reader["customeremail"].ToString() ?? string.Empty,
                CustomerPhone = reader["customerphone"].ToString() ?? string.Empty,
                EventDate = reader["eventdate"] != DBNull.Value ? Convert.ToDateTime(reader["eventdate"]) : DateTime.MinValue,
                EventType = reader["eventtype"].ToString() ?? string.Empty,
                TimeSlot = reader["timeslot"].ToString() ?? string.Empty,
                GuestCount = Convert.ToInt32(reader["guestcount"]),
                TotalAmount = Convert.ToDecimal(reader["totalamount"]),
                Status = reader["status"].ToString() ?? string.Empty,
                LastContactDate = reader["lastcontactdate"] != DBNull.Value ? Convert.ToDateTime(reader["lastcontactdate"]) : null,
                CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.UtcNow
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Booking entity)
        {
            var sql = @"INSERT INTO bookings (id, organizationid, hallid, customername, customeremail, customerphone, eventdate, eventtype, timeslot, guestcount, totalamount, status, isactive, customerresponse, lastcontactdate, handoverdetails, createdat, updatedat) VALUES (@id, @organizationid, @hallid, @customername, @customeremail, @customerphone, @eventdate, @eventtype, @timeslot, @guestcount, @totalamount, @status, @isactive, @customerresponse, @lastcontactdate, @handoverdetails, @createdat, @updatedat)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId,
                ["@customername"] = entity.CustomerName,
                ["@customeremail"] = entity.CustomerEmail,
                ["@customerphone"] = entity.CustomerPhone,
                ["@eventdate"] = entity.EventDate,
                ["@eventtype"] = entity.EventType,
                ["@timeslot"] = entity.TimeSlot,
                ["@guestcount"] = entity.GuestCount,
                ["@totalamount"] = entity.TotalAmount,
                ["@status"] = entity.Status,
                ["@isactive"] = entity.IsActive,
                ["@customerresponse"] = entity.CustomerResponse,
                ["@lastcontactdate"] = entity.LastContactDate,
                ["@handoverdetails"] = entity.HandOverDetails,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            var jsonFields = new List<string> { "@handoverdetails" };
            return (sql, parameters, jsonFields);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Booking entity)
        {
            var sql = @"UPDATE bookings SET organizationid = @organizationid, hallid = @hallid, customername = @customername, customeremail = @customeremail, customerphone = @customerphone, eventdate = @eventdate, eventtype = @eventtype, timeslot = @timeslot, guestcount = @guestcount, totalamount = @totalamount, status = @status, isactive = @isactive, customerresponse = @customerresponse, lastcontactdate = @lastcontactdate, handoverdetails = @handoverdetails, updatedat = @updatedat WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId,
                ["@customername"] = entity.CustomerName,
                ["@customeremail"] = entity.CustomerEmail,
                ["@customerphone"] = entity.CustomerPhone,
                ["@eventdate"] = entity.EventDate,
                ["@eventtype"] = entity.EventType,
                ["@timeslot"] = entity.TimeSlot,
                ["@guestcount"] = entity.GuestCount,
                ["@totalamount"] = entity.TotalAmount,
                ["@status"] = entity.Status,
                ["@isactive"] = entity.IsActive,
                ["@customerresponse"] = entity.CustomerResponse,
                ["@lastcontactdate"] = entity.LastContactDate,
                ["@handoverdetails"] = entity.HandOverDetails,
                ["@updatedat"] = entity.UpdatedAt
            };
            var jsonFields = new List<string> { "@handoverdetails" };
            return (sql, parameters, jsonFields);
        }

        public async Task<List<Booking>> GetByHallIdAsync(string hallId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM booking WHERE hallid = @hallId AND organizationid = @organizationId ORDER BY eventdate DESC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@hallId", hallId);
                command.Parameters.AddWithValue("@organizationId", GetCurrentOrganizationId());
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Booking>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting bookings by hall id: {ex.Message}");
                return new List<Booking>();
            }
        }

        public async Task<List<Booking>> GetByStatusAsync(string status)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM booking WHERE status = @status AND organizationid = @organizationId ORDER BY createdat DESC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@status", status);
                command.Parameters.AddWithValue("@organizationId", GetCurrentOrganizationId());
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Booking>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting bookings by status: {ex.Message}");
                return new List<Booking>();
            }
        }

        public async Task<List<Booking>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM booking WHERE eventdate >= @startDate AND eventdate <= @endDate AND organizationid = @organizationId ORDER BY eventdate";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@startDate", startDate);
                command.Parameters.AddWithValue("@endDate", endDate);
                command.Parameters.AddWithValue("@organizationId", GetCurrentOrganizationId());
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Booking>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting bookings by date range: {ex.Message}");
                return new List<Booking>();
            }
        }

        public async Task<bool> UpdateStatusAsync(string id, string status)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "UPDATE booking SET status = @status WHERE id = @id AND organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@status", status);
                command.Parameters.AddWithValue("@organizationId", GetCurrentOrganizationId());
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating booking status: {ex.Message}");
                return false;
            }
        }

        public async Task<List<Booking>> GetBookingsByOrganizationAsync(string organizationId)
        {
            return await GetByOrganizationIdAsync(organizationId);
        }

        public async Task<List<Booking>> SearchBookingsAsync(string organizationId, BookingFilters filters)
        {
            try
            {
                var allBookings = await GetByOrganizationIdAsync(organizationId);
                var filteredBookings = allBookings.AsEnumerable();

                if (filters.StartDate.HasValue)
                {
                    filteredBookings = filteredBookings.Where(booking => booking.EventDate >= filters.StartDate.Value);
                }

                if (filters.EndDate.HasValue)
                {
                    filteredBookings = filteredBookings.Where(booking => booking.EventDate <= filters.EndDate.Value);
                }

                if (!string.IsNullOrEmpty(filters.Status) && filters.Status != "all")
                {
                    filteredBookings = filteredBookings.Where(booking => booking.Status == filters.Status);
                }

                if (!string.IsNullOrEmpty(filters.CustomerName))
                {
                    filteredBookings = filteredBookings.Where(booking => 
                        booking.CustomerName.ToLower().Contains(filters.CustomerName.ToLower()));
                }

                if (!string.IsNullOrEmpty(filters.EventType))
                {
                    filteredBookings = filteredBookings.Where(booking => 
                        booking.EventType.ToLower().Contains(filters.EventType.ToLower()));
                }

                if (!string.IsNullOrEmpty(filters.HallId))
                {
                    filteredBookings = filteredBookings.Where(booking => booking.HallId == filters.HallId);
                }

                return filteredBookings.ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error searching bookings: {ex.Message}");
                return new List<Booking>();
            }
        }

        public async Task<BookingStatistics> GetBookingStatisticsAsync(string organizationId)
        {
            try
            {
                var allBookings = await GetByOrganizationIdAsync(organizationId);
                var today = DateTime.Today;
                
                return new BookingStatistics
                {
                    NewLeads = allBookings.Count(b => b.Status == "pending"),
                    RejectedLeads = allBookings.Count(b => b.Status == "cancelled"),
                    ConfirmedLeads = allBookings.Count(b => b.Status == "confirmed"),
                    UpcomingEvents = allBookings.Count(b => 
                        b.Status == "confirmed" && b.EventDate.Date >= today),
                    HappeningEvents = allBookings.Count(b => 
                        b.Status == "active" || (b.Status == "confirmed" && b.EventDate.Date == today)),
                    TotalBookings = allBookings.Count,
                    TotalRevenue = allBookings
                        .Where(b => b.Status != "cancelled")
                        .Sum(b => b.TotalAmount)
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting booking statistics: {ex.Message}");
                return new BookingStatistics();
            }
        }

        public async Task<Booking> CreateBookingAsync(Booking booking)
        {
            try
            {
                if (string.IsNullOrEmpty(booking.Id))
                {
                    booking.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                if (booking.CreatedAt == default)
                {
                    booking.CreatedAt = DateTime.UtcNow;
                }

                var success = await CreateAsync(booking);
                if (!success) throw new Exception("Failed to create booking");

                return booking;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating booking: {ex.Message}");
                throw;
            }
        }

        public async Task<Booking> RecordHandOverAsync(string id, HandOverDetails handOverDetails)
        {
            try
            {
                var booking = await GetByIdAsync(id);
                if (booking == null)
                    throw new Exception("Booking not found");

                // Update booking with handover details and status
                booking.Status = "active";
                // Note: You might need to add HandOverDetails property to Booking model
                // booking.HandOverDetails = handOverDetails;

                var success = await UpdateAsync(booking);
                if (!success) throw new Exception("Failed to update booking");

                return booking;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error recording handover: {ex.Message}");
                throw;
            }
        }

        public async Task<List<Booking>> GetByUserAsync(string userId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM bookings WHERE customeremail = @userId OR customername LIKE @userName AND organizationid = @organizationId ORDER BY createdat DESC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@userId", userId);
                command.Parameters.AddWithValue("@userName", $"%{userId}%");
                command.Parameters.AddWithValue("@organizationId", GetCurrentOrganizationId());
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Booking>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting bookings by user: {ex.Message}");
                return new List<Booking>();
            }
        }

        public async Task<List<Booking>> GetByDateAsync(DateTime date)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM booking WHERE DATE(eventdate) = DATE(@date) AND organizationid = @organizationId ORDER BY eventdate";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@date", date);
                command.Parameters.AddWithValue("@organizationId", GetCurrentOrganizationId());
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Booking>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting bookings by date: {ex.Message}");
                return new List<Booking>();
            }
        }
    }

    public interface IBookingDataService : IBaseDataService<Booking>
    {
        Task<List<Booking>> GetByHallIdAsync(string hallId);
        Task<List<Booking>> GetByStatusAsync(string status);
        Task<List<Booking>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<bool> UpdateStatusAsync(string id, string status);
        Task<List<Booking>> GetBookingsByOrganizationAsync(string organizationId);
        Task<List<Booking>> SearchBookingsAsync(string organizationId, BookingFilters filters);
        Task<BookingStatistics> GetBookingStatisticsAsync(string organizationId);
        Task<Booking> CreateBookingAsync(Booking booking);
        Task<Booking> RecordHandOverAsync(string id, HandOverDetails handOverDetails);
        Task<List<Booking>> GetByUserAsync(string userId);
        Task<List<Booking>> GetByDateAsync(DateTime date);
    }
} 