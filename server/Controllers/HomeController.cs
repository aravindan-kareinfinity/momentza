using Microsoft.AspNetCore.Mvc;
using Momantza.Middleware;
using Momantza.Services;
using System.IO;

namespace Momantza.Controllers
{
    public class HomeController : Controller
    {
        private readonly IOrganizationsDataService _organizationService;

        public HomeController(IOrganizationsDataService organizationService)
        {
            _organizationService = organizationService;
        }

        public IActionResult Index()
        {
            // Serve the webui/index.html for SPA
            var webuiIndexPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "webui", "index.html");
            if (System.IO.File.Exists(webuiIndexPath))
            {
                return PhysicalFile(webuiIndexPath, "text/html");
            }
            return View();
        }

        public IActionResult Landing()
        {
            // Serve the webui/index.html for SPA
            var webuiIndexPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "webui", "index.html");
            if (System.IO.File.Exists(webuiIndexPath))
            {
                return PhysicalFile(webuiIndexPath, "text/html");
            }
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Subdomain()
        {
            try
            {
                // Get subdomain and organization context from middleware
                var subdomain = HttpContext.Items["Subdomain"]?.ToString();
                var orgContext = HttpContext.Items["Organization"] as OrganizationContext;
                
                if (orgContext == null)
                {
                    return NotFound("Organization not found for this subdomain");
                }

                // Get full organization details
                var organization = await _organizationService.GetByIdAsync(orgContext.OrganizationId.ToString());
                
                if (organization == null)
                {
                    return NotFound("Organization details not found");
                }

                // Return organization data as JSON for frontend consumption
                return Json(new
                {
                    organizationId = organization.Id,
                    organizationName = organization.Name,
                    customDomain = organization.CustomDomain,
                    defaultDomain = organization.DefaultDomain,
                    logo = organization.Logo,
                    theme = organization.Theme,
                    subdomain = subdomain
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to load organization data", details = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult Frontend()
        {
            try
            {
                // Get organization context from middleware
                var orgContext = HttpContext.Items["Organization"] as OrganizationContext;
                
                if (orgContext == null)
                {
                    // Redirect to webui at 192.168.1.21:8080
                    return Redirect("http://192.168.1.21:8080/");
                }

                // Redirect to webui with organization ID in URL path
                var frontendUrl = $"http://192.168.1.21:8080/{orgContext.OrganizationId}";
                return Redirect(frontendUrl);
            }
            catch (Exception)
            {
                // Fallback to webui at 192.168.1.21:8080
                return Redirect("http://192.168.1.21:8080/");
            }
        }

        [HttpGet]
        public async Task<IActionResult> SubdomainDirect(string? subdomain)
        {
            try
            {
                // Get subdomain from context or parameter
                var contextSubdomain = HttpContext.Items["Subdomain"]?.ToString();
                var targetSubdomain = subdomain ?? contextSubdomain;
                
                if (!string.IsNullOrEmpty(targetSubdomain))
                {
                    var organization = await _organizationService.GetByDomainAsync(targetSubdomain);
                    
                    if (organization != null)
                    {
                        // Redirect to webui with organization ID in URL path
                        var frontendUrl = $"http://192.168.1.21:8080/{organization.Id}";
                        return Redirect(frontendUrl);
                    }
                }

                // Get organization context from middleware
                var orgContext = HttpContext.Items["Organization"] as OrganizationContext;
                
                if (orgContext != null)
                {
                    // Redirect to webui with organization ID in URL path
                    var frontendUrl = $"http://192.168.1.21:8080/{orgContext.OrganizationId}";
                    return Redirect(frontendUrl);
                }

                // Fallback to webui at 192.168.1.21:8080
                return Redirect("http://192.168.1.21:8080/");
            }
            catch (Exception)
            {
                // Fallback to webui at 192.168.1.21:8080
                return Redirect("http://192.168.1.21:8080/");
            }
        }

    }
}
