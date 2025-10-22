import { 
  mockEventTypes, 
  mockImageCategories, 
  mockEmployees, 
  mockInventoryItems, 
  mockTicketCategories,
  MasterDataItem 
} from '../mockData';

class SettingsService {
  // Event Types
  async getEventTypes(): Promise<MasterDataItem[]> {
    return Promise.resolve(mockEventTypes);
  }

  async addEventType(name: string): Promise<MasterDataItem> {
    const newItem = {
      id: Date.now().toString(),
      name,
      type: 'EventTypes'
    };
    mockEventTypes.push(newItem);
    return Promise.resolve(newItem);
  }

  async updateEventType(id: string, name: string): Promise<MasterDataItem> {
    const eventIndex = mockEventTypes.findIndex(event => event.id === id);
    if (eventIndex !== -1) {
      mockEventTypes[eventIndex] = { ...mockEventTypes[eventIndex], name };
      return Promise.resolve(mockEventTypes[eventIndex]);
    }
    throw new Error('Event type not found');
  }

  async deleteEventType(id: string): Promise<boolean> {
    const eventIndex = mockEventTypes.findIndex(event => event.id === id);
    if (eventIndex !== -1) {
      mockEventTypes.splice(eventIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  // Image Categories
  async getImageCategories(): Promise<MasterDataItem[]> {
    return Promise.resolve(mockImageCategories);
  }

  async addImageCategory(name: string): Promise<MasterDataItem> {
    const newCategory = {
      id: Date.now().toString(),
      name,
      type: 'ImageCategories'
    };
    mockImageCategories.push(newCategory);
    return Promise.resolve(newCategory);
  }

  async updateImageCategory(id: string, name: string): Promise<MasterDataItem> {
    const categoryIndex = mockImageCategories.findIndex(cat => cat.id === id);
    if (categoryIndex !== -1) {
      mockImageCategories[categoryIndex] = { ...mockImageCategories[categoryIndex], name };
      return Promise.resolve(mockImageCategories[categoryIndex]);
    }
    throw new Error('Image category not found');
  }

  async deleteImageCategory(id: string): Promise<boolean> {
    const categoryIndex = mockImageCategories.findIndex(cat => cat.id === id);
    if (categoryIndex !== -1) {
      mockImageCategories.splice(categoryIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  // Employees
  async getEmployees(): Promise<MasterDataItem[]> {
    return Promise.resolve(mockEmployees);
  }

  async addEmployee(name: string): Promise<MasterDataItem> {
    const newEmployee = {
      id: Date.now().toString(),
      name,
      type: 'Employees'
    };
    mockEmployees.push(newEmployee);
    return Promise.resolve(newEmployee);
  }

  async updateEmployee(id: string, name: string): Promise<MasterDataItem> {
    const employeeIndex = mockEmployees.findIndex(emp => emp.id === id);
    if (employeeIndex !== -1) {
      mockEmployees[employeeIndex] = { ...mockEmployees[employeeIndex], name };
      return Promise.resolve(mockEmployees[employeeIndex]);
    }
    throw new Error('Employee not found');
  }

  async deleteEmployee(id: string): Promise<boolean> {
    const employeeIndex = mockEmployees.findIndex(emp => emp.id === id);
    if (employeeIndex !== -1) {
      mockEmployees.splice(employeeIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  // Inventory Items
  async getInventoryItems(): Promise<MasterDataItem[]> {
    return Promise.resolve(mockInventoryItems);
  }

  async addInventoryItem(name: string, charge: number): Promise<MasterDataItem> {
    const newItem = {
      id: Date.now().toString(),
      name,
      type: 'InventoryItems',
      charge
    };
    mockInventoryItems.push(newItem);
    return Promise.resolve(newItem);
  }

  async updateInventoryItem(id: string, name: string, charge: number): Promise<MasterDataItem> {
    const itemIndex = mockInventoryItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      mockInventoryItems[itemIndex] = { ...mockInventoryItems[itemIndex], name, charge };
      return Promise.resolve(mockInventoryItems[itemIndex]);
    }
    throw new Error('Inventory item not found');
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const itemIndex = mockInventoryItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      mockInventoryItems.splice(itemIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  // Ticket Categories
  async getTicketCategories(): Promise<MasterDataItem[]> {
    return Promise.resolve(mockTicketCategories);
  }

  async addTicketCategory(name: string): Promise<MasterDataItem> {
    const newCategory = {
      id: Date.now().toString(),
      name,
      type: 'TicketCategories'
    };
    mockTicketCategories.push(newCategory);
    return Promise.resolve(newCategory);
  }

  async updateTicketCategory(id: string, name: string): Promise<MasterDataItem> {
    const categoryIndex = mockTicketCategories.findIndex(cat => cat.id === id);
    if (categoryIndex !== -1) {
      mockTicketCategories[categoryIndex] = { ...mockTicketCategories[categoryIndex], name };
      return Promise.resolve(mockTicketCategories[categoryIndex]);
    }
    throw new Error('Ticket category not found');
  }

  async deleteTicketCategory(id: string): Promise<boolean> {
    const categoryIndex = mockTicketCategories.findIndex(cat => cat.id === id);
    if (categoryIndex !== -1) {
      mockTicketCategories.splice(categoryIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  // Generic methods for any master data type
  async getMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories'): Promise<MasterDataItem[]> {
    switch (type) {
      case 'eventTypes':
        return this.getEventTypes();
      case 'imageCategories':
        return this.getImageCategories();
      case 'employees':
        return this.getEmployees();
      case 'inventoryItems':
        return this.getInventoryItems();
      case 'ticketCategories':
        return this.getTicketCategories();
      default:
        return Promise.resolve([]);
    }
  }

  async addMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', name: string, charge?: number): Promise<MasterDataItem> {
    switch (type) {
      case 'eventTypes':
        return this.addEventType(name);
      case 'imageCategories':
        return this.addImageCategory(name);
      case 'employees':
        return this.addEmployee(name);
      case 'inventoryItems':
        return this.addInventoryItem(name, charge || 0);
      case 'ticketCategories':
        return this.addTicketCategory(name);
      default:
        throw new Error('Invalid master data type');
    }
  }

  async deleteMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', id: string): Promise<boolean> {
    switch (type) {
      case 'eventTypes':
        return this.deleteEventType(id);
      case 'imageCategories':
        return this.deleteImageCategory(id);
      case 'employees':
        return this.deleteEmployee(id);
      case 'inventoryItems':
        return this.deleteInventoryItem(id);
      case 'ticketCategories':
        return this.deleteTicketCategory(id);
      default:
        return Promise.resolve(false);
    }
  }
}

export const settingsService = new SettingsService();
export type { MasterDataItem };
