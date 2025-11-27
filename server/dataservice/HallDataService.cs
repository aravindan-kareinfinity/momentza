using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Momantza.Middleware;

namespace Momantza.Services
{
    public class HallDataService : BaseDataService<Hall>, IHallDataService
    {
        private readonly IBookingDataService _bookingDataService;

        public HallDataService(IConfiguration configuration, IBookingDataService bookingDataService, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
            _bookingDataService = bookingDataService;
        }

        protected override Hall MapFromReader(NpgsqlDataReader reader)
        {
            return new Hall
            {
                Id = reader["id"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                Name = reader["name"].ToString() ?? string.Empty,
                Capacity = Convert.ToInt32(reader["capacity"]),
                Location = reader["location"].ToString() ?? string.Empty,
                Address = reader["address"].ToString() ?? string.Empty,
                Features = reader["features"] != DBNull.Value
                    ? JsonSerializer.Deserialize<List<HallFeature>>(reader["features"].ToString() ?? "[]") ?? new List<HallFeature>()
                    : new List<HallFeature>(),
                RateCard = reader["ratecard"] != DBNull.Value
                    ? JsonSerializer.Deserialize<RateCard>(reader["ratecard"].ToString() ?? "{}") ?? new RateCard()
                    : new RateCard(),
                Gallery = reader["gallery"] != DBNull.Value
                    ? JsonSerializer.Deserialize<List<string>>(reader["gallery"].ToString() ?? "[]") ?? new List<string>()
                    : new List<string>(),
                IsActive = Convert.ToBoolean(reader["isactive"])
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Hall entity)
        {
            var sql = @"
                INSERT INTO halls (id, organizationid, name, capacity, location, address, features, ratecard, gallery, isactive)
                VALUES (@id, @organizationid, @name, @capacity, @location, @address, @features, @ratecard, @gallery, @isactive)";

            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@name"] = entity.Name,
                ["@capacity"] = entity.Capacity,
                ["@location"] = entity.Location,
                ["@address"] = entity.Address,
                ["@features"] = entity.Features,
                ["@ratecard"] = entity.RateCard,
                ["@gallery"] = entity.Gallery,
                ["@isactive"] = entity.IsActive
            };

            var jsonFields = new List<string> { "@features", "@ratecard", "@gallery" };

            return (sql, parameters, jsonFields);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Hall entity)
        {
            var sql = @"
                UPDATE halls 
                SET organizationid = @organizationid, name = @name, capacity = @capacity, 
                    location = @location, address = @address, features = @features, 
                    ratecard = @ratecard, gallery = @gallery, isactive = @isactive
                WHERE id = @id";

            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@name"] = entity.Name,
                ["@capacity"] = entity.Capacity,
                ["@location"] = entity.Location,
                ["@address"] = entity.Address,
                ["@features"] = entity.Features,
                ["@ratecard"] = entity.RateCard,
                ["@gallery"] = entity.Gallery,
                ["@isactive"] = entity.IsActive
            };

            var jsonFields = new List<string> { "@features", "@ratecard", "@gallery" };

            return (sql, parameters, jsonFields);
        }

        public override async Task<List<Hall>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM halls WHERE organizationid = @organizationId AND isactive = true";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Hall>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<List<Hall>> GetAllAsyncs()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM halls WHERE isactive = true";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Hall>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<Hall?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM halls WHERE id = @id";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@id", id);
            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapFromReader(reader);
            }
            return null;
        }

        public async Task<List<Hall>> GetActiveHallsAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM halls WHERE isactive = true";
                using var command = new NpgsqlCommand(sql, connection);

                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Hall>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting active halls: {ex.Message}");
                return new List<Hall>();
            }
        }

        public async Task<List<Hall>> GetByCapacityRangeAsync(int minCapacity, int maxCapacity)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM halls WHERE capacity >= @minCapacity AND capacity <= @maxCapacity AND isactive = true";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@minCapacity", minCapacity);
                command.Parameters.AddWithValue("@maxCapacity", maxCapacity);

                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Hall>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting halls by capacity range: {ex.Message}");
                return new List<Hall>();
            }
        }

        public async Task<List<Hall>> GetAllHallsAsync()
        {
            return await GetAllAsync();
        }

        public async Task<List<Hall>> GetHallsByOrganizationAsync(string organizationId)
        {
            return await GetByOrganizationIdAsync(organizationId);
        }

        public async Task<List<Hall>> GetAccessibleHallsAsync(string organizationId, List<string> accessibleHallIds)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM halls WHERE organizationid = @organizationId AND id = ANY(@hallIds)";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                command.Parameters.AddWithValue("@hallIds", accessibleHallIds.ToArray());

                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Hall>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting accessible halls: {ex.Message}");
                return new List<Hall>();
            }
        }

        public async Task<Hall?> GetHallByIdAsync(string id)
        {
            return await GetByIdAsync(id);
        }

        public async Task<List<TimeSlot>> GetAvailableTimeSlotsAsync(string hallId, DateTime date)
        {
            try
            {
                var hall = await GetByIdAsync(hallId);
                if (hall == null) return new List<TimeSlot>();

                var dateStr = date.ToString("yyyy-MM-dd");
                var hallBookings = await _bookingDataService.GetByHallIdAsync(hallId);
                var dayBookings = hallBookings.Where(booking =>
                    booking.EventDate.ToString("yyyy-MM-dd") == dateStr &&
                    (booking.Status == "confirmed" || booking.Status == "active")
                ).ToList();

                var hasFullDay = dayBookings.Any(b => b.TimeSlot == "fullday");
                var hasMorning = dayBookings.Any(b => b.TimeSlot == "morning");
                var hasEvening = dayBookings.Any(b => b.TimeSlot == "evening");

                var availableSlots = new List<TimeSlot>();

                if (!hasFullDay && !hasMorning)
                {
                    availableSlots.Add(new TimeSlot
                    {
                        Value = "morning",
                        Label = $"Morning (₹{hall.RateCard.MorningRate:N0})",
                        Price = hall.RateCard.MorningRate
                    });
                }

                if (!hasFullDay && !hasEvening)
                {
                    availableSlots.Add(new TimeSlot
                    {
                        Value = "evening",
                        Label = $"Evening (₹{hall.RateCard.EveningRate:N0})",
                        Price = hall.RateCard.EveningRate
                    });
                }

                if (!hasMorning && !hasEvening && !hasFullDay)
                {
                    availableSlots.Add(new TimeSlot
                    {
                        Value = "fullday",
                        Label = $"Full Day (₹{hall.RateCard.FullDayRate:N0})",
                        Price = hall.RateCard.FullDayRate
                    });
                }

                return availableSlots;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting available time slots: {ex.Message}");
                return new List<TimeSlot>();
            }
        }

        public async Task<Hall> CreateHallAsync(Hall hall)
        {
            try
            {
                if (string.IsNullOrEmpty(hall.Id))
                {
                    hall.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                var success = await CreateAsync(hall);
                if (!success) throw new Exception("Failed to create hall");

                return hall;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating hall: {ex.Message}");
                throw;
            }
        }

        public async Task<Hall> UpdateHallAsync(string id, Hall updates)
        {
            try
            {
                var existing = await GetByIdAsync(id); // Use the fixed method
                if (existing == null)
                    throw new Exception("Hall not found");

                // Update fields
                existing.Name = updates.Name ?? existing.Name;
                existing.Capacity = updates.Capacity > 0 ? updates.Capacity : existing.Capacity;
                existing.Location = updates.Location ?? existing.Location;
                existing.Address = updates.Address ?? existing.Address;
                existing.Features = updates.Features ?? existing.Features;
                existing.RateCard = updates.RateCard ?? existing.RateCard;
                existing.Gallery = updates.Gallery ?? existing.Gallery;
                existing.IsActive = updates.IsActive;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update hall");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating hall: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteHallAsync(string id)
        {
            return await DeleteAsync(id);
        }

        public async Task<Hall>GetHallsByNameAsync(string name)
        {
            using var connection = await GetConnectionAsync();
            var sql = @"
            SELECT *
            FROM halls
            WHERE organizationid = @orgId
              AND isactive = true
              AND LOWER(name) LIKE LOWER(@name)
            LIMIT 1;
    ";

            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@orgId", GetCurrentOrganizationId());
            command.Parameters.AddWithValue("@name", $"%{name}%");

            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
                return MapFromReader(reader);

            return null;
        }
    }

    public interface IHallDataService : IBaseDataService<Hall>
    {
        Task<List<Hall>> GetActiveHallsAsync();
        Task<List<Hall>> GetByCapacityRangeAsync(int minCapacity, int maxCapacity);
        Task<List<Hall>> GetAllHallsAsync();
        Task<List<Hall>> GetHallsByOrganizationAsync(string organizationId);
        Task<List<Hall>> GetAccessibleHallsAsync(string organizationId, List<string> accessibleHallIds);
        Task<Hall> GetHallByIdAsync(string id);
        Task<List<TimeSlot>> GetAvailableTimeSlotsAsync(string hallId, DateTime date);
        Task<Hall> CreateHallAsync(Hall hall);
        Task<Hall> UpdateHallAsync(string id, Hall updates);
        Task<bool> DeleteHallAsync(string id);

        //for chatbot
        Task<Hall> GetHallsByNameAsync(string name);
    }
}