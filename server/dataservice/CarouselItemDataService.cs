using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;

namespace Momantza.Services
{
    public class CarouselItemDataService : BaseDataService<CarouselItem>, ICarouselItemDataService
    {
        public CarouselItemDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
        }

        protected override CarouselItem MapFromReader(NpgsqlDataReader reader)
        {
            return new CarouselItem
            {
                Id = reader["id"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                ImageUrl = reader["imageurl"].ToString() ?? string.Empty,
                Title = reader["title"].ToString() ?? string.Empty,
                Description = reader["description"].ToString() ?? string.Empty,
                OrderPosition = Convert.ToInt32(reader["orderposition"]),
                IsActive = Convert.ToBoolean(reader["isactive"])
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(CarouselItem entity)
        {
            var sql = @"INSERT INTO carouselitem (id, organizationid, imageurl, title, description, orderposition, isactive) VALUES (@id, @organizationid, @imageurl, @title, @description, @orderposition, @isactive)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@imageurl"] = entity.ImageUrl,
                ["@title"] = entity.Title,
                ["@description"] = entity.Description,
                ["@orderposition"] = entity.OrderPosition,
                ["@isactive"] = entity.IsActive
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(CarouselItem entity)
        {
            var sql = @"UPDATE carouselitem SET organizationid = @organizationid, imageurl = @imageurl, title = @title, description = @description, orderposition = @orderposition, isactive = @isactive WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@imageurl"] = entity.ImageUrl,
                ["@title"] = entity.Title,
                ["@description"] = entity.Description,
                ["@orderposition"] = entity.OrderPosition,
                ["@isactive"] = entity.IsActive
            };
            return (sql, parameters, new List<string>());
        }

        public async Task<List<CarouselItem>> GetActiveItemsAsync()
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM carouselitem WHERE isactive = true AND organizationid = @organizationId ORDER BY orderposition ASC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", orgId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<CarouselItem>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting active carousel items: {ex.Message}");
                return new List<CarouselItem>();
            }
        }

        public async Task<bool> UpdateOrderAsync(string id, int newOrder)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                using var connection = await GetConnectionAsync();
                var sql = "UPDATE carouselitem SET orderposition = @order WHERE id = @id AND organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@order", newOrder);
                command.Parameters.AddWithValue("@organizationId", orgId);
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating carousel item order: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ToggleActiveAsync(string id)
        {
            try
            {
                var orgId = GetCurrentOrganizationId();
                using var connection = await GetConnectionAsync();
                var sql = "UPDATE carouselitem SET isactive = NOT isactive WHERE id = @id AND organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                command.Parameters.AddWithValue("@organizationId", orgId);
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling carousel item active status: {ex.Message}");
                return false;
            }
        }

        public async Task<List<CarouselItem>> GetCarouselItemsAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM carouselitem WHERE organizationid = @organizationId ORDER BY orderposition ASC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<CarouselItem>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting carousel items: {ex.Message}");
                return new List<CarouselItem>();
            }
        }

        public async Task<CarouselItem> UpdateCarouselItemAsync(string id, CarouselItem updates)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("Carousel item not found");

                // Update only the provided fields
                if (!string.IsNullOrEmpty(updates.Title)) existing.Title = updates.Title;
                if (!string.IsNullOrEmpty(updates.Description)) existing.Description = updates.Description;
                if (!string.IsNullOrEmpty(updates.ImageUrl)) existing.ImageUrl = updates.ImageUrl;
                if (updates.OrderPosition > 0) existing.OrderPosition = updates.OrderPosition;
                existing.IsActive = updates.IsActive;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update carousel item");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating carousel item: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> MoveItemUpAsync(string id, string organizationId)
        {
            try
            {
                var items = await GetCarouselItemsAsync(organizationId);
                var currentItem = items.FirstOrDefault(item => item.Id == id);
                
                if (currentItem == null) return false;
                
                if (currentItem.OrderPosition <= 1) return false;
                
                var itemAbove = items.FirstOrDefault(item => item.OrderPosition == currentItem.OrderPosition - 1);
                if (itemAbove == null) return false;
                
                // Swap positions
                await UpdateOrderAsync(id, currentItem.OrderPosition - 1);
                await UpdateOrderAsync(itemAbove.Id, currentItem.OrderPosition);
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error moving item up: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> MoveItemDownAsync(string id, string organizationId)
        {
            try
            {
                var items = await GetCarouselItemsAsync(organizationId);
                var currentItem = items.FirstOrDefault(item => item.Id == id);
                
                if (currentItem == null) return false;
                
                if (currentItem.OrderPosition >= items.Count) return false;
                
                var itemBelow = items.FirstOrDefault(item => item.OrderPosition == currentItem.OrderPosition + 1);
                if (itemBelow == null) return false;
                
                // Swap positions
                await UpdateOrderAsync(id, currentItem.OrderPosition + 1);
                await UpdateOrderAsync(itemBelow.Id, currentItem.OrderPosition);
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error moving item down: {ex.Message}");
                return false;
            }
        }
    }

    public interface ICarouselItemDataService : IBaseDataService<CarouselItem>
    {
        Task<List<CarouselItem>> GetActiveItemsAsync();
        Task<bool> UpdateOrderAsync(string id, int newOrder);
        Task<bool> ToggleActiveAsync(string id);
        Task<List<CarouselItem>> GetCarouselItemsAsync(string organizationId);
        Task<CarouselItem> UpdateCarouselItemAsync(string id, CarouselItem updates);
        Task<bool> MoveItemUpAsync(string id, string organizationId);
        Task<bool> MoveItemDownAsync(string id, string organizationId);
    }
} 