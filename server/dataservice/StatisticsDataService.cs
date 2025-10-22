using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Npgsql;
using Momantza.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Momantza.Middleware;

namespace Momantza.Services
{
    public interface IStatisticsDataService
    {
        Task<List<MonthlyData>> GetMonthlyDataAsync();
        Task<GrowthMetrics> GetGrowthMetricsAsync();
        Task<CustomerInsights> GetCustomerInsightsAsync();
        Task<List<StatusData>> GetStatusDataAsync();
        Task<List<HallUtilization>> GetHallUtilizationAsync();
        Task<Dictionary<string, object>> GetDashboardStatsAsync();
        Task<object> GetDashboardStatisticsAsync(string? organizationId = null);
        Task<object> GetBookingStatisticsAsync(string? organizationId = null, DateTime? startDate = null, DateTime? endDate = null);
        Task<object> GetRevenueStatisticsAsync(string? organizationId = null, DateTime? startDate = null, DateTime? endDate = null);
        Task<object> GetUserStatisticsAsync(string? organizationId = null);
        Task<object> GetHallStatisticsAsync(string? organizationId = null);
        Task<object> GetReviewStatisticsAsync(string? organizationId = null);
    }

    public class StatisticsDataService : IStatisticsDataService
    {
        private readonly string _connectionString;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public StatisticsDataService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetCurrentOrganizationId()
        {
            var context = _httpContextAccessor.HttpContext;
            if (context?.Items["Organization"] is Momantza.Middleware.OrganizationContext orgContext)
            {
                return orgContext.OrganizationId.ToString();
            }
            return string.Empty;
        }

        private async Task<NpgsqlConnection> GetConnectionAsync()
        {
            var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();
            return connection;
        }

        public async Task<List<MonthlyData>> GetMonthlyDataAsync()
        {
            var monthlyData = new List<MonthlyData>();
            var sql = @"
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', CAST(created_at AS DATE)), 'Mon') as month,
                    COUNT(*) as bookings,
                    SUM(total_amount) as revenue
                FROM bookings 
                WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', CAST(created_at AS DATE))
                ORDER BY DATE_TRUNC('month', CAST(created_at AS DATE))";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                monthlyData.Add(new MonthlyData
                {
                    Month = reader["month"].ToString() ?? "",
                    Bookings = Convert.ToInt32(reader["bookings"]),
                    Revenue = Convert.ToDecimal(reader["revenue"])
                });
            }

            return monthlyData;
        }

        public async Task<GrowthMetrics> GetGrowthMetricsAsync()
        {
            var sql = @"
                WITH current_month AS (
                    SELECT COUNT(*) as bookings, SUM(total_amount) as revenue
                    FROM bookings 
                    WHERE DATE_TRUNC('month', CAST(created_at AS DATE)) = DATE_TRUNC('month', CURRENT_DATE)
                ),
                previous_month AS (
                    SELECT COUNT(*) as bookings, SUM(total_amount) as revenue
                    FROM bookings 
                    WHERE DATE_TRUNC('month', CAST(created_at AS DATE)) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                )
                SELECT 
                    CASE 
                        WHEN pm.revenue > 0 THEN ((cm.revenue - pm.revenue) / pm.revenue * 100)
                        ELSE 0 
                    END as monthly_growth,
                    (SELECT AVG(total_amount) FROM bookings) as avg_booking_value,
                    (SELECT COUNT(DISTINCT customer_email) FROM bookings) as total_customers
                FROM current_month cm, previous_month pm";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new GrowthMetrics
                {
                    MonthlyGrowth = Convert.ToDecimal(reader["monthly_growth"]),
                    CustomerRetention = 78.0M, // This would need more complex calculation
                    AverageBookingValue = Convert.ToDecimal(reader["avg_booking_value"])
                };
            }

            return new GrowthMetrics
            {
                MonthlyGrowth = 0,
                CustomerRetention = 0,
                AverageBookingValue = 0
            };
        }

        public async Task<CustomerInsights> GetCustomerInsightsAsync()
        {
            var sql = @"
                SELECT 
                    COUNT(DISTINCT customer_email) as total_customers,
                    COUNT(DISTINCT CASE WHEN customer_email IN (
                        SELECT customer_email FROM bookings GROUP BY customer_email HAVING COUNT(*) > 1
                    ) THEN customer_email END) as repeat_customers,
                    (SELECT AVG(rating) FROM reviews) as avg_rating
                FROM bookings";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new CustomerInsights
                {
                    TotalCustomers = Convert.ToInt32(reader["total_customers"]),
                    RepeatCustomers = Convert.ToInt32(reader["repeat_customers"]),
                    CustomerSatisfaction = Convert.ToDecimal(reader["avg_rating"])
                };
            }

            return new CustomerInsights
            {
                TotalCustomers = 0,
                RepeatCustomers = 0,
                CustomerSatisfaction = 0
            };
        }

        public async Task<List<StatusData>> GetStatusDataAsync()
        {
            var statusData = new List<StatusData>();
            var sql = @"
                SELECT 
                    status as name,
                    COUNT(*) as value
                FROM bookings 
                GROUP BY status";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();

            var colors = new[] { "#10B981", "#F59E0B", "#EF4444", "#6B7280" };
            var colorIndex = 0;

            while (await reader.ReadAsync())
            {
                statusData.Add(new StatusData
                {
                    Name = reader["name"].ToString() ?? "",
                    Value = Convert.ToInt32(reader["value"]),
                    Color = colors[colorIndex % colors.Length]
                });
                colorIndex++;
            }

            return statusData;
        }

        public async Task<List<HallUtilization>> GetHallUtilizationAsync()
        {
            var hallUtilization = new List<HallUtilization>();
            var sql = @"
                SELECT 
                    h.name,
                    COUNT(b.id) as bookings,
                    SUM(b.total_amount) as revenue
                FROM halls h
                LEFT JOIN bookings b ON h.id = b.hall_id
                GROUP BY h.id, h.name
                ORDER BY bookings DESC";

            using var connection = await GetConnectionAsync();
            using var command = new NpgsqlCommand(sql, connection);
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                hallUtilization.Add(new HallUtilization
                {
                    Name = reader["name"].ToString() ?? "",
                    Bookings = Convert.ToInt32(reader["bookings"]),
                    Revenue = Convert.ToDecimal(reader["revenue"])
                });
            }

            return hallUtilization;
        }

        public async Task<Dictionary<string, object>> GetDashboardStatsAsync()
        {
            var stats = new Dictionary<string, object>();

            // Get total bookings
            var totalBookingsSql = "SELECT COUNT(*) FROM bookings";
            using var connection = await GetConnectionAsync();
            
            using (var command = new NpgsqlCommand(totalBookingsSql, connection))
            {
                var totalBookings = await command.ExecuteScalarAsync();
                stats["totalBookings"] = Convert.ToInt32(totalBookings);
            }

            // Get total revenue
            var totalRevenueSql = "SELECT COALESCE(SUM(total_amount), 0) FROM bookings";
            using (var command = new NpgsqlCommand(totalRevenueSql, connection))
            {
                var totalRevenue = await command.ExecuteScalarAsync();
                stats["totalRevenue"] = Convert.ToDecimal(totalRevenue);
            }

            // Get total halls
            var totalHallsSql = "SELECT COUNT(*) FROM halls";
            using (var command = new NpgsqlCommand(totalHallsSql, connection))
            {
                var totalHalls = await command.ExecuteScalarAsync();
                stats["totalHalls"] = Convert.ToInt32(totalHalls);
            }

            // Get total customers
            var totalCustomersSql = "SELECT COUNT(DISTINCT customer_email) FROM bookings";
            using (var command = new NpgsqlCommand(totalCustomersSql, connection))
            {
                var totalCustomers = await command.ExecuteScalarAsync();
                stats["totalCustomers"] = Convert.ToInt32(totalCustomers);
            }

            // Get recent bookings
            var recentBookingsSql = @"
                SELECT id, customer_name, event_date, total_amount, status 
                FROM bookings 
                ORDER BY created_at DESC 
                LIMIT 5";
            using (var command = new NpgsqlCommand(recentBookingsSql, connection))
            {
                using var reader = await command.ExecuteReaderAsync();
                var recentBookings = new List<object>();
                while (await reader.ReadAsync())
                {
                    recentBookings.Add(new
                    {
                        Id = reader["id"].ToString(),
                        CustomerName = reader["customer_name"].ToString(),
                        EventDate = reader["event_date"].ToString(),
                        TotalAmount = Convert.ToDecimal(reader["total_amount"]),
                        Status = reader["status"].ToString()
                    });
                }
                stats["recentBookings"] = recentBookings;
            }

            return stats;
        }

        public async Task<object> GetDashboardStatisticsAsync(string? organizationId = null)
        {
            try
            {
                var orgId = organizationId ?? GetCurrentOrganizationId();
                using var connection = await GetConnectionAsync();
                
                var sql = @"
                    SELECT
                        (SELECT COUNT(*) FROM bookings WHERE organizationid = @organizationId) as total_bookings,
                        (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE organizationid = @organizationId) as total_revenue,
                        (SELECT COUNT(*) FROM halls WHERE organizationid = @organizationId) as total_halls,
                        (SELECT COUNT(DISTINCT customer_email) FROM bookings WHERE organizationid = @organizationId) as total_customers,
                        (SELECT COUNT(*) FROM reviews WHERE organizationid = @organizationId) as total_reviews,
                        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE organizationid = @organizationId) as average_rating";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("@organizationId", orgId);
                
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        TotalBookings = Convert.ToInt32(reader["total_bookings"]),
                        TotalRevenue = Convert.ToDecimal(reader["total_revenue"]),
                        TotalHalls = Convert.ToInt32(reader["total_halls"]),
                        TotalCustomers = Convert.ToInt32(reader["total_customers"]),
                        TotalReviews = Convert.ToInt32(reader["total_reviews"]),
                        AverageRating = Convert.ToDouble(reader["average_rating"])
                    };
                }

                return new { TotalBookings = 0, TotalRevenue = 0.0M, TotalHalls = 0, TotalCustomers = 0, TotalReviews = 0, AverageRating = 0.0 };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting dashboard statistics: {ex.Message}");
                return new { error = "Failed to get dashboard statistics" };
            }
        }

        public async Task<object> GetBookingStatisticsAsync(string? organizationId = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var orgId = organizationId ?? GetCurrentOrganizationId();
                var sql = "SELECT COUNT(*) as total_bookings, COALESCE(SUM(total_amount), 0) as total_revenue FROM bookings WHERE 1=1";
                var parameters = new List<NpgsqlParameter>();

                if (!string.IsNullOrEmpty(organizationId))
                {
                    sql += " AND organizationid = @organizationId";
                    parameters.Add(new NpgsqlParameter("@organizationId", orgId));
                }

                if (startDate.HasValue)
                {
                    sql += " AND created_at >= @startDate";
                    parameters.Add(new NpgsqlParameter("@startDate", startDate.Value));
                }

                if (endDate.HasValue)
                {
                    sql += " AND created_at <= @endDate";
                    parameters.Add(new NpgsqlParameter("@endDate", endDate.Value));
                }

                using var connection = await GetConnectionAsync();
                using var command = new NpgsqlCommand(sql, connection);
                foreach (var param in parameters)
                {
                    command.Parameters.Add(param);
                }

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        TotalBookings = Convert.ToInt32(reader["total_bookings"]),
                        TotalRevenue = Convert.ToDecimal(reader["total_revenue"])
                    };
                }

                return new { TotalBookings = 0, TotalRevenue = 0.0M };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting booking statistics: {ex.Message}");
                return new { error = "Failed to get booking statistics" };
            }
        }

        public async Task<object> GetRevenueStatisticsAsync(string? organizationId = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            try
            {
                var orgId = organizationId ?? GetCurrentOrganizationId();
                var sql = "SELECT COALESCE(SUM(total_amount), 0) as total_revenue, COUNT(*) as total_bookings FROM bookings WHERE 1=1";
                var parameters = new List<NpgsqlParameter>();

                if (!string.IsNullOrEmpty(organizationId))
                {
                    sql += " AND organizationid = @organizationId";
                    parameters.Add(new NpgsqlParameter("@organizationId", orgId));
                }

                if (startDate.HasValue)
                {
                    sql += " AND created_at >= @startDate";
                    parameters.Add(new NpgsqlParameter("@startDate", startDate.Value));
                }

                if (endDate.HasValue)
                {
                    sql += " AND created_at <= @endDate";
                    parameters.Add(new NpgsqlParameter("@endDate", endDate.Value));
                }

                using var connection = await GetConnectionAsync();
                using var command = new NpgsqlCommand(sql, connection);
                foreach (var param in parameters)
                {
                    command.Parameters.Add(param);
                }

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        TotalRevenue = Convert.ToDecimal(reader["total_revenue"]),
                        TotalBookings = Convert.ToInt32(reader["total_bookings"])
                    };
                }

                return new { TotalRevenue = 0.0M, TotalBookings = 0 };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting revenue statistics: {ex.Message}");
                return new { error = "Failed to get revenue statistics" };
            }
        }

        public async Task<object> GetUserStatisticsAsync(string? organizationId = null)
        {
            try
            {
                var orgId = organizationId ?? GetCurrentOrganizationId();
                var sql = "SELECT COUNT(*) as total_users FROM users WHERE 1=1";
                var parameters = new List<NpgsqlParameter>();

                if (!string.IsNullOrEmpty(organizationId))
                {
                    sql += " AND organizationid = @organizationId";
                    parameters.Add(new NpgsqlParameter("@organizationId", orgId));
                }

                using var connection = await GetConnectionAsync();
                using var command = new NpgsqlCommand(sql, connection);
                foreach (var param in parameters)
                {
                    command.Parameters.Add(param);
                }

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        TotalUsers = Convert.ToInt32(reader["total_users"])
                    };
                }

                return new { TotalUsers = 0 };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting user statistics: {ex.Message}");
                return new { error = "Failed to get user statistics" };
            }
        }

        public async Task<object> GetHallStatisticsAsync(string? organizationId = null)
        {
            try
            {
                var orgId = organizationId ?? GetCurrentOrganizationId();
                var sql = "SELECT COUNT(*) as total_halls FROM halls WHERE 1=1";
                var parameters = new List<NpgsqlParameter>();

                if (!string.IsNullOrEmpty(organizationId))
                {
                    sql += " AND organizationid = @organizationId";
                    parameters.Add(new NpgsqlParameter("@organizationId", orgId));
                }

                using var connection = await GetConnectionAsync();
                using var command = new NpgsqlCommand(sql, connection);
                foreach (var param in parameters)
                {
                    command.Parameters.Add(param);
                }

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        TotalHalls = Convert.ToInt32(reader["total_halls"])
                    };
                }

                return new { TotalHalls = 0 };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting hall statistics: {ex.Message}");
                return new { error = "Failed to get hall statistics" };
            }
        }

        public async Task<object> GetReviewStatisticsAsync(string? organizationId = null)
        {
            try
            {
                var orgId = organizationId ?? GetCurrentOrganizationId();
                var sql = "SELECT COUNT(*) as total_reviews, COALESCE(AVG(rating), 0) as average_rating FROM reviews WHERE 1=1";
                var parameters = new List<NpgsqlParameter>();

                if (!string.IsNullOrEmpty(organizationId))
                {
                    sql += " AND organizationid = @organizationId";
                    parameters.Add(new NpgsqlParameter("@organizationId", orgId));
                }

                using var connection = await GetConnectionAsync();
                using var command = new NpgsqlCommand(sql, connection);
                foreach (var param in parameters)
                {
                    command.Parameters.Add(param);
                }

                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    return new
                    {
                        TotalReviews = Convert.ToInt32(reader["total_reviews"]),
                        AverageRating = Convert.ToDouble(reader["average_rating"])
                    };
                }

                return new { TotalReviews = 0, AverageRating = 0.0 };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting review statistics: {ex.Message}");
                return new { error = "Failed to get review statistics" };
            }
        }
    }
} 