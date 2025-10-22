import { MasterDataItem, settingsService } from './settingsService';

class TicketCategoriesService {
  getAllTicketCategories(): MasterDataItem[] {
    return settingsService.getTicketCategories();
  }

  getTicketCategoryById(id: string): MasterDataItem | undefined {
    return settingsService.getTicketCategories().find(category => category.id === id);
  }

  getTicketCategoryByName(name: string): MasterDataItem | undefined {
    return settingsService.getTicketCategories().find(category => category.name === name);
  }

  createTicketCategory(category: Omit<MasterDataItem, 'id'>): MasterDataItem {
    return settingsService.addTicketCategory(category.name);
  }

  updateTicketCategory(id: string, updates: Partial<MasterDataItem>): MasterDataItem {
    if (updates.name) {
      return settingsService.updateTicketCategory(id, updates.name);
    }
    throw new Error('Only name updates are supported');
  }

  deleteTicketCategory(id: string): boolean {
    return settingsService.deleteTicketCategory(id);
  }

  // Method to sync with settings data - now just returns the current data
  syncWithSettings(settingsCategories: MasterDataItem[]): void {
    // This method is now a no-op since we're using the settings service directly
    console.log('Ticket categories service now uses settings service directly');
  }
}

export const ticketCategoriesService = new TicketCategoriesService(); 