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

builder.Services.AddSingleton<IOrganizationResolver, DomainOrganizationResolver>();

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
app.UseStaticFiles();

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

// SPA catch-all route: serve webui/index.html for all non-API routes
app.MapFallback(async context =>
{
    // Skip if it's an API route
    if (context.Request.Path.Value?.StartsWith("/api", StringComparison.OrdinalIgnoreCase) == true)
    {
        context.Response.StatusCode = 404;
        return;
    }

    // Serve webui/index.html for SPA routing
    var webuiIndexPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "webui", "index.html");
    if (File.Exists(webuiIndexPath))
    {
        await context.Response.SendFileAsync(webuiIndexPath);
    }
    else
    {
        context.Response.StatusCode = 404;
        await context.Response.WriteAsync("WebUI not found");
    }
});

// Fallback to index.html for SPA routing (must be last)
// This handles all client-side routes like /hall/:id, /booking/:id, etc.
app.MapFallbackToFile("index.html");


app.Run();