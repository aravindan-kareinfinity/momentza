# IIS Deployment Fix for Error 500.19

## Error Details
- **Error Code**: 0x8007000d
- **Error**: HTTP Error 500.19 - Internal Server Error
- **Cause**: Invalid configuration data in web.config or missing ASP.NET Core Hosting Bundle

## Solutions

### 1. Install ASP.NET Core Hosting Bundle (REQUIRED)

The most common cause of this error is that the **ASP.NET Core Hosting Bundle** is not installed on your Windows server.

**Download and Install:**
1. Go to: https://dotnet.microsoft.com/download/dotnet/8.0
2. Download the **ASP.NET Core 8.0 Runtime - Windows Hosting Bundle**
3. Install it on your server
4. Restart IIS after installation:
   ```powershell
   iisreset
   ```

### 2. Verify web.config Location

Ensure the `web.config` file is in the root of your IIS application directory:
- Your IIS site path: `C:\sites\momantza.com\`
- The `web.config` should be at: `C:\sites\momantza.com\web.config`
- The `MomantzaApp.dll` should be at: `C:\sites\momantza.com\MomantzaApp.dll`

### 3. Verify .NET Runtime is Installed

Since your application uses `processPath="dotnet"`, you need the .NET 8.0 Runtime installed:
1. Download .NET 8.0 Runtime from: https://dotnet.microsoft.com/download/dotnet/8.0
2. Install it on your server
3. Verify installation:
   ```powershell
   dotnet --version
   ```
   Should show: `8.0.x`

### 4. Check IIS Application Pool Configuration

1. Open IIS Manager
2. Select your Application Pool
3. Set **.NET CLR Version** to **No Managed Code** (important for .NET Core/8.0)
4. Set **Managed Pipeline Mode** to **Integrated**

### 5. Verify File Permissions

Ensure the IIS application pool identity has read/execute permissions on:
- The application directory (`C:\sites\momantza.com\`)
- All DLL files
- The `wwwroot` folder

### 6. Enable Required IIS Features

Ensure these Windows Features are enabled:
- IIS (Internet Information Services)
- ASP.NET Core Module V2
- .NET Extensibility (if needed)

### 7. Check Event Viewer for Detailed Errors

1. Open Event Viewer
2. Go to: Windows Logs > Application
3. Look for errors related to your application
4. These will provide more specific error details

### 8. Alternative: Use Self-Contained Deployment

If you continue to have issues, you can publish as self-contained (includes .NET runtime):

```powershell
cd server
dotnet publish -c Release -r win-x64 --self-contained true -o ../momentzabuild
```

Then update `web.config` to use the `.exe` instead:
```xml
<aspNetCore processPath=".\MomantzaApp.exe" arguments="" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
```

## Quick Checklist

- [ ] ASP.NET Core 8.0 Hosting Bundle installed
- [ ] .NET 8.0 Runtime installed
- [ ] web.config is in the root of IIS site directory
- [ ] MomantzaApp.dll exists in the same directory as web.config
- [ ] Application Pool set to "No Managed Code"
- [ ] IIS restarted after installing Hosting Bundle
- [ ] File permissions are correct
- [ ] Checked Event Viewer for detailed errors

## Testing

After applying fixes, test by:
1. Restarting IIS: `iisreset`
2. Accessing your site: `http://localhost:9092/`
3. Check the `logs\stdout` folder for application logs

