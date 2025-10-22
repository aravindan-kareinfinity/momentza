import { IMicrositeService, MicrositeComponent } from '../interfaces/IDataService';

// Mock data for development
const mockComponents: MicrositeComponent[] = [
  { 
    id: '1', 
    type: 'carousel', 
    orderPosition: 1, 
    isActive: true, 
    organizationId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '2', 
    type: 'halls', 
    orderPosition: 2, 
    isActive: true, 
    organizationId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '3', 
    type: 'reviews', 
    orderPosition: 3, 
    isActive: true, 
    organizationId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

class MicrositeService implements IMicrositeService {
  async getComponents(organizationId: string): Promise<MicrositeComponent[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter by organization and return sorted by orderPosition
    return mockComponents
      .filter(comp => comp.organizationId === organizationId)
      .sort((a, b) => a.orderPosition - b.orderPosition);
  }

  async createComponent(component: Omit<MicrositeComponent, 'id' | 'createdAt' | 'updatedAt'>): Promise<MicrositeComponent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newComponent: MicrositeComponent = {
      ...component,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    mockComponents.push(newComponent);
    return newComponent;
  }

  async updateComponent(id: string, component: Partial<MicrositeComponent>): Promise<MicrositeComponent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockComponents.findIndex(comp => comp.id === id);
    if (index === -1) {
      throw new Error('Component not found');
    }
    
    mockComponents[index] = {
      ...mockComponents[index],
      ...component,
      updatedAt: new Date().toISOString()
    };
    
    return mockComponents[index];
  }

  async deleteComponent(id: string): Promise<boolean> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockComponents.findIndex(comp => comp.id === id);
    if (index === -1) {
      return false;
    }
    
    mockComponents.splice(index, 1);
    return true;
  }

  async reorderComponents(organizationId: string, componentIds: string[]): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update orderPosition for components in the specified organization
    componentIds.forEach((id, index) => {
      const component = mockComponents.find(comp => comp.id === id && comp.organizationId === organizationId);
      if (component) {
        component.orderPosition = index + 1;
        component.updatedAt = new Date().toISOString();
      }
    });
  }

  async toggleComponent(id: string, isActive: boolean): Promise<MicrositeComponent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const component = mockComponents.find(comp => comp.id === id);
    if (!component) {
      throw new Error('Component not found');
    }
    
    component.isActive = isActive;
    component.updatedAt = new Date().toISOString();
    
    return component;
  }
}

export const micrositeService = new MicrositeService();
export type { MicrositeComponent };
