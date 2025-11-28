import { buildApiUrl } from '@/environment';
import { requestManager } from '../RequestManager';

export class ApiClient {
  private headers: HeadersInit;
  private defaultTimeout: number = 10000; // 10 seconds default timeout
  
  constructor() {
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`,
      'X-Organization-Id': this.getOrganizationId()
    };
  }
  
  private getAuthToken(): string {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const userData = JSON.parse(user);
      return userData.token || '';
    }
    return '';
  }
  
  private getOrganizationId(): string {
    // 1) Try URL query: ?orgId=
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const orgIdFromSearch = url.searchParams.get('orgId');
        if (orgIdFromSearch) return orgIdFromSearch;
        
        // 2) Try path pattern like /org/{id}/...
        const parts = url.pathname.split('/').filter(Boolean);
        const orgIndex = parts.indexOf('org');
        if (orgIndex >= 0 && parts[orgIndex + 1]) {
          return parts[orgIndex + 1];
        }
      }
    } catch {}

    // 3) Try localStorage override key (if app sets it elsewhere)
    const storedOrgId = localStorage.getItem('currentOrganizationId') || localStorage.getItem('selectedOrganizationId');
    if (storedOrgId) return storedOrgId;

    // 4) Fallback to logged-in user's organizationId
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.organizationId || '';
      } catch {}
    }
    return '';
  }
  
  private updateHeaders(): void {
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`,
      'X-Organization-Id': this.getOrganizationId()
    };
  }

  // Helper method to create fetch with timeout
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = this.defaultTimeout): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(
          408,
          'Request Timeout',
          `Request timeout after ${timeoutMs}ms. The server may be down or unreachable.`,
          { timeout: timeoutMs }
        );
      }
      throw error;
    }
  }
  
  async get<T>(endpoint: string, timeoutMs?: number): Promise<T> {
    return requestManager.executeRequest(
      'GET',
      endpoint,
      async () => {
        this.updateHeaders();
        const response = await this.fetchWithTimeout(buildApiUrl(endpoint), {
          method: 'GET',
          headers: this.headers
        }, timeoutMs);
        return this.handleResponse<T>(response);
      }
    );
  }
  
  async post<T>(endpoint: string, data: any, timeoutMs?: number): Promise<T> {
    return requestManager.executeRequest(
      'POST',
      endpoint,
      async () => {
        this.updateHeaders();
        const response = await this.fetchWithTimeout(buildApiUrl(endpoint), {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(data)
        }, timeoutMs);
        return this.handleResponse<T>(response);
      },
      data
    );
  }
  
  async put<T>(endpoint: string, data: any, timeoutMs?: number): Promise<T> {
    return requestManager.executeRequest(
      'PUT',
      endpoint,
      async () => {
        this.updateHeaders();
        const response = await this.fetchWithTimeout(buildApiUrl(endpoint), {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(data)
        }, timeoutMs);
        return this.handleResponse<T>(response);
      },
      data
    );
  }
  
  async patch<T>(endpoint: string, data: any, timeoutMs?: number): Promise<T> {
    return requestManager.executeRequest(
      'PATCH',
      endpoint,
      async () => {
        this.updateHeaders();
        const response = await this.fetchWithTimeout(buildApiUrl(endpoint), {
          method: 'PATCH',
          headers: this.headers,
          body: JSON.stringify(data)
        }, timeoutMs);
        return this.handleResponse<T>(response);
      },
      data
    );
  }
  
  async delete<T>(endpoint: string, timeoutMs?: number): Promise<T> {
    return requestManager.executeRequest(
      'DELETE',
      endpoint,
      async () => {
        this.updateHeaders();
        const response = await this.fetchWithTimeout(buildApiUrl(endpoint), {
          method: 'DELETE',
          headers: this.headers
        }, timeoutMs);
        return this.handleResponse<T>(response);
      }
    );
  }
  
  async upload<T>(endpoint: string, formData: FormData, timeoutMs?: number): Promise<T> {
    return requestManager.executeRequest(
      'UPLOAD',
      endpoint,
      async () => {
        this.updateHeaders();
        const headers = { ...this.headers };
        delete headers['Content-Type']; // Let browser set content-type for FormData
        
        const response = await this.fetchWithTimeout(buildApiUrl(endpoint), {
          method: 'POST',
          headers,
          body: formData
        }, timeoutMs);
        return this.handleResponse<T>(response);
      }
    );
  }
  
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new ApiError(
        response.status,
        response.statusText,
        errorData.message || 'An error occurred',
        errorData
      );
    }
    
    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as T;
  }
  
  private async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { message: await response.text() };
    } catch {
      return { message: 'An error occurred' };
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton instance
export const apiClient = new ApiClient(); 