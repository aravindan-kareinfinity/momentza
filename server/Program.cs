using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using Momantza.Services;
using Momantza.Middleware;

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
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001", 
                "http://localhost:4173",
                "https://localhost:3000",
                "https://localhost:3001",
                "http://localhost:8080",
                "https://localhost:8080",
                "http://192.168.1.21:8080",
                "https://192.168.1.21:8080"
              )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
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
builder.Services.AddScoped<OrganizationContext>(_ =>
{
    var context = _.GetRequiredService<IHttpContextAccessor>().HttpContext;
    return context?.Items["Organization"] as OrganizationContext ?? throw new UnauthorizedAccessException();
});

// Register all data services with IConfiguration dependency
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

var app = builder.Build();

// Correct middleware order
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseSession();
app.UseMiddleware<OrganizationResolverMiddleware>();

// Configure MVC routing
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
app.Run();
