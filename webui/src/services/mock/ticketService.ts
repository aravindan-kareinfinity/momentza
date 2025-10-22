import { mockTickets, TicketItem } from '../mockData';

class TicketService {
  async getAll(): Promise<TicketItem[]> {
    return Promise.resolve(mockTickets);
  }

  async getById(id: string): Promise<TicketItem | null> {
    const ticket = mockTickets.find(ticket => ticket.id === id);
    return Promise.resolve(ticket || null);
  }

  async create(data: Omit<TicketItem, 'id'>): Promise<TicketItem> {
    const newTicket = {
      ...data,
      id: Date.now().toString()
    };
    mockTickets.push(newTicket);
    return Promise.resolve(newTicket);
  }

  async update(id: string, data: Partial<TicketItem>): Promise<TicketItem> {
    const ticketIndex = mockTickets.findIndex(ticket => ticket.id === id);
    if (ticketIndex !== -1) {
      mockTickets[ticketIndex] = { ...mockTickets[ticketIndex], ...data };
      return Promise.resolve(mockTickets[ticketIndex]);
    }
    throw new Error('Ticket not found');
  }

  async delete(id: string): Promise<boolean> {
    const ticketIndex = mockTickets.findIndex(ticket => ticket.id === id);
    if (ticketIndex !== -1) {
      mockTickets.splice(ticketIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getTicketsByBookingId(bookingId: string): Promise<TicketItem[]> {
    return Promise.resolve(mockTickets.filter(ticket => ticket.bookingId === bookingId));
  }

  async updateTicketStatus(id: string, status: 'open' | 'in-progress' | 'completed'): Promise<TicketItem> {
    const ticketIndex = mockTickets.findIndex(ticket => ticket.id === id);
    if (ticketIndex !== -1) {
      mockTickets[ticketIndex].status = status;
      return Promise.resolve(mockTickets[ticketIndex]);
    }
    throw new Error('Ticket not found');
  }

  async createTicket(data: Omit<TicketItem, 'id'>): Promise<TicketItem> {
    const newTicket = {
      ...data,
      id: Date.now().toString()
    };
    mockTickets.push(newTicket);
    return Promise.resolve(newTicket);
  }

  async updateTicket(id: string, data: Partial<TicketItem>): Promise<TicketItem> {
    const ticketIndex = mockTickets.findIndex(ticket => ticket.id === id);
    if (ticketIndex !== -1) {
      mockTickets[ticketIndex] = { ...mockTickets[ticketIndex], ...data };
      return Promise.resolve(mockTickets[ticketIndex]);
    }
    throw new Error('Ticket not found');
  }

  async deleteTicket(id: string): Promise<boolean> {
    const ticketIndex = mockTickets.findIndex(ticket => ticket.id === id);
    if (ticketIndex !== -1) {
      mockTickets.splice(ticketIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  getTicketsByStatus(status: TicketItem['status']): TicketItem[] {
    return mockTickets.filter(ticket => ticket.status === status);
  }

  getTicketsByAssignedTo(assignedTo: string): TicketItem[] {
    return mockTickets.filter(ticket => ticket.assignedTo === assignedTo);
  }
}

export const ticketService = new TicketService();
export type { TicketItem }; 