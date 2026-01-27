using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Data;
using System.Text.Json;


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
                Address = reader["address"]?.ToString() ?? string.Empty,
                City = reader["city"]?.ToString() ?? string.Empty,
                Village = reader["village"]?.ToString() ?? string.Empty,
                EventStartDate = reader["eventstartdate"] != DBNull.Value ? Convert.ToDateTime(reader["eventstartdate"]) : DateTime.MinValue,
                EventEndDate = reader["eventenddate"] != DBNull.Value ? Convert.ToDateTime(reader["eventenddate"]) : DateTime.MinValue,
                HandoverStartDate = reader["handoverstartdate"] != DBNull.Value ? Convert.ToDateTime(reader["handoverstartdate"]) : DateTime.MinValue,
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
                Notes = reader["notes"]?.ToString() ?? string.Empty,
                RoomsRequired = reader["roomsrequired"] != DBNull.Value ? Convert.ToBoolean(reader["roomsrequired"]) : false,
                //
                RoomDetails = reader["roomdetails"] != DBNull.Value
                    ? JsonSerializer.Deserialize<RoomsInfo>(
                        reader["roomdetails"].ToString() ?? "{}"
                      ) ?? new RoomsInfo()
                    : new RoomsInfo(),
               RoomsCount = reader["roomscount"] != DBNull.Value ? Convert.ToInt32(reader["roomscount"]) : 0,
                //HallName = reader["hallname"]?.ToString() ?? string.Empty
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Booking entity)
        {
            // Calculate event date as the start date for backward compatibility
            entity.EventDate = entity.EventStartDate.Date;

            var sql = @"INSERT INTO bookings (id, organizationid, hallid, customername, customeremail, customerphone, 
                       address, city, village, eventstartdate, eventenddate,handoverstartdate, eventdate, eventtype, timeslot, 
                       guestcount, totalamount, status, isactive, customerresponse, lastcontactdate, 
                       createdat, updatedat, notes, roomsrequired, roomscount, roomdetails) 
                       VALUES (@id, @organizationid, @hallid, @customername, @customeremail, @customerphone, 
                       @address, @city, @village, @eventstartdate, @eventenddate, @handoverStartDate, @eventdate, @eventtype, @timeslot, 
                       @guestcount, @totalamount, @status, @isactive, @customerresponse, @lastcontactdate, 
                       @createdat, @updatedat, @notes, @roomsrequired, @roomscount, @roomdetails)";

            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId ?? (object)DBNull.Value,
                ["@customername"] = entity.CustomerName ?? (object)DBNull.Value,
                ["@customeremail"] = entity.CustomerEmail ?? (object)DBNull.Value,
                ["@customerphone"] = entity.CustomerPhone ?? (object)DBNull.Value,
                ["@address"] = entity.Address ?? (object)DBNull.Value,
                ["@city"] = entity.City ?? (object)DBNull.Value,
                ["@village"] = entity.Village ?? (object)DBNull.Value,
                ["@eventstartdate"] = entity.EventStartDate,
                ["@eventenddate"] = entity.EventEndDate,
                ["@handoverStartDate"] = entity.HandoverStartDate,
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
                ["@updatedat"] = entity.UpdatedAt,
                ["@notes"] = entity.Notes ?? (object)DBNull.Value,
                ["@roomsrequired"] = entity.RoomsRequired,
                ["@roomscount"] = entity.RoomsCount,
                ["@roomdetails"] = entity.RoomDetails ?? (object)DBNull.Value
            };

            return (sql, parameters, new List<string> { "@roomdetails" });
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Booking entity)
        {
            // Calculate event date as the start date for backward compatibility
            entity.EventDate = entity.EventStartDate.Date;

            var sql = @"UPDATE bookings SET 
                       organizationid = @organizationid, 
                       hallid = @hallid, 
                       customername = @customername, 
                       customeremail = @customeremail, 
                       customerphone = @customerphone, 
                       address = @address,
                       city = @city,
                       village = @village,
                       eventstartdate = @eventstartdate, 
                       eventenddate = @eventenddate, 
                       handoverstartdate = @handoverStartDate,
                       eventtype = @eventtype, 
                       timeslot = @timeslot, 
                       guestcount = @guestcount, 
                       totalamount = @totalamount, 
                       status = @status, 
                       isactive = @isactive, 
                       customerresponse = @customerresponse, 
                       lastcontactdate = @lastcontactdate, 
                       updatedat = @updatedat,
                       notes = @notes,
                       roomsrequired = @roomsrequired,
                       roomscount = @roomscount,
                       roomdetails = @roomdetails
                       WHERE id = @id AND organizationid = @currentOrganizationId";

            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId ?? (object)DBNull.Value,
                ["@customername"] = entity.CustomerName ?? (object)DBNull.Value,
                ["@customeremail"] = entity.CustomerEmail ?? (object)DBNull.Value,
                ["@customerphone"] = entity.CustomerPhone ?? (object)DBNull.Value,
                ["@address"] = entity.Address ?? (object)DBNull.Value,
                ["@city"] = entity.City ?? (object)DBNull.Value,
                ["@village"] = entity.Village ?? (object)DBNull.Value,
                ["@eventstartdate"] = entity.EventStartDate,
                ["@eventenddate"] = entity.EventEndDate,
                ["@handoverStartDate"] = entity.HandoverStartDate,
                //["@eventdate"] = entity.EventDate,
                ["@eventtype"] = entity.EventType ?? (object)DBNull.Value,
                ["@timeslot"] = entity.TimeSlot ?? (object)DBNull.Value,
                ["@guestcount"] = entity.GuestCount,
                ["@totalamount"] = entity.TotalAmount,
                ["@status"] = entity.Status ?? (object)DBNull.Value,
                ["@isactive"] = entity.IsActive,
                ["@customerresponse"] = entity.CustomerResponse ?? (object)DBNull.Value,
                ["@lastcontactdate"] = entity.LastContactDate ?? (object)DBNull.Value,
                ["@updatedat"] = DateTime.UtcNow,
                ["@notes"] = entity.Notes ?? (object)DBNull.Value,
                ["@roomsrequired"] = entity.RoomsRequired,
                ["@roomscount"] = entity.RoomsCount,
                ["@roomdetails"] = entity.RoomDetails ?? (object)DBNull.Value,
                ["@currentOrganizationId"] = GetCurrentOrganizationId()
            };

            return (sql, parameters, new List<string> { "@roomdetails" });
        }

        public async Task<List<Booking>> GetByHallIdAsync(string hallId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM bookings WHERE hallid = @hallId AND organizationid = @organizationId ORDER BY eventstartdate DESC";
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
                var sql = @"SELECT * FROM bookings 
                          WHERE ((eventstartdate >= @startDate AND eventstartdate <= @endDate)
                          OR (eventenddate >= @startDate AND eventenddate <= @endDate)
                          OR (eventstartdate <= @startDate AND eventenddate >= @endDate))
                          AND organizationid = @organizationId 
                          ORDER BY eventstartdate";
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

        // Enhanced UpdateStatusAsync with time slot conflict resolution
        public async Task<bool> UpdateStatusAsync(string id, string status)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var orgId = GetCurrentOrganizationId();

                // First, get the current booking details
                Booking? currentBooking = null;
                string fetchSql = @"SELECT hallid, eventstartdate, eventenddate, handoverstartdate, timeslot, status 
                                  FROM bookings 
                                  WHERE id = @id AND organizationid = @organizationId";

                using (var fetchCmd = new NpgsqlCommand(fetchSql, connection))
                {
                    fetchCmd.Parameters.AddWithValue("@id", id);
                    fetchCmd.Parameters.AddWithValue("@organizationId", orgId);

                    using var reader = await fetchCmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        currentBooking = new Booking
                        {
                            HallId = reader["hallid"].ToString() ?? string.Empty,
                            EventStartDate = Convert.ToDateTime(reader["eventstartdate"]),
                            EventEndDate = Convert.ToDateTime(reader["eventenddate"]),
                            HandoverStartDate = Convert.ToDateTime(reader["handoverstartdate"]),
                            TimeSlot = reader["timeslot"].ToString() ?? string.Empty,
                            Status = reader["status"].ToString() ?? string.Empty
                        };
                    }
                }

                if (currentBooking == null)
                {
                    Console.WriteLine($"[BookingDataService] Booking {id} not found.");
                    return false;
                }

                // If status is being changed to 'confirmed', check for conflicts and handle them
                if (status == "confirmed" && currentBooking.Status != "confirmed")
                {
                    await HandleBookingConflicts(connection, id, orgId, currentBooking);
                }

                // Update the booking status
                string updateSql = @"UPDATE bookings 
                                   SET status = @status, updatedat = @updatedat 
                                   WHERE id = @id AND organizationid = @organizationId";

                using var updateCmd = new NpgsqlCommand(updateSql, connection);
                updateCmd.Parameters.AddWithValue("@id", id);
                updateCmd.Parameters.AddWithValue("@status", status);
                updateCmd.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
                updateCmd.Parameters.AddWithValue("@organizationId", orgId);

                var rowsAffected = await updateCmd.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception error)
            {
                Console.WriteLine($"Error updating booking status: {error.Message}");
                return false;
            }
        }

        // New method to handle booking conflicts intelligently
        private async Task HandleBookingConflicts(NpgsqlConnection connection, string currentBookingId, string orgId, Booking currentBooking)
        {
            try
            {
                // Get all conflicting bookings (excluding the current one)
                string conflictSql = @"
                SELECT id, eventstartdate, eventenddate, timeslot, status, customername
                FROM bookings
                WHERE hallid = @hallId
                  AND organizationid = @organizationId
                  AND id <> @currentId
                  AND status IN ('pending', 'confirmed')
                  AND (
                      -- Multi-day booking overlapping check
                      (eventstartdate <= @currentEndDate AND eventenddate >= @currentStartDate)
                      OR
                      -- Single date booking check
                      (
                          -- Same date range with time slot conflicts
                          eventstartdate = @currentStartDate 
                          AND eventenddate = @currentEndDate
                          AND (
                              @currentTimeSlot = 'fullday' -- Current booking is full day, conflicts with all
                              OR timeslot = 'fullday' -- Other booking is full day, conflicts with all
                              OR (@currentTimeSlot = 'evening' AND timeslot = 'evening') -- Both evening
                              OR (@currentTimeSlot = 'morning' AND timeslot = 'morning') -- Both morning
                              -- Note: 'morning' and 'evening' on same date DON'T conflict
                          )
                      )
                  )";

                using var conflictCmd = new NpgsqlCommand(conflictSql, connection);
                conflictCmd.Parameters.AddWithValue("@hallId", currentBooking.HallId);
                conflictCmd.Parameters.AddWithValue("@organizationId", orgId);
                conflictCmd.Parameters.AddWithValue("@currentId", currentBookingId);
                conflictCmd.Parameters.AddWithValue("@currentStartDate", currentBooking.EventStartDate);
                conflictCmd.Parameters.AddWithValue("@currentEndDate", currentBooking.EventEndDate);
                conflictCmd.Parameters.AddWithValue("@currentTimeSlot", currentBooking.TimeSlot);

                var conflictingBookings = new List<(string Id, DateTime StartDate, DateTime EndDate, string TimeSlot, string Status, string CustomerName)>();

                using (var reader = await conflictCmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        conflictingBookings.Add((
                            reader["id"].ToString() ?? string.Empty,
                            Convert.ToDateTime(reader["eventstartdate"]),
                            Convert.ToDateTime(reader["eventenddate"]),
                            reader["timeslot"].ToString() ?? string.Empty,
                            reader["status"].ToString() ?? string.Empty,
                            reader["customername"].ToString() ?? string.Empty
                        ));
                    }
                }

                if (conflictingBookings.Any())
                {
                    Console.WriteLine($"[BookingDataService] Found {conflictingBookings.Count} conflicting bookings.");

                    // Cancel all conflicting bookings
                    foreach (var conflict in conflictingBookings)
                    {
                        string cancelSql = @"UPDATE bookings 
                                          SET status = 'cancelled', updatedat = @updatedat,
                                          customerresponse = @customerresponse
                                          WHERE id = @id AND organizationid = @organizationId";

                        using var cancelCmd = new NpgsqlCommand(cancelSql, connection);
                        cancelCmd.Parameters.AddWithValue("@id", conflict.Id);
                        cancelCmd.Parameters.AddWithValue("@organizationId", orgId);
                        cancelCmd.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
                        cancelCmd.Parameters.AddWithValue("@customerresponse",
                            $"Auto-cancelled due to conflict with booking for {currentBooking.CustomerName}");

                        await cancelCmd.ExecuteNonQueryAsync();

                        Console.WriteLine($"[BookingDataService] Auto-cancelled booking {conflict.Id} for {conflict.CustomerName}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BookingDataService] Error handling conflicts: {ex.Message}");
            }
        }

        // New method to check availability before creating a booking
        public async Task<(bool IsAvailable, string Message)> CheckAvailabilityAsync(Booking booking)
        {
            try
            {
                using var connection = await GetConnectionAsync();

                string availabilitySql = @"
                SELECT id, timeslot, status, customername
                FROM bookings
                WHERE hallid = @hallId
                  AND organizationid = @organizationId
                  AND status IN ('pending', 'confirmed')
                  AND (
                      -- Multi-day booking overlapping check
                      (eventstartdate <= @eventEndDate AND eventenddate >= @eventStartDate)
                      OR
                      -- Single date booking check
                      (
                          eventstartdate = @eventStartDate 
                          AND eventenddate = @eventEndDate
                          AND (
                              @timeSlot = 'fullday' -- Requested booking is full day
                              OR timeslot = 'fullday' -- Existing booking is full day
                              OR (@timeSlot = 'evening' AND timeslot = 'evening') -- Both evening
                              OR (@timeSlot = 'morning' AND timeslot = 'morning') -- Both morning
                              -- Note: 'morning' and 'evening' on same date DON'T conflict
                          )
                      )
                  )
                ORDER BY eventstartdate";

                using var cmd = new NpgsqlCommand(availabilitySql, connection);
                cmd.Parameters.AddWithValue("@hallId", booking.HallId);
                cmd.Parameters.AddWithValue("@organizationId", booking.OrganizationId);
                cmd.Parameters.AddWithValue("@eventStartDate", booking.EventStartDate);
                cmd.Parameters.AddWithValue("@eventEndDate", booking.EventEndDate);
                cmd.Parameters.AddWithValue("@timeSlot", booking.TimeSlot);

                var conflictingBookings = new List<string>();

                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var timeslot = reader["timeslot"].ToString() ?? string.Empty;
                        var customerName = reader["customername"].ToString() ?? string.Empty;
                        var status = reader["status"].ToString() ?? string.Empty;

                        conflictingBookings.Add($"Booking for {customerName} ({timeslot}, {status})");
                    }
                }

                if (conflictingBookings.Any())
                {
                    return (false, $"Hall is not available. Conflicting bookings: {string.Join(", ", conflictingBookings)}");
                }

                return (true, "Hall is available");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking availability: {ex.Message}");
                return (false, $"Error checking availability: {ex.Message}");
            }
        }

        // Enhanced CreateBookingAsync with availability check
        public async Task<(Booking? Booking, string Message)> CreateBookingWithCheckAsync(Booking booking)
        {
            try
            {
                // Check availability first
                var (isAvailable, message) = await CheckAvailabilityAsync(booking);
                if (!isAvailable)
                {
                    return (null, message);
                }

                // Create the booking
                if (string.IsNullOrEmpty(booking.Id))
                {
                    booking.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                if (booking.CreatedAt == default)
                {
                    booking.CreatedAt = DateTime.UtcNow;
                }

                booking.UpdatedAt = DateTime.UtcNow;
                booking.EventDate = booking.EventStartDate.Date;

                var success = await CreateAsync(booking);
                if (!success)
                {
                    return (null, "Failed to create booking in database.");
                }

                return (booking, "Booking created successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating booking: {ex.Message}");
                return (null, $"Error creating booking: {ex.Message}");
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
                    filteredBookings = filteredBookings.Where(booking => booking.EventStartDate >= filters.StartDate.Value);
                }

                if (filters.EndDate.HasValue)
                {
                    filteredBookings = filteredBookings.Where(booking => booking.EventEndDate <= filters.EndDate.Value);
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

        // Enhanced GetByOrganizationIdAsync to include hall name
        public override async Task<List<Booking>> GetByOrganizationIdAsync(string organizationId)
        {
            using var connection = await GetConnectionAsync();

            var sql = @"
            SELECT
                b.*,
                h.name AS hallname
            FROM bookings b
            LEFT JOIN halls h ON h.id = b.hallid AND h.organizationid = b.organizationid
            WHERE b.organizationid = @organizationId
            ORDER BY b.eventstartdate DESC";

            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", organizationId);

            using var reader = await command.ExecuteReaderAsync();

            var results = new List<Booking>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }

            return results;
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
                        b.Status == "confirmed" && b.EventStartDate.Date >= today),
                    HappeningEvents = allBookings.Count(b =>
                        b.Status == "active" || (b.Status == "confirmed" &&
                        b.EventStartDate.Date <= today && b.EventEndDate.Date >= today)),
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

        // Keep original CreateBookingAsync for backward compatibility
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

                booking.UpdatedAt = DateTime.UtcNow;
                booking.EventDate = booking.EventStartDate.Date;

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
                var sql = @"SELECT b.*, h.name AS hallname 
                          FROM bookings b
                          LEFT JOIN halls h ON h.id = b.hallid AND h.organizationid = b.organizationid
                          WHERE (b.customeremail = @userId OR b.customername LIKE @userName) 
                          AND b.organizationid = @organizationId 
                          ORDER BY b.createdat DESC";
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
                var sql = @"SELECT b.*, h.name AS hallname 
                          FROM bookings b
                          LEFT JOIN halls h ON h.id = b.hallid AND h.organizationid = b.organizationid
                          WHERE DATE(b.eventstartdate) = DATE(@date) 
                          AND b.organizationid = @organizationId 
                          ORDER BY b.eventstartdate";
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

        // New method to get availability for a hall
        public async Task<Dictionary<DateTime, Dictionary<string, bool>>> GetHallAvailabilityAsync(string hallId, DateTime startDate, DateTime endDate)
        {
            var availability = new Dictionary<DateTime, Dictionary<string, bool>>();
            var currentDate = startDate.Date;

            try
            {
                // Get all confirmed/active bookings for this hall in the date range
                var bookings = await GetByHallIdAsync(hallId);
                var relevantBookings = bookings
                    .Where(b => b.EventStartDate.Date <= endDate && b.EventEndDate.Date >= startDate
                               && (b.Status == "confirmed" || b.Status == "active"))
                    .ToList();

                while (currentDate <= endDate)
                {
                    var dateBookings = relevantBookings
                        .Where(b => currentDate >= b.EventStartDate.Date && currentDate <= b.EventEndDate.Date)
                        .ToList();

                    var hasFullDay = dateBookings.Any(b => b.TimeSlot == "fullday");
                    var hasMorning = dateBookings.Any(b => b.TimeSlot == "morning");
                    var hasEvening = dateBookings.Any(b => b.TimeSlot == "evening");

                    availability[currentDate] = new Dictionary<string, bool>
                    {
                        ["fullday"] = !hasFullDay && !hasMorning && !hasEvening,
                        ["morning"] = !hasMorning && !hasFullDay,
                        ["evening"] = !hasEvening && !hasFullDay
                    };

                    currentDate = currentDate.AddDays(1);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting hall availability: {ex.Message}");
            }

            return availability;
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
        Task<(Booking? Booking, string Message)> CreateBookingWithCheckAsync(Booking booking);
        Task<List<Booking>> GetByUserAsync(string userId);
        Task<List<Booking>> GetByDateAsync(DateTime date);
        Task<(bool IsAvailable, string Message)> CheckAvailabilityAsync(Booking booking);
        Task<Dictionary<DateTime, Dictionary<string, bool>>> GetHallAvailabilityAsync(string hallId, DateTime startDate, DateTime endDate);
    }
   

    // Add this class for statistics
    public class BookingStatistics
    {
        public int NewLeads { get; set; }
        public int RejectedLeads { get; set; }
        public int ConfirmedLeads { get; set; }
        public int UpcomingEvents { get; set; }
        public int HappeningEvents { get; set; }
        public int TotalBookings { get; set; }
        public decimal TotalRevenue { get; set; }
    }
}