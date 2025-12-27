import { ISettingsService } from '../interfaces/IDataService';
import { MasterDataItem } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiSettingsService implements ISettingsService {
  async getEventTypes(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/event-types');
  }

  async addEventType(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/eventTypes/add', { name });
  }

  async updateEventType(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/event-types/update/${id}`, { name });
  }

  async deleteEventType(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/settings/event-types/delete/${id}`, {});
      return true;
    } catch {
      return false;
    }
  }

  async getImageCategories(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/image-categories');
  }

  async addImageCategory(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/image-categories/add', { name });
  }

  async updateImageCategory(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/image-categories/update/${id}`, { name });
  }

  async deleteImageCategory(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/settings/image-categories/delete/${id}`, {});
      return true;
    } catch {
      return false;
    }
  }

  async getEmployees(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/employees');
  }

  async addEmployee(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/employees/add', { name });
  }

  async updateEmployee(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/employees/update/${id}`, { name });
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/settings/employees/delete/${id}`, {});
      return true;
    } catch {
      return false;
    }
  }

  async getInventoryItems(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/inventory-items');
  }

  async addInventoryItem(name: string, charge: number): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/inventory-items/add', { name, charge });
  }

  async updateInventoryItem(id: string, name: string, charge: number): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/inventory-items/update/${id}`, { name, charge });
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/settings/inventory-items/delete/${id}`, {});
      return true;
    } catch {
      return false;
    }
  }

  async getTicketCategories(): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>('/api/settings/ticket-categories');
  }

  async addTicketCategory(name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>('/api/settings/ticket-categories/add', { name });
  }

  async updateTicketCategory(id: string, name: string): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/ticket-categories/update/${id}`, { name });
  }

  async deleteTicketCategory(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/settings/ticket-categories/delete/${id}`, {});
      return true;
    } catch {
      return false;
    }
  }

  private getApiPath(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories'): string {
    const pathMap: Record<string, string> = {
      'eventTypes': 'event-types',
      'imageCategories': 'image-categories',
      'employees': 'employees',
      'inventoryItems': 'inventory-items',
      'ticketCategories': 'ticket-categories'
    };
    return pathMap[type] || type;
  }

  async getMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories'): Promise<MasterDataItem[]> {
    return apiClient.get<MasterDataItem[]>(`/api/settings/${this.getApiPath(type)}`);
  }

  async addMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', name: string, charge?: number): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/${this.getApiPath(type)}/add`, { name, charge });
  }

  async updateMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', id: string, name: string, charge?: number): Promise<MasterDataItem> {
    return apiClient.post<MasterDataItem>(`/api/settings/${this.getApiPath(type)}/update/${id}`, { name, charge });
  }

  async deleteMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/settings/${this.getApiPath(type)}/delete/${id}`, {});
      return true;
    } catch {
      return false;
    }
  }
}
