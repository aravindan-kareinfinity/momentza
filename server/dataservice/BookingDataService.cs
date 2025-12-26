using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;

namespace Momantza.Services
{
    public class BookingDataService : BaseDataService<Booking>, IBookingDataService
    {
        public BookingDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor, "bookings")
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
                IsActive = reader["isactive"] != DBNull.Value ? Convert.ToBoolean(reader["isactive"]) : true,
                CustomerResponse = reader["customerresponse"]?.ToString() ?? string.Empty,
                LastContactDate = reader["lastcontactdate"] != DBNull.Value ? Convert.ToDateTime(reader["lastcontactdate"]) : null,
                CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.Now,
                UpdatedAt = reader["updatedat"] != DBNull.Value ? Convert.ToDateTime(reader["updatedat"]) : DateTime.Now,
                //HallName = reader["hallname"].ToString() ?? string.Empty
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Booking entity)
        {
            // REMOVE handoverdetails from SQL
            var sql = @"INSERT INTO bookings (id, organizationid, hallid, customername, customeremail, customerphone, eventdate, eventtype, timeslot, guestcount, totalamount, status, isactive, customerresponse, lastcontactdate, createdat, updatedat) 
                       VALUES (@id, @organizationid, @hallid, @customername, @customeremail, @customerphone, @eventdate, @eventtype, @timeslot, @guestcount, @totalamount, @status, @isactive, @customerresponse, @lastcontactdate, @createdat, @updatedat)";

            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId ?? (object)DBNull.Value,
                ["@customername"] = entity.CustomerName ?? (object)DBNull.Value,
                ["@customeremail"] = entity.CustomerEmail ?? (object)DBNull.Value,
                ["@customerphone"] = entity.CustomerPhone ?? (object)DBNull.Value,
                ["@eventdate"] = entity.EventDate,
                ["@eventtype"] = entity.EventType ?? (object)DBNull.Value,
                ["@timeslot"] = entity.TimeSlot ?? (object)DBNull.Value,
                ["@guestcount"] = entity.GuestCount,
                ["@totalamount"] = entity.TotalAmount,
                ["@status"] = entity.Status ?? (object)DBNull.Value,
                ["@isactive"] = entity.IsActive,
                ["@customerresponse"] = entity.CustomerResponse ?? (object)DBNull.Value,
                ["@lastcontactdate"] = entity.LastContactDate ?? (object)DBNull.Value,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };

            // REMOVE jsonFields for handoverdetails
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Booking entity)
        {
            // REMOVE handoverdetails from SQL and add organization filter
            var sql = @"UPDATE bookings SET 
                       organizationid = @organizationid, 
                       hallid = @hallid, 
                       customername = @customername, 
                       customeremail = @customeremail, 
                       customerphone = @customerphone, 
                       eventdate = @eventdate, 
                       eventtype = @eventtype, 
                       timeslot = @timeslot, 
                       guestcount = @guestcount, 
                       totalamount = @totalamount, 
                       status = @status, 
                       isactive = @isactive, 
                       customerresponse = @customerresponse, 
                       lastcontactdate = @lastcontactdate, 
                       updatedat = @updatedat 
                       WHERE id = @id AND organizationid = @currentOrganizationId";

            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId ?? (object)DBNull.Value,
                ["@customername"] = entity.CustomerName ?? (object)DBNull.Value,
                ["@customeremail"] = entity.CustomerEmail ?? (object)DBNull.Value,
                ["@customerphone"] = entity.CustomerPhone ?? (object)DBNull.Value,
                ["@eventdate"] = entity.EventDate,
                ["@eventtype"] = entity.EventType ?? (object)DBNull.Value,
                ["@timeslot"] = entity.TimeSlot ?? (object)DBNull.Value,
                ["@guestcount"] = entity.GuestCount,
                ["@totalamount"] = entity.TotalAmount,
                ["@status"] = entity.Status ?? (object)DBNull.Value,
                ["@isactive"] = entity.IsActive,
                ["@customerresponse"] = entity.CustomerResponse ?? (object)DBNull.Value,
                ["@lastcontactdate"] = entity.LastContactDate ?? (object)DBNull.Value,
                ["@updatedat"] = DateTime.UtcNow,
                ["@currentOrganizationId"] = GetCurrentOrganizationId()
            };

            // REMOVE jsonFields for handoverdetails
            return (sql, parameters, new List<string>());
        }

        // FIX: Update table name from "booking" to "bookings" in all queries
        public async Task<List<Booking>> GetByHallIdAsync(string hallId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM bookings WHERE hallid = @hallId AND organizationid = @organizationId ORDER BY eventdate DESC";
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
                var sql = "SELECT * FROM bookings WHERE status = @status AND organizationid = @organizationId ORDER BY createdat DESC";
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
                var sql = "SELECT * FROM bookings WHERE eventdate >= @startDate AND eventdate <= @endDate AND organizationid = @organizationId ORDER BY eventdate";
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

        //public async Task<bool> UpdateStatusAsync(string id, string status)
        //{
        //    try
        //    {
        //        using var connection = await GetConnectionAsync();

        //        var orgId = GetCurrentOrganizationId();
        //        string sql;
        //        if (string.IsNullOrEmpty(orgId))
        //        {
        //            // No org context — update by id only (defensive)
        //            sql = "UPDATE bookings SET status = @status, updatedat = @updatedat WHERE id = @id";
        //        }
        //        else
        //        {
        //            // Normal path: ensure organization match
        //            sql = "UPDATE bookings SET status = @status, updatedat = @updatedat WHERE id = @id AND organizationid = @organizationId";
        //        }

        //        using var command = new NpgsqlCommand(sql, connection);
        //        command.Parameters.AddWithValue("@id", id);
        //        command.Parameters.AddWithValue("@status", status);
        //        command.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);

        //        if (!string.IsNullOrEmpty(orgId))
        //        {
        //            command.Parameters.AddWithValue("@organizationId", orgId);
        //        }

        //        var rowsAffected = await command.ExecuteNonQueryAsync();
        //        return rowsAffected > 0;
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine($"Error updating booking status: {ex.Message}");
        //        return false;
        //    }
        //}

        public async Task<bool> UpdateStatusAsync(string id, string status)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var orgId = GetCurrentOrganizationId();

                string fetchsql;

                Booking? currentBooking = null;
                fetchsql = "SELECT hallid, eventdate, timeslot FROM bookings WHERE id = @id AND organizationid = @organizationId";

                using (var fetchcmd = new NpgsqlCommand(fetchsql, connection))
                {
                    fetchcmd.Parameters.AddWithValue("@id", id);
                    fetchcmd.Parameters.AddWithValue("@organizationId", orgId);

                    using var reader = await fetchcmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        currentBooking = new Booking
                        {
                            HallId = reader["hallid"].ToString() ?? string.Empty,
                            EventDate = Convert.ToDateTime(reader["eventdate"]),
                            TimeSlot = reader["timeslot"].ToString() ?? string.Empty
                        };
                    }
                }

                if (status == "confirmed" && currentBooking != null)
                {
                    var cancelsql = @"
                UPDATE bookings
                SET status = 'cancelled', updatedat = @updatedat
                WHERE hallid = @hallId
                  AND eventdate = @eventDate
                  AND timeslot = @timeSlot
                  AND id <> @id
                  AND organizationid = @organizationId
                  AND status IN ('pending', 'confirmed')";
                    using var cancelcmd = new NpgsqlCommand(cancelsql, connection);
                    cancelcmd.Parameters.AddWithValue("@hallId", currentBooking.HallId);
                    cancelcmd.Parameters.AddWithValue("@eventDate", currentBooking.EventDate);
                    cancelcmd.Parameters.AddWithValue("@timeSlot", currentBooking.TimeSlot);
                    cancelcmd.Parameters.AddWithValue("@id", id);
                    cancelcmd.Parameters.AddWithValue("@organizationId", orgId);
                    cancelcmd.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
                    var cancelledCount = await cancelcmd.ExecuteNonQueryAsync();
                    Console.WriteLine($"[BookingDataService] Auto-cancelled {cancelledCount} conflicting bookings.");
                }

                string sql = "UPDATE bookings SET status = @status, updatedat = @updatedat WHERE id = @id AND organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@status", status);
                command.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
                command.Parameters.AddWithValue("@organizationId", orgId);

                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;

            }
            catch (Exception error)
            {
                Console.WriteLine($"Error updating booking status: {error.Message}");
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

        //Fetch hall names
        //public override async Task<List<Booking>> GetByOrganizationIdAsync(string organizationId)
        //{
        //    using var connection = await GetConnectionAsync();

        //    var sql = @"
        //SELECT
        //    b.*,
        //    h.name AS hallname
        //FROM bookings b
        //LEFT JOIN halls h ON h.id = b.hallid
        //WHERE b.organizationid = @organizationId
        //ORDER BY b.createdat DESC";

        //    using var command = new NpgsqlCommand(sql, connection);
        //    command.Parameters.AddWithValue("@organizationId", organizationId);

        //    using var reader = await command.ExecuteReaderAsync();

        //    var results = new List<Booking>();
        //    while (await reader.ReadAsync())
        //    {
        //        results.Add(MapFromReader(reader));
        //    }

        //    return results;
        //}


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
                    booking.CreatedAt = DateTime.Now;
                }

                booking.UpdatedAt = DateTime.Now;

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

        public async Task<List<Booking>> GetByUserAsync(string userId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM bookings WHERE (customeremail = @userId OR customername LIKE @userName) AND organizationid = @organizationId ORDER BY createdat DESC";
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
                var sql = "SELECT * FROM bookings WHERE DATE(eventdate) = DATE(@date) AND organizationid = @organizationId ORDER BY eventdate";
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
        Task<List<Booking>> GetByUserAsync(string userId);
        Task<List<Booking>> GetByDateAsync(DateTime date);
    }
}