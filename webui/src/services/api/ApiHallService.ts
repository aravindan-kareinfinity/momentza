import { IHallService } from '../interfaces/IDataService';
import { Hall } from '../../types';
import { apiClient } from '../http/ApiClient';

export class ApiHallService implements IHallService {
  async getAll(): Promise<Hall[]> {
    return apiClient.get<Hall[]>('/api/halls');
  }

  async getById(id: string): Promise<Hall | null> {
    try {
      return await apiClient.get<Hall>(`/api/halls/1752588534882`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<Hall, 'id'>): Promise<Hall> {
    return apiClient.post<Hall>('/api/halls', data);
  }

  async update(id: string, data: Partial<Hall>): Promise<Hall> {
    return apiClient.put<Hall>(`/api/halls/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/halls/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getByOrganization(organizationId: string): Promise<Hall[]> {
    return apiClient.get<Hall[]>(`/api/halls/organizations/${organizationId}`);
  }

  async getAccessibleHalls(organizationId: string, accessibleHallIds: string[]): Promise<Hall[]> {
    const queryParams = new URLSearchParams({ hallIds: accessibleHallIds.join(',') }).toString();
    return apiClient.get<Hall[]>(`/api/halls/organizations/${organizationId}/accessible?${queryParams}`);
  }

  async getAvailableTimeSlots(hallId: string, date: Date): Promise<Array<{value: string, label: string, price: number}>> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await apiClient.get<Array<{value: string, label: string, price: number}>>(`/api/halls/${hallId}/timeslots?date=${dateStr}`);
      
      // If API returns data, use it
      if (response && Array.isArray(response)) {
        return response;
      }
      
      // If API returns empty or no data, return default time slots
      const hall = await this.getById(hallId);
      if (!hall) return [];
      
      return [
        {
          value: 'morning',
          label: `Morning (₹${hall.rateCard.morningRate.toLocaleString()})`,
          price: hall.rateCard.morningRate
        },
        {
          value: 'evening',
          label: `Evening (₹${hall.rateCard.eveningRate.toLocaleString()})`,
          price: hall.rateCard.eveningRate
        },
        {
          value: 'fullday',
          label: `Full Day (₹${hall.rateCard.fullDayRate.toLocaleString()})`,
          price: hall.rateCard.fullDayRate
        }
      ];
    } catch (error) {
      // If API call fails, return default time slots
      const hall = await this.getById(hallId);
      if (!hall) return [];
      
      return [
        {
          value: 'morning',
          label: `Morning (₹${hall.rateCard.morningRate.toLocaleString()})`,
          price: hall.rateCard.morningRate
        },
        {
          value: 'evening',
          label: `Evening (₹${hall.rateCard.eveningRate.toLocaleString()})`,
          price: hall.rateCard.eveningRate
        },
        {
          value: 'fullday',
          label: `Full Day (₹${hall.rateCard.fullDayRate.toLocaleString()})`,
          price: hall.rateCard.fullDayRate
        }
      ];
    }
  }

  async getHallById(id: string): Promise<Hall | null> {
    try {
      return await apiClient.get<Hall>(`/api/halls/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getAllHalls(): Promise<Hall[]> {
    return apiClient.get<Hall[]>('/api/halls');
  }

  async getHallsByOrganization(organizationId: string): Promise<Hall[]> {
    return apiClient.get<Hall[]>(`/api/halls/organizations/${organizationId}`);
  }

  async createHall(hall: Omit<Hall, 'id'>): Promise<Hall> {
    return apiClient.post<Hall>('/api/halls', hall);
  }

  async updateHall(id: string, updates: Partial<Hall>): Promise<Hall> {
    return apiClient.put<Hall>(`/api/halls/${id}`, updates);
  }

  async deleteHall(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/halls/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
} 