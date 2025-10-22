import { mockUsers } from '../mockData';
import { User } from '../../types';
import { IAuthService } from '../interfaces/IDataService';

class AuthService implements IAuthService {
  private currentUser: User | null = null;

  // Async methods for API compatibility
  async login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.email === email);
        if (user && password === 'password') {
          this.currentUser = user;
          localStorage.setItem('currentUser', JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  }

  async logout(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        resolve();
      }, 500);
    });
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentUser) {
          resolve(this.currentUser);
          return;
        }
        
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          try {
            this.currentUser = JSON.parse(stored);
            resolve(this.currentUser);
          } catch (error) {
            localStorage.removeItem('currentUser');
            resolve(null);
          }
        } else {
          resolve(null);
        }
      }, 100);
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Synchronous methods for backward compatibility
  loginSync(email: string, password: string): User {
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'password') {
      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    } else {
      throw new Error('Invalid credentials');
    }
  }

  logoutSync(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUserSync(): User | null {
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

export const authService = new AuthService();
