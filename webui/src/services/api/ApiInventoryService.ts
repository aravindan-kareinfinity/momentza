import { IInventoryService } from '../interfaces/IDataService';
import { InventoryItem } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiInventoryService implements IInventoryService {
  async getAll(): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>('/api/inventory');
  }

  async getById(id: string): Promise<InventoryItem | null> {
    try {
      return await apiClient.get<InventoryItem>(`/api/inventory/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    return apiClient.post<InventoryItem>('/api/inventory', data);
  }

  async update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    return apiClient.put<InventoryItem>(`/api/inventory/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/inventory/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>('/api/inventory');
  }

  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    try {
      return await apiClient.get<InventoryItem>(`/api/inventory/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getInventoryItemByName(name: string): Promise<InventoryItem | null> {
    try {
      return await apiClient.get<InventoryItem>(`/api/inventory/by-name?name=${encodeURIComponent(name)}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    return apiClient.post<InventoryItem>('/api/inventory', item);
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    return apiClient.put<InventoryItem>(`/api/inventory/${id}`, updates);
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/inventory/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
} 