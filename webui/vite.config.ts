import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    // ADD PROXY CONFIGURATION HERE
    proxy: {
      '/api': {
        target: 'http://localhost:5212', // Your backend URL
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
  },
  // Expose environment variables to the client
  envPrefix: 'VITE_',
}));