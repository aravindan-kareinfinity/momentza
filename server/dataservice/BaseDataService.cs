using System.Data;
using Npgsql;
using Microsoft.Extensions.Configuration;
using System.Reflection;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Momantza.Middleware;
using System.Linq;

namespace Momantza.Services
{
    public abstract class BaseDataService<T> : IBaseDataService<T> where T : class
    {
        protected readonly string _connectionString;
        protected readonly string _tableName;
        protected readonly IHttpContextAccessor _httpContextAccessor;

        protected BaseDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            _tableName = typeof(T).Name.ToLower();
            _httpContextAccessor = httpContextAccessor;
        }

        protected BaseDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor,string tablename)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            _tableName = tablename;
            _httpContextAccessor = httpContextAccessor;
        }

        protected string GetCurrentOrganizationId()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context == null) return string.Empty;

            // 1) Prefer explicit OrganizationId item (string or Guid)
            if (context.Items.TryGetValue("OrganizationId", out var orgIdObj) && orgIdObj != null)
            {
                if (orgIdObj is string s && !string.IsNullOrEmpty(s)) return s;
                if (orgIdObj is Guid g) return g.ToString();
            }

            // 2) Fallback to Organization object
            if (context.Items.TryGetValue("Organization", out var orgObj) && orgObj != null)
            {
                // Middleware's OrganizationContext lives in Momantza.Middleware
                if (orgObj is Momantza.Middleware.OrganizationContext oc)
                    return oc.OrganizationId.ToString();

                if (orgObj is Guid g) return g.ToString();
                if (orgObj is string s && !string.IsNullOrEmpty(s)) return s;
            }

            // 3) Try common JWT claims
            var claim = context.User?.Claims.FirstOrDefault(c =>
                c.Type == "organizationId" || c.Type == "org" || c.Type == "organization")?.Value;
            if (!string.IsNullOrEmpty(claim)) return claim;

            return string.Empty;
        }

        public string GetSQL(Npgsql.NpgsqlCommand command)
        {
            string query = command.CommandText;
            foreach (NpgsqlParameter p in command.Parameters.OrderByDescending(e => e.ParameterName.Length))
            {
                if (p.Value is string || p.NpgsqlDbType == NpgsqlTypes.NpgsqlDbType.Varchar)
                    query = query.Replace(p.ParameterName.StartsWith("@")? p.ParameterName: ("@" + p.ParameterName), "'" + p.Value.ToString() + "'");
                else if (p.Value is DateTime || p.NpgsqlDbType == NpgsqlTypes.NpgsqlDbType.TimestampTz || p.NpgsqlDbType == NpgsqlTypes.NpgsqlDbType.Timestamp || p.NpgsqlDbType == NpgsqlTypes.NpgsqlDbType.Date)
                {
                    if (p.Value != null && p.Value != DBNull.Value)
                    {
                        if (p.Value is DateTime)
                            query = query.Replace(p.ParameterName.StartsWith("@") ? p.ParameterName : ("@" + p.ParameterName), "'" + ((DateTime)p.Value).ToString("yyyy-MM-dd") + "'");
                        else if (p.Value is DateTimeOffset)
                            query = query.Replace(p.ParameterName.StartsWith("@") ? p.ParameterName : ("@" + p.ParameterName), "'" + ((DateTimeOffset)p.Value).ToString("yyyy-MM-dd") + "'");
                    }
                }
                else
                    query = query.Replace(p.ParameterName.StartsWith("@") ? p.ParameterName : ("@" + p.ParameterName), p.Value.ToString());
            }
            return query;
        }
        protected void AssignOrganizationIdIfNeeded(T entity)
        {
            var organizationIdProperty = typeof(T).GetProperty("OrganizationId");
            if (organizationIdProperty != null && organizationIdProperty.PropertyType == typeof(string))
            {
                var currentValue = organizationIdProperty.GetValue(entity) as string;
                if (string.IsNullOrEmpty(currentValue))
                {
                    var orgId = GetCurrentOrganizationId();
                    organizationIdProperty.SetValue(entity, orgId);
                }
            }
        }

        protected async Task<NpgsqlConnection> GetConnectionAsync()
        {
            var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            return connection;
        }

        public virtual async Task<bool> CreateTableAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                
                // Check if table exists
                var tableExists = await CheckTableExistsAsync(connection);
                if (tableExists)
                {
                    // Check and add missing columns
                    await AddMissingColumnsAsync(connection);
                    return true;
                }

                // Create table based on model properties
                var createTableSql = GenerateCreateTableSql();
                using var command = new NpgsqlCommand(createTableSql, connection);
                await command.ExecuteNonQueryAsync();
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating table {_tableName}: {ex.Message}");
                return false;
            }
        }

        private async Task<bool> CheckTableExistsAsync(NpgsqlConnection connection)
        {
            var sql = @"
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = @tableName
                )";
            
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@tableName", _tableName);
            var result = await command.ExecuteScalarAsync();
            return Convert.ToBoolean(result);
        }

        private async Task AddMissingColumnsAsync(NpgsqlConnection connection)
        {
            var properties = typeof(T).GetProperties();
            
            foreach (var property in properties)
            {
                if (await ColumnExistsAsync(connection, property.Name))
                    continue;

                var columnSql = GenerateColumnSql(property);
                using var command = new NpgsqlCommand($"ALTER TABLE {_tableName} ADD COLUMN {columnSql}", connection);
                await command.ExecuteNonQueryAsync();
            }
        }

        private async Task<bool> ColumnExistsAsync(NpgsqlConnection connection, string columnName)
        {
            var sql = @"
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = @tableName 
                    AND column_name = @columnName
                )";
            
            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("@tableName", _tableName);
            command.Parameters.AddWithValue("@columnName", columnName.ToLower());
            var result = await command.ExecuteScalarAsync();
            return Convert.ToBoolean(result);
        }

        private string GenerateCreateTableSql()
        {
            var properties = typeof(T).GetProperties();
            var columns = properties.Select(p => GenerateColumnSql(p));
            
            return $@"
                CREATE TABLE IF NOT EXISTS {_tableName} (
                    {string.Join(",\n    ", columns)}
                )";
        }

        private string GenerateColumnSql(PropertyInfo property)
        {
            var columnName = property.Name.ToLower();
            var columnType = GetPostgresType(property.PropertyType);
            var constraints = new List<string>();

            // Primary key for Id property
            if (property.Name.Equals("Id", StringComparison.OrdinalIgnoreCase))
            {
                constraints.Add("PRIMARY KEY");
            }

            // Not null for required properties
            if (property.GetCustomAttribute<RequiredAttribute>() != null)
            {
                constraints.Add("NOT NULL");
            }

            // Default values
            if (property.PropertyType == typeof(DateTime))
            {
                constraints.Add("DEFAULT CURRENT_TIMESTAMP");
            }

            var constraintString = constraints.Count > 0 ? " " + string.Join(" ", constraints) : "";
            return $"{columnName} {columnType}{constraintString}";
        }

        private string GetPostgresType(Type type)
        {
            if (type == typeof(string)) return "TEXT";
            if (type == typeof(int)) return "INTEGER";
            if (type == typeof(decimal)) return "DECIMAL(18,2)";
            if (type == typeof(bool)) return "BOOLEAN";
            if (type == typeof(DateTime)) return "TIMESTAMP WITH TIME ZONE";
            if (type == typeof(Guid)) return "UUID";
            if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(List<>)) return "JSONB";
            if (type.IsClass && type != typeof(string)) return "JSONB";
            
            return "TEXT";
        }

        private bool IsJsonType(Type type)
        {
            if (type == typeof(string)) return false;
            if (type == typeof(int)) return false;
            if (type == typeof(decimal)) return false;
            if (type == typeof(bool)) return false;
            if (type == typeof(DateTime)) return false;
            if (type == typeof(Guid)) return false;
            if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(List<>)) return true;
            if (type.IsClass && type != typeof(string)) return true;
            
            return false;
        }

        public virtual async Task<T?> GetByIdAsync(string id)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = $"SELECT * FROM {_tableName} WHERE id = @id";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return MapFromReader(reader);
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting {_tableName} by id: {ex.Message}");
                return null;
            }
        }

        public virtual async Task<List<T>> GetAllAsync()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = $"SELECT * FROM {_tableName}";
                using var command = new NpgsqlCommand(sql, connection);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<T>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all {_tableName}: {ex.Message}");
                return new List<T>();
            }
        }

        //new
        public virtual async Task<List<T>> GetAllAsyncs()
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = $"SELECT * FROM {_tableName}";
                using var command = new NpgsqlCommand(sql, connection);

                using var reader = await command.ExecuteReaderAsync();
                var results = new List<T>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting all {_tableName}: {ex.Message}");
                return new List<T>();
            }
        }

        public virtual async Task<List<T>> GetByOrganizationIdAsync(string organizationId)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = $"SELECT * FROM {_tableName} WHERE organizationid = @organizationId";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", organizationId);
                
                using var reader = await command.ExecuteReaderAsync();
                var results = new List<T>();
                while (await reader.ReadAsync())
                {
                    results.Add(MapFromReader(reader));
                }
                return results;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting {_tableName} by organization id: {ex.Message}");
                return new List<T>();
            }
        }

        public virtual async Task<bool> CreateAsync(T entity)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                AssignOrganizationIdIfNeeded(entity);
                var (sql, parameters, jsonFields) = GenerateInsertSql(entity);
                using var command = new NpgsqlCommand(sql, connection);
                
                foreach (var param in parameters)
                {
                    if (param.Value != null && jsonFields.Contains(param.Key))
                    {
                        var jsonValue = System.Text.Json.JsonSerializer.Serialize(param.Value);
                        command.Parameters.AddWithValue(param.Key, NpgsqlTypes.NpgsqlDbType.Jsonb, jsonValue);
                    }
                    else
                    {
                        command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                    }
                }
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating {_tableName}: {ex.Message}");
                return false;
            }
        }

        public virtual async Task<bool> UpdateAsync(T entity)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                AssignOrganizationIdIfNeeded(entity);
                var (sql, parameters, jsonFields) = GenerateUpdateSql(entity);
                using var command = new NpgsqlCommand(sql, connection);
                
                foreach (var param in parameters)
                {
                    if (param.Value != null && jsonFields.Contains(param.Key))
                    {
                        var jsonValue = System.Text.Json.JsonSerializer.Serialize(param.Value);
                        command.Parameters.AddWithValue(param.Key, NpgsqlTypes.NpgsqlDbType.Jsonb, jsonValue);
                    }
                    else
                    {
                        command.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                    }
                }
                var sqltest = GetSQL(command);
                Console.WriteLine($"Executing SQL: {sqltest}");
                Console.WriteLine($"Parameters: {string.Join(", ", parameters.Select(p => $"{p.Key}={p.Value}"))}");
                var rowsAffected = await command.ExecuteNonQueryAsync();
                Console.WriteLine($"Rows affected: {rowsAffected}");
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating {_tableName}: {ex.Message}");
                return false;
            }
        }

        public virtual async Task<bool> DeleteAsync(string id)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = $"DELETE FROM {_tableName} WHERE id = @id";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                
                var rowsAffected = await command.ExecuteNonQueryAsync();
                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting {_tableName}: {ex.Message}");
                return false;
            }
        }

        public virtual async Task<bool> ExistsAsync(string id)
        {
            try
            {
                using var connection = await GetConnectionAsync();
                var sql = $"SELECT EXISTS(SELECT 1 FROM {_tableName} WHERE id = @id)";
                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@id", id);
                
                var result = await command.ExecuteScalarAsync();
                return Convert.ToBoolean(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking existence of {_tableName}: {ex.Message}");
                return false;
            }
        }

        protected abstract T MapFromReader(NpgsqlDataReader reader);
        protected abstract (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateInsertSql(T entity);
        protected abstract (string sql, Dictionary<string, object?> parameters, List<string> jsonFields) GenerateUpdateSql(T entity);
    }
}