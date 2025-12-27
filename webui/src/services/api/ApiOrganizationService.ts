import { IOrganizationService } from '../interfaces/IDataService';
import { Organization } from '../../types';
import { apiClient } from '../http/ApiClient';

export class ApiOrganizationService implements IOrganizationService {
  private static instance: ApiOrganizationService;
  private cachedOrganization: Organization | null = null;
  private isLoading = false;
  private error: Error | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  private constructor() {}

  public static getInstance(): ApiOrganizationService {
    if (!ApiOrganizationService.instance) {
      ApiOrganizationService.instance = new ApiOrganizationService();
    }
    return ApiOrganizationService.instance;
  }

  private isCacheValid(): boolean {
    return this.cachedOrganization !== null && 
           (Date.now() - this.lastFetchTime) < this.CACHE_DURATION;
  }

  private clearCache(): void {
    this.cachedOrganization = null;
    this.error = null;
    this.lastFetchTime = 0;
  }

  async getCurrentOrganization(organizationId?: string): Promise<Organization> {
    // If organizationId is provided, fetch directly by ID
    if (organizationId) {
      console.log('🔍 ApiOrganizationService: Fetching organization by ID from URL:', organizationId);
      try {
        // Try multiple endpoints to find the organization
        let organization: Organization;
        
        try {
          // First try the standard endpoint
          organization = await apiClient.get<Organization>(`/api/organizations/${organizationId}`);
          console.log('🔍 ApiOrganizationService: Successfully fetched organization by ID (standard endpoint):', organization);
        } catch (error) {
          console.log('🔍 ApiOrganizationService: Standard endpoint failed, trying alternative endpoints...');
          
          try {
            // Try the by-id endpoint
            organization = await apiClient.get<Organization>(`/api/organizations/by-id/${organizationId}`);
            console.log('🔍 ApiOrganizationService: Successfully fetched organization by ID (by-id endpoint):', organization);
          } catch (error2) {
            console.log('🔍 ApiOrganizationService: by-id endpoint failed, trying id endpoint...');
            
            try {
              // Try the id endpoint
              organization = await apiClient.get<Organization>(`/api/organizations/id/${organizationId}`);
              console.log('🔍 ApiOrganizationService: Successfully fetched organization by ID (id endpoint):', organization);
            } catch (error3) {
              console.error('🔍 ApiOrganizationService: All endpoints failed for organization ID:', organizationId);
              console.error('🔍 ApiOrganizationService: Standard endpoint error:', error);
              console.error('🔍 ApiOrganizationService: by-id endpoint error:', error2);
              console.error('🔍 ApiOrganizationService: id endpoint error:', error3);
              throw error; // Throw the original error
            }
          }
        }
        
        return organization;
      } catch (error) {
        console.error('🔍 ApiOrganizationService: Error fetching organization by ID:', error);
        throw error;
      }
    }

    // If no organizationId provided, get it from user context (localStorage)
    // This bypasses domain/subdomain validation and uses the user's organizationId directly
    const userOrganizationId = this.getUserOrganizationId();
    if (userOrganizationId) {
      console.log('🔍 ApiOrganizationService: Using organization ID from user context:', userOrganizationId);
      // Recursively call with the user's organizationId to fetch by ID
      return this.getCurrentOrganization(userOrganizationId);
    }

    // Return cached data if valid (fallback for backward compatibility)
    if (this.isCacheValid()) {
      console.log('🔍 ApiOrganizationService: Returning cached organization:', this.cachedOrganization);
      return Promise.resolve(this.cachedOrganization!);
    }

    // If already loading, wait for the current request
    if (this.isLoading) {
      console.log('🔍 ApiOrganizationService: Request already in progress, waiting...');
      return new Promise((resolve, reject) => {
        const checkCache = () => {
          if (this.error) {
            reject(this.error);
          } else if (this.cachedOrganization) {
            resolve(this.cachedOrganization);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    // Start new request
    this.isLoading = true;
    this.error = null;

    try {
      console.log('🔍 ApiOrganizationService: Fetching organization data from API...');
      
      const organization = await apiClient.get<Organization>('/api/organizations/current');
      
      // Cache the successful result
      this.cachedOrganization = organization;
      this.lastFetchTime = Date.now();
      this.isLoading = false;
      
      console.log('🔍 ApiOrganizationService: Successfully cached organization:', organization);
      return organization;
    } catch (error) {
      this.error = error as Error;
      this.isLoading = false;
      console.error('🔍 ApiOrganizationService: Error fetching organization:', error);
      throw error;
    }
  }

  // Helper method to get organization ID from user context (localStorage)
  private getUserOrganizationId(): string | null {
    try {
      const user = localStorage.getItem('currentUser');
      if (user) {
        const userData = JSON.parse(user);
        return userData.organizationId || null;
      }
    } catch (error) {
      console.error('🔍 ApiOrganizationService: Error reading user organizationId from localStorage:', error);
    }
    return null;
  }

  // Method to force refresh the cache
  async refreshOrganization(): Promise<Organization> {
    this.clearCache();
    return this.getCurrentOrganization();
  }

  // Method to get cached organization without making API call
  getCachedOrganization(): Organization | null {
    return this.isCacheValid() ? this.cachedOrganization : null;
  }

  // Method to check if there's a cached error
  getLastError(): Error | null {
    return this.error;
  }

  // Method to clear error state
  clearError(): void {
    this.error = null;
  }

  async getAll(): Promise<Organization[]> {
    return apiClient.get<Organization[]>('/api/organizations');
  }

  async getById(id: string): Promise<Organization | null> {
    try {
      return await apiClient.get<Organization>(`/api/organizations/by-id/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<Organization, 'id'>): Promise<Organization> {
    return apiClient.post<Organization>('/api/organizations', data);
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    console.log('Updating organization with data:', data);
    const updatedOrg = await apiClient.post<Organization>(`/api/organizations/${id}/update`, data);
    console.log('API returned:', updatedOrg);
    
    // Update cache if this is the current organization
    if (this.cachedOrganization && this.cachedOrganization.id === id) {
      this.cachedOrganization = { ...this.cachedOrganization, ...data };
      console.log('Updated cached organization:', this.cachedOrganization);
    }
    
    // If the API returns an empty object (204 No Content), return the updated cached organization
    if (Object.keys(updatedOrg).length === 0) {
      console.log('API returned empty object, using cached organization');
      return this.cachedOrganization || { ...data, id } as Organization;
    }
    
    return updatedOrg;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/organizations/${id}/delete`, {});
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    return this.update(id, data);
  }
} 