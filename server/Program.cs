using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.IO;
using Momantza.Services;
using Momantza.Middleware;
using MomantzaApp.dataservice;
using MomantzaApp.DataService;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // Use camelCase
    });

builder.Services.AddHttpContextAccessor();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader(); // allow X-Organization-Id
    });
});

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured")))
        };
    });

//builder.Services.AddSingleton<IOrganizationResolver, DomainOrganizationResolver>();
builder.Services.AddScoped<IOrganizationResolver, DomainOrganizationResolver>();

// Return an empty OrganizationContext when not present instead of throwing.
builder.Services.AddScoped<OrganizationContext>(_ =>
{
    var context = _.GetRequiredService<IHttpContextAccessor>().HttpContext;
    // return existing or an empty OrganizationContext (avoid throwing)
    return context?.Items["Organization"] as OrganizationContext ?? new OrganizationContext();
});

// Register data services
builder.Services.AddScoped<IAuthDataService, AuthDataService>();
builder.Services.AddScoped<IOrganizationsDataService, OrganizationsDataService>();
builder.Services.AddScoped<IUserDataService, UserDataService>();
builder.Services.AddScoped<IHallDataService, HallDataService>();
builder.Services.AddScoped<IBookingDataService, BookingDataService>();
builder.Services.AddScoped<IReviewDataService, ReviewDataService>();
builder.Services.AddScoped<ICarouselItemDataService, CarouselItemDataService>();
builder.Services.AddScoped<IMicrositeDataService, MicrositeDataService>();
builder.Services.AddScoped<IMicrositeComponentDataService, MicrositeComponentDataService>();
builder.Services.AddScoped<ICustomerClicksDataService, CustomerClicksDataService>();
builder.Services.AddScoped<IServicesDataService, ServicesDataService>();
builder.Services.AddScoped<IBillingDataService, BillingDataService>();
builder.Services.AddScoped<ISettingsDataService, SettingsDataService>();
builder.Services.AddScoped<IGalleryDataService, GalleryDataService>();
builder.Services.AddScoped<ICommunicationDataService, CommunicationDataService>();
builder.Services.AddScoped<ITicketDataService, TicketDataService>();
builder.Services.AddScoped<IInventoryDataService, InventoryDataService>();
builder.Services.AddScoped<IStatisticsDataService, StatisticsDataService>();
builder.Services.AddScoped<IHandoverDataService, HandoverDataService>();
builder.Services.AddScoped<IChatBotDataService, ChatBotDataService>();
builder.Services.AddScoped<IPaymentDataService, PaymentDataService>();
builder.Services.AddScoped<IFeatureDataService, FeatureDataService>();
builder.Services.AddHttpContextAccessor();
//builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Middleware ordering: resolve organization BEFORE authentication/authorization
// Configure static files to serve from wwwroot
// This ensures assets in wwwroot/assets/ are accessible at /assets/
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Add cache headers for static assets (1 year for hashed assets, no cache for HTML)
        var path = ctx.File.Name.ToLower();
        var requestPath = ctx.Context.Request.Path.Value?.ToLower() ?? "";
        
        // Log static file requests for debugging
        if (requestPath.Contains("/assets/"))
        {
            Console.WriteLine($"[StaticFiles] Serving: {requestPath} -> {ctx.File.PhysicalPath}");
        }
        
        if (path.EndsWith(".html"))
        {
            // No cache for HTML files to ensure fresh content
            ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
            ctx.Context.Response.Headers.Append("Pragma", "no-cache");
            ctx.Context.Response.Headers.Append("Expires", "0");
        }
        else if (requestPath.Contains("/assets/"))
        {
            // Long cache for hashed assets (they have content hashes in filename)
            ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=31536000, immutable");
        }
    }
});

// Serve webui assets at root /assets path
//app.UseStaticFiles(new StaticFileOptions
//{
//    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
//        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "webui", "assets")),
//    RequestPath = "/assets"
//});

//// Also serve webui static files directly from /webui path (for favicon, etc.)
//app.UseStaticFiles(new StaticFileOptions
//{
//    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
//        Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "webui")),
//    RequestPath = "/webui"
//});

app.UseCors("AllowAll");

// <-- run resolver early so HttpContext.Items["Organization"] is set for controllers/services
app.UseMiddleware<OrganizationResolverMiddleware>();
app.UseRouting();
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

// Always map MVC routes first (these take precedence)
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Landing}/{id?}");

// Add subdomain route for frontend serving
app.MapControllerRoute(
    name: "subdomain",
    pattern: "{action=Frontend}",
    defaults: new { controller = "Home" });

// Add route to handle subdomain requests directly
app.MapControllerRoute(
    name: "subdomain-direct",
    pattern: "subdomain/{subdomain?}",
    defaults: new { controller = "Home", action = "SubdomainDirect" });

// Keep API routes for backward compatibility
app.MapControllers();


// Serve webui config.json at /config.json
app.MapGet("/config.json", async context =>
{
    var configPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "webui", "config.json");
    if (File.Exists(configPath))
    {
        context.Response.ContentType = "application/json";
        await context.Response.SendFileAsync(configPath);
    }
    else
    {
        // Fallback to root config.json
        var rootConfigPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "config.json");
        if (File.Exists(rootConfigPath))
        {
            context.Response.ContentType = "application/json";
            await context.Response.SendFileAsync(rootConfigPath);
        }
        else
        {
            context.Response.StatusCode = 404;
        }
    }
});

// Serve webui favicon at /favicon.ico
app.MapGet("/favicon.ico", async context =>
{
    var faviconPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "webui", "favicon.ico");
    if (File.Exists(faviconPath))
    {
        context.Response.ContentType = "image/x-icon";
        await context.Response.SendFileAsync(faviconPath);
    }
    else
    {
        context.Response.StatusCode = 404;
    }
});

// SPA catch-all route: serve wwwroot/index.html for all non-API routes (only when subdomain exists)
app.MapFallback(async context =>
{
    // Skip if it's an API route
    if (context.Request.Path.Value?.StartsWith("/api", StringComparison.OrdinalIgnoreCase) == true)
    {
        context.Response.StatusCode = 404;
        return;
    }

    // Only serve SPA if there's a subdomain (for subdomain-based multi-tenant routing)
    var subdomain = context.Items["Subdomain"]?.ToString();
    if (string.IsNullOrEmpty(subdomain))
    {
        // No subdomain - let MVC handle it (return 404 so MVC can handle it)
        context.Response.StatusCode = 404;
        return;
    }

    // Serve wwwroot/index.html for SPA routing (when subdomain exists)
    var indexPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "index.html");
    
    // Log for debugging
    Console.WriteLine($"[SPA Fallback] ContentRootPath: {builder.Environment.ContentRootPath}");
    Console.WriteLine($"[SPA Fallback] Looking for index.html at: {indexPath}");
    Console.WriteLine($"[SPA Fallback] File exists: {File.Exists(indexPath)}");
    
    if (File.Exists(indexPath))
    {
        context.Response.ContentType = "text/html; charset=utf-8";
        // Add no-cache headers to prevent stale HTML from being served
        context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        context.Response.Headers.Append("Pragma", "no-cache");
        context.Response.Headers.Append("Expires", "0");
        await context.Response.SendFileAsync(indexPath);
    }
    else
    {
        // Try alternative paths
        var altPaths = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html"),
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wwwroot", "index.html"),
            Path.Combine(AppContext.BaseDirectory, "wwwroot", "index.html")
        };
        
        string? foundPath = null;
        foreach (var altPath in altPaths)
        {
            Console.WriteLine($"[SPA Fallback] Trying alternative path: {altPath}");
            if (File.Exists(altPath))
            {
                foundPath = altPath;
                Console.WriteLine($"[SPA Fallback] Found index.html at: {altPath}");
                break;
            }
        }
        
        if (foundPath != null)
        {
            context.Response.ContentType = "text/html; charset=utf-8";
            context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
            context.Response.Headers.Append("Pragma", "no-cache");
            context.Response.Headers.Append("Expires", "0");
            await context.Response.SendFileAsync(foundPath);
        }
        else
        {
            context.Response.StatusCode = 404;
            var errorMsg = $"SPA index.html not found. Tried:\n- {indexPath}\n" + string.Join("\n- ", altPaths);
            Console.WriteLine($"[SPA Fallback] ERROR: {errorMsg}");
            await context.Response.WriteAsync(errorMsg);
        }
    }
});

// Note: MapFallbackToFile removed - we only want SPA fallback for subdomain routes
// MVC routes should be handled by MVC routing, not fallback to index.html


app.Run();