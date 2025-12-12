export type RuntimeConfig = {
  VITE_BASE_URL?: string;
  VITE_PORT?: number;
  VITE_API_BASE_URL: string;
  VITE_APP_TITLE: string;
  VITE_APP_VERSION: string;
  VITE_ENVIRONMENT: string;
  // Add more config keys as needed
};

export let runtimeConfig: RuntimeConfig = {
  VITE_BASE_URL: '', // default to empty (root)
  VITE_PORT: 8080, // default port
  VITE_API_BASE_URL: 'https://momentza.com', // default fallback
  VITE_APP_TITLE: 'Wedding Hub Manager',
  VITE_APP_VERSION: '1.0.0',
  VITE_ENVIRONMENT: 'development'
};

// Helper function to create a timeout promise
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export async function loadRuntimeConfig() {
  try {
    // Check if config is already loaded globally from HTML
    if (typeof window !== 'undefined' && window.runtimeConfig) {
      runtimeConfig = { ...runtimeConfig, ...window.runtimeConfig };
      console.log('Using pre-loaded runtime config:', runtimeConfig);
      return;
    }

    // Fallback: fetch config.json with timeout
    // Try to get base URL from environment variable (for build-time) or use root
    const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
    const configPath = baseUrl ? `${baseUrl}/config.json` : '/config.json';
    console.log('Loading runtime config from', configPath);
    const res = await fetchWithTimeout(configPath, 5000); // 5 second timeout
    
    if (res.ok) {
      const config = await res.json();
      runtimeConfig = { ...runtimeConfig, ...config };
      console.log('Runtime config loaded from fetch:', runtimeConfig);
    } else {
      throw new Error(`Failed to load config.json: ${res.status} ${res.statusText}`);
    }
  } catch (e) {
    // fallback to defaults
    console.warn('Could not load runtime config, using defaults.', e);
    // Keep the default values that are already set
  }
} 