import { ISettingsService } from '../interfaces/IDataService';
import { MasterDataItem } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiSettingsService implements ISettingsService {
  async getEventTypes(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/event-types');
  }

  async addEventType(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/event-types', { name });
  }

  async updateEventType(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.put<MasterDataItem>(`/api/settings/event-types/${id}`, { name });
  }

  async deleteEventType(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/settings/event-types/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  async getImageCategories(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/image-categories');
  }

  async addImageCategory(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/image-categories', { name });
  }

  async updateImageCategory(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.put<MasterDataItem>(`/api/settings/image-categories/${id}`, { name });
  }

  async deleteImageCategory(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/settings/image-categories/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  async getEmployees(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/employees');
  }

  async addEmployee(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/employees', { name });
  }

  async updateEmployee(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.put<MasterDataItem>(`/api/settings/employees/${id}`, { name });
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/settings/employees/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  async getInventoryItems(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/inventory-items');
  }

  async addInventoryItem(name: string, charge: number): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/inventory-items', { name, charge });
  }

  async updateInventoryItem(id: string, name: string, charge: number): Promise<MasterDataItem> {
    return apiClient.put<MasterDataItem>(`/api/settings/inventory-items/${id}`, { name, charge });
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/settings/inventory-items/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  async getTicketCategories(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/ticket-categories');
  }

  async addTicketCategory(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/ticket-categories', { name });
  }

  async updateTicketCategory(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.put<MasterDataItem>(`/api/settings/ticket-categories/${id}`, { name });
  }

  async deleteTicketCategory(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/settings/ticket-categories/${id}`);
      return true;
    } catch {
      return false;
    }
  }

  async getMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories'): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>(`/api/settings/${type}`);
  }

  async addMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', name: string, charge?: number): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/${type}`, { name, charge });
  }

  async deleteMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/settings/${type}/${id}`);
      return true;
    } catch {
      return false;
    }
  }
} 