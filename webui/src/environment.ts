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
 */
export const getApiBaseUrl = (): string => {
  const candidates = [
    normalizeUrl(runtimeConfig?.VITE_API_BASE_URL),
    normalizeUrl(import.meta?.env?.VITE_API_BASE_URL),
    normalizeUrl(config.apiBaseUrl),
    'http://localhost:5000',
  ];

  const resolved = candidates.find(Boolean);
  return resolved ?? 'http://localhost:5000';
};

/**
 * Build a full API URL from a relative endpoint/path.
 */
export const buildApiUrl = (endpoint: string = ''): string => {
  const base = getApiBaseUrl();
  const sanitizedEndpoint = endpoint.replace(/^\//, '');
  return sanitizedEndpoint ? `${base}/${sanitizedEndpoint}` : base;
};

export default {
  getApiBaseUrl,
  buildApiUrl,
};

