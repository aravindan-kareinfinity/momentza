using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
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

var app = builder.Build();

// Middleware ordering: resolve organization BEFORE authentication/authorization
app.UseStaticFiles();

app.UseCors("AllowAll");

// <-- run resolver early so HttpContext.Items["Organization"] is set for controllers/services
app.UseMiddleware<OrganizationResolverMiddleware>();
app.UseRouting();
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

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