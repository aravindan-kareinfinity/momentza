import { mockServices, ServiceItem } from '../mockData';

class ServicesService {
  async getAll(): Promise<ServiceItem[]> {
    return Promise.resolve(mockServices);
  }

  async getById(id: string): Promise<ServiceItem | null> {
    const service = mockServices.find(service => service.id === id);
    return Promise.resolve(service || null);
  }

  async create(data: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
    const newService = {
      ...data,
      id: Date.now().toString()
    };
    mockServices.push(newService);
    return Promise.resolve(newService);
  }

  async update(id: string, data: Partial<ServiceItem>): Promise<ServiceItem> {
    const serviceIndex = mockServices.findIndex(service => service.id === id);
    if (serviceIndex !== -1) {
      mockServices[serviceIndex] = { ...mockServices[serviceIndex], ...data };
      return Promise.resolve(mockServices[serviceIndex]);
    }
    throw new Error('Service not found');
  }

  async delete(id: string): Promise<boolean> {
    const serviceIndex = mockServices.findIndex(service => service.id === id);
    if (serviceIndex !== -1) {
      mockServices.splice(serviceIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getAllServices(): Promise<ServiceItem[]> {
    return Promise.resolve(mockServices);
  }

  async createService(service: Omit<ServiceItem, 'id'>): Promise<ServiceItem> {
    const newService = {
      ...service,
      id: Date.now().toString()
    };
    mockServices.push(newService);
    return Promise.resolve(newService);
  }

  async updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem> {
    const serviceIndex = mockServices.findIndex(service => service.id === id);
    if (serviceIndex !== -1) {
      mockServices[serviceIndex] = { ...mockServices[serviceIndex], ...updates };
      return Promise.resolve(mockServices[serviceIndex]);
    }
    throw new Error('Service not found');
  }

  async deleteService(id: string): Promise<boolean> {
    const serviceIndex = mockServices.findIndex(service => service.id === id);
    if (serviceIndex !== -1) {
      mockServices.splice(serviceIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
}

export const servicesService = new ServicesService();
export type { ServiceItem };
