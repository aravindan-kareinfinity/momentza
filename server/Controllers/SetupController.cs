using Microsoft.AspNetCore.Mvc;
using Momantza.Models;
using Momantza.Services;

namespace Momantza.Controllers
{
    public class SetupController : Controller
    {
        private readonly IOrganizationsDataService _organizationsDataService;
        private readonly IUserDataService _userDataService;

        public SetupController(
            IOrganizationsDataService organizationsDataService,
            IUserDataService userDataService)
        {
            _organizationsDataService = organizationsDataService;
            _userDataService = userDataService;
        }

        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Create(string orgName, string contactPerson, string contactNumber, 
            string userName, string email, string password)
        {
            try
            {
                // Generate unique IDs
                var organizationId = Guid.NewGuid().ToString();
                var userId = Guid.NewGuid().ToString();

                // Create organization
                var organization = new Organizations
                {
                    Id = organizationId,
                    Name = orgName,
                    ContactPerson = contactPerson,
                    ContactNo = contactNumber,
                    DefaultDomain = orgName.ToLower().Replace(" ", ""),
                    Theme = new OrganizationTheme(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Create user
                var user = new Users
                {
                    Id = userId,
                    Name = userName,
                    Email = email,
                    Password = password,
                    Role = "admin",
                    OrganizationId = organizationId,
                    AccessibleHalls = new List<string>(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Save organization
                var orgResult = await _organizationsDataService.CreateAsync(organization);
                if (!orgResult)
                {
                    return Json(new { success = false, message = "Failed to create organization" });
                }

                // Save user
                var userResult = await _userDataService.CreateAsync(user);
                if (!userResult)
                {
                    return Json(new { success = false, message = "Failed to create user" });
                }

                // Store in session
                HttpContext.Session.SetString("OrganizationId", organizationId);
                HttpContext.Session.SetString("UserId", userId);
                HttpContext.Session.SetString("UserRole", "admin");

                return Json(new { 
                    success = true, 
                    message = "Organization and user created successfully!",
                    organizationId = organizationId,
                    userId = userId
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + ex.Message });
            }
        }
    }
}