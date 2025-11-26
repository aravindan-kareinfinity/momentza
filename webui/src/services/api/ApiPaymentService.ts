import { IPaymentService } from '../interfaces/IDataService';
import { PaymentsItem } from "@/types";
import { apiClient } from '../http/ApiClient';

export class ApiPaymentService implements IPaymentService {

  async getAll(): Promise<PaymentsItem[]> {
    return apiClient.get<PaymentsItem[]>('/api/payments');
  }

  async getById(id: string): Promise<PaymentsItem | null> {
    try {
      return await apiClient.get<PaymentsItem>(`/api/payments/${id}`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<PaymentsItem, 'id'>): Promise<PaymentsItem> {
    return apiClient.post<PaymentsItem>('/api/payments', data);
  }

  async update(id: string, data: Partial<PaymentsItem>): Promise<PaymentsItem> {
    return apiClient.put<PaymentsItem>(`/api/payments/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/payments/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getPaymentsByBookingId(bookingId: string): Promise<PaymentsItem[]> {
    return apiClient.get<PaymentsItem[]>(`/api/payments/bookings/${bookingId}`);
  }
}
