// vite.config.ts
import { defineConfig } from "file:///E:/Developer/consultation/momentza/MomantzaClient/wedding-hub-manager-main/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Developer/consultation/momentza/MomantzaClient/wedding-hub-manager-main/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///E:/Developer/consultation/momentza/MomantzaClient/wedding-hub-manager-main/node_modules/lovable-tagger/dist/index.js";
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
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "development" && fixRechartsLodashPlugin()
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
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(process.env.VITE_API_BASE_URL || "http://localhost:5000")
  },
  // Expose environment variables to the client
  envPrefix: "VITE_"
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxEZXZlbG9wZXJcXFxcY29uc3VsdGF0aW9uXFxcXG1vbWVudHphXFxcXE1vbWFudHphQ2xpZW50XFxcXHdlZGRpbmctaHViLW1hbmFnZXItbWFpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcRGV2ZWxvcGVyXFxcXGNvbnN1bHRhdGlvblxcXFxtb21lbnR6YVxcXFxNb21hbnR6YUNsaWVudFxcXFx3ZWRkaW5nLWh1Yi1tYW5hZ2VyLW1haW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0RldmVsb3Blci9jb25zdWx0YXRpb24vbW9tZW50emEvTW9tYW50emFDbGllbnQvd2VkZGluZy1odWItbWFuYWdlci1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIEN1c3RvbSBwbHVnaW4gdG8gZml4IFJlY2hhcnRzL0xvZGFzaCBjb21wYXRpYmlsaXR5IGlzc3VlXG5jb25zdCBmaXhSZWNoYXJ0c0xvZGFzaFBsdWdpbiA9ICgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnZml4LXJlY2hhcnRzLWxvZGFzaCcsXG4gICAgdHJhbnNmb3JtKGNvZGU6IHN0cmluZywgaWQ6IHN0cmluZykge1xuICAgICAgLy8gRml4IHRoZSBTeW1ib2wudG9TdHJpbmdUYWcgaXNzdWUgaW4gZGV2ZWxvcG1lbnRcbiAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzL2xvZGFzaCcpICYmIGNvZGUuaW5jbHVkZXMoJ1N5bWJvbC50b1N0cmluZ1RhZycpKSB7XG4gICAgICAgIHJldHVybiBjb2RlLnJlcGxhY2UoXG4gICAgICAgICAgL09iamVjdFxcLmRlZmluZVByb3BlcnR5XFwoKFteLF0rKSxcXHMqU3ltYm9sXFwudG9TdHJpbmdUYWcsXFxzKlxce1tefV0qXFx9XFwpL2csXG4gICAgICAgICAgJy8vIEZpeGVkOiBTeW1ib2wudG9TdHJpbmdUYWcgYXNzaWdubWVudCByZW1vdmVkIGZvciBjb21wYXRpYmlsaXR5J1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfSxcbiAgfTtcbn07XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9OiB7IG1vZGU6IHN0cmluZyB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxuICAgIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiYgZml4UmVjaGFydHNMb2Rhc2hQbHVnaW4oKSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsncmVjaGFydHMnLCAnbG9kYXNoJ10sXG4gICAgZXhjbHVkZTogW10sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbXSxcbiAgICB9LFxuICAgIHRhcmdldDogJ2VzMjAxNScsXG4gIH0sXG4gIGRlZmluZToge1xuICAgIF9fREVWX186IG1vZGUgPT09ICdkZXZlbG9wbWVudCcsXG4gICAgLy8gRml4IGZvciBSZWNoYXJ0cy9Mb2Rhc2ggY29tcGF0aWJpbGl0eSBpc3N1ZVxuICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICAgIC8vIEVuc3VyZSBBUEkgYmFzZSBVUkwgaXMgYXZhaWxhYmxlIGluIGJ1aWxkXG4gICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0FQSV9CQVNFX1VSTCc6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlZJVEVfQVBJX0JBU0VfVVJMIHx8ICdodHRwOi8vbG9jYWxob3N0OjUwMDAnKSxcbiAgfSxcbiAgLy8gRXhwb3NlIGVudmlyb25tZW50IHZhcmlhYmxlcyB0byB0aGUgY2xpZW50XG4gIGVudlByZWZpeDogJ1ZJVEVfJyxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFosU0FBUyxvQkFBb0I7QUFDemIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUdoQyxJQUFNLDBCQUEwQixNQUFNO0FBQ3BDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFVBQVUsTUFBYyxJQUFZO0FBRWxDLFVBQUksR0FBRyxTQUFTLHFCQUFxQixLQUFLLEtBQUssU0FBUyxvQkFBb0IsR0FBRztBQUM3RSxlQUFPLEtBQUs7QUFBQSxVQUNWO0FBQUEsVUFDQTtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBeUI7QUFBQSxFQUMzRCxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQSxJQUNoQixTQUFTLGlCQUFpQix3QkFBd0I7QUFBQSxFQUNwRCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLE9BQU87QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxZQUFZLFFBQVE7QUFBQSxJQUM5QixTQUFTLENBQUM7QUFBQSxFQUNaO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUM7QUFBQSxJQUNiO0FBQUEsSUFDQSxRQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sU0FBUyxTQUFTO0FBQUE7QUFBQSxJQUVsQix3QkFBd0IsS0FBSyxVQUFVLElBQUk7QUFBQTtBQUFBLElBRTNDLHFDQUFxQyxLQUFLLFVBQVUsUUFBUSxJQUFJLHFCQUFxQix1QkFBdUI7QUFBQSxFQUM5RztBQUFBO0FBQUEsRUFFQSxXQUFXO0FBQ2IsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
