import { ICommunicationService } from '../interfaces/IDataService';
import { Communication } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiCommunicationService implements ICommunicationService {
  async getAll(): Promise<Communication[]> {
    return apiClient.get<Communication[]>('/api/communications');
  }

  async getById(id: string): Promise<Communication | null> {
    try {
      return await apiClient.get<Communication>(`/api/communications/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<Communication, 'id'>): Promise<Communication> {
    return apiClient.post<Communication>('/api/communications', data);
  }

  async update(id: string, data: Partial<Communication>): Promise<Communication> {
    return apiClient.put<Communication>(`/api/communications/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/communications/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCommunicationsByBookingId(bookingId: string): Promise<Communication[]> {
    return apiClient.get<Communication[]>(`/api/bookings/${bookingId}/communications`);
  }

  async createCommunication(data: Omit<Communication, 'id'>): Promise<Communication> {
    return apiClient.post<Communication>('/api/communications', data);
  }

  async updateCommunication(id: string, data: Partial<Communication>): Promise<Communication> {
    return apiClient.put<Communication>(`/api/communications/${id}`, data);
  }

  async deleteCommunication(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/communications/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
} 