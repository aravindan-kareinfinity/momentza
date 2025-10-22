using Microsoft.AspNetCore.Mvc;
using Momentza.Services;
using Momentza.Models;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Momentza.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/v1/[controller]")]
    [Route("api/orgs")]
    public class OrganizationsController : ControllerBase
    {
        private readonly IOrganizationsDataService _organizationDataService;
        private readonly IConfiguration _configuration;

        public OrganizationsController(IOrganizationsDataService organizationDataService, IConfiguration configuration)
        {
            _organizationDataService = organizationDataService;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var organizations = await _organizationDataService.GetAllAsync();
                return Ok(organizations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var organization = await _organizationDataService.GetByIdAsync(id);
                if (organization == null)
                {
                    return NotFound(new { message = "Organization not found" });
                }
                return Ok(organization);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Organizations organization)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var success = await _organizationDataService.CreateAsync(organization);
                if (!success)
                {
                    return StatusCode(500, new { message = "Failed to create organization" });
                }
                return CreatedAtAction(nameof(GetById), new { id = organization.Id }, organization);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] Organizations organization)
        {
            try
            {
                organization.Id = id;
                var success = await _organizationDataService.UpdateAsync(organization);
                if (!success)
                {
                    return NotFound(new { message = "Organization not found" });
                }
                return Ok(await _organizationDataService.GetByIdAsync(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var success = await _organizationDataService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "Organization not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("domain/{domain}")]
        [HttpGet("by-domain/{domain}")]  // Alternative route
        [HttpGet("find/{domain}")]  // Another alternative route
        public async Task<IActionResult> GetByDomain(string domain)
        {
            try
            {
                var organization = await _organizationDataService.GetByDomainAsync(domain);
                if (organization == null)
                {
                    return NotFound(new { message = "Organization not found" });
                }
                return Ok(organization);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("current")]
        [HttpGet("me")]  // Alternative route
        [HttpGet("active")]  // Another alternative route
        public async Task<IActionResult> GetCurrent()
        {
            try
            {
                Console.WriteLine($"GetCurrent method called. Request path: {Request.Path}");
                Console.WriteLine($"Request host: {Request.Host.Host}");
                
                // Get the current domain from the request
                var domain = Request.Host.Host;
                Console.WriteLine($"Looking for organization with domain: {domain}");
                
                var organization = await _organizationDataService.GetByDomainAsync(domain);
                if (organization == null)
                {
                    Console.WriteLine("Organization not found for domain: " + domain);
                    return NotFound(new { message = "Current organization not found" });
                }
                
                Console.WriteLine($"Found organization: {organization.Name}");
                return Ok(organization);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetCurrent: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpGet("DBSync")]
        public async Task<IActionResult> DBSync()
        {
            try
            {
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                if (string.IsNullOrEmpty(connectionString))
                {
                    return BadRequest(new { message = "Database connection string not found" });
                }

                var syncResults = new List<object>();

                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                // Create or sync tables
                var tables = new[]
                {
                    new { Name = "organization", Sql = @"
                        CREATE TABLE IF NOT EXISTS organization (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            contactperson VARCHAR(255),
                            contactno VARCHAR(50),
                            defaultdomain VARCHAR(255),
                            customdomain VARCHAR(255),
                            logo TEXT,
                            theme JSONB,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "users", Sql = @"
                        CREATE TABLE IF NOT EXISTS users (
                            id VARCHAR(50) PRIMARY KEY,
                            email VARCHAR(255) UNIQUE NOT NULL,
                            name VARCHAR(255) NOT NULL,
                            password VARCHAR(255),
                            role VARCHAR(50) DEFAULT 'user',
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            accessible_halls JSONB,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "halls", Sql = @"
                        CREATE TABLE IF NOT EXISTS halls (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            location VARCHAR(255) NOT NULL,
                            address VARCHAR(500) NOT NULL,
                            capacity INTEGER NOT NULL,
                            description TEXT,
                            price DECIMAL(10,2),
                            amenities JSONB,
                            images JSONB,
                            features JSONB,
                            rate_card JSONB,
                            gallery JSONB,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            isactive BOOLEAN DEFAULT true,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "bookings", Sql = @"
                        CREATE TABLE IF NOT EXISTS bookings (
                            id VARCHAR(50) PRIMARY KEY,
                            customer_name VARCHAR(255) NOT NULL,
                            customer_email VARCHAR(255) NOT NULL,
                            customer_phone VARCHAR(50) NOT NULL,
                            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
                            event_type VARCHAR(100) NOT NULL,
                            time_slot VARCHAR(20) NOT NULL,
                            guest_count INTEGER NOT NULL,
                            total_amount DECIMAL(10,2) NOT NULL,
                            status VARCHAR(50) DEFAULT 'pending',
                            is_active BOOLEAN DEFAULT false,
                            customer_response TEXT,
                            last_contact_date TIMESTAMP WITH TIME ZONE,
                            hall_id VARCHAR(50) REFERENCES halls(id),
                            user_id VARCHAR(50) REFERENCES users(id),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            handover_details JSONB,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "reviews", Sql = @"
                        CREATE TABLE IF NOT EXISTS reviews (
                            id VARCHAR(50) PRIMARY KEY,
                            customer_name VARCHAR(255) NOT NULL,
                            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                            comment TEXT,
                            date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            hall_id VARCHAR(50) REFERENCES halls(id),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            isenabled BOOLEAN DEFAULT true
                        )" },
                    
                    new { Name = "galleryimage", Sql = @"
                        CREATE TABLE IF NOT EXISTS galleryimage (
                            id VARCHAR(50) PRIMARY KEY,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            url VARCHAR(500),
                            title VARCHAR(200) NOT NULL,
                            category VARCHAR(50) NOT NULL,
                            uploadedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            imagebytes BYTEA,
                            contenttype VARCHAR(100)
                        )" },
                    
                    new { Name = "carouselitem", Sql = @"
                        CREATE TABLE IF NOT EXISTS carouselitem (
                            id VARCHAR(50) PRIMARY KEY,
                            imageurl VARCHAR(500) NOT NULL,
                            title VARCHAR(255),
                            description TEXT,
                            orderposition INTEGER DEFAULT 0,
                            isactive BOOLEAN DEFAULT true,
                            organizationid VARCHAR(50) REFERENCES organization(id)
                        )" },
                    
                    new { Name = "customerclick", Sql = @"
                        CREATE TABLE IF NOT EXISTS customerclick (
                            id VARCHAR(50) PRIMARY KEY,
                            customerid VARCHAR(50),
                            hallid VARCHAR(50) REFERENCES halls(id),
                            customername VARCHAR(255),
                            customeremail VARCHAR(255),
                            customerphone VARCHAR(50),
                            eventdate TIMESTAMP WITH TIME ZONE,
                            eventtype VARCHAR(100),
                            guestcount INTEGER,
                            message TEXT,
                            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            rating INTEGER,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "serviceitem", Sql = @"
                        CREATE TABLE IF NOT EXISTS serviceitem (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            hsncode VARCHAR(50),
                            taxpercentage DECIMAL(5,2),
                            baseprice DECIMAL(10,2),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            isactive BOOLEAN DEFAULT true,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "microsite", Sql = @"
                        CREATE TABLE IF NOT EXISTS microsite (
                            id VARCHAR(50) PRIMARY KEY,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            components JSONB,
                            isactive BOOLEAN DEFAULT true
                        )" },
                    
                    new { Name = "billingsettings", Sql = @"
                        CREATE TABLE IF NOT EXISTS billingsettings (
                            id VARCHAR(50) PRIMARY KEY,
                            companyname VARCHAR(255) NOT NULL,
                            gstnumber VARCHAR(50),
                            address TEXT,
                            taxpercentage DECIMAL(5,2),
                            hsnnumber VARCHAR(50),
                            bankaccount VARCHAR(50),
                            ifscnumber VARCHAR(50),
                            bankname VARCHAR(255),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "masterdataitem", Sql = @"
                        CREATE TABLE IF NOT EXISTS masterdataitem (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            value TEXT,
                            charge DECIMAL(10,2),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "communication", Sql = @"
                        CREATE TABLE IF NOT EXISTS communication (
                            id VARCHAR(50) PRIMARY KEY,
                            type VARCHAR(50) NOT NULL,
                            subject VARCHAR(255),
                            message TEXT,
                            recipient VARCHAR(255),
                            status VARCHAR(50) DEFAULT 'pending',
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "inventoryitem", Sql = @"
                        CREATE TABLE IF NOT EXISTS inventoryitem (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            description TEXT,
                            quantity INTEGER DEFAULT 0,
                            unit VARCHAR(50),
                            price DECIMAL(10,2),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "ticketitem", Sql = @"
                        CREATE TABLE IF NOT EXISTS ticketitem (
                            id VARCHAR(50) PRIMARY KEY,
                            title VARCHAR(255) NOT NULL,
                            description TEXT,
                            priority VARCHAR(50) DEFAULT 'medium',
                            status VARCHAR(50) DEFAULT 'open',
                            assigned_to VARCHAR(50) REFERENCES users(id),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" }
                };

                foreach (var table in tables)
                {
                    try
                    {
                        using var command = new NpgsqlCommand(table.Sql, connection);
                        await command.ExecuteNonQueryAsync();
                        
                        syncResults.Add(new
                        {
                            Table = table.Name,
                            Status = "Created/Updated",
                            Message = "Table synchronized successfully"
                        });
                    }
                    catch (Exception ex)
                    {
                        syncResults.Add(new
                        {
                            Table = table.Name,
                            Status = "Error",
                            Message = ex.Message
                        });
                    }
                }

                // Create indexes for better performance
                var indexes = new[]
                {
                    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
                    "CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_halls_organization ON halls(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_bookings_organization ON bookings(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_bookings_hall ON bookings(hall_id)",
                    "CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date)",
                    "CREATE INDEX IF NOT EXISTS idx_reviews_hall ON reviews(hall_id)",
                    "CREATE INDEX IF NOT EXISTS idx_galleryimage_organization ON galleryimage(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_carouselitem_organization ON carouselitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_customerclick_hall ON customerclick(hallid)",
                    "CREATE INDEX IF NOT EXISTS idx_serviceitem_organization ON serviceitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_microsite_organization ON microsite(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_billingsettings_organization ON billingsettings(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_masterdataitem_organization ON masterdataitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_communication_organization ON communication(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_inventoryitem_organization ON inventoryitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_ticketitem_organization ON ticketitem(organizationid)"
                };

                foreach (var indexSql in indexes)
                {
                    try
                    {
                        using var command = new NpgsqlCommand(indexSql, connection);
                        await command.ExecuteNonQueryAsync();
                    }
                    catch (Exception ex)
                    {
                        // Log index creation errors but don't fail the sync
                        Console.WriteLine($"Index creation error: {ex.Message}");
                    }
                }

                return Ok(new
                {
                    message = "Database synchronization completed",
                    timestamp = DateTime.UtcNow,
                    results = syncResults
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Database synchronization failed",
                    error = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }
    }
} 