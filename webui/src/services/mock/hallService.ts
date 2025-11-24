import { Hall } from '../../types';
import { mockHalls } from '../mockData';
import { bookingService } from './bookingService';
import { format } from 'date-fns';

class HallService {
  async getAll(): Promise<Hall[]> {
    return Promise.resolve(mockHalls);
  }

  async getById(id: string): Promise<Hall | null> {
    const hall = mockHalls.find(hall => hall.id === id);
    return Promise.resolve(hall || null);
  }

  async create(data: Omit<Hall, 'id'>): Promise<Hall> {
    const newHall = {
      ...data,
      id: Date.now().toString()
    };
    mockHalls.push(newHall);
    return Promise.resolve(newHall);
  }

  async update(id: string, data: Partial<Hall>): Promise<Hall> {
    const hallIndex = mockHalls.findIndex(hall => hall.id === id);
    if (hallIndex !== -1) {
      mockHalls[hallIndex] = { ...mockHalls[hallIndex], ...data };
      return Promise.resolve(mockHalls[hallIndex]);
    }
    throw new Error('Hall not found');
  }

  async delete(id: string): Promise<boolean> {
    const hallIndex = mockHalls.findIndex(hall => hall.id === id);
    if (hallIndex !== -1) {
      mockHalls.splice(hallIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getAllHalls(): Promise<Hall[]> {
    return Promise.resolve(mockHalls);
  }

  async getHallsByOrganization(organizationId: string): Promise<Hall[]> {
    return Promise.resolve(mockHalls.filter(hall => hall.organizationId === organizationId));
  }

  async getAccessibleHalls(organizationId: string, accessibleHallIds: string[]): Promise<Hall[]> {
    return Promise.resolve(mockHalls.filter(
      hall => hall.organizationId === organizationId && 
              accessibleHallIds.includes(hall.id)
    ));
  }

  async getHallById(id: string): Promise<Hall | null> {
    const hall = mockHalls.find(hall => hall.id === id);
    return Promise.resolve(hall || null);
  }

  async getAvailableTimeSlots(hallId: string, date: string | Date): Promise<Array<{value: string, label: string, price: number}>> {
    const hall = await this.getHallById(hallId);
    if (!hall) return Promise.resolve([]);

    const normalizeDate = (value: string | Date): Date => {
      if (value instanceof Date) {
        return value;
      }

      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      throw new Error(`Invalid date: ${value}`);
    };

    const dateValue = normalizeDate(date);
    const dateStr = format(dateValue, 'yyyy-MM-dd');
    const hallBookings = await bookingService.getBookingsByHall(hallId, hall.organizationId);
    const dayBookings = hallBookings.filter(booking => 
      booking.eventDate === dateStr && 
      (booking.status === 'confirmed' || booking.status === 'active')
    );

    // If no bookings exist for this date, return all three time slots by default
    if (dayBookings.length === 0) {
      return Promise.resolve([
        {
          value: 'morning',
          label: `Morning (₹${hall.rateCard.morningRate.toLocaleString()})`,
          price: hall.rateCard.morningRate
        },
        {
          value: 'evening',
          label: `Evening (₹${hall.rateCard.eveningRate.toLocaleString()})`,
          price: hall.rateCard.eveningRate
        },
        {
          value: 'fullday',
          label: `Full Day (₹${hall.rateCard.fullDayRate.toLocaleString()})`,
          price: hall.rateCard.fullDayRate
        }
      ]);
    }

    // If bookings exist, apply the booking logic
    const hasFullDay = dayBookings.some(b => b.timeSlot === 'fullday');
    const hasMorning = dayBookings.some(b => b.timeSlot === 'morning');
    const hasEvening = dayBookings.some(b => b.timeSlot === 'evening');

    const availableSlots = [];

    if (!hasFullDay && !hasMorning) {
      availableSlots.push({
        value: 'morning',
        label: `Morning (₹${hall.rateCard.morningRate.toLocaleString()})`,
        price: hall.rateCard.morningRate
      });
    }

    if (!hasFullDay && !hasEvening) {
      availableSlots.push({
        value: 'evening',
        label: `Evening (₹${hall.rateCard.eveningRate.toLocaleString()})`,
        price: hall.rateCard.eveningRate
      });
    }

    if (!hasMorning && !hasEvening && !hasFullDay) {
      availableSlots.push({
        value: 'fullday',
        label: `Full Day (₹${hall.rateCard.fullDayRate.toLocaleString()})`,
        price: hall.rateCard.fullDayRate
      });
    }

    return Promise.resolve(availableSlots);
  }

  createHall(hall: Omit<Hall, 'id'>): Hall {
    const newHall = {
      ...hall,
      id: Date.now().toString()
    };
    mockHalls.push(newHall);
    return newHall;
  }

  updateHall(id: string, updates: Partial<Hall>): Hall {
    const hallIndex = mockHalls.findIndex(hall => hall.id === id);
    if (hallIndex !== -1) {
      mockHalls[hallIndex] = { ...mockHalls[hallIndex], ...updates };
      return mockHalls[hallIndex];
    }
    throw new Error('Hall not found');
  }

  deleteHall(id: string): boolean {
    const hallIndex = mockHalls.findIndex(hall => hall.id === id);
    if (hallIndex !== -1) {
      mockHalls.splice(hallIndex, 1);
      return true;
    }
    return false;
  }
}

export const hallService = new HallService();
