using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class MonthlyData
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(10)]
        public string Month { get; set; } = string.Empty;
        
        [Required]
        [Range(0, int.MaxValue)]
        public int Bookings { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal Revenue { get; set; }
        
        public string OrganizationId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class StatusData
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [Range(0, int.MaxValue)]
        public int Value { get; set; }
        
        [Required]
        [MaxLength(7)]
        public string Color { get; set; } = string.Empty;
        
        public string OrganizationId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class HallUtilization
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [Range(0, int.MaxValue)]
        public int Bookings { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal Revenue { get; set; }
        
        public string OrganizationId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class GrowthMetrics
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [Range(0, 100)]
        public decimal MonthlyGrowth { get; set; }
        
        [Required]
        [Range(0, 100)]
        public decimal CustomerRetention { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal AverageBookingValue { get; set; }
        
        public string OrganizationId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CustomerInsights
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [Range(0, int.MaxValue)]
        public int TotalCustomers { get; set; }
        
        [Required]
        [Range(0, int.MaxValue)]
        public int RepeatCustomers { get; set; }
        
        [Required]
        [Range(0, 5)]
        public decimal CustomerSatisfaction { get; set; }
        
        public string OrganizationId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
} 