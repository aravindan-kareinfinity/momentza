using Microsoft.AspNetCore.Http;
using Npgsql;

namespace Momantza.Middleware
{
    public class OrganizationContext
    {
        public Guid OrganizationId { get; set; }
        public string Domain { get; set; } = string.Empty;
    }

    public interface IOrganizationResolver
    {
        Task<OrganizationContext?> ResolveAsync(HttpContext context);
    }

    public class OrganizationResolverMiddleware
    {
        private readonly RequestDelegate _next;

        public OrganizationResolverMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        private static bool IsValidGuid(string guidString)
        {
            return Guid.TryParse(guidString, out _);
        }

        public async Task InvokeAsync(HttpContext context, IOrganizationResolver resolver)
        {
            // Get host and extract subdomain and domain
            var host = context.Request.Host.Host.ToLower();
            var parts = host.Split('.');
            
            string subdomain = "";
            string domain = "";
            
            if (parts.Length >= 2)
            {
                subdomain = parts[0]; // First part is subdomain
                domain = string.Join(".", parts.Skip(1)); // Rest is domain
            }
            else
            {
                domain = host; // No subdomain, use full host as domain
            }
            
            // Store subdomain and domain in context for use by controllers
            context.Items["Subdomain"] = subdomain;
            context.Items["Domain"] = domain;
            
            // FIRST: Try to resolve organization from subdomain
            var org = await resolver.ResolveAsync(context);
            
            // SECOND: If subdomain resolution failed, check URL path patterns
            if (org == null)
            {
                var path = context.Request.Path.Value?.ToLower();
                if (path != null)
                {
                    var pathParts = path.Split('/');
                    
                    // Check for /org/{orgId} pattern
                    if (path.StartsWith("/org/") && pathParts.Length >= 3 && !string.IsNullOrEmpty(pathParts[2]))
                    {
                        var orgIdFromUrl = pathParts[2];
                        context.Items["OrganizationIdFromUrl"] = orgIdFromUrl;
                        Console.WriteLine($"Organization ID found in URL (/org/ pattern): {orgIdFromUrl}");
                        
                        // Try to resolve organization again with URL-based ID
                        org = await resolver.ResolveAsync(context);
                    }
                    // Check for direct UUID in root path (e.g., /{uuid})
                    else if (pathParts.Length == 2 && !string.IsNullOrEmpty(pathParts[1]) && IsValidGuid(pathParts[1]))
                    {
                        var orgIdFromUrl = pathParts[1];
                        context.Items["OrganizationIdFromUrl"] = orgIdFromUrl;
                        Console.WriteLine($"Organization ID found in URL (direct UUID): {orgIdFromUrl}");
                        
                        // Try to resolve organization again with URL-based ID
                        org = await resolver.ResolveAsync(context);
                    }
                }
            }
            if (org != null)
            {
                context.Items["Organization"] = org;
                
                // Handle subdomain rerouting directly in middleware
                if (!string.IsNullOrEmpty(subdomain) && context.Request.Path.Value == "/")
                {
                    // Redirect to frontend with organization ID in URL path
                    var frontendUrl = $"http://192.168.1.21:8080/{org.OrganizationId}";
                    Console.WriteLine($"Subdomain '{subdomain}' resolved to organization '{org.OrganizationId}'");
                    Console.WriteLine($"Redirecting to: {frontendUrl}");
                    context.Response.Redirect(frontendUrl);
                    return; // Stop processing, don't call _next
                }
            }
            
            await _next(context);
        }
    }

    public class DomainOrganizationResolver : IOrganizationResolver
    {
        private readonly IConfiguration _config;

        public DomainOrganizationResolver(IConfiguration config)
        {
            _config = config;
        }

        public async Task<OrganizationContext?> ResolveAsync(HttpContext context)
        {
            // FIRST: Try subdomain-based resolution
            var subdomain = context.Items["Subdomain"]?.ToString();
            
            if (!string.IsNullOrEmpty(subdomain))
            {
                try
                {
                    using var connection = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));
                    await connection.OpenAsync();
                    
                    var sql = "SELECT id, customdomain, name FROM organization WHERE lower(defaultdomain) LIKE @subdomainPattern OR lower(customdomain) LIKE @subdomainPattern LIMIT 1";
                    using var command = new NpgsqlCommand(sql, connection);
                    command.Parameters.AddWithValue("@subdomainPattern", $"{subdomain}%");
                    
                    using var reader = await command.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        Console.WriteLine($"Organization found for subdomain '{subdomain}': {reader.GetString(0)}");
                        return new OrganizationContext
                        {
                            OrganizationId = new Guid(reader.GetString(0)),
                            Domain = reader.GetString(1)
                        };
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error resolving organization for subdomain '{subdomain}': {ex.Message}");
                }
            }
            
            // SECOND: Fallback to URL-based resolution
            var orgIdFromUrl = context.Items["OrganizationIdFromUrl"]?.ToString();
            if (!string.IsNullOrEmpty(orgIdFromUrl))
            {
                try
                {
                    using var connection = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));
                    await connection.OpenAsync();
                    
                    var sql = "SELECT id, customdomain, name FROM organization WHERE id = @orgId LIMIT 1";
                    using var command = new NpgsqlCommand(sql, connection);
                    command.Parameters.AddWithValue("@orgId", Guid.Parse(orgIdFromUrl));
                    
                    using var reader = await command.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        Console.WriteLine($"Organization found for URL ID '{orgIdFromUrl}': {reader.GetString(0)}");
                        return new OrganizationContext
                        {
                            OrganizationId = new Guid(reader.GetString(0)),
                            Domain = reader.GetString(1)
                        };
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error resolving organization for ID '{orgIdFromUrl}': {ex.Message}");
                }
            }
            
            return null;
        }

    }
} 