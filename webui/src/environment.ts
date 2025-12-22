import config from '@/config/environment';
import { runtimeConfig } from '@/config/runtimeConfig';

const normalizeUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.replace(/\/$/, '') : undefined;
};

/**
 * Determine the API base URL by checking runtime config, Vite env values,
 * and finally falling back to the default provided in config.
 * 
 * For production (momentza.com), uses relative URLs (empty string = same origin).
 * For localhost development, preserves subdomain and uses port 5000.
 */
export const getApiBaseUrl = (): string => {
  // PRIORITY 1: ALWAYS preserve subdomain for ANY domain (localhost OR production)
  // This ensures: storesoft.momantza.com -> API calls go to storesoft.momantza.com
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol; // http: or https:
    const port = window.location.port;
    
    // Check if we're on a subdomain (3+ parts: subdomain.domain.tld)
    const parts = hostname.split('.');
    const hasSubdomain = parts.length >= 3;
    
    if (hasSubdomain) {
      // We're on a subdomain - preserve it for API calls
      // Examples:
      // - storesoft.momantza.com -> https://storesoft.momantza.com/api/...
      // - appointza.localhost -> http://appointza.localhost:5000/api/...
      const apiUrl = port 
        ? `${protocol}//${hostname}:${port}` 
        : `${protocol}//${hostname}`;
      console.log(`[getApiBaseUrl] Preserving subdomain: ${hostname} -> ${apiUrl}`);
      return apiUrl;
    }
    
    // Special case: localhost with port (development)
    if (hostname.includes('.localhost') || (hostname === 'localhost' && port)) {
      const devPort = port || '5000';
      console.log(`[getApiBaseUrl] Development mode: ${hostname} -> http://${hostname}:${devPort}`);
      return `http://${hostname}:${devPort}`;
    }
  }
  
  // PRIORITY 2: Check candidates (runtime config, env vars, config file)
  const candidates = [
    normalizeUrl(runtimeConfig?.VITE_API_BASE_URL),
    normalizeUrl(import.meta?.env?.VITE_API_BASE_URL),
    normalizeUrl(config.apiBaseUrl),
  ];

  const resolved = candidates.find(Boolean);
  
  // If we have an explicit config, use it
  if (resolved) {
    // If it's a relative path (starts with /) or empty, return as-is
    // This means API calls use same origin (good for production)
    if (resolved.startsWith('/') || resolved === '') {
      return resolved;
    }
    // If it's a full URL, use it
    return resolved;
  }
  
  // PRIORITY 3: Fallback for direct localhost (no subdomain)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Direct localhost or 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
  }
  
  // Production base domain: use relative URLs (empty string = same origin)
  // This means: momantza.com -> /api/... (same origin)
  return '';
};

/**
 * Build a full API URL from a relative endpoint/path.
 * Handles both absolute URLs (http://...) and relative paths (/api/...).
 */
export const buildApiUrl = (endpoint: string = ''): string => {
  const base = getApiBaseUrl();
  const sanitizedEndpoint = endpoint.replace(/^\//, '');
  
  // If base is empty (relative URL mode), just return the endpoint
  if (base === '') {
    return sanitizedEndpoint ? `/${sanitizedEndpoint}` : '/';
  }
  
  // If base is a full URL, combine it with endpoint
  return sanitizedEndpoint ? `${base}/${sanitizedEndpoint}` : base;
};

export default {
  getApiBaseUrl,
  buildApiUrl,
};

