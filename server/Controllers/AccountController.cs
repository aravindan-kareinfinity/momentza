using Microsoft.AspNetCore.Mvc;
using Momantza.Services;

namespace MomantzaApp.Controllers
{
    public class AccountController : Controller
    {
        private readonly IUserDataService _userDataService;
        private readonly IOrganizationsDataService _organizationsDataService;
        private readonly IAuthDataService _authService;

        public AccountController(
            IUserDataService userDataService,
            IAuthDataService authService,
            IOrganizationsDataService organizationsDataService)
        {
            _authService = authService;
            _userDataService = userDataService;
            _organizationsDataService = organizationsDataService;
        }

        // ✅ GET /login
        [HttpGet("/login")]
        public async Task<IActionResult> Login()
        {
            var session = await _authService.GetActiveSessionFromCookieAsync();

            if (session != null)
            {
                var org = await _organizationsDataService.GetByIdAsync(session.OrganizationId);
                if (org != null)
                {
                    var protocol = Request.Scheme;

                    var redirectUrl =
                        Request.Host.Host == "localhost"
                            ? $"{protocol}://{org.DefaultDomain}.localhost:8082/home"
                            : $"{protocol}://{org.DefaultDomain}.momentza.com/home";

                    return Redirect(redirectUrl);
                }
            }

            return View();
        }

        // ✅ POST /login
        [HttpPost("/login")]
        public async Task<IActionResult> Login(string email, string password)
        {
            var user = await _userDataService.GetByEmailAndOrganizationLoginAsync(email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
            {
                TempData["LoginError"] = "Invalid email or password";
                return RedirectToAction("Login");
            }

            var org = await _organizationsDataService.GetByIdAsync(user.OrganizationId);
            if (org == null)
            {
                TempData["LoginError"] = "Organization not found";
                return RedirectToAction("Login");
            }

            var protocol = Request.Scheme;

            var redirectUrl =
                Request.Host.Host == "localhost"
                    ? $"{protocol}://{org.DefaultDomain}.localhost:8082/home"
                    : $"{protocol}://{org.DefaultDomain}.momentza.com/home";

            return Redirect(redirectUrl);
        }

        // ✅ POST /logout
        [HttpPost("/logout")]
        public IActionResult Logout()
        {
            return Redirect("/login");
        }
    }
}
