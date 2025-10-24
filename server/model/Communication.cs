using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Communication
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        public string booking_id { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public DateTime Time { get; set; }

        [Required]
        [MaxLength(100)]
        public string from_Person { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string to_Person { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Detail { get; set; } = string.Empty;

        public string Organizationid { get; set; } = string.Empty;

        public DateTime Created_at { get; set; } = DateTime.UtcNow;



    }
}