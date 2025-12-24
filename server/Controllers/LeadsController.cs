using Microsoft.AspNetCore.Mvc;
using MomantzaApp.dataservice;
using MomantzaApp.model;

namespace MomantzaApp.Controllers
{
    [ApiController]
    [Route("api/leads")]
    public class LeadsController : ControllerBase
    {
        private readonly ILeadsDataService _leadsDataService;

        public LeadsController(ILeadsDataService leadsDataService)
        {
            _leadsDataService = leadsDataService;
        }

        // CREATE LEAD (from Contact Us)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Leads lead)
        {
            if (lead == null || string.IsNullOrWhiteSpace(lead.Name) || string.IsNullOrWhiteSpace(lead.Mobile))
            {
                return BadRequest("Name and Mobile are required");
            }

            var result = await _leadsDataService.CreateAsync(lead);
            return Ok(result);
        }

        // GET ALL LEADS (Admin)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var leads = await _leadsDataService.GetAllAsync();
            return Ok(leads);
        }
    }
}
