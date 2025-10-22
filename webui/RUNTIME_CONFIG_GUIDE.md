# Runtime Configuration Guide

This guide explains how the runtime configuration system works in the Wedding Hub Manager application and how to deploy it to different environments.

## 🎯 Overview

The runtime configuration system allows you to change application settings (like API URLs) without rebuilding the React application. This is especially useful when deploying to different environments (development, staging, production).

## 📁 File Structure

```
project/
├── public/
│   └── config.json          # Source configuration file
├── dist/                    # Built application
│   ├── index.html
│   ├── config.json          # Copied from public/
│   ├── assets/
│   └── test-runtime-config.html  # Test file
└── src/
    ├── config/
    │   └── runtimeConfig.ts # Runtime config loader
    └── main.tsx             # App entry point
```

## 🔧 How It Works

### 1. Configuration Loading Process

1. **App Startup**: When the React app starts, it calls `loadRuntimeConfig()`
2. **Fetch Config**: The app fetches `/config.json` from the web server
3. **Apply Settings**: Configuration values are applied to the runtime
4. **Fallback**: If config.json is not found, default values are used

### 2. Configuration Flow

```typescript
// src/main.tsx
async function startApp() {
  await loadRuntimeConfig(); // ← Loads config.json
  ReactDOM.createRoot(document.getElementById('root')!).render(...);
}

// src/config/runtimeConfig.ts
export async function loadRuntimeConfig() {
  try {
    const res = await fetch('/config.json'); // ← Fetches from web server
    if (res.ok) {
      const config = await res.json();
      runtimeConfig = { ...runtimeConfig, ...config };
    }
  } catch (e) {
    console.warn('Using default configuration');
  }
}
```

### 3. Usage in Components

```typescript
// src/pages/Invoice.tsx
import { runtimeConfig, loadRuntimeConfig } from '@/config/runtimeConfig';

const Invoice = () => {
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const initializeConfig = async () => {
      await loadRuntimeConfig();
      setConfigLoaded(true);
    };
    initializeConfig();
  }, []);

  // Use config values
  console.log('API URL:', runtimeConfig.VITE_API_BASE_URL);
};
```

## 🚀 Deployment to .NET Core

### Step 1: Build the Application

```bash
npm run build
```

This creates a `dist/` folder with:
- `index.html` - Main application
- `config.json` - Runtime configuration
- `assets/` - JavaScript and CSS files

### Step 2: Copy to .NET Core wwwroot

Copy the contents of `dist/` to your .NET Core application's `wwwroot/` folder:

```
YourDotNetApp/
├── wwwroot/
│   ├── index.html
│   ├── config.json          # ← Modify this for your environment
│   ├── assets/
│   └── test-runtime-config.html
├── Controllers/
├── Program.cs
└── appsettings.json
```

### Step 3: Configure for Your Environment

Edit `wwwroot/config.json` for your environment:

**Development:**
```json
{
  "VITE_API_BASE_URL": "http://localhost:5000",
  "VITE_APP_TITLE": "Wedding Hub Manager",
  "VITE_APP_VERSION": "1.0.0",
  "VITE_ENVIRONMENT": "development"
}
```

**Production:**
```json
{
  "VITE_API_BASE_URL": "http://localhost:5212",
  "VITE_APP_TITLE": "Wedding Hub Manager",
  "VITE_APP_VERSION": "1.0.0",
  "VITE_ENVIRONMENT": "production"
}
```

**Staging:**
```json
{
  "VITE_API_BASE_URL": "https://staging-api.yourdomain.com",
  "VITE_APP_TITLE": "Wedding Hub Manager (Staging)",
  "VITE_APP_VERSION": "1.0.0",
  "VITE_ENVIRONMENT": "staging"
}
```

## 🧪 Testing Configuration

### Test File

Use the included test file to verify configuration loading:

1. Deploy your application
2. Navigate to `https://yourdomain.com/test-runtime-config.html`
3. Check the test results

### Manual Testing

You can also test manually by:

1. Opening browser developer tools
2. Navigating to your application
3. Checking the console for configuration logs
4. Verifying API calls use the correct base URL

## 📋 Configuration Properties

| Property | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | API server base URL | `http://localhost:5000` | ✅ |
| `VITE_APP_TITLE` | Application title | `Wedding Hub Manager` | ❌ |
| `VITE_APP_VERSION` | Application version | `1.0.0` | ❌ |
| `VITE_ENVIRONMENT` | Environment name | `development` | ❌ |

## 🔒 Security Considerations

### 1. Sensitive Data
- **Never** include sensitive data (passwords, API keys) in `config.json`
- Use environment variables on the server side for sensitive data
- Only include public configuration in `config.json`

### 2. CORS Configuration
Ensure your .NET Core application allows access to `config.json`:

```csharp
// Program.cs
app.UseStaticFiles(); // This serves wwwroot files
```

### 3. HTTPS in Production
Always use HTTPS in production to protect configuration data in transit.

## 🐛 Troubleshooting

### Common Issues

1. **Config not loading**
   - Check if `config.json` exists in `wwwroot/`
   - Verify file permissions
   - Check browser console for errors

2. **Wrong API URL**
   - Verify `VITE_API_BASE_URL` in `config.json`
   - Check network tab for failed requests
   - Ensure API server is running

3. **CORS errors**
   - Configure CORS in your .NET Core application
   - Check API server CORS settings

### Debug Information

The application includes debug information in development mode:

```typescript
// Shows in development only
{process.env.NODE_ENV === 'development' && (
  <div className="text-xs text-gray-500">
    API: {runtimeConfig.VITE_API_BASE_URL}
  </div>
)}
```

## 📝 Best Practices

1. **Environment-Specific Configs**: Use different `config.json` files for different environments
2. **Version Control**: Don't commit environment-specific configs to version control
3. **Backup Defaults**: Always provide sensible defaults in the code
4. **Documentation**: Document all configuration options
5. **Testing**: Test configuration loading in each environment

## 🔄 Updating Configuration

To update configuration after deployment:

1. **Stop the application** (if needed)
2. **Edit `wwwroot/config.json`** with new values
3. **Restart the application** (if needed)
4. **Refresh the browser** to load new configuration

No rebuild is required!

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Use the test file to verify configuration loading
3. Verify file paths and permissions
4. Check network connectivity to the API server

---

**Note**: This runtime configuration system provides flexibility for deployment while maintaining security and performance. 