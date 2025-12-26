import { InventoryItem } from '@/types';
import { apiClient } from '../http/ApiClient';

export class ApiInventoryService {
  // async getAllInventoryItems() {
  //   return apiClient.get("/api/inventory");
  // }

  async getInventoryByBookingId(bookingId: string): Promise<InventoryItem[]> {
    return apiClient.get<InventoryItem[]>(`/api/inventory/bookings/${bookingId}/inventory`);
  }

  async create(data: any) {
    return apiClient.post("/api/inventory", data);
  }

  async update(id: string, data: any) {
    return apiClient.post(`/api/inventory/${id}`, data);
  }

  async delete(id: string) {
    return apiClient.post(`/api/inventory/delete/${id}`,{});
  }
}
