using Microsoft.AspNetCore.Mvc;
using Momantza.Services;

namespace Momantza.Controllers
{
    public class ExploreOrganisationController : Controller
    {
        private readonly IOrganizationsDataService _organizationsDataService;
        private readonly IHallDataService _hallDataService;

        public ExploreOrganisationController(
            IOrganizationsDataService organizationsDataService,
            IHallDataService hallDataService)
        {
            _organizationsDataService = organizationsDataService;
            _hallDataService = hallDataService;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            try
            {
                // Fetch data from your API endpoints
                var halls = await FetchHallsFromApi();
                var bookings = await FetchBookingsFromApi();
                
                var viewModel = new
                {
                    Halls = halls,
                    Bookings = bookings
                };

                return View(viewModel);
            }
            catch (Exception ex)
            {
                // If API fails, return empty data
                var viewModel = new
                {
                    Halls = new List<object>(),
                    Bookings = new List<object>()
                };
                return View(viewModel);
            }
        }

        private async Task<List<object>> FetchHallsFromApi()
        {
            try
            {
                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync("http://localhost:5000/api/halls");
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    return System.Text.Json.JsonSerializer.Deserialize<List<object>>(jsonContent) ?? new List<object>();
                }
            }
            catch (Exception ex)
            {
                // Log error if needed
            }
            
            return new List<object>();
        }

        private async Task<List<object>> FetchBookingsFromApi()
        {
            try
            {
                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync("http://localhost:5000/api/bookings/search");
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    return System.Text.Json.JsonSerializer.Deserialize<List<object>>(jsonContent) ?? new List<object>();
                }
            }
            catch (Exception ex)
            {
                // Log error if needed
            }
            
            return new List<object>();
        }

        [HttpGet]
        public async Task<IActionResult> Details(string id)
        {
            try
            {
                var hall = await _hallDataService.GetByIdAsync(id);
                if (hall == null)
                {
                    return NotFound();
                }

                return View(hall);
            }
            catch (Exception ex)
            {
                return NotFound();
            }
        }
    }
}
