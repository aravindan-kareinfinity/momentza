using Npgsql;
using Microsoft.Extensions.Configuration;
using Momantza.Models;
using System.Text.Json;

namespace Momantza.Services
{
    public class MicrositeComponentDataService : BaseDataService<MicrositeComponent>, IMicrositeComponentDataService
    {
        public MicrositeComponentDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor) : base(configuration, 
            httpContextAccessor, "microsite_components")
        {
        }

        protected override MicrositeComponent MapFromReader(NpgsqlDataReader reader)
        {
            return new MicrositeComponent
            {
                Id = reader["id"].ToString() ?? string.Empty,
                Type = reader["type"].ToString() ?? string.Empty,
                OrderPosition = Convert.ToInt32(reader["orderposition"]),
                IsActive = Convert.ToBoolean(reader["isactive"]),
                OrganizationId = reader["organizationid"]?.ToString(),
                Config = reader["config"] != DBNull.Value ? 
                    JsonSerializer.Deserialize<object>(reader["config"].ToString() ?? "{}") : null,
                CreatedAt = Convert.ToDateTime(reader["createdat"]),
                UpdatedAt = Convert.ToDateTime(reader["updatedat"])
            };
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(MicrositeComponent entity)
        {
            var sql = @"INSERT INTO microsite_components (id, type, orderposition, isactive, organizationid, config, createdat, updatedat) 
                       VALUES (@id, @type, @orderposition, @isactive, @organizationid, @config, @createdat, @updatedat)";
            
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@type"] = entity.Type,
                ["@orderposition"] = entity.OrderPosition,
                ["@isactive"] = entity.IsActive,
                ["@organizationid"] = entity.OrganizationId,
                ["@config"] = entity.Config,
                ["@createdat"] = entity.CreatedAt,
                ["@updatedat"] = entity.UpdatedAt
            };
            
            var jsonFields = new List<string> { "@config" };
            return (sql, parameters, jsonFields);
        }

        protected override (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(MicrositeComponent entity)
        {
            var sql = @"UPDATE microsite_components 
                       SET type = @type, orderposition = @orderposition, isactive = @isactive, 
                           organizationid = @organizationid, config = @config, updatedat = @updatedat 
                       WHERE id = @id";
            
            var parameters = new Dictionary<string, object?>
            {
                ["@id"] = entity.Id,
                ["@type"] = entity.Type,
                ["@orderposition"] = entity.OrderPosition,
                ["@isactive"] = entity.IsActive,
                ["@organizationid"] = entity.OrganizationId,
                ["@config"] = entity.Config,
                ["@updatedat"] = DateTime.UtcNow
            };
            
            var jsonFields = new List<string> { "@config" };
            return (sql, parameters, jsonFields);
        }

        public async Task<List<MicrositeComponent>> GetByOrganizationAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = @"SELECT * FROM microsite_components 
                           WHERE organizationid = @organizationId 
                           ORDER BY orderposition ASC";
                
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<MicrositeComponent>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting components by organization: {ex.Message}");
                return new List<MicrositeComponent>();
            }
        }

        public async Task<bool> ReorderComponentsAsync(string organizationId, List<string> componentIds)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                using var transaction = await connection.BeginTransactionAsync();
                
                try
                {
                    for (int i = 0; i < componentIds.Count; i++)
                    {
                        var sql = @"UPDATE microsite_components 
                                   SET orderposition = @orderposition, updatedat = @updatedat 
                                   WHERE id = @id AND organizationid = @organizationId";
                        
                        using var command = new NpgsqlCommand(sql, connection, transaction);
                        command.Parameters.AddWithValue("@orderposition", i + 1);
                        command.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
                        command.Parameters.AddWithValue("@id", componentIds[i]);
                        command.Parameters.AddWithValue("@organizationId", organizationId);
                        
                        await command.ExecuteNonQueryAsync();
                    }
                    
                    await transaction.CommitAsync();
                    return true;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reordering components: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ToggleActiveAsync(string id, bool isActive)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = @"UPDATE microsite_components 
                           SET isactive = @isactive, updatedat = @updatedat 
                           WHERE id = @id";
                
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@isactive", isActive);
                command.Parameters.AddWithValue("@updatedat", DateTime.UtcNow);
                command.Parameters.AddWithValue("@id", id);
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error toggling component active status: {ex.Message}");
                return false;
            }
        }

        public override async Task<List<MicrositeComponent>> GetAllAsync()
        {
            var orgId = GetCurrentOrganizationId();
            return await GetByOrganizationAsync(orgId);
        }

        public override async Task<MicrositeComponent?> GetByIdAsync(string id)
        {
            var orgId = GetCurrentOrganizationId();
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = @"SELECT * FROM microsite_components 
                           WHERE id = @id AND organizationid = @organizationId";
                
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
                Console.WriteLine($"Error getting component by id: {ex.Message}");
                return null;
            }
        }
    }

    public interface IMicrositeComponentDataService : IBaseDataService<MicrositeComponent>
    {
        Task<List<MicrositeComponent>> GetByOrganizationAsync(string organizationId);
        Task<bool> ReorderComponentsAsync(string organizationId, List<string> componentIds);
        Task<bool> ToggleActiveAsync(string id, bool isActive);
    }
}
