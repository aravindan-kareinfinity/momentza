import { Organization } from '../../types';
import { mockOrganizations } from '../mockData';

class OrganizationService {
  private static instance: OrganizationService;
  private cachedOrganization: Organization | null = null;
  private isLoading = false;
  private error: Error | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  private constructor() {}

  public static getInstance(): OrganizationService {
    if (!OrganizationService.instance) {
      OrganizationService.instance = new OrganizationService();
    }
    return OrganizationService.instance;
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

  async getCurrentOrganization(): Promise<Organization> {
    // Return cached data if valid
    if (this.isCacheValid()) {
      console.log('🔍 OrganizationService: Returning cached organization:', this.cachedOrganization);
      return Promise.resolve(this.cachedOrganization!);
    }

    // If already loading, wait for the current request
    if (this.isLoading) {
      console.log('🔍 OrganizationService: Request already in progress, waiting...');
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
      console.log('🔍 OrganizationService: Fetching organization data...');
      
      // Simulate API call with potential error
      const organization = await this.fetchOrganizationData();
      
      // Cache the successful result
      this.cachedOrganization = organization;
      this.lastFetchTime = Date.now();
      this.isLoading = false;
      
      console.log('🔍 OrganizationService: Successfully cached organization:', organization);
      return organization;
    } catch (error) {
      this.error = error as Error;
      this.isLoading = false;
      console.error('🔍 OrganizationService: Error fetching organization:', error);
      throw error;
    }
  }

  private async fetchOrganizationData(): Promise<Organization> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional server errors (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Server not available. Please try again later.');
    }

    // Return mock data
    return Promise.resolve(mockOrganizations[0]);
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

  getOrganizationById(id: string): Organization | undefined {
    return mockOrganizations.find(org => org.id === id);
  }

  async getById(id: string): Promise<Organization | null> {
    const org = this.getOrganizationById(id);
    return org || null;
  }

  async getAll(): Promise<Organization[]> {
    return this.getAllOrganizations();
  }

  async create(data: Omit<Organization, 'id'>): Promise<Organization> {
    const newOrg: Organization = {
      ...data,
      id: Date.now().toString()
    };
    mockOrganizations.push(newOrg);
    return newOrg;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return this.updateOrganization(id, data);
  }

  async delete(id: string): Promise<boolean> {
    const orgIndex = mockOrganizations.findIndex(org => org.id === id);
    if (orgIndex !== -1) {
      mockOrganizations.splice(orgIndex, 1);
      return true;
    }
    return false;
  }

  getAllOrganizations(): Organization[] {
    return mockOrganizations;
  }

  updateOrganization(id: string, updates: Partial<Organization>): Organization {
    const orgIndex = mockOrganizations.findIndex(org => org.id === id);
    if (orgIndex !== -1) {
      mockOrganizations[orgIndex] = { ...mockOrganizations[orgIndex], ...updates };
      
      // Update cache if this is the current organization
      if (this.cachedOrganization && this.cachedOrganization.id === id) {
        this.cachedOrganization = { ...this.cachedOrganization, ...updates };
      }
      
      return mockOrganizations[orgIndex];
    }
    throw new Error('Organization not found');
  }
}

export const organizationService = OrganizationService.getInstance();
