// vite.config.ts
import { defineConfig } from "file:///C:/backup/momentza/webui/node_modules/vite/dist/node/index.js";
import react from "file:///C:/backup/momentza/webui/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///C:/backup/momentza/webui/node_modules/lovable-tagger/dist/index.js";
import { readFileSync, writeFileSync, existsSync } from "fs";
var fixRechartsLodashPlugin = () => {
  return {
    name: "fix-recharts-lodash",
    transform(code, id) {
      if (id.includes("node_modules/lodash") && code.includes("Symbol.toStringTag")) {
        return code.replace(
          /Object\.defineProperty\(([^,]+),\s*Symbol\.toStringTag,\s*\{[^}]*\}\)/g,
          "// Fixed: Symbol.toStringTag assignment removed for compatibility"
        );
      }
      return code;
    }
  };
};
function getConfigFromFile() {
  try {
    const configPath = path.resolve(process.cwd(), "public/config.json");
    const configContent = readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);
    return config;
  } catch (error) {
    return {};
  }
}
var vite_config_default = defineConfig(({ mode }) => {
  const fileConfig = getConfigFromFile();
  const baseUrl = process.env.VITE_BASE_URL || fileConfig.VITE_BASE_URL || "";
  let base = "/";
  if (baseUrl) {
    const normalized = baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`;
    base = normalized.endsWith("/") ? normalized : `${normalized}/`;
  }
  const port = fileConfig.VITE_PORT || parseInt(process.env.VITE_PORT || "8080", 10);
  const outDir = path.resolve(process.cwd(), "../momentzabuild/wwwroot");
  return {
    base,
    server: {
      host: "::",
      port,
      cors: true,
      // ADD PROXY CONFIGURATION HERE
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          // Your backend URL
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("Sending Request to the Target:", req.method, req.url);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log("Received Response from Target:", proxyRes.statusCode, req.url);
            });
          }
        }
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "development" && fixRechartsLodashPlugin(),
      // Plugin to ensure config.json is copied to dist during build and generate production config
      {
        name: "ensure-config-json",
        buildStart() {
          const configPath = path.resolve(process.cwd(), "public/config.json");
          try {
            const config = readFileSync(configPath, "utf-8");
            JSON.parse(config);
            console.log("\u2713 config.json found and validated - will be copied to momentzabuild/wwwroot/");
          } catch (error) {
            console.warn("\u26A0 config.json not found or invalid in public/ folder");
          }
        },
        writeBundle() {
          const wwwrootConfigPath = path.resolve(process.cwd(), "../momentzabuild/wwwroot/config.json");
          let config = {};
          try {
            const publicConfigPath = path.resolve(process.cwd(), "public/config.json");
            const configContent = readFileSync(publicConfigPath, "utf-8");
            config = JSON.parse(configContent);
          } catch (error) {
            console.warn("\u26A0 Could not read public/config.json, using defaults");
          }
          if (mode === "production") {
            const apiBaseUrl = process.env.VITE_API_BASE_URL || config.VITE_API_BASE_URL;
            const productionConfig = {
              VITE_API_BASE_URL: apiBaseUrl || "/api",
              // Default to relative /api for same-server deployment
              VITE_APP_TITLE: process.env.VITE_APP_TITLE || config.VITE_APP_TITLE || "Wedding Hub Manager",
              VITE_APP_VERSION: process.env.VITE_APP_VERSION || config.VITE_APP_VERSION || "1.0.0",
              VITE_ENVIRONMENT: "production",
              ...config.VITE_BASE_URL && { VITE_BASE_URL: config.VITE_BASE_URL },
              ...config.VITE_PORT && { VITE_PORT: config.VITE_PORT }
            };
            writeFileSync(wwwrootConfigPath, JSON.stringify(productionConfig, null, 2));
            console.log("\u2713 Production config.json generated in momentzabuild/wwwroot/");
          } else {
            if (!existsSync(wwwrootConfigPath)) {
              const devConfig = {
                VITE_API_BASE_URL: config.VITE_API_BASE_URL || "http://localhost:5000",
                VITE_APP_TITLE: config.VITE_APP_TITLE || "Wedding Hub Manager",
                VITE_APP_VERSION: config.VITE_APP_VERSION || "1.0.0",
                VITE_ENVIRONMENT: "development",
                ...config.VITE_BASE_URL && { VITE_BASE_URL: config.VITE_BASE_URL },
                ...config.VITE_PORT && { VITE_PORT: config.VITE_PORT }
              };
              writeFileSync(wwwrootConfigPath, JSON.stringify(devConfig, null, 2));
              console.log("\u2713 Development config.json generated in momentzabuild/wwwroot/");
            }
          }
        }
      }
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src")
      }
    },
    optimizeDeps: {
      include: ["recharts", "lodash"],
      exclude: []
    },
    build: {
      outDir,
      sourcemap: true,
      rollupOptions: {
        external: []
      },
      target: "es2015"
    },
    define: {
      __DEV__: mode === "development",
      // Fix for Recharts/Lodash compatibility issue
      "process.env.NODE_ENV": JSON.stringify(mode),
      // Ensure API base URL is available in build
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL || "http://localhost:5000"),
      // Ensure base URL is available in build
      "import.meta.env.VITE_BASE_URL": JSON.stringify(baseUrl)
    },
    // Expose environment variables to the client
    envPrefix: "VITE_"
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxiYWNrdXBcXFxcbW9tZW50emFcXFxcd2VidWlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXGJhY2t1cFxcXFxtb21lbnR6YVxcXFx3ZWJ1aVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovYmFja3VwL21vbWVudHphL3dlYnVpL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBQbHVnaW4gfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuaW1wb3J0IHsgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XHJcblxyXG4vLyBDdXN0b20gcGx1Z2luIHRvIGZpeCBSZWNoYXJ0cy9Mb2Rhc2ggY29tcGF0aWJpbGl0eSBpc3N1ZVxyXG5jb25zdCBmaXhSZWNoYXJ0c0xvZGFzaFBsdWdpbiA9ICgpID0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ2ZpeC1yZWNoYXJ0cy1sb2Rhc2gnLFxyXG4gICAgdHJhbnNmb3JtKGNvZGU6IHN0cmluZywgaWQ6IHN0cmluZykge1xyXG4gICAgICAvLyBGaXggdGhlIFN5bWJvbC50b1N0cmluZ1RhZyBpc3N1ZSBpbiBkZXZlbG9wbWVudFxyXG4gICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcy9sb2Rhc2gnKSAmJiBjb2RlLmluY2x1ZGVzKCdTeW1ib2wudG9TdHJpbmdUYWcnKSkge1xyXG4gICAgICAgIHJldHVybiBjb2RlLnJlcGxhY2UoXHJcbiAgICAgICAgICAvT2JqZWN0XFwuZGVmaW5lUHJvcGVydHlcXCgoW14sXSspLFxccypTeW1ib2xcXC50b1N0cmluZ1RhZyxcXHMqXFx7W159XSpcXH1cXCkvZyxcclxuICAgICAgICAgICcvLyBGaXhlZDogU3ltYm9sLnRvU3RyaW5nVGFnIGFzc2lnbm1lbnQgcmVtb3ZlZCBmb3IgY29tcGF0aWJpbGl0eSdcclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBjb2RlO1xyXG4gICAgfSxcclxuICB9O1xyXG59O1xyXG5cclxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHJlYWQgY29uZmlnIGZyb20gcHVibGljL2NvbmZpZy5qc29uXHJcbmZ1bmN0aW9uIGdldENvbmZpZ0Zyb21GaWxlKCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdwdWJsaWMvY29uZmlnLmpzb24nKTtcclxuICAgIGNvbnN0IGNvbmZpZ0NvbnRlbnQgPSByZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgJ3V0Zi04Jyk7XHJcbiAgICBjb25zdCBjb25maWcgPSBKU09OLnBhcnNlKGNvbmZpZ0NvbnRlbnQpO1xyXG4gICAgcmV0dXJuIGNvbmZpZztcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgLy8gSWYgY29uZmlnLmpzb24gZG9lc24ndCBleGlzdCBvciBjYW4ndCBiZSByZWFkLCByZXR1cm4gZW1wdHkgb2JqZWN0XHJcbiAgICByZXR1cm4ge307XHJcbiAgfVxyXG59XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9OiB7IG1vZGU6IHN0cmluZyB9KSA9PiB7XHJcbiAgLy8gUmVhZCBjb25maWcgZnJvbSBwdWJsaWMvY29uZmlnLmpzb24gKGZvciBlYXN5IGNvbmZpZ3VyYXRpb24pXHJcbiAgY29uc3QgZmlsZUNvbmZpZyA9IGdldENvbmZpZ0Zyb21GaWxlKCk7XHJcbiAgXHJcbiAgLy8gQmFzZSBVUkwgZm9yIGFzc2V0cyAoY2FuIGJlIHNldCB2aWEgVklURV9CQVNFX1VSTCBlbnYgdmFyIGZvciBidWlsZC10aW1lKVxyXG4gIC8vIEZvciBydW50aW1lLCBjb25maWd1cmUgaW4gcHVibGljL2NvbmZpZy5qc29uIGluc3RlYWRcclxuICBjb25zdCBiYXNlVXJsID0gcHJvY2Vzcy5lbnYuVklURV9CQVNFX1VSTCB8fCBmaWxlQ29uZmlnLlZJVEVfQkFTRV9VUkwgfHwgJyc7XHJcbiAgLy8gTm9ybWFsaXplIGJhc2UgVVJMIGZvciBWaXRlOiBlbnN1cmUgaXQgc3RhcnRzIHdpdGggLyBhbmQgZW5kcyB3aXRoIC8gKG9yIGlzIGp1c3QgLylcclxuICAvLyBWaXRlIHJlcXVpcmVzIGJhc2UgdG8gZW5kIHdpdGggLyBmb3Igc3ViZGlyZWN0b3JpZXNcclxuICBsZXQgYmFzZSA9ICcvJztcclxuICBpZiAoYmFzZVVybCkge1xyXG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IGJhc2VVcmwuc3RhcnRzV2l0aCgnLycpID8gYmFzZVVybCA6IGAvJHtiYXNlVXJsfWA7XHJcbiAgICBiYXNlID0gbm9ybWFsaXplZC5lbmRzV2l0aCgnLycpID8gbm9ybWFsaXplZCA6IGAke25vcm1hbGl6ZWR9L2A7XHJcbiAgfVxyXG4gIFxyXG4gIC8vIEdldCBwb3J0IGZyb20gY29uZmlnLmpzb24sIGVudiB2YXIsIG9yIGRlZmF1bHQgdG8gODA4MFxyXG4gIGNvbnN0IHBvcnQgPSBmaWxlQ29uZmlnLlZJVEVfUE9SVCB8fCBwYXJzZUludChwcm9jZXNzLmVudi5WSVRFX1BPUlQgfHwgJzgwODAnLCAxMCk7XHJcbiAgXHJcbiAgLy8gU2V0IG91dHB1dCBkaXJlY3RvcnkgdG8gbW9tZW50emFidWlsZC93d3dyb290XHJcbiAgY29uc3Qgb3V0RGlyID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICcuLi9tb21lbnR6YWJ1aWxkL3d3d3Jvb3QnKTtcclxuICBcclxuICByZXR1cm4ge1xyXG4gIGJhc2U6IGJhc2UsXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiBwb3J0LFxyXG4gICAgY29yczogdHJ1ZSxcclxuICAgIC8vIEFERCBQUk9YWSBDT05GSUdVUkFUSU9OIEhFUkVcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsIC8vIFlvdXIgYmFja2VuZCBVUkxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgX29wdGlvbnMpID0+IHtcclxuICAgICAgICAgIHByb3h5Lm9uKCdlcnJvcicsIChlcnIsIF9yZXEsIF9yZXMpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3Byb3h5IGVycm9yJywgZXJyKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxLCByZXEsIF9yZXMpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1NlbmRpbmcgUmVxdWVzdCB0byB0aGUgVGFyZ2V0OicsIHJlcS5tZXRob2QsIHJlcS51cmwpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBwcm94eS5vbigncHJveHlSZXMnLCAocHJveHlSZXMsIHJlcSwgX3JlcykgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjZWl2ZWQgUmVzcG9uc2UgZnJvbSBUYXJnZXQ6JywgcHJveHlSZXMuc3RhdHVzQ29kZSwgcmVxLnVybCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgZml4UmVjaGFydHNMb2Rhc2hQbHVnaW4oKSxcclxuICAgIC8vIFBsdWdpbiB0byBlbnN1cmUgY29uZmlnLmpzb24gaXMgY29waWVkIHRvIGRpc3QgZHVyaW5nIGJ1aWxkIGFuZCBnZW5lcmF0ZSBwcm9kdWN0aW9uIGNvbmZpZ1xyXG4gICAge1xyXG4gICAgICBuYW1lOiAnZW5zdXJlLWNvbmZpZy1qc29uJyxcclxuICAgICAgYnVpbGRTdGFydCgpIHtcclxuICAgICAgICAvLyBUaGlzIGVuc3VyZXMgY29uZmlnLmpzb24gZnJvbSBwdWJsaWMvIGlzIGNvcGllZCB0byB3d3dyb290L1xyXG4gICAgICAgIC8vIFZpdGUgYXV0b21hdGljYWxseSBjb3BpZXMgcHVibGljLyBmaWxlcywgYnV0IHRoaXMgcGx1Z2luIHZlcmlmaWVzIGl0XHJcbiAgICAgICAgY29uc3QgY29uZmlnUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAncHVibGljL2NvbmZpZy5qc29uJyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHJlYWRGaWxlU3luYyhjb25maWdQYXRoLCAndXRmLTgnKTtcclxuICAgICAgICAgIEpTT04ucGFyc2UoY29uZmlnKTsgLy8gVmFsaWRhdGUgSlNPTlxyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1x1MjcxMyBjb25maWcuanNvbiBmb3VuZCBhbmQgdmFsaWRhdGVkIC0gd2lsbCBiZSBjb3BpZWQgdG8gbW9tZW50emFidWlsZC93d3dyb290LycpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1x1MjZBMCBjb25maWcuanNvbiBub3QgZm91bmQgb3IgaW52YWxpZCBpbiBwdWJsaWMvIGZvbGRlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgd3JpdGVCdW5kbGUoKSB7XHJcbiAgICAgICAgLy8gQWZ0ZXIgYnVpbGQsIGdlbmVyYXRlIHByb2R1Y3Rpb24gY29uZmlnLmpzb24gd2l0aCBjb3JyZWN0IHZhbHVlc1xyXG4gICAgICAgIGNvbnN0IHd3d3Jvb3RDb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICcuLi9tb21lbnR6YWJ1aWxkL3d3d3Jvb3QvY29uZmlnLmpzb24nKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBSZWFkIHRoZSBvcmlnaW5hbCBjb25maWcgb3IgdXNlIGRlZmF1bHRzXHJcbiAgICAgICAgbGV0IGNvbmZpZzogYW55ID0ge307XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHB1YmxpY0NvbmZpZ1BhdGggPSBwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJ3B1YmxpYy9jb25maWcuanNvbicpO1xyXG4gICAgICAgICAgY29uc3QgY29uZmlnQ29udGVudCA9IHJlYWRGaWxlU3luYyhwdWJsaWNDb25maWdQYXRoLCAndXRmLTgnKTtcclxuICAgICAgICAgIGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnQ29udGVudCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgIGNvbnNvbGUud2FybignXHUyNkEwIENvdWxkIG5vdCByZWFkIHB1YmxpYy9jb25maWcuanNvbiwgdXNpbmcgZGVmYXVsdHMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgIC8vIE92ZXJyaWRlIHdpdGggcHJvZHVjdGlvbiB2YWx1ZXMgaWYgYnVpbGRpbmcgZm9yIHByb2R1Y3Rpb25cclxuICAgICAgICAgaWYgKG1vZGUgPT09ICdwcm9kdWN0aW9uJykge1xyXG4gICAgICAgICAgIC8vIEZvciBwcm9kdWN0aW9uLCB1c2UgcmVsYXRpdmUgQVBJIHBhdGggaWYgbm90IHNwZWNpZmllZFxyXG4gICAgICAgICAgIC8vIElmIEFQSSBpcyBvbiBzYW1lIHNlcnZlciBhcyBmcm9udGVuZCwgdXNlIHJlbGF0aXZlIHBhdGggJy9hcGknXHJcbiAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHVzZSB0aGUgY29uZmlndXJlZCBhYnNvbHV0ZSBVUkxcclxuICAgICAgICAgICBjb25zdCBhcGlCYXNlVXJsID0gcHJvY2Vzcy5lbnYuVklURV9BUElfQkFTRV9VUkwgfHwgY29uZmlnLlZJVEVfQVBJX0JBU0VfVVJMO1xyXG4gICAgICAgICAgIGNvbnN0IHByb2R1Y3Rpb25Db25maWcgPSB7XHJcbiAgICAgICAgICAgICBWSVRFX0FQSV9CQVNFX1VSTDogYXBpQmFzZVVybCB8fCAnL2FwaScsIC8vIERlZmF1bHQgdG8gcmVsYXRpdmUgL2FwaSBmb3Igc2FtZS1zZXJ2ZXIgZGVwbG95bWVudFxyXG4gICAgICAgICAgICAgVklURV9BUFBfVElUTEU6IHByb2Nlc3MuZW52LlZJVEVfQVBQX1RJVExFIHx8IGNvbmZpZy5WSVRFX0FQUF9USVRMRSB8fCAnV2VkZGluZyBIdWIgTWFuYWdlcicsXHJcbiAgICAgICAgICAgICBWSVRFX0FQUF9WRVJTSU9OOiBwcm9jZXNzLmVudi5WSVRFX0FQUF9WRVJTSU9OIHx8IGNvbmZpZy5WSVRFX0FQUF9WRVJTSU9OIHx8ICcxLjAuMCcsXHJcbiAgICAgICAgICAgICBWSVRFX0VOVklST05NRU5UOiAncHJvZHVjdGlvbicsXHJcbiAgICAgICAgICAgICAuLi4oY29uZmlnLlZJVEVfQkFTRV9VUkwgJiYgeyBWSVRFX0JBU0VfVVJMOiBjb25maWcuVklURV9CQVNFX1VSTCB9KSxcclxuICAgICAgICAgICAgIC4uLihjb25maWcuVklURV9QT1JUICYmIHsgVklURV9QT1JUOiBjb25maWcuVklURV9QT1JUIH0pXHJcbiAgICAgICAgICAgfTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gV3JpdGUgcHJvZHVjdGlvbiBjb25maWcgdG8gd3d3cm9vdFxyXG4gICAgICAgICAgd3JpdGVGaWxlU3luYyh3d3dyb290Q29uZmlnUGF0aCwgSlNPTi5zdHJpbmdpZnkocHJvZHVjdGlvbkNvbmZpZywgbnVsbCwgMikpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coJ1x1MjcxMyBQcm9kdWN0aW9uIGNvbmZpZy5qc29uIGdlbmVyYXRlZCBpbiBtb21lbnR6YWJ1aWxkL3d3d3Jvb3QvJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIEZvciBkZXZlbG9wbWVudCwganVzdCBlbnN1cmUgdGhlIGNvbmZpZyBleGlzdHNcclxuICAgICAgICAgIGlmICghZXhpc3RzU3luYyh3d3dyb290Q29uZmlnUGF0aCkpIHtcclxuICAgICAgICAgICAgY29uc3QgZGV2Q29uZmlnID0ge1xyXG4gICAgICAgICAgICAgIFZJVEVfQVBJX0JBU0VfVVJMOiBjb25maWcuVklURV9BUElfQkFTRV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgICAgICAgVklURV9BUFBfVElUTEU6IGNvbmZpZy5WSVRFX0FQUF9USVRMRSB8fCAnV2VkZGluZyBIdWIgTWFuYWdlcicsXHJcbiAgICAgICAgICAgICAgVklURV9BUFBfVkVSU0lPTjogY29uZmlnLlZJVEVfQVBQX1ZFUlNJT04gfHwgJzEuMC4wJyxcclxuICAgICAgICAgICAgICBWSVRFX0VOVklST05NRU5UOiAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgICAgICAgICAgIC4uLihjb25maWcuVklURV9CQVNFX1VSTCAmJiB7IFZJVEVfQkFTRV9VUkw6IGNvbmZpZy5WSVRFX0JBU0VfVVJMIH0pLFxyXG4gICAgICAgICAgICAgIC4uLihjb25maWcuVklURV9QT1JUICYmIHsgVklURV9QT1JUOiBjb25maWcuVklURV9QT1JUIH0pXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHdyaXRlRmlsZVN5bmMod3d3cm9vdENvbmZpZ1BhdGgsIEpTT04uc3RyaW5naWZ5KGRldkNvbmZpZywgbnVsbCwgMikpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnXHUyNzEzIERldmVsb3BtZW50IGNvbmZpZy5qc29uIGdlbmVyYXRlZCBpbiBtb21lbnR6YWJ1aWxkL3d3d3Jvb3QvJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGFzIFBsdWdpbixcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbJ3JlY2hhcnRzJywgJ2xvZGFzaCddLFxyXG4gICAgZXhjbHVkZTogW10sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiBvdXREaXIsXHJcbiAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIGV4dGVybmFsOiBbXSxcclxuICAgIH0sXHJcbiAgICB0YXJnZXQ6ICdlczIwMTUnLFxyXG4gIH0sXHJcbiAgZGVmaW5lOiB7XHJcbiAgICBfX0RFVl9fOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgLy8gRml4IGZvciBSZWNoYXJ0cy9Mb2Rhc2ggY29tcGF0aWJpbGl0eSBpc3N1ZVxyXG4gICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkobW9kZSksXHJcbiAgICAvLyBFbnN1cmUgQVBJIGJhc2UgVVJMIGlzIGF2YWlsYWJsZSBpbiBidWlsZFxyXG4gICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0FQSV9CQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlZJVEVfQVBJX0JBU0VfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnKSxcclxuICAgIC8vIEVuc3VyZSBiYXNlIFVSTCBpcyBhdmFpbGFibGUgaW4gYnVpbGRcclxuICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9CQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KGJhc2VVcmwpLFxyXG4gIH0sXHJcbiAgLy8gRXhwb3NlIGVudmlyb25tZW50IHZhcmlhYmxlcyB0byB0aGUgY2xpZW50XHJcbiAgZW52UHJlZml4OiAnVklURV8nLFxyXG4gIH07XHJcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1EsU0FBUyxvQkFBNEI7QUFDdlMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGNBQWMsZUFBZSxrQkFBa0I7QUFHeEQsSUFBTSwwQkFBMEIsTUFBTTtBQUNwQyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixVQUFVLE1BQWMsSUFBWTtBQUVsQyxVQUFJLEdBQUcsU0FBUyxxQkFBcUIsS0FBSyxLQUFLLFNBQVMsb0JBQW9CLEdBQUc7QUFDN0UsZUFBTyxLQUFLO0FBQUEsVUFDVjtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUNBLGFBQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUNGO0FBR0EsU0FBUyxvQkFBb0I7QUFDM0IsTUFBSTtBQUNGLFVBQU0sYUFBYSxLQUFLLFFBQVEsUUFBUSxJQUFJLEdBQUcsb0JBQW9CO0FBQ25FLFVBQU0sZ0JBQWdCLGFBQWEsWUFBWSxPQUFPO0FBQ3RELFVBQU0sU0FBUyxLQUFLLE1BQU0sYUFBYTtBQUN2QyxXQUFPO0FBQUEsRUFDVCxTQUFTLE9BQU87QUFFZCxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBd0I7QUFFMUQsUUFBTSxhQUFhLGtCQUFrQjtBQUlyQyxRQUFNLFVBQVUsUUFBUSxJQUFJLGlCQUFpQixXQUFXLGlCQUFpQjtBQUd6RSxNQUFJLE9BQU87QUFDWCxNQUFJLFNBQVM7QUFDWCxVQUFNLGFBQWEsUUFBUSxXQUFX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
