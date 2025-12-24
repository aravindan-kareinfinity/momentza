using Microsoft.AspNetCore.Mvc;
using Momantza.Services;
using Momantza.Models;

namespace Momantza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly ITicketDataService _ticketService;

        public TicketsController(ITicketDataService ticketService)
        {
            _ticketService = ticketService;
        }

        [HttpGet]
        public async Task<ActionResult<List<TicketItem>>> GetAll()
        {
            try
            {
                var tickets = await _ticketService.GetAllAsync();
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TicketItem>> GetById(string id)
        {
            try
            {
                var ticket = await _ticketService.GetByIdAsync(id);
                if (ticket == null)
                {
                    return NotFound(new { error = "Ticket not found" });
                }
                return Ok(ticket);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<TicketItem>> Create(TicketItem ticket)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var createdTicket = await _ticketService.CreateAsync(ticket);
                return CreatedAtAction(nameof(GetById), new { id = createdTicket.Id }, createdTicket);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("{id}")]
        public async Task<ActionResult<TicketItem>> Update(string id, TicketItem ticket)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var updatedTicket = await _ticketService.UpdateAsync(id, ticket);
                return Ok(updatedTicket);
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
                var deleted = await _ticketService.DeleteAsync(id);
                if (!deleted)
                {
                    return NotFound(new { error = "Ticket not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("bookings/{bookingId}/tickets")]
        public async Task<ActionResult<List<TicketItem>>> GetByBookingId(string bookingId)
        {
            try
            {
                var tickets = await _ticketService.GetTicketsByBookingIdAsync(bookingId);
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("{id}/status")]
        public async Task<ActionResult<TicketItem>> UpdateStatus(string id, string status)
        {
            try
            {
                var updatedTicket = await _ticketService.UpdateTicketStatusAsync(id, status);
                return Ok(updatedTicket);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("status/{status}")]
        public async Task<ActionResult<List<TicketItem>>> GetByStatus(string status)
        {
            try
            {
                var tickets = await _ticketService.GetTicketsByStatusAsync(status);
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("assigned/{assignedTo}")]
        public async Task<ActionResult<List<TicketItem>>> GetByAssignedTo(string assignedTo)
        {
            try
            {
                var tickets = await _ticketService.GetTicketsByAssignedToAsync(assignedTo);
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
} 