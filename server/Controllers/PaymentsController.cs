using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentDataService _paymentService;

        public PaymentsController(IPaymentDataService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet]
        public async Task<ActionResult<List<PaymentItem>>> GetAll()
        {
            try
            {
                var payments = await _paymentService.GetAllAsync();
                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentItem>> GetById(string id)
        {
            try
            {
                var payment = await _paymentService.GetByIdAsync(id);
                if (payment == null)
                {
                    return NotFound(new { error = "Payment not found" });
                }
                return Ok(payment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<PaymentItem>> Create(PaymentItem payment)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdPayment = await _paymentService.CreateAsync(payment);
                return CreatedAtAction(nameof(GetById), new { id = createdPayment.Id }, createdPayment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<ActionResult<PaymentItem>> Update(string id, PaymentItem payment)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var updatedPayment = await _paymentService.UpdateAsync(id, payment);
                return Ok(updatedPayment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _paymentService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { error = "Payment not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("bookings/{bookingId}")]
        public async Task<ActionResult<List<PaymentItem>>> GetByBookingId(string bookingId)
        {
            try
            {
                var payments = await _paymentService.GetPaymentsByBookingIdAsync(bookingId);
                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("mode/{paymentMode}")]
        public async Task<ActionResult<List<PaymentItem>>> GetByPaymentMode(string paymentMode)
        {
            try
            {
                var payments = await _paymentService.GetPaymentsByModeAsync(paymentMode);
                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("date-range")]
        public async Task<ActionResult<List<PaymentItem>>> GetByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var payments = await _paymentService.GetPaymentsByDateRangeAsync(startDate, endDate);
                return Ok(payments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
