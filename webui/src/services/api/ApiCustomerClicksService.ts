import { ICustomerClicksService, CustomerClickUploadRequest } from '../interfaces/IDataService';
import { CustomerClick } from '../mockData';
import { apiClient } from '../http/ApiClient';
import { buildApiUrl } from '@/environment';

export class ApiCustomerClicksService implements ICustomerClicksService {
  async getAll(): Promise<CustomerClick[]> {
    return apiClient.get<CustomerClick[]>('/api/customer-clicks');
  }

  async getById(id: string): Promise<CustomerClick | null> {
    try {
      return await apiClient.get<CustomerClick>(`/api/customer-clicks/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<CustomerClick, 'id'>): Promise<CustomerClick> {
    return apiClient.post<CustomerClick>('/api/customer-clicks', data);
  }

  async update(id: string, data: Partial<CustomerClick>): Promise<CustomerClick> {
    return apiClient.put<CustomerClick>(`/api/customer-clicks/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/customer-clicks/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCustomerClicksByHallId(hallId: string): Promise<CustomerClick[]> {
    return apiClient.get<CustomerClick[]>(`/api/halls/${hallId}/customer-clicks`);
  }

  async getCustomerClicksStats(): Promise<any> {
    return apiClient.get<any>('/api/customer-clicks/stats');
  }

  async createCustomerClick(data: CustomerClickUploadRequest): Promise<CustomerClick> {
    // Send as JSON object to match the updated C# controller
    const jsonPayload = {
      id: data.id,
      customerId: data.customerId,
      eventDate: data.eventDate,
      eventType: data.eventType,
      message: data.message,
      hallId: data.hallId,
      boyName: data.boyName,
      girlName: data.girlName,
      imageBase64: data.imageBase64,
      customerName: 'Anonymous',
      customerEmail: 'no-email@example.com',
      customerPhone: 'No Phone',
      guestCount: 1,
      rating: 5
    };
    
    return apiClient.post<CustomerClick>('/api/customer-clicks/upload', jsonPayload);
  }

  getImageUrl(id: string): string {
    return buildApiUrl(`/api/customer-clicks/${id}/image`);
  }
} 