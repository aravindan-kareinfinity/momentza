import { CarouselItem } from '../../types';
import { mockCarouselItems } from '../mockData';
import { ICarouselService } from '../interfaces/IDataService';

class CarouselService implements ICarouselService {
  async getCarouselItems(organizationId: string): Promise<CarouselItem[]> {
    console.log('Getting carousel items for organization:', organizationId);
    const items = mockCarouselItems
      .filter(item => item.organizationId === organizationId)
      .sort((a, b) => a.orderPosition - b.orderPosition);
    console.log('Found carousel items:', items);
    return Promise.resolve(items);
  }

  createCarouselItem(item: Omit<CarouselItem, 'id'>): CarouselItem {
    console.log('Creating carousel item:', item);
    const newItem = {
      ...item,
      id: Date.now().toString()
    };
    
    // Ensure the order is correct by checking existing items
    const existingItems = mockCarouselItems.filter(item => item.organizationId === newItem.organizationId);
    if (newItem.orderPosition <= 0 || newItem.orderPosition > existingItems.length + 1) {
      newItem.orderPosition = existingItems.length + 1;
    }
    
    mockCarouselItems.push(newItem);
    console.log('Created carousel item:', newItem);
    console.log('Updated mock data:', mockCarouselItems);
    return newItem;
  }

  updateCarouselItem(id: string, updates: Partial<CarouselItem>): CarouselItem {
    console.log('Updating carousel item:', id, updates);
    const itemIndex = mockCarouselItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      console.error('Carousel item not found:', id);
      throw new Error('Carousel item not found');
    }
    
    const originalItem = { ...mockCarouselItems[itemIndex] };
    mockCarouselItems[itemIndex] = { ...mockCarouselItems[itemIndex], ...updates };
    
    console.log('Updated carousel item from:', originalItem, 'to:', mockCarouselItems[itemIndex]);
    console.log('Updated mock data:', mockCarouselItems);
    return mockCarouselItems[itemIndex];
  }

  deleteCarouselItem(id: string): boolean {
    console.log('Deleting carousel item:', id);
    const itemIndex = mockCarouselItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      console.error('Carousel item not found for deletion:', id);
      return false;
    }
    
    const deletedItem = mockCarouselItems[itemIndex];
    const organizationId = deletedItem.organizationId;
    mockCarouselItems.splice(itemIndex, 1);
    
    // Reorder remaining items to fill the gap
    this.reorderAfterDeletion(organizationId, deletedItem.orderPosition);
    
    console.log('Deleted carousel item:', deletedItem);
    console.log('Updated mock data after deletion:', mockCarouselItems);
    return true;
  }

  private reorderAfterDeletion(organizationId: string, deletedOrder: number): void {
    console.log('Reordering items after deletion, deleted order:', deletedOrder);
    const itemsToReorder = mockCarouselItems
      .filter(item => item.organizationId === organizationId && item.orderPosition > deletedOrder)
      .sort((a, b) => a.orderPosition - b.orderPosition);
    
    itemsToReorder.forEach((item) => {
      const itemIndex = mockCarouselItems.findIndex(mockItem => mockItem.id === item.id);
      if (itemIndex !== -1) {
        mockCarouselItems[itemIndex].orderPosition = item.orderPosition - 1;
      }
    });
    
    console.log('Reordered items after deletion');
  }

  async reorderItems(organizationId: string, itemIds: string[]): Promise<void> {
    console.log('Reordering items for organization:', organizationId, 'with order:', itemIds);
    
    if (!itemIds || itemIds.length === 0) {
      console.warn('No item IDs provided for reordering');
      return;
    }
    
    itemIds.forEach((id, index) => {
      const item = mockCarouselItems.find(item => item.id === id && item.organizationId === organizationId);
      if (item) {
        const newOrder = index + 1;
        console.log(`Updating item ${id} order from ${item.orderPosition} to ${newOrder}`);
        item.orderPosition = newOrder;
      } else {
        console.warn(`Item not found for reordering: ${id}`);
      }
    });
    
    console.log('Updated mock data after reordering:', mockCarouselItems);
  }

  async moveItemUp(id: string, organizationId: string): Promise<boolean> {
    console.log('Moving item up:', id, 'for organization:', organizationId);
    const items = await this.getCarouselItems(organizationId);
    const currentItem = items.find(item => item.id === id);
    
    if (!currentItem) {
      console.error('Item not found for move up:', id);
      return false;
    }
    
    if (currentItem.orderPosition <= 1) {
      console.log('Item is already at the top:', id);
      return false;
    }
    
    const itemAbove = items.find(item => item.orderPosition === currentItem.orderPosition - 1);
    if (itemAbove) {
      console.log(`Swapping positions: ${id} (${currentItem.orderPosition}) with ${itemAbove.id} (${itemAbove.orderPosition})`);
      await this.updateCarouselItem(id, { orderPosition: currentItem.orderPosition - 1 });
      await this.updateCarouselItem(itemAbove.id, { orderPosition: currentItem.orderPosition });
      return true;
    }
    
    console.error('Item above not found for move up:', id);
    return false;
  }

  async moveItemDown(id: string, organizationId: string): Promise<boolean> {
    console.log('Moving item down:', id, 'for organization:', organizationId);
    const items = await this.getCarouselItems(organizationId);
    const currentItem = items.find(item => item.id === id);
    
    if (!currentItem) {
      console.error('Item not found for move down:', id);
      return false;
    }
    
    if (currentItem.orderPosition >= items.length) {
      console.log('Item is already at the bottom:', id);
      return false;
    }
    
    const itemBelow = items.find(item => item.orderPosition === currentItem.orderPosition + 1);
    if (itemBelow) {
      console.log(`Swapping positions: ${id} (${currentItem.orderPosition}) with ${itemBelow.id} (${itemBelow.orderPosition})`);
      await this.updateCarouselItem(id, { orderPosition: currentItem.orderPosition + 1 });
      await this.updateCarouselItem(itemBelow.id, { orderPosition: currentItem.orderPosition });
      return true;
    }
    
    console.error('Item below not found for move down:', id);
    return false;
  }

  async toggleItemStatus(id: string): Promise<CarouselItem> {
    console.log('Toggling item status:', id);
    const item = mockCarouselItems.find(item => item.id === id);
    if (!item) {
      console.error('Item not found for status toggle:', id);
      throw new Error('Carousel item not found');
    }
    
    const newStatus = !item.isActive;
    console.log(`Toggling item ${id} status from ${item.isActive} to ${newStatus}`);
    return await this.updateCarouselItem(id, { isActive: newStatus });
  }

  async getActiveCarouselItems(organizationId: string): Promise<CarouselItem[]> {
    console.log('Getting active carousel items for organization:', organizationId);
    const items = await this.getCarouselItems(organizationId);
    const activeItems = items.filter(item => item.isActive);
    console.log('Found active carousel items:', activeItems);
    return activeItems;
  }

  // IDataService interface methods
  async getAll(): Promise<CarouselItem[]> {
    return Promise.resolve(mockCarouselItems);
  }

  async getById(id: string): Promise<CarouselItem | null> {
    const item = mockCarouselItems.find(item => item.id === id);
    return Promise.resolve(item || null);
  }

  async create(data: Omit<CarouselItem, 'id'>): Promise<CarouselItem> {
    return Promise.resolve(this.createCarouselItem(data));
  }

  async update(id: string, data: Partial<CarouselItem>): Promise<CarouselItem> {
    return Promise.resolve(this.updateCarouselItem(id, data));
  }



  async delete(id: string): Promise<boolean> {
    return Promise.resolve(this.deleteCarouselItem(id));
  }
}

export const carouselService = new CarouselService();
