using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using System.IO;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Momantza.Services
{
    public class GalleryDataService : BaseDataService<GalleryImage>, IGalleryDataService
    {
        public GalleryDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, httpContextAccessor)
        {
        }

        protected override GalleryImage MapFromReader(NpgsqlDataReader reader)
        {
            return new GalleryImage
            {
                Id = reader["id"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                Url = reader["url"] != DBNull.Value ? reader["url"].ToString() : null,
                Title = reader["title"].ToString() ?? string.Empty,
                Category = reader["category"].ToString() ?? string.Empty,
                UploadedAt = reader["uploadedat"] != DBNull.Value ? Convert.ToDateTime(reader["uploadedat"]) : DateTime.UtcNow,
                CreatedAt = reader["createdat"] != DBNull.Value ? Convert.ToDateTime(reader["createdat"]) : DateTime.UtcNow,
                ImageBytes = reader["imagebytes"] != DBNull.Value ? (byte[])reader["imagebytes"] : null,
                ContentType = reader["contenttype"] != DBNull.Value ? reader["contenttype"].ToString() : null
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(GalleryImage entity)
        {
            var sql = @"INSERT INTO galleryimage (id, organizationid, url, title, category, uploadedat, createdat, imagebytes, contenttype) VALUES (@id, @organizationid, @url, @title, @category, @uploadedat, @createdat, @imagebytes, @contenttype)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@url"] = entity.Url,
                ["@title"] = entity.Title,
                ["@category"] = entity.Category,
                ["@uploadedat"] = entity.UploadedAt,
                ["@createdat"] = entity.CreatedAt,
                ["@imagebytes"] = entity.ImageBytes,
                ["@contenttype"] = entity.ContentType
            };
            return (sql, parameters, new List<string>());
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(GalleryImage entity)
        {
            var sql = @"UPDATE galleryimage SET organizationid = @organizationid, url = @url, title = @title, category = @category, uploadedat = @uploadedat, createdat = @createdat, imagebytes = @imagebytes, contenttype = @contenttype WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@url"] = entity.Url,
                ["@title"] = entity.Title,
                ["@category"] = entity.Category,
                ["@uploadedat"] = entity.UploadedAt,
                ["@createdat"] = entity.CreatedAt,
                ["@imagebytes"] = entity.ImageBytes,
                ["@contenttype"] = entity.ContentType
            };
            return (sql, parameters, new List<string>());
        }

        public async Task<List<GalleryImage>> GetGalleryByOrganizationAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM galleryimage WHERE organizationid = @organizationId ORDER BY uploadedat DESC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<GalleryImage>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting gallery by organization: {ex.Message}");
                return new List<GalleryImage>();
            }
        }

        public async Task<List<GalleryImage>> GetGalleryByHallAsync(string hallId)
        {
            try
            {
                // Since GalleryImage doesn't have HallId, we'll return empty list
                // or you might want to add HallId to the GalleryImage model
                return new List<GalleryImage>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting gallery by hall: {ex.Message}");
                return new List<GalleryImage>();
            }
        }

        public async Task<List<GalleryImage>> GetGalleryByCategoryAsync(string organizationId, string category)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM galleryimage WHERE organizationid = @organizationId AND category = @category ORDER BY uploadedat DESC";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                command.Parameters.AddWithValue("@category", category);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<GalleryImage>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting gallery by category: {ex.Message}");
                return new List<GalleryImage>();
            }
        }

        public async Task<GalleryImage> CreateGalleryItemAsync(GalleryImage item)
        {
            try
            {
                
                if (string.IsNullOrEmpty(item.Id))
                {
                    item.Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                }

                if (item.UploadedAt == default)
                {
                    item.UploadedAt = DateTime.UtcNow;
                }

                if (item.CreatedAt == default)
                {
                    item.CreatedAt = DateTime.UtcNow;
                }

                var success = await CreateAsync(item);
                if (!success) throw new Exception("Failed to create gallery item");

                return item;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating gallery item: {ex.Message}");
                throw;
            }
        }

        public async Task<GalleryImage> UpdateGalleryItemAsync(string id, GalleryImage updates)
        {
            try
            {
                var existing = await GetByIdAsync(id);
                if (existing == null)
                    throw new Exception("Gallery item not found");

                // Update only the provided fields
                if (!string.IsNullOrEmpty(updates.Url)) existing.Url = updates.Url;
                if (!string.IsNullOrEmpty(updates.Title)) existing.Title = updates.Title;
                if (!string.IsNullOrEmpty(updates.Category)) existing.Category = updates.Category;
                if (updates.UploadedAt != default) existing.UploadedAt = updates.UploadedAt;
                if (updates.ImageBytes != null) existing.ImageBytes = updates.ImageBytes;
                if (!string.IsNullOrEmpty(updates.ContentType)) existing.ContentType = updates.ContentType;

                var success = await UpdateAsync(existing);
                if (!success) throw new Exception("Failed to update gallery item");

                return existing;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating gallery item: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteGalleryItemAsync(string id)
        {
            return await DeleteAsync(id);
        }

        public async Task<bool> UpdateGalleryItemOrderAsync(string id, int newOrder)
        {
            try
            {
                // Since GalleryImage doesn't have Order property, we'll return true
                // or you might want to add Order property to the GalleryImage model
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating gallery item order: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ToggleGalleryItemActiveAsync(string id)
        {
            try
            {
                // Since GalleryImage doesn't have IsActive property, we'll return true
                // or you might want to add IsActive property to the GalleryImage model
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling gallery item active: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ActivateAsync(string id)
        {
            try
            {
                // Since GalleryImage doesn't have IsActive property, we'll return true
                // or you might want to add IsActive property to the GalleryImage model
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error activating gallery item: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> DeactivateAsync(string id)
        {
            try
            {
                // Since GalleryImage doesn't have IsActive property, we'll return true
                // or you might want to add IsActive property to the GalleryImage model
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deactivating gallery item: {ex.Message}");
                return false;
            }
        }

        public async Task<List<string>> GetGalleryCategoriesAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT DISTINCT category FROM galleryimage WHERE organizationid = @organizationId ORDER BY category";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var categories = new List<string>();
                while (await reader.ReadAsync())
                {
                    categories.Add(reader["category"].ToString() ?? string.Empty);
                }
                return categories;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting gallery categories: {ex.Message}");
                return new List<string>();
            }
        }

        public async Task<List<GalleryImage>> GetByOrganizationAsync(string organizationId)
        {
            return await GetGalleryByOrganizationAsync(organizationId);
        }

        public async Task<List<GalleryImage>> GetActiveAsync()
        {
            try
            {
                // Since GalleryImage doesn't have IsActive property, we'll return all items
                // or you might want to add IsActive property to the GalleryImage model
                return await GetAllAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting active gallery items: {ex.Message}");
                return new List<GalleryImage>();
            }
        }

        public async Task<List<GalleryImage>> GetByCategoryAsync(string category)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM galleryimage WHERE category = @category AND organizationid = @organizationId ORDER BY uploadedat DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@category", category);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<GalleryImage>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public async Task<GalleryImage> UploadImageAsync(string organizationId, IFormFile file, string title, string category)
        {
            try
            {
                // Read the image bytes from the uploaded file
                byte[] imageBytes;
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    imageBytes = memoryStream.ToArray();
                }
                
                // Create the gallery image object
                var galleryImage = new GalleryImage
                {
                    Id = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString(),
                    OrganizationId = organizationId,
                    Url = null, // No URL needed since we store bytes directly
                    Title = title,
                    Category = category,
                    UploadedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    ImageBytes = imageBytes,
                    ContentType = file.ContentType
                };
                
                // Save to database
                var success = await CreateAsync(galleryImage);
                if (!success)
                {
                    throw new Exception("Failed to save gallery image to database");
                }
                
                return galleryImage;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error uploading image: {ex.Message}");
                throw;
            }
        }
    }

    public interface IGalleryDataService : IBaseDataService<GalleryImage>
    {
        Task<List<GalleryImage>> GetGalleryByOrganizationAsync(string organizationId);
        Task<List<GalleryImage>> GetGalleryByHallAsync(string hallId);
        Task<List<GalleryImage>> GetGalleryByCategoryAsync(string organizationId, string category);
        Task<GalleryImage> CreateGalleryItemAsync(GalleryImage item);
        Task<GalleryImage> UpdateGalleryItemAsync(string id, GalleryImage updates);
        Task<bool> DeleteGalleryItemAsync(string id);
        Task<bool> UpdateGalleryItemOrderAsync(string id, int newOrder);
        Task<bool> ToggleGalleryItemActiveAsync(string id);
        Task<bool> ActivateAsync(string id);
        Task<bool> DeactivateAsync(string id);
        Task<List<string>> GetGalleryCategoriesAsync(string organizationId);
        Task<List<GalleryImage>> GetByOrganizationAsync(string organizationId);
        Task<List<GalleryImage>> GetActiveAsync();
        Task<List<GalleryImage>> GetByCategoryAsync(string category);
        Task<GalleryImage> UploadImageAsync(string organizationId, IFormFile file, string title, string category);
    }
} 