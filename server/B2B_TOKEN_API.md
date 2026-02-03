# B2B Token API Documentation

## Endpoint: POST /api/b2b/auth/token

This endpoint is used for server-to-server B2B authentication. It generates a JWT token that can be used to authenticate subsequent API requests.

### Request

**URL:** `POST /api/b2b/auth/token`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "clientId": "appointza-client",
  "clientSecret": "appointza-secret",
  "company": "appointza.com",
  "mobile": "optional-user-mobile",
  "email": "optional-user-email@example.com"
}
```

**Request Parameters:**
- `clientId` (string, required): Client identifier (e.g., "appointza-client", "latrexa-client", "momantza-client", "campusza-client")
- `clientSecret` (string, required): Client secret (e.g., "appointza-secret", "latrexa-secret", "momantza-secret", "campusza-secret")
- `company` (string, required): Company identifier (e.g., "appointza.com", "latrexa.com", "momantza.com")
- `mobile` (string, optional): User mobile number for user context lookup
- `email` (string, optional): User email for user context lookup

### Response

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 600,
  "user": {
    "user": {
      "id": "user-id-123",
      "email": "user@example.com",
      "name": "User Name",
      "organizationId": "org-id-123",
      "role": "admin",
      "accessibleHalls": ["hall-1", "hall-2"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "token": "user-jwt-token",
    "message": "User details retrieved",
    "halls": [
      {
        "id": "hall-1",
        "name": "Hall Name",
        "organizationId": "org-id-123"
      }
    ]
  }
}
```

**Note:** The `user` field is optional and will only be included if:
- Either `mobile` or `email` is provided in the request
- A user matching the provided mobile/email exists in the system

**Error Responses:**

**401 Unauthorized - Invalid Client Credentials:**
```json
{
  "message": "Invalid client credentials"
}
```

**500 Internal Server Error - B2B Not Configured:**
```json
{
  "message": "B2B authentication not configured"
}
```

### Valid Client Credentials

The following client credentials are currently supported:

| Client ID | Client Secret | Company |
|-----------|---------------|---------|
| appointza-client | appointza-secret | appointza.com |
| latrexa-client | latrexa-secret | latrexa.com |
| momantza-client | momantza-secret | momantza.com |
| campusza-client | campusza-secret | campusza.com |

### Token Usage

The returned `access_token` is a JWT token that should be included in subsequent API requests:

**Authorization Header:**
```
Authorization: Bearer <access_token>
```

**Token Expiration:**
- The token expires in 600 seconds (10 minutes)
- Use the `expires_in` field to track expiration

### Example cURL Request

```bash
curl -X POST "http://localhost:5000//api/b2b/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "appointza-client",
    "clientSecret": "appointza-secret",
    "company": "appointza.com",
    "email": "user@example.com"
  }'
```

### Example JavaScript/TypeScript Request

```typescript
const response = await fetch('/api/b2b/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    clientId: 'appointza-client',
    clientSecret: 'appointza-secret',
    company: 'appointza.com',
    email: 'user@example.com'
  })
});

const data = await response.json();
console.log('Access Token:', data.access_token);
console.log('Expires In:', data.expires_in, 'seconds');
```

### Example Using the Token

```typescript
// After getting the token
const token = data.access_token;

// Use it in subsequent requests
const apiResponse = await fetch('/api/some-endpoint', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```
