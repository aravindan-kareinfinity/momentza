using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
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
            // Handles ANY subdomain: "sd", "x", "kjsenfkj", "whatever", etc.
            var host = context.Request.Host.Host.ToLower();
            var parts = host.Split('.');

            string subdomain = "";
            string domain = "";
            bool isDevelopmentLocalhost = false;

            // Extract subdomain from ANY hostname format
            // Examples:
            // - "momantza.com" -> NO subdomain (base domain)
            // - "sd.momantza.com" -> subdomain="sd", domain="momantza.com"
            // - "x.localhost" -> subdomain="x", domain="localhost" (for local dev)
            // - "kjsenfkj.momantza.com" -> subdomain="kjsenfkj", domain="momantza.com"
            // - "whatever.example.com" -> subdomain="whatever", domain="example.com"
            // - "localhost" -> NO subdomain, domain="localhost" (development base domain)
            
            // A subdomain exists only if there are 3+ parts (subdomain.domain.tld)
            // For 2 parts (domain.tld), it's the base domain with no subdomain
            if (parts.Length >= 3)
            {
                // Has subdomain: subdomain.domain.tld
                subdomain = parts[0].Trim(); // First part is subdomain (any value)
                domain = string.Join(".", parts.Skip(1)); // Rest is domain
            }
            else if (parts.Length == 2)
            {
                // Base domain: domain.tld (no subdomain)
                // Examples: "momantza.com", "example.com"
                // Special case: "subdomain.localhost" (2 parts, but localhost is special)
                if (parts[1] == "localhost")
                {
                    // This is actually a subdomain: "storesoft.localhost" -> subdomain="storesoft"
                    subdomain = parts[0].Trim();
                    domain = "localhost";
                }
                else
                {
                    // Base domain: domain.tld (no subdomain)
                    subdomain = ""; // No subdomain
                    domain = host; // Full host is the domain
                }
            }
            else
            {
                // Single part: just "localhost" or IP address
                subdomain = "";
                domain = host;
                
                // Mark as development localhost (no subdomain)
                if (host == "localhost" || host == "127.0.0.1")
                {
                    isDevelopmentLocalhost = true;
                }
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
            context.Items["IsDevelopmentLocalhost"] = isDevelopmentLocalhost;

            // FIRST: Try to resolve organization from subdomain
            // In development, if accessing localhost without subdomain, skip organization resolution
            // This allows the base domain to work in development (serves MVC landing page)
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

                // Don't redirect - let the fallback route in Program.cs serve the SPA
                // The SPA will be served by the MapFallback route when subdomain exists
                    Console.WriteLine($"Subdomain '{subdomain}' resolved to organization '{org.OrganizationId}'");
            }

            await _next(context);
        }
    }

    public class DomainOrganizationResolver : IOrganizationResolver
    {
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _environment;

        public DomainOrganizationResolver(IConfiguration config, IWebHostEnvironment environment)
        {
            _config = config;
            _environment = environment;
        }

        public async Task<OrganizationContext?> ResolveAsync(HttpContext context)
        {
            // Get full hostname and subdomain
            // Handles ANY subdomain value: "sd", "x", "kjsenfkj", "whatever", etc.
            var fullHost = context.Request.Host.Host.ToLowerInvariant().Trim();
            var subdomainObj = context.Items["Subdomain"];
            var subdomain = (subdomainObj as string) ?? string.Empty;
            subdomain = subdomain.ToLowerInvariant().Trim();
            var isDevelopmentLocalhost = context.Items["IsDevelopmentLocalhost"] as bool? ?? false;

            // SPECIAL CASE: In development, if accessing plain localhost (no subdomain),
            // skip organization resolution to allow base domain to work (serves MVC landing page)
            // This matches production behavior where momantza.com (base domain) works without organization
            if (_environment.IsDevelopment() && isDevelopmentLocalhost && string.IsNullOrEmpty(subdomain))
            {
                Console.WriteLine($"Development mode: Skipping organization resolution for base localhost '{fullHost}'");
                return null; // Allow request to proceed without organization (base domain behavior)
            }

            // Only proceed if we have a valid hostname or subdomain
            // Empty strings, whitespace, or null are ignored
            if ((!string.IsNullOrWhiteSpace(subdomain) && subdomain.Length > 0) || 
                (!string.IsNullOrWhiteSpace(fullHost) && fullHost.Length > 0))
            {
                try
                {
                    using var connection = new NpgsqlConnection(_config.GetConnectionString("DefaultConnection"));
                    await connection.OpenAsync();

                    // PRIORITY 1: Try exact match on full hostname first (most accurate)
                    // This handles: pakshi.momantza.com -> matches defaultdomain='pakshi.momantza.com'
                    var sql = @"
                        SELECT id, customdomain, name 
                        FROM organization 
                        WHERE lower(defaultdomain) = @fullHost 
                           OR lower(customdomain) = @fullHost 
                        LIMIT 1";
                    using var command = new NpgsqlCommand(sql, connection);
                    command.Parameters.AddWithValue("@fullHost", fullHost);

                    using var reader = await command.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        Console.WriteLine($"Organization found for full host '{fullHost}': {reader.GetString(0)}");
                        return new OrganizationContext
                        {
                            OrganizationId = Guid.Parse(reader.GetString(0)),
                            Domain = reader.IsDBNull(1) ? string.Empty : reader.GetString(1)
                        };
                    }

                    // PRIORITY 2: If no exact match and we have a subdomain, try subdomain match
                    // This handles ANY subdomain: "sd", "x", "kjsenfkj", "pakshi", etc.
                    // Matches: defaultdomain='pakshi' or 'pakshi.localhost' or 'x' or 'sd.momantza.com'
                    if (!string.IsNullOrWhiteSpace(subdomain) && subdomain.Length > 0)
                    {
                        sql = @"
                            SELECT id, customdomain, name 
                            FROM organization 
                            WHERE lower(defaultdomain) = @subdomain 
                               OR lower(defaultdomain) LIKE @subdomainPattern
                               OR lower(customdomain) = @subdomain
                               OR lower(customdomain) LIKE @subdomainPattern
                            LIMIT 1";
                        using var subdomainCommand = new NpgsqlCommand(sql, connection);
                        subdomainCommand.Parameters.AddWithValue("@subdomain", subdomain);
                        subdomainCommand.Parameters.AddWithValue("@subdomainPattern", $"{subdomain}.%");

                        using var subdomainReader = await subdomainCommand.ExecuteReaderAsync();
                        if (await subdomainReader.ReadAsync())
                        {
                            Console.WriteLine($"Organization found for subdomain '{subdomain}': {subdomainReader.GetString(0)}");
                            return new OrganizationContext
                            {
                                OrganizationId = Guid.Parse(subdomainReader.GetString(0)),
                                Domain = subdomainReader.IsDBNull(1) ? string.Empty : subdomainReader.GetString(1)
                            };
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error resolving organization for host '{fullHost}' / subdomain '{subdomain}': {ex.Message}");
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
                            Domain = reader.IsDBNull(1) ? string.Empty : reader.GetString(1)
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