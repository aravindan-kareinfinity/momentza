import { ICustomerClicksService, CustomerClickUploadRequest } from '../interfaces/IDataService';
import { mockCustomerClicks, CustomerClick } from '../mockData';

class CustomerClicksService implements ICustomerClicksService {
  async getAll(): Promise<CustomerClick[]> {
    return Promise.resolve(mockCustomerClicks);
  }

  async getById(id: string): Promise<CustomerClick | null> {
    const click = mockCustomerClicks.find(click => click.id === id);
    return Promise.resolve(click || null);
  }

  async create(data: Omit<CustomerClick, 'id'>): Promise<CustomerClick> {
    const newClick = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    mockCustomerClicks.push(newClick);
    return Promise.resolve(newClick);
  }

  async update(id: string, data: Partial<CustomerClick>): Promise<CustomerClick> {
    const clickIndex = mockCustomerClicks.findIndex(click => click.id === id);
    if (clickIndex !== -1) {
      mockCustomerClicks[clickIndex] = { ...mockCustomerClicks[clickIndex], ...data };
      return Promise.resolve(mockCustomerClicks[clickIndex]);
    }
    throw new Error('Customer click not found');
  }

  async delete(id: string): Promise<boolean> {
    const clickIndex = mockCustomerClicks.findIndex(click => click.id === id);
    if (clickIndex !== -1) {
      mockCustomerClicks.splice(clickIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getCustomerClicksByHallId(hallId: string): Promise<CustomerClick[]> {
    const clicks = mockCustomerClicks.filter(click => click.hallId === hallId);
    return Promise.resolve(clicks);
  }

  async getCustomerClicksStats(): Promise<any> {
    const totalClicks = mockCustomerClicks.length;
    const clicksByHall = mockCustomerClicks.reduce((acc, click) => {
      acc[click.hallId] = (acc[click.hallId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const clicksByEventType = mockCustomerClicks.reduce((acc, click) => {
      acc[click.eventType] = (acc[click.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Promise.resolve({
      totalClicks,
      clicksByHall,
      clicksByEventType
    });
  }

  // Legacy method for backward compatibility
  getAllCustomerClicks(): CustomerClick[] {
    return mockCustomerClicks;
  }

  getCustomerClickById(id: string): CustomerClick | undefined {
    return mockCustomerClicks.find(click => click.id === id);
  }



  updateCustomerClick(id: string, updates: Partial<CustomerClick>): CustomerClick {
    const clickIndex = mockCustomerClicks.findIndex(click => click.id === id);
    if (clickIndex !== -1) {
      mockCustomerClicks[clickIndex] = { ...mockCustomerClicks[clickIndex], ...updates };
      return mockCustomerClicks[clickIndex];
    }
    throw new Error('Customer click not found');
  }

  deleteCustomerClick(id: string): boolean {
    const clickIndex = mockCustomerClicks.findIndex(click => click.id === id);
    if (clickIndex !== -1) {
      mockCustomerClicks.splice(clickIndex, 1);
      return true;
    }
    return false;
  }

  async createCustomerClick(data: CustomerClickUploadRequest): Promise<CustomerClick> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if this is an update (has ID) or create (no ID)
    const isUpdate = !!(data.id && data.id.trim());
    
    if (isUpdate) {
      // Update existing customer click
      const clickIndex = mockCustomerClicks.findIndex(click => click.id === data.id);
      if (clickIndex !== -1) {
        mockCustomerClicks[clickIndex] = {
          ...mockCustomerClicks[clickIndex],
          hallId: data.hallId || mockCustomerClicks[clickIndex].hallId,
          eventDate: data.eventDate || mockCustomerClicks[clickIndex].eventDate,
          eventType: data.eventType || mockCustomerClicks[clickIndex].eventType,
          message: data.message || mockCustomerClicks[clickIndex].message,
          boyName: data.boyName || mockCustomerClicks[clickIndex].boyName || '',
          girlName: data.girlName || mockCustomerClicks[clickIndex].girlName || '',
          timestamp: new Date().toISOString()
        };
        return Promise.resolve(mockCustomerClicks[clickIndex]);
      } else {
        throw new Error('Customer click not found for update');
      }
    } else {
      // Create new customer click
      const newClick: CustomerClick = {
        id: Date.now().toString(),
        customerId: data.customerId || `customer-${Date.now()}`, // Use provided or generate new
        hallId: data.hallId || '1',
        customerName: 'Anonymous', // Default value as per C# controller
        customerEmail: 'no-email@example.com', // Default value as per C# controller
        customerPhone: 'No Phone', // Default value as per C# controller
        eventDate: data.eventDate || new Date().toISOString().split('T')[0],
        eventType: data.eventType || '',
        guestCount: 1, // Default value as per C# controller
        message: data.message || '',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        rating: 5, // Default value as per C# controller
        boyName: data.boyName || '',
        girlName: data.girlName || ''
      };
      
      mockCustomerClicks.push(newClick);
      return Promise.resolve(newClick);
    }
  }

  getImageUrl(id: string): string {
    // For mock service, return a placeholder image URL
    return `https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80`;
  }
}

export const customerClicksService = new CustomerClicksService();
export type { CustomerClick };
