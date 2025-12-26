import { IHallService } from '../interfaces/IDataService';
import { Hall } from '../../types';
import { apiClient } from '../http/ApiClient';

export class ApiHallService implements IHallService {
  async getAll(): Promise<Hall[]> {
    return apiClient.get<Hall[]>('/api/halls');
  }

  async getById(id: string): Promise<Hall | null> {
    try {
      return await apiClient.get<Hall>(`/api/halls/${id}`);
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
    return apiClient.post<Hall>(`/api/halls/${id}/update`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/halls/${id}/delete`, {});
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

  async getAvailableTimeSlots(hallId: string, date: string | Date): Promise<Array<{value: string, label: string, price: number}>> {
    try {
      const normalizeDateParam = (input: string | Date): string => {
        if (input instanceof Date) {
          if (isNaN(input.getTime())) {
            throw new Error('Invalid date provided');
          }
          return input.toISOString().split('T')[0];
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
          return input;
        }

        const parsed = new Date(input);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }

        throw new Error(`Invalid date format: ${input}`);
      };

      const dateStr = normalizeDateParam(date);
      const response = await apiClient.get<Array<{value: string, label: string, price: number}>>(
        `/api/halls/${hallId}/available-slots?date=${encodeURIComponent(dateStr)}`
      );
      
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
    return apiClient.post<Hall>(`/api/halls/${id}/update`, updates);
  }

  async deleteHall(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/halls/${id}/delete`, {});
      return true;
    } catch (error) {
      return false;
    }
  }
} 