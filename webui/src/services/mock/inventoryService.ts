import { mockBookingInventoryItems, InventoryItem } from '../mockData';

class InventoryService {
  async getAll(): Promise<InventoryItem[]> {
    return Promise.resolve(mockBookingInventoryItems);
  }

  async getById(id: string): Promise<InventoryItem | null> {
    const item = mockBookingInventoryItems.find(item => item.id === id);
    return Promise.resolve(item || null);
  }

  async create(data: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const newItem = {
      ...data,
      id: Date.now().toString()
    };
    mockBookingInventoryItems.push(newItem);
    return Promise.resolve(newItem);
  }

  async update(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const itemIndex = mockBookingInventoryItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      mockBookingInventoryItems[itemIndex] = { ...mockBookingInventoryItems[itemIndex], ...data };
      return Promise.resolve(mockBookingInventoryItems[itemIndex]);
    }
    throw new Error('Inventory item not found');
  }

  async delete(id: string): Promise<boolean> {
    const itemIndex = mockBookingInventoryItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      mockBookingInventoryItems.splice(itemIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    return Promise.resolve(mockBookingInventoryItems);
  }

  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    const item = mockBookingInventoryItems.find(item => item.id === id);
    return Promise.resolve(item || null);
  }

  async getInventoryItemByName(name: string): Promise<InventoryItem | null> {
    const item = mockBookingInventoryItems.find(item => item.name === name);
    return Promise.resolve(item || null);
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const newItem = {
      ...item,
      id: Date.now().toString()
    };
    mockBookingInventoryItems.push(newItem);
    return Promise.resolve(newItem);
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const itemIndex = mockBookingInventoryItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      mockBookingInventoryItems[itemIndex] = { ...mockBookingInventoryItems[itemIndex], ...updates };
      return Promise.resolve(mockBookingInventoryItems[itemIndex]);
    }
    throw new Error('Inventory item not found');
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const itemIndex = mockBookingInventoryItems.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
      mockBookingInventoryItems.splice(itemIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getInventoryByBookingId(bookingId: string): Promise<InventoryItem[]> {
    // Mock data doesn't track booking IDs yet, so return all items for now
    return Promise.resolve(
      mockBookingInventoryItems.filter(item => {
        const inventoryWithBooking = item as InventoryItem & { bookingId?: string };
        return !inventoryWithBooking.bookingId || inventoryWithBooking.bookingId === bookingId;
      })
    );
  }
}

export const inventoryService = new InventoryService();
export type { InventoryItem }; 