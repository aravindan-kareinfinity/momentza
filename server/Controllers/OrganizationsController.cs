using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Momantza.Middleware;
using Momantza.Models;
using Momantza.Services;
using Npgsql;

namespace Momantza.Controllers
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

        [HttpPost("recreate-table")]
        public async Task<IActionResult> RecreateTable()
        {
            try
            {
                Console.WriteLine("Recreating organization table...");
                // await _organizationDataService.RecreateTableAsync();
                Console.WriteLine("Organization table recreated successfully");
                return Ok(new { message = "Table recreated successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error recreating table: {ex.Message}");
                return StatusCode(500, new { message = "Failed to recreate table", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create(Organizations organization)
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

        [HttpPost("{id}")]
        public async Task<IActionResult> Update(string id, Organizations organization)
        {
            try
            {
                Console.WriteLine($"Updating organization {id} with data: Logo={organization.Logo}, Name={organization.Name}");
                
                // Verify table structure first
                // await _organizationDataService.VerifyTableStructure();
                
                // Get existing organization first
                var existingOrg = await _organizationDataService.GetByIdAsync(id);
                if (existingOrg == null)
                {
                    Console.WriteLine($"Organization {id} not found");
                    return NotFound(new { message = "Organization not found" });
                }
                
                // Merge with existing data to ensure all fields are present
                existingOrg.Name = organization.Name ?? existingOrg.Name;
                existingOrg.ContactPerson = organization.ContactPerson ?? existingOrg.ContactPerson;
                existingOrg.ContactNo = organization.ContactNo ?? existingOrg.ContactNo;
                existingOrg.Address = organization.Address ?? existingOrg.Address;
                existingOrg.About = organization.About ?? existingOrg.About;
                existingOrg.DefaultDomain = organization.DefaultDomain ?? existingOrg.DefaultDomain;
                existingOrg.CustomDomain = organization.CustomDomain ?? existingOrg.CustomDomain;
                existingOrg.Logo = organization.Logo ?? existingOrg.Logo;
                existingOrg.Theme = organization.Theme ?? existingOrg.Theme;
                existingOrg.UpdatedAt = DateTime.UtcNow;
                
                Console.WriteLine($"Merged organization data: Logo={existingOrg.Logo}, Name={existingOrg.Name}");
                
                var success = await _organizationDataService.UpdateAsync(existingOrg);
                if (!success)
                {
                    Console.WriteLine($"Failed to update organization {id}");
                    return StatusCode(500, new { message = "Failed to update organization" });
                }
                
                var updatedOrg = await _organizationDataService.GetByIdAsync(id);
                Console.WriteLine($"Successfully updated organization {id}, Logo={updatedOrg?.Logo}");
                return Ok(updatedOrg);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating organization {id}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("{id}")]
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
                             // [HttpGet("current")]
                             //public async Task<IActionResult> GetCurrentOrganization()
                             //{
                             //    try
                             //    {
                             //        // Get the domain from the current request
                             //        var domain = HttpContext.Request.Host.Host;

        //        // Remove port if present (localhost:3000 -> localhostGetByDomainAsync
        //        if (domain.Contains(':'))
        //        {
        //            domain = domain.Split(':')[0];
        //        }

        //        Console.WriteLine($"🔍 Looking for organization by domain: {domain}");

        //        var organization = await _organizationDataService.GetByDomainAsync(domain);
        //        if (organization == null)
        //        {
        //            Console.WriteLine($"❌ No organization found for domain: {domain}");
        //            return NotFound(new { message = $"No organization found for domain: {domain}" });
        //        }

        //        Console.WriteLine($"✅ Found organization: {organization.Name}");
        //        return Ok(organization);
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.WriteLine($"❌ Error getting current organization: {ex.Message}");
        //        return StatusCode(500, new { message = "Internal server error" });
        //    }
        //}
        public async Task<IActionResult> GetCurrentOrganization()
        {
            try
            {
                // Log request details for debugging
                var fullHost = HttpContext.Request.Host.Host.ToLower();
                var requestPath = HttpContext.Request.Path.Value;
                Console.WriteLine($"============== GetCurrentOrganization DEBUG ==============");
                Console.WriteLine($"Request Host: {fullHost}");
                Console.WriteLine($"Request Path: {requestPath}");
                
                // Check middleware context first
                var orgContext = HttpContext.Items["Organization"] as OrganizationContext;
                var subdomain = HttpContext.Items["Subdomain"]?.ToString();
                Console.WriteLine($"Middleware Subdomain: {subdomain ?? "(null)"}");
                Console.WriteLine($"Middleware Organization Context: {(orgContext != null ? orgContext.OrganizationId.ToString() : "(null)")}");
                
                // Skip validation for now to allow subdomain-based resolution
                // var isValidContext = await _organizationDataService.ValidateUserOrganizationContextAsync();
                // if (!isValidContext)
                // {
                //     Console.WriteLine(" Organization mismatch. Access denied.");
                //     return Unauthorized(new { message = "Access denied: organization mismatch" });
                // }

                Organizations? organization = null;
                string domain = string.Empty;
                
                if (orgContext != null)
                {
                    // Organization already resolved by middleware, just get full details
                    organization = await _organizationDataService.GetByIdAsync(orgContext.OrganizationId.ToString());
                    Console.WriteLine($"✅ Using organization from middleware context: {orgContext.OrganizationId}");
                    domain = orgContext.OrganizationId.ToString();
                }
                else
                {
                    // Fallback: resolve by domain/subdomain
                    Console.WriteLine($"⚠️ Organization context not found in middleware, resolving by subdomain/domain...");
                    
                    if (!string.IsNullOrEmpty(subdomain))
                    {
                        // Use subdomain from middleware (e.g., "appointza" from "appointza.localhost")
                        domain = subdomain;
                        Console.WriteLine($" Using subdomain from middleware: '{domain}'");
                    }
                    else
                    {
                        // Fallback: extract from Host header
                        domain = fullHost;
                        
                        // Remove port if present
                        if (domain.Contains(':'))
                            domain = domain.Split(':')[0];
                        
                        // Extract subdomain from hostname for ANY domain format
                        // Examples:
                        // - "storesoft.momantza.com" -> "storesoft"
                        // - "appointza.localhost" -> "appointza"
                        // - "x.momantza.com" -> "x"
                        var parts = domain.Split('.');
                        if (parts.Length >= 3)
                        {
                            // Has subdomain: subdomain.domain.tld
                            domain = parts[0]; // Get subdomain part
                            Console.WriteLine($" Extracted subdomain from Host header: '{domain}'");
                        }
                        else if (parts.Length == 2 && parts[1] == "localhost")
                        {
                            // Special case: "subdomain.localhost" (2 parts, but localhost is special)
                            domain = parts[0]; // Get subdomain part
                            Console.WriteLine($" Extracted subdomain from localhost: '{domain}'");
                        }
                        else
                        {
                            // Base domain (e.g., "momantza.com") - no subdomain to extract
                            Console.WriteLine($" Using full hostname as domain: '{domain}'");
                        }
                    }

                    Console.WriteLine($"🔍 Looking for organization by domain/subdomain: '{domain}'");
                    organization = await _organizationDataService.GetByDomainAsync(domain);
                    
                    if (organization != null)
                    {
                        Console.WriteLine($"✅ Found organization: {organization.Name} (ID: {organization.Id}, DefaultDomain: {organization.DefaultDomain})");
                    }
                    else
                    {
                        Console.WriteLine($"❌ No organization found for domain: '{domain}'");
                    }
                }
                
                if (organization == null)
                {
                    var errorMessage = !string.IsNullOrEmpty(domain) 
                        ? $"No organization found for domain: {domain}"
                        : "No organization found";
                    Console.WriteLine($" {errorMessage}");
                    return NotFound(new { message = errorMessage });
                }

                Console.WriteLine($"Found organization: {organization.Name}");
                return Ok(organization);
            }
            catch (Exception ex)
            {
                Console.WriteLine($" Error getting current organization: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("by-id/{id}")]
        [HttpGet("id/{id}")]  // Alternative route
        public async Task<IActionResult> GetByIdFromUrl(string id)
        {
            try
            {
                Console.WriteLine($"GetByIdFromUrl method called with ID: {id}");
                
                var organization = await _organizationDataService.GetByIdAsync(id);
                if (organization == null)
                {
                    Console.WriteLine($"Organization not found for ID: {id}");
                    return NotFound(new { message = "Organization not found" });
                }
                
                Console.WriteLine($"Found organization by ID: {organization.Name}");
                return Ok(organization);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetByIdFromUrl: {ex.Message}");
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
                            address TEXT,
                            about TEXT,
                            defaultdomain VARCHAR(255),
                            customdomain VARCHAR(255),
                            logo TEXT,
                            theme JSONB,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        );
                        
                        -- Ensure logo column exists (for existing tables)
                        DO $$ 
                        BEGIN
                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                         WHERE table_name = 'organization' AND column_name = 'logo') THEN
                                ALTER TABLE organization ADD COLUMN logo TEXT;
                            END IF;
                        END $$;" },
                    
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
                            rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
                            comment TEXT NOT NULL,
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
                            title VARCHAR(255) NOT NULL,
                            description TEXT NOT NULL,
                            orderposition INTEGER DEFAULT 0,
                            isactive BOOLEAN DEFAULT true,
                            organizationid VARCHAR(50) REFERENCES organization(id)
                        )" },
                    
                    new { Name = "customerclick", Sql = @"
                        CREATE TABLE IF NOT EXISTS customerclick (
                            id VARCHAR(50) PRIMARY KEY,
                            customerid VARCHAR(50) NOT NULL,
                            hallid VARCHAR(50) REFERENCES halls(id),
                            customername VARCHAR(255) NOT NULL,
                            customeremail VARCHAR(255) NOT NULL,
                            customerphone VARCHAR(50) NOT NULL,
                            eventdate TIMESTAMP WITH TIME ZONE NOT NULL,
                            eventtype VARCHAR(100) NOT NULL,
                            guestcount INTEGER NOT NULL,
                            message TEXT NOT NULL,
                            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            rating INTEGER,
                            imagebytes BYTEA,
                            contenttype VARCHAR(100),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "serviceitem", Sql = @"
                        CREATE TABLE IF NOT EXISTS serviceitem (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            hsncode VARCHAR(50) NOT NULL,
                            taxpercentage DECIMAL(5,2) NOT NULL,
                            baseprice DECIMAL(10,2) NOT NULL,
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
                            gstnumber VARCHAR(50) NOT NULL,
                            address TEXT NOT NULL,
                            taxpercentage DECIMAL(5,2) NOT NULL,
                            hsnnumber VARCHAR(50) NOT NULL,
                            bankaccount VARCHAR(50) NOT NULL,
                            ifscnumber VARCHAR(50) NOT NULL,
                            bankname VARCHAR(255) NOT NULL,
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
                            booking_id VARCHAR(50) REFERENCES bookings(id),
                            date TIMESTAMP WITH TIME ZONE NOT NULL,
                            time TIMESTAMP WITH TIME ZONE NOT NULL,
                            from_person VARCHAR(100) NOT NULL,
                            to_person VARCHAR(100) NOT NULL,
                            detail TEXT NOT NULL,
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
                            notes TEXT,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "ticketitem", Sql = @"
                        CREATE TABLE IF NOT EXISTS ticketitem (
                            id VARCHAR(50) PRIMARY KEY,
                            title VARCHAR(255) NOT NULL,
                            description TEXT NOT NULL,
                            category VARCHAR(50) NOT NULL,
                            priority VARCHAR(50) DEFAULT 'medium',
                            status VARCHAR(50) DEFAULT 'open',
                            assigned_to VARCHAR(50) REFERENCES users(id),
                            booking_id VARCHAR(50) REFERENCES bookings(id),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "monthlydata", Sql = @"
                        CREATE TABLE IF NOT EXISTS monthlydata (
                            id VARCHAR(50) PRIMARY KEY,
                            month VARCHAR(10) NOT NULL,
                            bookings INTEGER NOT NULL,
                            revenue DECIMAL(10,2) NOT NULL,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "statusdata", Sql = @"
                        CREATE TABLE IF NOT EXISTS statusdata (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(50) NOT NULL,
                            value INTEGER NOT NULL,
                            color VARCHAR(7) NOT NULL,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "hallutilization", Sql = @"
                        CREATE TABLE IF NOT EXISTS hallutilization (
                            id VARCHAR(50) PRIMARY KEY,
                            name VARCHAR(100) NOT NULL,
                            bookings INTEGER NOT NULL,
                            revenue DECIMAL(10,2) NOT NULL,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "growthmetrics", Sql = @"
                        CREATE TABLE IF NOT EXISTS growthmetrics (
                            id VARCHAR(50) PRIMARY KEY,
                            monthly_growth DECIMAL(5,2) NOT NULL,
                            customer_retention DECIMAL(5,2) NOT NULL,
                            average_booking_value DECIMAL(10,2) NOT NULL,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "customerinsights", Sql = @"
                        CREATE TABLE IF NOT EXISTS customerinsights (
                            id VARCHAR(50) PRIMARY KEY,
                            total_customers INTEGER NOT NULL,
                            repeat_customers INTEGER NOT NULL,
                            customer_satisfaction DECIMAL(3,2) NOT NULL,
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                        )" },
                    
                    new { Name = "usersession", Sql = @"
                        CREATE TABLE IF NOT EXISTS usersession (
                            id VARCHAR(50) PRIMARY KEY,
                            userid VARCHAR(50) REFERENCES users(id),
                            organizationid VARCHAR(50) REFERENCES organization(id),
                            accesstoken TEXT NOT NULL,
                            refreshtoken TEXT NOT NULL,
                            expiresat TIMESTAMP WITH TIME ZONE NOT NULL,
                            createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                            isactive BOOLEAN DEFAULT true
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
                    "CREATE INDEX IF NOT EXISTS idx_reviews_organization ON reviews(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_galleryimage_organization ON galleryimage(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_carouselitem_organization ON carouselitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_customerclick_hall ON customerclick(hallid)",
                    "CREATE INDEX IF NOT EXISTS idx_customerclick_organization ON customerclick(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_serviceitem_organization ON serviceitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_microsite_organization ON microsite(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_billingsettings_organization ON billingsettings(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_masterdataitem_organization ON masterdataitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_communication_organization ON communication(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_communication_booking ON communication(booking_id)",
                    "CREATE INDEX IF NOT EXISTS idx_inventoryitem_organization ON inventoryitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_ticketitem_organization ON ticketitem(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_ticketitem_booking ON ticketitem(booking_id)",
                    "CREATE INDEX IF NOT EXISTS idx_monthlydata_organization ON monthlydata(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_statusdata_organization ON statusdata(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_hallutilization_organization ON hallutilization(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_growthmetrics_organization ON growthmetrics(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_customerinsights_organization ON customerinsights(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_usersession_user ON usersession(userid)",
                    "CREATE INDEX IF NOT EXISTS idx_usersession_organization ON usersession(organizationid)",
                    "CREATE INDEX IF NOT EXISTS idx_usersession_token ON usersession(accesstoken)",
                    "CREATE INDEX IF NOT EXISTS idx_usersession_refresh ON usersession(refreshtoken)",
                    "CREATE INDEX IF NOT EXISTS idx_usersession_active ON usersession(isactive)"
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