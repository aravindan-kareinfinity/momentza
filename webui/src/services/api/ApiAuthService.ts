import { IAuthService } from '../interfaces/IDataService';
import { User } from '../../types';
import { apiClient } from '../http/ApiClient';

export class ApiAuthService implements IAuthService {
  private currentUser: User | null = null;

  async login(email: string, password: string): Promise<User> {
    try {
      const response = await apiClient.post<{ user: User; token: string }>('/api/auth/login', {
        email,
        password
      });

      // Store user data with token
      const userWithToken = {
        ...response.user,
        token: response.token
      };
      
      this.currentUser = userWithToken;
      localStorage.setItem('currentUser', JSON.stringify(userWithToken));
      
      return userWithToken;
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await apiClient.post('/api/auth/logout', {});
    } catch (error) {
      // Even if server logout fails, clear local data
      console.warn('Server logout failed, clearing local data:', error);
    } finally {
      // Clear local data regardless of server response
      this.currentUser = null;
      localStorage.removeItem('currentUser');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to get user from localStorage
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        this.currentUser = userData;
        return userData;
      } catch (error) {
        // Invalid JSON in localStorage, clear it
        localStorage.removeItem('currentUser');
        return null;
      }
    }

    // Try to validate token with server
    try {
      const user = await apiClient.get<User>('/api/auth/me');
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    } catch (error) {
      // Token is invalid or expired, clear local data
      this.currentUser = null;
      localStorage.removeItem('currentUser');
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Additional helper methods for token management
  private getAuthToken(): string {
    const user = this.getCurrentUser();
    if (user && 'token' in user) {
      return (user as any).token || '';
    }
    return '';
  }

  // Method to refresh token if needed
  async refreshToken(): Promise<string> {
    try {
      const response = await apiClient.post<{ token: string }>('/api/auth/refresh', {});
      const newToken = response.token;
      
      // Update stored user with new token
      if (this.currentUser) {
        const updatedUser = { ...this.currentUser, token: newToken };
        this.currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      
      return newToken;
    } catch (error) {
      // Token refresh failed, logout user
      await this.logout();
      throw new Error('Token refresh failed');
    }
  }

  // Synchronous methods for backward compatibility
  // These methods will throw an error since API calls are inherently async
  loginSync(email: string, password: string): User {
    throw new Error('Synchronous login not supported in API mode. Use login() instead.');
  }

  logoutSync(): void {
    throw new Error('Synchronous logout not supported in API mode. Use logout() instead.');
  }

  getCurrentUserSync(): User | null {
    // For API mode, we can return the cached user synchronously
    if (this.currentUser) {
      return this.currentUser;
    }
    
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch (error) {
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    
    return null;
  }

  isAuthenticatedSync(): boolean {
    return this.getCurrentUserSync() !== null;
  }
} 