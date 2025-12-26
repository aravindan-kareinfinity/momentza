import { IUserService } from '../interfaces/IDataService';
import { User } from '../../types';
import { apiClient } from '../http/ApiClient';

export class ApiUserService implements IUserService {
  async getAll(): Promise<User[]> {
    return apiClient.get<User[]>('/api/users');
  }

  async getById(id: string): Promise<User | null> {
    try {
      return await apiClient.get<User>(`/api/users/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    return apiClient.post<User>('/api/users', data);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    // C# API expects complete user object with proper casing
    const updateData = {
      Id: id,  // Use uppercase Id for C# API
      Name: data.name,
      Email: data.email,
      Role: data.role,
      OrganizationId: data.organizationId,
      AccessibleHalls: data.accessibleHalls || []
    };
    
    console.log('[ApiUserService] Sending update data:', updateData);
    console.log('[ApiUserService] Update URL:', '/api/users');
    
    return apiClient.post<User>('/api/users/update', updateData);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/users/delete/${id}`, {});
      return true;
    } catch (error) {
      return false;
    }
  }

  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    return apiClient.get<User[]>(`/api/users/organizations/${organizationId}`);
  }
} 