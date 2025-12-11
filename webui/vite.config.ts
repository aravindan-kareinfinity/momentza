import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { readFileSync, writeFileSync, existsSync } from "fs";

// Custom plugin to fix Recharts/Lodash compatibility issue
const fixRechartsLodashPlugin = () => {
  return {
    name: 'fix-recharts-lodash',
    transform(code: string, id: string) {
      // Fix the Symbol.toStringTag issue in development
      if (id.includes('node_modules/lodash') && code.includes('Symbol.toStringTag')) {
        return code.replace(
          /Object\.defineProperty\(([^,]+),\s*Symbol\.toStringTag,\s*\{[^}]*\}\)/g,
          '// Fixed: Symbol.toStringTag assignment removed for compatibility'
        );
      }
      return code;
    },
  };
};

// Helper function to read config from public/config.json
function getConfigFromFile() {
  try {
    const configPath = path.resolve(process.cwd(), 'public/config.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    return config;
  } catch (error) {
    // If config.json doesn't exist or can't be read, return empty object
    return {};
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => {
  // Read config from public/config.json (for easy configuration)
  const fileConfig = getConfigFromFile();
  
  // Base URL for assets (can be set via VITE_BASE_URL env var for build-time)
  // For runtime, configure in public/config.json instead
  const baseUrl = process.env.VITE_BASE_URL || fileConfig.VITE_BASE_URL || '';
  // Normalize base URL for Vite: ensure it starts with / and ends with / (or is just /)
  // Vite requires base to end with / for subdirectories
  let base = '/';
  if (baseUrl) {
    const normalized = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`;
    base = normalized.endsWith('/') ? normalized : `${normalized}/`;
  }
  
  // Get port from config.json, env var, or default to 8080
  const port = fileConfig.VITE_PORT || parseInt(process.env.VITE_PORT || '8080', 10);
  
  // Set output directory to momentzabuild/wwwroot
  const outDir = path.resolve(process.cwd(), '../momentzabuild/wwwroot');
  
  return {
  base: base,
  server: {
    host: "::",
    port: port,
    cors: true,
    // ADD PROXY CONFIGURATION HERE
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend URL
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    mode === 'development' && fixRechartsLodashPlugin(),
    // Plugin to ensure config.json is copied to dist during build and generate production config
    {
      name: 'ensure-config-json',
      buildStart() {
        // This ensures config.json from public/ is copied to wwwroot/
        // Vite automatically copies public/ files, but this plugin verifies it
        const configPath = path.resolve(process.cwd(), 'public/config.json');
        try {
          const config = readFileSync(configPath, 'utf-8');
          JSON.parse(config); // Validate JSON
          console.log('✓ config.json found and validated - will be copied to momentzabuild/wwwroot/');
        } catch (error) {
          console.warn('⚠ config.json not found or invalid in public/ folder');
        }
      },
      writeBundle() {
        // After build, generate production config.json with correct values
        const wwwrootConfigPath = path.resolve(process.cwd(), '../momentzabuild/wwwroot/config.json');
        
        // Read the original config or use defaults
        let config: any = {};
        try {
          const publicConfigPath = path.resolve(process.cwd(), 'public/config.json');
          const configContent = readFileSync(publicConfigPath, 'utf-8');
          config = JSON.parse(configContent);
        } catch (error) {
          console.warn('⚠ Could not read public/config.json, using defaults');
        }
        
         // Override with production values if building for production
         if (mode === 'production') {
           // For production, use relative API path if not specified
           // If API is on same server as frontend, use relative path '/api'
           // Otherwise use the configured absolute URL
           const apiBaseUrl = process.env.VITE_API_BASE_URL || config.VITE_API_BASE_URL;
           const productionConfig = {
             VITE_API_BASE_URL: apiBaseUrl || '/api', // Default to relative /api for same-server deployment
             VITE_APP_TITLE: process.env.VITE_APP_TITLE || config.VITE_APP_TITLE || 'Wedding Hub Manager',
             VITE_APP_VERSION: process.env.VITE_APP_VERSION || config.VITE_APP_VERSION || '1.0.0',
             VITE_ENVIRONMENT: 'production',
             ...(config.VITE_BASE_URL && { VITE_BASE_URL: config.VITE_BASE_URL }),
             ...(config.VITE_PORT && { VITE_PORT: config.VITE_PORT })
           };
          
          // Write production config to wwwroot
          writeFileSync(wwwrootConfigPath, JSON.stringify(productionConfig, null, 2));
          console.log('✓ Production config.json generated in momentzabuild/wwwroot/');
        } else {
          // For development, just ensure the config exists
          if (!existsSync(wwwrootConfigPath)) {
            const devConfig = {
              VITE_API_BASE_URL: config.VITE_API_BASE_URL || 'http://localhost:5000',
              VITE_APP_TITLE: config.VITE_APP_TITLE || 'Wedding Hub Manager',
              VITE_APP_VERSION: config.VITE_APP_VERSION || '1.0.0',
              VITE_ENVIRONMENT: 'development',
              ...(config.VITE_BASE_URL && { VITE_BASE_URL: config.VITE_BASE_URL }),
              ...(config.VITE_PORT && { VITE_PORT: config.VITE_PORT })
            };
            writeFileSync(wwwrootConfigPath, JSON.stringify(devConfig, null, 2));
            console.log('✓ Development config.json generated in momentzabuild/wwwroot/');
          }
        }
      }
    } as Plugin,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  optimizeDeps: {
    include: ['recharts', 'lodash'],
    exclude: [],
  },
  build: {
    outDir: outDir,
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
    target: 'es2015',
  },
  define: {
    __DEV__: mode === 'development',
    // Fix for Recharts/Lodash compatibility issue
    'process.env.NODE_ENV': JSON.stringify(mode),
    // Ensure API base URL is available in build
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:5000'),
    // Ensure base URL is available in build
    'import.meta.env.VITE_BASE_URL': JSON.stringify(baseUrl),
  },
  // Expose environment variables to the client
  envPrefix: 'VITE_',
  };
});