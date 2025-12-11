import { runtimeConfig } from './runtimeConfig';

// Environment configuration utility
export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  
  // App Configuration
  appTitle: import.meta.env.VITE_APP_TITLE || 'Wedding Hub Manager',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  nodeEnv: import.meta.env.MODE,
  
  // Feature flags
  enableDebug: import.meta.env.DEV,
  enableAnalytics: import.meta.env.PROD,
} as const;

// Type-safe environment configuration
export type Config = typeof config;

// Helper function to get API URL
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash
  return `${baseUrl}/${cleanEndpoint}`;
};

// Helper function to get base URL from runtime config (normalized with leading slash, no trailing slash)
// Base URL is configured in public/config.json - just change it there!
export const getBaseUrl = (): string => {
  const base = runtimeConfig.VITE_BASE_URL || '';
  // Ensure it starts with / and doesn't end with /
  if (!base) return '';
  const normalized = base.startsWith('/') ? base : `/${base}`;
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
};

// Helper function to create a path with base URL
export const getPath = (path: string): string => {
  const base = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
};

// Helper function to check if running in development
export const isDevelopment = (): boolean => config.isDevelopment;

// Helper function to check if running in production
export const isProduction = (): boolean => config.isProduction;

// Helper function to check if we should use mock data
export const shouldUseMockData = (): boolean => {
  return false;
  // Use mock data in development by default, unless explicitly disabled
  if (config.isDevelopment) {
    return import.meta.env.VITE_USE_MOCK_DATA !== 'false';
  }
  // Use mock data in production only if explicitly enabled
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
};

export default config; 