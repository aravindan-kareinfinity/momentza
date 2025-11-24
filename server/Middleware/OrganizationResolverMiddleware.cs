using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
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
            // LOGS for checking purpose
            Console.WriteLine("============== 🌐 DOMAIN DEBUG ==============");
            Console.WriteLine($"Full Host: {host}");
            Console.WriteLine($"Subdomain: {subdomain}");
            Console.WriteLine($"Domain: {domain}");
            Console.WriteLine($"Request Path: {context.Request.Path}");
            Console.WriteLine("=============================================");

            // Store subdomain and domain in context for use by resolver/controllers
            context.Items["Subdomain"] = subdomain;
            context.Items["Domain"] = domain;

            // FIRST: Try to resolve organization from subdomain
            var org = await resolver.ResolveAsync(context);

            // SECOND: If subdomain resolution failed, check URL path patterns
            if (org == null)
            {
                var segments = context.Request.Path.Value?.Split(new[] {'/'}, StringSplitOptions.RemoveEmptyEntries);
                if (segments != null && segments.Length >= 2 && segments[0].Equals("org", StringComparison.OrdinalIgnoreCase))
                {
                    var orgIdFromUrl = segments[1];
                    context.Items["OrganizationIdFromUrl"] = orgIdFromUrl;
                    Console.WriteLine($"Organization ID found in URL (/org/ pattern): {orgIdFromUrl}");

                    // Try to resolve organization again with URL-based ID
                    org = await resolver.ResolveAsync(context);
                }
                // Check for direct UUID in root path (e.g., /{uuid})
                else if (segments.Length == 1 && !string.IsNullOrEmpty(segments[0]) && IsValidGuid(segments[0]))
                {
                    var orgIdFromUrl = segments[0];
                    context.Items["OrganizationIdFromUrl"] = orgIdFromUrl;
                    Console.WriteLine($"Organization ID found in URL (direct UUID): {orgIdFromUrl}");

                    // Try to resolve organization again with URL-based ID
                    org = await resolver.ResolveAsync(context);
                }
            }
            if (org != null)
            {
                context.Items["Organization"] = org;
                // ensure a simple string id is always available
                context.Items["OrganizationId"] = org.OrganizationId.ToString();

                // Handle subdomain rerouting directly in middleware
                if (!string.IsNullOrEmpty(subdomain) && context.Request.Path.Value == "/")
                {
                    var frontendUrl = $"http://{subdomain}.localhost:8080/{org.OrganizationId}";
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
            // Use the subdomain stored by the middleware (fallback to host)
            var subdomainObj = context.Items["Subdomain"];
            var subdomain = (subdomainObj as string) ?? context.Request.Host.Host ?? string.Empty;
            subdomain = subdomain.ToLowerInvariant();

            if (!string.IsNullOrEmpty(subdomain))
            {
                try
                {
                    using var connection = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));
                    await connection.OpenAsync();

                    var sql = "SELECT id, customdomain, name FROM organization WHERE lower(defaultdomain) LIKE @subdomainPattern OR lower(customdomain) LIKE @subdomainPattern LIMIT 1";
                    using var command = new NpgsqlCommand(sql, connection);
                    // search lower-cased domain fields with a prefix match
                    command.Parameters.AddWithValue("@subdomainPattern", $"{subdomain}%");

                    using var reader = await command.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        Console.WriteLine($"Organization found for subdomain '{subdomain}': {reader.GetString(0)}");
                        return new OrganizationContext
                        {
                            OrganizationId = Guid.Parse(reader.GetString(0)),
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
                            OrganizationId = Guid.Parse(reader.GetString(0)),
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