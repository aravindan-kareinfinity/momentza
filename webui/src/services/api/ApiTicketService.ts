import { ITicketService } from '../interfaces/IDataService';
import { TicketItem } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiTicketService implements ITicketService {
  async getAll(): Promise<TicketItem[]> {
    return apiClient.get<TicketItem[]>('/api/tickets');
  }

  async getById(id: string): Promise<TicketItem | null> {
    try {
      return await apiClient.get<TicketItem>(`/api/tickets/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<TicketItem, 'id'>): Promise<TicketItem> {
    return apiClient.post<TicketItem>('/api/ticket', data);
  }

  async update(id: string, data: Partial<TicketItem>): Promise<TicketItem> {
    return apiClient.put<TicketItem>(`/api/tickets/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/tickets/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getTicketsByBookingId(bookingId: string): Promise<TicketItem[]> {
    return apiClient.get<TicketItem[]>(`/api/tickets/bookings/${bookingId}/tickets`);
  }

  async updateTicketStatus(id: string, status: 'open' | 'in-progress' | 'completed'): Promise<TicketItem> {
    return apiClient.patch<TicketItem>(`/api/tickets/${id}/status`, { status });
  }

  async createTicket(data: Omit<TicketItem, 'id'>): Promise<TicketItem> {
    return apiClient.post<TicketItem>('/api/tickets', data);
  }

  async updateTicket(id: string, data: Partial<TicketItem>): Promise<TicketItem> {
    return apiClient.put<TicketItem>(`/api/tickets/${id}`, data);
  }

  async deleteTicket(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/tickets/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }
} 