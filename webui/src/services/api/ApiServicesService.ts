import { IServicesService } from '../interfaces/IDataService';
import { ServiceItem, Services } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiServicesService implements IServicesService {
  async getAll(): Promise<ServiceItem[]> {
    return apiClient.get<ServiceItem[]>('/api/services');
  }

  async getById(id: string): Promise<ServiceItem | null> {
    try {
      return await apiClient.get<ServiceItem>(`/api/services/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }
  // async getServicesByBookingId(bookingId: string): Promise<ServiceItem[]> {
  //   return apiClient.get<ServiceItem[]>(`/api/services/bookings/${bookingId}/Services`);
  // }

  async create(data: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
    return apiClient.post<ServiceItem>('/api/services', data);
  }

  async update(id: string, data: Partial<ServiceItem>): Promise<ServiceItem> {
    return apiClient.put<ServiceItem>(`/api/services/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/services/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllServices(): Promise<ServiceItem[]> {
    return apiClient.get<ServiceItem[]>('/api/services');
  }

  async createService(service: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
    return apiClient.post<ServiceItem>('/api/services', service);
  }

  async updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem> {
    return apiClient.put<ServiceItem>(`/api/services/${id}`, updates);
  }

  async deleteService(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/services/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }


  //new

  async addService(data: Omit<Services, 'id'>): Promise<Services> {
    return apiClient.post<Services>('/api/Services/Service', data);
  }

  async getServiceByBookingId(bookingId: string): Promise<ServiceItem[]> {
    return apiClient.get<ServiceItem[]>(`/api/Services/bookings/${bookingId}/services`);
  }

  // async addService(data: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
  //   return apiClient.post<ServiceItem>('/api/services/service', data);
  // }

}