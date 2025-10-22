import { ICarouselService } from '../interfaces/IDataService';
import { CarouselItem } from '../../types';
import { apiClient } from '../http/ApiClient';

export class ApiCarouselService implements ICarouselService {
  async getAll(): Promise<CarouselItem[]> {
    return apiClient.get<CarouselItem[]>('/api/carousel');
  }

  async getById(id: string): Promise<CarouselItem | null> {
    try {
      return await apiClient.get<CarouselItem>(`/api/carousel/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<CarouselItem, 'id'>): Promise<CarouselItem> {
    return apiClient.post<CarouselItem>('/api/carousel', data);
  }

  async update(id: string, data: Partial<CarouselItem>): Promise<CarouselItem> {
    return apiClient.put<CarouselItem>(`/api/carousel/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/carousel/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCarouselItems(organizationId: string): Promise<CarouselItem[]> {
    return apiClient.get<CarouselItem[]>(`/api/carousel/organizations/${organizationId}`);
  }

  async getActiveCarouselItems(organizationId: string): Promise<CarouselItem[]> {
    return apiClient.get<CarouselItem[]>(`/api/carousel/organizations/${organizationId}/active`);
  }

  async reorderItems(organizationId: string, itemIds: string[]): Promise<void> {
    await apiClient.post(`/api/carousel/organizations/${organizationId}/reorder`, { itemIds });
  }

  async moveItemUp(id: string, organizationId: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/carousel/organizations/${organizationId}/${id}/move-up`, {});
      return true;
    } catch (error) {
      return false;
    }
  }

  async moveItemDown(id: string, organizationId: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/carousel/organizations/${organizationId}/${id}/move-down`, {});
      return true;
    } catch (error) {
      return false;
    }
  }

  async toggleItemStatus(id: string): Promise<CarouselItem> {
    return apiClient.patch<CarouselItem>(`/api/carousel/${id}/toggle-status`, {});
  }

} 