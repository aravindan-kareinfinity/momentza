import { ICommunicationService } from '../interfaces/IDataService';
import { Communication } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiCommunicationService implements ICommunicationService {
  async getAll(): Promise<Communication[]> {
    return apiClient.get<Communication[]>('/api/communication');
  }

  async getById(id: string): Promise<Communication | null> {
    try {
      return await apiClient.get<Communication>(`/api/communication/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<Communication, 'id'>): Promise<Communication> {
    return apiClient.post<Communication>('/api/communication', data);
  }

  async update(id: string, data: Partial<Communication>): Promise<Communication> {
    return apiClient.put<Communication>(`/api/communication/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/communication/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCommunicationsByBookingId(bookingId: string): Promise<Communication[]> {
    return apiClient.get<Communication[]>(`/api/communication/booking/${bookingId}/communication`);
  }

  async createCommunication(data: Omit<Communication, 'id'>): Promise<Communication> {
    return apiClient.post<Communication>('/api/communication', data);
  }

  async updateCommunication(id: string, data: Partial<Communication>): Promise<Communication> {
    return apiClient.put<Communication>(`/api/communication/${id}`, data);
  }

  async deleteCommunication(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/communication/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
} 