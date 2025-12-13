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
  // PRIORITY 1: Check if we're on a subdomain - ALWAYS preserve subdomain regardless of config
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Preserve subdomain for .localhost domains (e.g., appointza.localhost -> http://appointza.localhost:5000)
    if (hostname.includes('.localhost')) {
      console.log(`[getApiBaseUrl] Preserving subdomain: ${hostname} -> http://${hostname}:5000`);
      return `http://${hostname}:5000`;
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
  
  // Production: use relative URLs (empty string means same origin)
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

