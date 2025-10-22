import { IBookingService } from '../interfaces/IDataService';
import { Booking } from '../../types';
import { apiClient } from '../http/ApiClient';

// Define the booking search request type to match the C# API
export interface BookingSearchRequest {
  organizationId: string;
  hallId?: string;
  status?: Booking['status'];
  eventType?: string;
  customerName?: string;
  customerEmail?: string;
  searchTerm?: string; // Generic search term for multiple fields
  eventDateFrom?: string;
  eventDateTo?: string;
  isActive?: boolean;
  timeSlot?: 'morning' | 'evening' | 'fullday';
  guestCountMin?: number;
  guestCountMax?: number;
  totalAmountMin?: number;
  totalAmountMax?: number;
  createdDateFrom?: string;
  createdDateTo?: string;
  lastContactDateFrom?: string;
  lastContactDateTo?: string;
  sortBy?: 'eventDate' | 'createdAt' | 'customerName' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export class ApiBookingService implements IBookingService {
  async getAll(): Promise<Booking[]> {
    return apiClient.get<Booking[]>('/api/bookings');
  }

  async getById(id: string): Promise<Booking | null> {
    try {
      return await apiClient.get<Booking>(`/api/bookings/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<Booking, 'id'>): Promise<Booking> {
    return apiClient.post<Booking>('/api/bookings', data);
  }

  async update(id: string, data: Partial<Booking>): Promise<Booking> {
    return apiClient.put<Booking>(`/api/bookings/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/bookings/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getBookingsByOrganization(organizationId: string): Promise<Booking[]> {
    // Use the new searchBookings method with just organizationId
    return this.searchBookings({ organizationId });
  }

  async getBookingsByHall(hallId: string, organizationId: string): Promise<Booking[]> {
    // Use the new searchBookings method with hallId and organizationId
    return this.searchBookings({ organizationId, hallId });
  }

  async getActiveBookings(organizationId: string): Promise<Booking[]> {
    // Use the new searchBookings method with organizationId and isActive filter
    return this.searchBookings({ organizationId, isActive: true });
  }

  async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
    return apiClient.post<Booking[]>('/api/bookings/search', searchRequest);
  }

  async updateBookingStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/status`, { status, reason });
  }

  async toggleBookingActive(id: string, isActive: boolean): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/active`, { isActive });
  }

  async recordHandOver(id: string, handOverDetails: any): Promise<Booking> {
    return apiClient.post<Booking>(`/api/bookings/${id}/handover`, handOverDetails);
  }

  async updateBookingCommunication(id: string, lastContactDate: string, customerResponse: string): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/communication`, { 
      lastContactDate, 
      customerResponse 
    });
  }

  async getBookingStatistics(organizationId: string): Promise<any> {
    return apiClient.get<any>(`/api/bookings/organizations/${organizationId}/statistics`);
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    return apiClient.post<Booking>('/api/bookings', booking);
  }
} 