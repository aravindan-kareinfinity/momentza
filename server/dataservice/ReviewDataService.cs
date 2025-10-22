using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;

namespace Momantza.Services
{
    public class ReviewDataService : BaseDataService<Reviews>, IReviewDataService
    {
        public ReviewDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor, "reviews")
        {
        }

        protected override Reviews MapFromReader(NpgsqlDataReader reader)
        {
            return new Reviews
            {
                Id = reader["id"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                HallId = reader["hallid"]?.ToString(),
                CustomerName = reader["customername"].ToString() ?? string.Empty,
                Rating = Convert.ToInt32(reader["rating"]),
                Comment = reader["comment"].ToString() ?? string.Empty,
                Date = Convert.ToDateTime(reader["date"]),
                IsEnabled = Convert.ToBoolean(reader["isenabled"])
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Reviews entity)
        {
            var sql = @"INSERT INTO reviews (id, organizationid, hallid, customername, rating, comment, date, isenabled) VALUES (@id, @organizationid, @hallid, @customername, @rating, @comment, @date, @isenabled)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId,
                ["@customername"] = entity.CustomerName,
                ["@rating"] = entity.Rating,
                ["@comment"] = entity.Comment,
                ["@date"] = entity.Date,
                ["@isenabled"] = entity.IsEnabled
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Reviews entity)
        {
            var sql = @"UPDATE reviews SET organizationid = @organizationid, hallid = @hallid, customername = @customername, rating = @rating, comment = @comment, date = @date, isenabled = @isenabled WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@hallid"] = entity.HallId,
                ["@customername"] = entity.CustomerName,
                ["@rating"] = entity.Rating,
                ["@comment"] = entity.Comment,
                ["@date"] = entity.Date,
                ["@isenabled"] = entity.IsEnabled
            };
            return (sql, parameters, new List<string>());
        }

        public override async Task<List<Reviews>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM reviews WHERE organizationid = @organizationId AND isenabled = true ORDER BY date DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Reviews>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<Reviews?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM reviews WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<List<Reviews>> GetByHallIdAsync(string hallId)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM reviews WHERE hallid = @hallId AND organizationid = @organizationId AND isenabled = true ORDER BY date DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@hallId", hallId);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Reviews>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public async Task<List<Reviews>> GetByRatingAsync(int rating)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM reviews WHERE rating = @rating AND organizationid = @organizationId AND isenabled = true ORDER BY date DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@rating", rating);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Reviews>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public async Task<double> GetAverageRatingAsync(string organizationId, string? hallId = null)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                string sql;
                var parameters = new Dictionary<string, object> { ["@organizationId"] = organizationId };

                if (hallId != null)
                {
                    sql = "SELECT AVG(rating) FROM reviews WHERE organizationid = @organizationId AND hallid = @hallId AND isenabled = true";
                    parameters["@hallId"] = hallId;
                }
                else
                {
                    sql = "SELECT AVG(rating) FROM reviews WHERE organizationid = @organizationId AND isenabled = true";
                }

                using var command = new NpgsqlCommand(sql, connection);
                foreach (var param in parameters)
                {
                    command.Parameters.AddWithValue(param.Key, param.Value);
                }
                
                var result = await command.ExecuteScalarAsync();
                return result != DBNull.Value ? Convert.ToDouble(result) : 0.0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting average rating: {ex.Message}");
                return 0.0;
            }
        }

        public async Task<List<Reviews>> GetRecentReviewsAsync(int count = 10)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = $"SELECT * FROM reviews WHERE isenabled = true ORDER BY date DESC LIMIT {count}";
                using var command = new NpgsqlCommand(sql, connection);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Reviews>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting recent reviews: {ex.Message}");
                return new List<Reviews>();
            }
        }

        public async Task<List<Reviews>> GetReviewsByOrganizationAsync(string organizationId)
        {
            return await GetByOrganizationIdAsync(organizationId);
        }

        public async Task<List<Reviews>> GetReviewsByHallAsync(string hallId)
        {
            return await GetByHallIdAsync(hallId);
        }

        public async Task<Reviews> CreateReviewAsync(Reviews review)
        {
            try
            {
                if (string.IsNullOrEmpty(review.Id))
                {
                    review.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                if (review.Date == default)
                {
                    review.Date = DateTime.UtcNow;
                }

                //// Set default value for IsEnabled if not specified
                //// Since IsEnabled is a bool (not nullable), we don't need to check HasValue
                //// The default value will be false, so we set it to true for new reviews
                //review.IsEnabled = true;

                var success = await CreateAsync(review);
                if (!success) throw new Exception("Failed to create review");

                return review;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating review: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteReviewAsync(string id)
        {
            return await DeleteAsync(id);
        }

        public async Task<double> GetAverageRatingAsync(string organizationId)
        {
            return await GetAverageRatingAsync(organizationId, null);
        }

        public async Task<List<Reviews>> GetByUserAsync(string userId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM reviews WHERE customername LIKE @userName AND isenabled = true ORDER BY date DESC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@userName", $"%{userId}%");
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Reviews>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting reviews by user: {ex.Message}");
                return new List<Reviews>();
            }
        }

        public async Task<List<Reviews>> GetByOrganizationAsync(string organizationId)
        {
            return await GetReviewsByOrganizationAsync(organizationId);
        }

        // New method to get all reviews including disabled ones (for admin purposes)
        public async Task<List<Reviews>> GetAllReviewsIncludingDisabledAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM reviews WHERE organizationid = @organizationId ORDER BY date DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Reviews>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        // New method to toggle reviews enabled status
        public async Task<bool> ToggleReviewEnabledAsync(string id, bool isEnabled)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                var sql = "UPDATE reviews SET isenabled = @isenabled WHERE id = @id AND organizationid = @organizationId";
                using var connection = await GetConnectionAsync();
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@organizationId", orgId);
                command.Parameters.AddWithValue("@isenabled", isEnabled);
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling reviews enabled status: {ex.Message}");
                return false;
            }
        }

    }

    public interface IReviewDataService : IBaseDataService<Reviews>
    {
        Task<List<Reviews>> GetByHallIdAsync(string hallId);
        Task<List<Reviews>> GetByRatingAsync(int rating);
        Task<double> GetAverageRatingAsync(string organizationId, string? hallId = null);
        Task<List<Reviews>> GetRecentReviewsAsync(int count = 10);
        Task<List<Reviews>> GetReviewsByOrganizationAsync(string organizationId);
        Task<List<Reviews>> GetReviewsByHallAsync(string hallId);
        Task<Reviews> CreateReviewAsync(Reviews review);
        Task<bool> DeleteReviewAsync(string id);
        Task<double> GetAverageRatingAsync(string organizationId);
        Task<List<Reviews>> GetByUserAsync(string userId);
        Task<List<Reviews>> GetByOrganizationAsync(string organizationId);
        Task<List<Reviews>> GetAllReviewsIncludingDisabledAsync();
        Task<bool> ToggleReviewEnabledAsync(string id, bool isEnabled);
    }
} 