import { IMicrositeService, MicrositeComponent } from '../interfaces/IDataService';
import { apiClient } from '../http/ApiClient';

export class ApiMicrositeService implements IMicrositeService {
  async getComponents(organizationId: string): Promise<MicrositeComponent[]> {
    return apiClient.get<MicrositeComponent[]>(`/api/microsite/organizations/${organizationId}/components`);
  }

  async createComponent(component: Omit<MicrositeComponent, 'id' | 'createdAt' | 'updatedAt'>): Promise<MicrositeComponent> {
    return apiClient.post<MicrositeComponent>('/api/microsite/components', component);
  }

  async updateComponent(id: string, component: Partial<MicrositeComponent>): Promise<MicrositeComponent> {
    return apiClient.put<MicrositeComponent>(`/api/microsite/components/${id}`, component);
  }

  async deleteComponent(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/microsite/components/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async reorderComponents(organizationId: string, componentIds: string[]): Promise<void> {
    await apiClient.put(`/api/microsite/organizations/${organizationId}/reorder`, { componentIds });
  }

  async toggleComponent(id: string, isActive: boolean): Promise<MicrositeComponent> {
    return apiClient.patch<MicrositeComponent>(`/api/microsite/components/${id}/toggle`, { isActive });
  }
}
