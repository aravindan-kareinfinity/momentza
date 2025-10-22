// Global type declarations
declare global {
  interface Window {
    runtimeConfig?: {
      VITE_API_BASE_URL?: string;
      VITE_APP_TITLE?: string;
      VITE_APP_VERSION?: string;
      VITE_ENVIRONMENT?: string;
      [key: string]: any;
    };
  }
}

export {}; 