import { IAuthService } from '../interfaces/IDataService';
import { User } from '../../types';
import { getApiBaseUrl } from '../../environment';


export class ApiAuthService implements IAuthService {
  private currentUser: User | null = null;

  private getBackendBaseUrl(): string {
    // Use the centralized getApiBaseUrl function to ensure consistency
    // This preserves subdomain for both localhost and production domains
    const baseUrl = getApiBaseUrl();
    
    // If getApiBaseUrl returns empty (relative URL), use current origin
    // This ensures API calls go to the same domain/subdomain as the frontend
    if (!baseUrl || baseUrl === '') {
      return window.location.origin;
    }
    
    return baseUrl;
  }

  private getOrganizationId(): string {
    // 1) Query override: ?orgId=...
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get('orgId');
      if (q) return q;
    } catch {}

    // 2) Local override: currentOrganizationId or selectedOrganizationId
    const storedOrgId = localStorage.getItem('currentOrganizationId') || localStorage.getItem('selectedOrganizationId');
    if (storedOrgId) return storedOrgId;

    // 3) Subdomain: jk.localhost -> jk
    try {
      const hostname = window.location.hostname;
      if (hostname.includes('.localhost')) {
        const subdomain = hostname.split('.')[0];
        if (subdomain && subdomain !== 'www') {
          return subdomain;
        }
      }
      // Production-style: company.yourapp.com -> company
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        return parts[0];
      }
    } catch {}

    return '';
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const orgId = this.getOrganizationId();
      const backendUrl = this.getBackendBaseUrl();
      
      // Debug logging
      console.log('🚀 Login request details:', {
        frontendUrl: window.location.href,
        organization: orgId || '(empty)',
        backendUrl: backendUrl,
        expectedBackend: `http://${orgId}.localhost:5000` // What it should be
      });

     

      const resp = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId,
          'X-Organization-Subdomain': orgId
        },
        body: JSON.stringify({ email, password })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Login failed:', {
          status: resp.status,
          statusText: resp.statusText,
          error: errorData,
          organization: orgId,
          backendUrl: backendUrl
        });
        throw new Error(errorData.message || `Login failed: ${resp.status}`);
      }

      const response = await resp.json();
      
      // Store user data with token
      const userWithToken = {
        ...response.user,
        token: response.token
      };
      
      this.currentUser = userWithToken;
      localStorage.setItem('currentUser', JSON.stringify(userWithToken));
      localStorage.setItem('currentOrganizationId', orgId);
      
      console.log('✅ Login successful for organization:', orgId);
      return userWithToken;
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid credentials');
    }
  }

  async logout(): Promise<void> {
    try {
      const backendUrl = this.getBackendBaseUrl();
      const token = this.getAuthToken();
      
      if (token) {
        await fetch(`${backendUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
      }
    } catch (error) {
      console.warn('Server logout failed, clearing local data:', error);
    } finally {
      // Always clear local data
      this.currentUser = null;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentOrganizationId');
      console.log('✅ Logout completed');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get from localStorage
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        this.currentUser = userData;
        return userData;
      } catch (error) {
        console.warn('Invalid user data in localStorage, clearing...');
        localStorage.removeItem('currentUser');
        return null;
      }
    }

    // Try to validate with server
    try {
      const backendUrl = this.getBackendBaseUrl();
      const token = this.getAuthToken();
      
      if (!token) {
        return null;
      }

      const resp = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (resp.ok) {
        const user = await resp.json();
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      } else {
        // Token is invalid
        console.warn('Token validation failed, clearing local data');
        this.clearLocalData();
      }
    } catch (error) {
      console.error('Error validating token:', error);
      this.clearLocalData();
    }

    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async refreshToken(): Promise<string> {
    try {
      const backendUrl = this.getBackendBaseUrl();
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No token available for refresh');
      }

      const resp = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!resp.ok) {
        throw new Error('Token refresh failed');
      }

      const response = await resp.json();
      const newToken = response.token;

      // Update stored user with new token
      if (this.currentUser) {
        const updatedUser: any = { ...(this.currentUser as any), token: newToken };
        this.currentUser = updatedUser as User;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      console.log('✅ Token refreshed successfully');
      return newToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await this.logout();
      throw new Error('Token refresh failed');
    }
  }

  // Synchronous methods for immediate access
  getCurrentUserSync(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch {
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    
    return null;
  }

  isAuthenticatedSync(): boolean {
    return this.getCurrentUserSync() !== null;
  }

  // Helper methods
  private getAuthToken(): string {
    const user = this.getCurrentUserSync();
    return (user as any)?.token || '';
  }

  private clearLocalData(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentOrganizationId');
  }

  // For backward compatibility - throw errors for sync methods that can't work
  loginSync(email: string, password: string): User {
    throw new Error('Synchronous login not supported in API mode. Use login() instead.');
  }

  logoutSync(): void {
    throw new Error('Synchronous logout not supported in API mode. Use logout() instead.');
  }
}