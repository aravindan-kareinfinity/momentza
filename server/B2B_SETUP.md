# B2B Server-to-Server Authentication Setup

## Overview

This document describes the B2B (Business-to-Business) authentication system that allows secure server-to-server communication between independent companies:
- **appointza.com**
- **momantza.com**
- **latrexa.com**

## Architecture

### Token Flow

1. **Token Request**: Server A requests a token from Server B
   ```
   POST https://momantza.com/api/b2b/auth/token
   {
     "ClientId": "appointza-client",
     "ClientSecret": "appointza-secret",
     "Company": "appointza.com"
   }
   ```

2. **Token Response**: Server B issues a JWT token
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "expires_in": 600
   }
   ```

3. **API Call**: Server A uses the token to call Server B's APIs
   ```
   GET https://momantza.com/api/b2b/...
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Components

### 1. B2BAuthController (`/api/b2b/auth/token`)
- Issues JWT tokens for other companies
- Validates client credentials
- Returns tokens with 10-minute expiry

### 2. ServerToServerAuthMiddleware
- Validates incoming B2B tokens on `/api/b2b/*` endpoints
- Skips validation for `/api/b2b/auth/token` (token issuing endpoint)
- Sets `HttpContext.Items["CallingCompany"]` with the calling company ID

### 3. B2BClientService
- Service for making B2B API calls to other servers
- Automatically handles token acquisition and caching
- Provides `GetTokenAsync()` and `CallApiAsync<T>()` methods

## Configuration

### appsettings.json

```json
{
  "B2BAuth": {
    "SharedSecret": "VERY_LONG_RANDOM_SECRET_32+_CHARS",
    "ServerUrls": {
      "appointza": "https://appointza.com",
      "latrexa": "https://latrexa.com",
      "momantza": "https://momantza.com"
    },
    "Clients": {
      "appointza": {
        "ClientId": "momantza-client",
        "ClientSecret": "momantza-secret",
        "Company": "momantza.com"
      },
      "latrexa": {
        "ClientId": "momantza-client",
        "ClientSecret": "momantza-secret",
        "Company": "momantza.com"
      }
    }
  }
}
```

## Usage Examples

### Example 1: Call Appointza API from Momantza

```csharp
public class MyController : ControllerBase
{
    private readonly IB2BClientService _b2bClient;

    public MyController(IB2BClientService b2bClient)
    {
        _b2bClient = b2bClient;
    }

    [HttpGet("test-appointza")]
    public async Task<IActionResult> TestAppointza()
    {
        // Call Appointza API
        var result = await _b2bClient.CallApiAsync<MyResponse>(
            "appointza",
            "api/b2b/some-endpoint"
        );
        
        return Ok(result);
    }
}
```

### Example 2: Create a B2B API Endpoint in Momantza

```csharp
[ApiController]
[Route("api/b2b")]
public class MyB2BController : ControllerBase
{
    [HttpGet("my-endpoint")]
    public IActionResult MyEndpoint()
    {
        // Get calling company from middleware
        var callingCompany = HttpContext.Items["CallingCompany"]?.ToString();
        
        return Ok(new { 
            message = $"Called by {callingCompany}",
            data = "some data"
        });
    }
}
```

## Security Notes

1. **Shared Secret**: All servers must use the same `SharedSecret` for token validation
2. **Token Expiry**: Tokens expire after 10 minutes
3. **Client Credentials**: Client IDs and secrets are currently hardcoded - move to database in production
4. **HTTPS**: Always use HTTPS in production
5. **Audience Validation**: Tokens are validated against specific audience (e.g., "momantza-api")

## Testing

### Test Token Request

```bash
curl -X POST https://momantza.com/api/b2b/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "ClientId": "appointza-client",
    "ClientSecret": "appointza-secret",
    "Company": "appointza.com"
  }'
```

### Test B2B API Call

```bash
curl -X GET https://momantza.com/api/b2b/my-endpoint \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Middleware Order

The middleware is registered in the correct order in `Program.cs`:

1. `OrganizationResolverMiddleware` - Resolves organization context
2. `ServerToServerAuthMiddleware` - Validates B2B tokens
3. `UseRouting()` - Routing
4. `UseAuthentication()` - User authentication
5. `UseAuthorization()` - Authorization

This ensures B2B authentication happens before routing, allowing controllers to access `HttpContext.Items["CallingCompany"]`.
