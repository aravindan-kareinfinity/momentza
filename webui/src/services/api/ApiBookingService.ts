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
  // Transform API response to match TypeScript interface
  // Maps lowercase 'hallname' from API to 'HallName' in TypeScript
  private transformBooking(booking: any): Booking {
    return {
      ...booking,
      HallName: booking.hallName || booking.HallName || ''
    };
  }

  private transformBookings(bookings: any[]): Booking[] {
    return bookings.map(booking => this.transformBooking(booking));
  }

  async getAll(): Promise<Booking[]> {
    const bookings = await apiClient.get<any[]>('/api/bookings');
    return this.transformBookings(bookings);
  }

  async getById(id: string): Promise<Booking | null> {
    try {
      const booking = await apiClient.get<any>(`/api/bookings/${id}`);
      return this.transformBooking(booking);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<Booking, 'id'>): Promise<Booking> {
    const booking = await apiClient.post<any>('/api/bookings', data);
    return this.transformBooking(booking);
  }

  async update(id: string, data: Partial<Booking>): Promise<Booking> {
    const booking = await apiClient.put<any>(`/api/bookings/${id}`, data);
    return this.transformBooking(booking);
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
    const bookings = await apiClient.post<any[]>('/api/bookings/search', searchRequest);
    return this.transformBookings(bookings);
  }

  async updateBookingStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking> {
    const booking = await apiClient.put<any>(`/api/bookings/${id}/status`, { status, reason });
    return this.transformBooking(booking);
  }

  async toggleBookingActive(id: string, isActive: boolean): Promise<Booking> {
    const booking = await apiClient.patch<any>(`/api/bookings/${id}/active`, { isActive });
    return this.transformBooking(booking);
  }

  async recordHandOver(id: string, handOverDetails: any): Promise<Booking> {
    const booking = await apiClient.post<any>(`/api/bookings/${id}/handover`, handOverDetails);
    return this.transformBooking(booking);
  }

  async updateBookingCommunication(id: string, lastContactDate: string, customerResponse: string): Promise<Booking> {
    const booking = await apiClient.patch<any>(`/api/bookings/${id}/communication`, { 
      lastContactDate, 
      customerResponse 
    });
    return this.transformBooking(booking);
  }

  async getBookingStatistics(organizationId: string): Promise<any> {
    return apiClient.get<any>(`/api/bookings/organizations/${organizationId}/statistics`);
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const createdBooking = await apiClient.post<any>('/api/bookings', booking);
    return this.transformBooking(createdBooking);
  }
} 