# Environment Configuration Guide

This guide explains how to configure the API base URL and other environment variables for the Wedding Hub Manager application.

## 📁 Environment Files

### Required Files
Create these files in your project root:

#### `.env` (Development)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Environment
NODE_ENV=development

# App Configuration
VITE_APP_TITLE=Wedding Hub Manager
VITE_APP_VERSION=1.0.0
```

#### `.env.production` (Production)
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Environment
NODE_ENV=production

# App Configuration
VITE_APP_TITLE=Wedding Hub Manager
VITE_APP_VERSION=1.0.0
```

## 🚀 Build Commands

### Development Build
```bash
npm run build:dev
```
Uses `.env` or `.env.development` configuration.

### Production Build
```bash
npm run build:prod
```
Uses `.env.production` configuration.

### Default Build
```bash
npm run build
```
Uses the current environment's configuration.

## 🔧 Configuration Usage

### In Components
```typescript
import { config, getApiUrl } from '@/config/environment';

// Access API base URL
console.log(config.apiBaseUrl);

// Get full API URL for an endpoint
const userUrl = getApiUrl('/api/users');
```

### In Services
The API client automatically uses the configured base URL:
```typescript
import { apiClient } from '@/services/http/ApiClient';

// This will use the configured base URL
const users = await apiClient.get('/api/users');
```

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API server base URL | `http://localhost:5000` |
| `VITE_APP_TITLE` | Application title | `Wedding Hub Manager` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `NODE_ENV` | Environment mode | `development` |

## 🔒 Security Notes

- **Never commit `.env` files** to version control
- **Use `.env.example`** files for documentation
- **Validate environment variables** in production
- **Use HTTPS** for production API URLs

## 🛠️ Troubleshooting

### API Base URL Not Working
1. Check that `.env` file exists in project root
2. Verify `VITE_API_BASE_URL` is set correctly
3. Restart the development server
4. Clear browser cache

### Build Issues
1. Ensure all required environment variables are set
2. Check for typos in variable names
3. Verify Vite configuration is correct

### Production Deployment
1. Set up environment variables on your hosting platform
2. Use `npm run build:prod` for production builds
3. Verify API endpoints are accessible from production domain

## 📝 Example Configurations

### Local Development
```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_TITLE=Wedding Hub Manager (Dev)
```

### Staging
```bash
VITE_API_BASE_URL=https://staging-api.yourdomain.com
VITE_APP_TITLE=Wedding Hub Manager (Staging)
```

### Production
```bash
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_TITLE=Wedding Hub Manager
``` 