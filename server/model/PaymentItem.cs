using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class PaymentItem
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(50)]
        public string PaymentMode { get; set; } = "cash"; // cash, card, upi, bank-transfer

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(100)]
        public string PersonName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        public string? BookingId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string OrganizationId { get; set; } = string.Empty;
    }
}