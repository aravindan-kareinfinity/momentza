using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;

namespace Momantza.Services
{
    public class MicrositeDataService : BaseDataService<Microsite>, IMicrositeDataService
    {
        public MicrositeDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration,
            httpContextAccessor, "microsite")
        {
        }

        protected override Microsite MapFromReader(NpgsqlDataReader reader)
        {
            return new Microsite
            {
                Id = reader["id"].ToString() ?? string.Empty,
                OrganizationId = reader["organizationid"].ToString() ?? string.Empty,
                Components = reader["components"] != DBNull.Value 
                    ? JsonSerializer.Deserialize<List<MicrositeComponent>>(reader["components"].ToString() ?? "[]") ?? new List<MicrositeComponent>()
                    : new List<MicrositeComponent>()
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(Microsite entity)
        {
            var sql = @"INSERT INTO microsite (id, organizationid, components, isactive) VALUES (@id, @organizationid, @components, @isactive)";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@components"] = entity.Components,
                ["@isactive"] = entity.IsActive
            };
            var jsonFields = new List<string> { "@components" };
            return (sql, parameters, jsonFields);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(Microsite entity)
        {
            var sql = @"UPDATE microsite SET organizationid = @organizationid, components = @components, isactive = @isactive WHERE id = @id";
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@organizationid"] = entity.OrganizationId,
                ["@components"] = entity.Components,
                ["@isactive"] = entity.IsActive
            };
            var jsonFields = new List<string> { "@components" };
            return (sql, parameters, jsonFields);
        }

        public async Task<bool> AddComponentAsync(string micrositeId, MicrositeComponent component)
        {
            try
            {
                var microsite = await GetByIdAsync(micrositeId);
                if (microsite == null) return false;

                microsite.Components.Add(component);
                return await UpdateAsync(microsite);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding component to microsite: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> RemoveComponentAsync(string micrositeId, string componentId)
        {
            try
            {
                var microsite = await GetByIdAsync(micrositeId);
                if (microsite == null) return false;

                var component = microsite.Components.FirstOrDefault(c => c.Id == componentId);
                if (component == null) return false;

                microsite.Components.Remove(component);
                return await UpdateAsync(microsite);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error removing component from microsite: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> UpdateComponentOrderAsync(string micrositeId, string componentId, int newOrder)
        {
            try
            {
                var microsite = await GetByIdAsync(micrositeId);
                if (microsite == null) return false;

                var component = microsite.Components.FirstOrDefault(c => c.Id == componentId);
                if (component == null) return false;

                component.OrderPosition = newOrder;
                return await UpdateAsync(microsite);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating component order: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ToggleComponentActiveAsync(string micrositeId, string componentId)
        {
            try
            {
                var microsite = await GetByIdAsync(micrositeId);
                if (microsite == null) return false;

                var component = microsite.Components.FirstOrDefault(c => c.Id == componentId);
                if (component == null) return false;

                component.IsActive = !component.IsActive;
                return await UpdateAsync(microsite);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling component active status: {ex.Message}");
                return false;
            }
        }

        public async Task<List<MicrositeComponent>> GetActiveComponentsAsync(string micrositeId)
        {
            try
            {
                var microsite = await GetByIdAsync(micrositeId);
                if (microsite == null) return new List<MicrositeComponent>();

                return microsite.Components.Where(c => c.IsActive).OrderBy(c => c.OrderPosition).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting active components: {ex.Message}");
                return new List<MicrositeComponent>();
            }
        }

        public async Task<List<Microsite>> GetByOrganizationAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM microsite WHERE organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Microsite>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting microsites by organization: {ex.Message}");
                return new List<Microsite>();
            }
        }

        public async Task<List<Microsite>> GetActiveAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = "SELECT * FROM microsite WHERE isactive = true";
                using var command = new NpgsqlCommand(sql, connection);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<Microsite>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting active microsites: {ex.Message}");
                return new List<Microsite>();
            }
        }

        public override async Task<List<Microsite>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM microsite WHERE organizationid = @organizationId ORDER BY createdat DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Microsite>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }

        public override async Task<Microsite?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM microsite WHERE id = @id AND organizationid = @organizationId";
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

        public async Task<List<Microsite>> GetActiveMicrositesAsync()
        {
            var orgId = GetCurrentOrganizationId();
            var sql = "SELECT * FROM microsite WHERE isactive = true AND organizationid = @organizationId ORDER BY createdat DESC";
            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@organizationId", orgId);
            using var reader = await command.ExecuteReaderAsync();
            var results = new List<Microsite>();
            while (await reader.ReadAsync())
            {
                results.Add(MapFromReader(reader));
            }
            return results;
        }
    }

    public interface IMicrositeDataService : IBaseDataService<Microsite>
    {
        Task<bool> AddComponentAsync(string micrositeId, MicrositeComponent component);
        Task<bool> RemoveComponentAsync(string micrositeId, string componentId);
        Task<bool> UpdateComponentOrderAsync(string micrositeId, string componentId, int newOrder);
        Task<bool> ToggleComponentActiveAsync(string micrositeId, string componentId);
        Task<List<MicrositeComponent>> GetActiveComponentsAsync(string micrositeId);
        Task<List<Microsite>> GetByOrganizationAsync(string organizationId);
        Task<List<Microsite>> GetActiveAsync();
    }
} 