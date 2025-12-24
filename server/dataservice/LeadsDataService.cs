using MomantzaApp.model;
using Npgsql;

namespace MomantzaApp.dataservice
{
    public class LeadsDataService : ILeadsDataService
    {
        private readonly string _connectionString;

        public LeadsDataService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // CREATE
        public async Task<Leads> CreateAsync(Leads lead)
        {
            const string query = @"
                INSERT INTO leads (name, mobile, email, city, message)
                VALUES (@name, @mobile, @email, @city, @message)
                RETURNING id, created_at;
            ";

            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            await using var cmd = new NpgsqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@name", lead.Name);
            cmd.Parameters.AddWithValue("@mobile", lead.Mobile);
            cmd.Parameters.AddWithValue("@email", (object?)lead.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@city", (object?)lead.City ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@message", (object?)lead.Message ?? DBNull.Value);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                //lead.Id = reader["id"].ToString();
                lead.CreatedAt = (DateTime)reader["created_at"];
            }

            return lead;
        }

        // READ ALL
        public async Task<List<Leads>> GetAllAsync()
        {
            const string query = @"
                SELECT id, name, mobile, email, city, message, created_at
                FROM leads
                ORDER BY created_at DESC;
            "
            ;

            var leads = new List<Leads>();

            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            await using var cmd = new NpgsqlCommand(query, conn);
            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                leads.Add(new Leads
                {
                    //Id = reader["id"].ToString(),
                    Name = reader["name"].ToString(),
                    Mobile = reader["mobile"].ToString(),
                    Email = reader["email"]?.ToString(),
                    City = reader["city"]?.ToString(),
                    Message = reader["message"]?.ToString(),
                    CreatedAt = (DateTime)reader["created_at"]
                });
            }

            return leads;
        }
    }

    public interface ILeadsDataService
    {
        Task<Leads> CreateAsync(Leads lead);
        Task<List<Leads>> GetAllAsync();
    }
}
