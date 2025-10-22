import { mockBookings } from '../mockData';
import { Booking } from '../../types';

class BookingService {
  async getAll(): Promise<Booking[]> {
    return Promise.resolve(mockBookings);
  }

  async getById(id: string): Promise<Booking | null> {
    const booking = mockBookings.find(booking => booking.id === id);
    return Promise.resolve(booking || null);
  }

  async create(data: Omit<Booking, 'id'>): Promise<Booking> {
    const newBooking = {
      ...data,
      id: Date.now().toString()
    };
    mockBookings.push(newBooking);
    return Promise.resolve(newBooking);
  }

  async update(id: string, data: Partial<Booking>): Promise<Booking> {
    const bookingIndex = mockBookings.findIndex(booking => booking.id === id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex] = { ...mockBookings[bookingIndex], ...data };
      return Promise.resolve(mockBookings[bookingIndex]);
    }
    throw new Error('Booking not found');
  }

  async delete(id: string): Promise<boolean> {
    const bookingIndex = mockBookings.findIndex(booking => booking.id === id);
    if (bookingIndex !== -1) {
      mockBookings.splice(bookingIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getBookingsByOrganization(organizationId: string): Promise<Booking[]> {
    return Promise.resolve(mockBookings.filter(booking => booking.organizationId === organizationId));
  }

  async getBookingsByHall(hallId: string, organizationId: string): Promise<Booking[]> {
    return Promise.resolve(mockBookings.filter(booking => 
      booking.hallId === hallId && booking.organizationId === organizationId
    ));
  }

  async getActiveBookings(organizationId: string): Promise<Booking[]> {
    return Promise.resolve(mockBookings.filter(booking => 
      booking.organizationId === organizationId && 
      (booking.status === 'confirmed' || booking.status === 'active')
    ));
  }

  // Enhanced search and filter functionality
  async searchBookings(searchRequest: { organizationId: string; [key: string]: any }): Promise<Booking[]> {
    const { organizationId, ...filters } = searchRequest;
    let filteredBookings = await this.getBookingsByOrganization(organizationId);

    if (filters.eventDateFrom) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.eventDate >= filters.eventDateFrom!
      );
    }

    if (filters.eventDateTo) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.eventDate <= filters.eventDateTo!
      );
    }

    if (filters.status && filters.status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => 
        booking.status === filters.status
      );
    }

    if (filters.customerName) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.customerName.toLowerCase().includes(filters.customerName!.toLowerCase())
      );
    }

    if (filters.customerEmail) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.customerEmail.toLowerCase().includes(filters.customerEmail!.toLowerCase())
      );
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredBookings = filteredBookings.filter(booking => 
        booking.customerName.toLowerCase().includes(searchLower) ||
        booking.customerEmail.toLowerCase().includes(searchLower) ||
        booking.customerPhone.includes(filters.searchTerm!) ||
        booking.eventType.toLowerCase().includes(searchLower)
      );
    }

    if (filters.eventType) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.eventType.toLowerCase().includes(filters.eventType!.toLowerCase())
      );
    }

    if (filters.hallId) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.hallId === filters.hallId
      );
    }

    if (filters.isActive !== undefined) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.isActive === filters.isActive
      );
    }

    if (filters.timeSlot) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.timeSlot === filters.timeSlot
      );
    }

    if (filters.guestCountMin) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.guestCount >= filters.guestCountMin!
      );
    }

    if (filters.guestCountMax) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.guestCount <= filters.guestCountMax!
      );
    }

    if (filters.totalAmountMin) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.totalAmount >= filters.totalAmountMin!
      );
    }

    if (filters.totalAmountMax) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.totalAmount <= filters.totalAmountMax!
      );
    }

    // Handle sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
      filteredBookings.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'eventDate':
            aValue = a.eventDate;
            bValue = b.eventDate;
            break;
          case 'createdAt':
            aValue = a.createdAt;
            bValue = b.createdAt;
            break;
          case 'customerName':
            aValue = a.customerName.toLowerCase();
            bValue = b.customerName.toLowerCase();
            break;
          case 'totalAmount':
            aValue = a.totalAmount;
            bValue = b.totalAmount;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return -1 * sortOrder;
        if (aValue > bValue) return 1 * sortOrder;
        return 0;
      });
    }

    // Handle pagination
    if (filters.page && filters.pageSize) {
      const startIndex = (filters.page - 1) * filters.pageSize;
      const endIndex = startIndex + filters.pageSize;
      filteredBookings = filteredBookings.slice(startIndex, endIndex);
    }

    return Promise.resolve(filteredBookings);
  }

  // Statistics methods for leads tracking
  async getBookingStatistics(organizationId: string): Promise<any> {
    const allBookings = await this.getBookingsByOrganization(organizationId);
    const today = new Date().toISOString().split('T')[0];
    
    return Promise.resolve({
      newLeads: allBookings.filter(b => b.status === 'pending').length,
      rejectedLeads: allBookings.filter(b => b.status === 'cancelled').length,
      confirmedLeads: allBookings.filter(b => b.status === 'confirmed').length,
      upcomingEvents: allBookings.filter(b => 
        b.status === 'confirmed' && b.eventDate >= today
      ).length,
      happeningEvents: allBookings.filter(b => 
        b.status === 'active' || (b.status === 'confirmed' && b.eventDate === today)
      ).length,
      totalBookings: allBookings.length,
      totalRevenue: allBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + b.totalAmount, 0)
    });
  }

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
    const newBooking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    mockBookings.push(newBooking);
    return Promise.resolve(newBooking);
  }

  async updateBookingStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking> {
    const bookingIndex = mockBookings.findIndex(booking => booking.id === id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].status = status;
      if (reason) {
        mockBookings[bookingIndex].customerResponse = `Status changed to ${status}. Reason: ${reason}`;
        mockBookings[bookingIndex].lastContactDate = new Date().toISOString().split('T')[0];
      }
      return Promise.resolve(mockBookings[bookingIndex]);
    }
    throw new Error('Booking not found');
  }

  async toggleBookingActive(id: string, isActive: boolean): Promise<Booking> {
    const bookingIndex = mockBookings.findIndex(booking => booking.id === id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].isActive = isActive;
      if (isActive) {
        mockBookings[bookingIndex].status = 'active';
      }
      return Promise.resolve(mockBookings[bookingIndex]);
    }
    throw new Error('Booking not found');
  }

  async recordHandOver(id: string, handOverDetails: {
    personName: string;
    ebReading: number;
    advanceAmount: number;
    handOverDate: string;
  }): Promise<Booking> {
    const bookingIndex = mockBookings.findIndex(booking => booking.id === id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].handOverDetails = handOverDetails;
      mockBookings[bookingIndex].status = 'active';
      mockBookings[bookingIndex].isActive = true;
      return Promise.resolve(mockBookings[bookingIndex]);
    }
    throw new Error('Booking not found');
  }

  async updateBookingCommunication(id: string, lastContactDate: string, customerResponse: string): Promise<Booking> {
    const bookingIndex = mockBookings.findIndex(booking => booking.id === id);
    if (bookingIndex !== -1) {
      mockBookings[bookingIndex].lastContactDate = lastContactDate;
      mockBookings[bookingIndex].customerResponse = customerResponse;
      return Promise.resolve(mockBookings[bookingIndex]);
    }
    throw new Error('Booking not found');
  }
}

export const bookingService = new BookingService();
