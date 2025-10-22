import { mockCommunications, Communication } from '../mockData';

class CommunicationService {
  async getAll(): Promise<Communication[]> {
    return Promise.resolve(mockCommunications);
  }

  async getById(id: string): Promise<Communication | null> {
    const communication = mockCommunications.find(communication => communication.id === id);
    return Promise.resolve(communication || null);
  }

  async create(data: Omit<Communication, 'id'>): Promise<Communication> {
    const newCommunication = {
      ...data,
      id: Date.now().toString()
    };
    mockCommunications.push(newCommunication);
    return Promise.resolve(newCommunication);
  }

  async update(id: string, data: Partial<Communication>): Promise<Communication> {
    const communicationIndex = mockCommunications.findIndex(communication => communication.id === id);
    if (communicationIndex !== -1) {
      mockCommunications[communicationIndex] = { ...mockCommunications[communicationIndex], ...data };
      return Promise.resolve(mockCommunications[communicationIndex]);
    }
    throw new Error('Communication not found');
  }

  async delete(id: string): Promise<boolean> {
    const communicationIndex = mockCommunications.findIndex(communication => communication.id === id);
    if (communicationIndex !== -1) {
      mockCommunications.splice(communicationIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getCommunicationsByBookingId(bookingId: string): Promise<Communication[]> {
    return Promise.resolve(mockCommunications.filter(communication => communication.bookingId === bookingId));
  }

  async createCommunication(data: Omit<Communication, 'id'>): Promise<Communication> {
    const newCommunication = {
      ...data,
      id: Date.now().toString()
    };
    mockCommunications.push(newCommunication);
    return Promise.resolve(newCommunication);
  }

  async updateCommunication(id: string, data: Partial<Communication>): Promise<Communication> {
    const communicationIndex = mockCommunications.findIndex(communication => communication.id === id);
    if (communicationIndex !== -1) {
      mockCommunications[communicationIndex] = { ...mockCommunications[communicationIndex], ...data };
      return Promise.resolve(mockCommunications[communicationIndex]);
    }
    throw new Error('Communication not found');
  }

  async deleteCommunication(id: string): Promise<boolean> {
    const communicationIndex = mockCommunications.findIndex(communication => communication.id === id);
    if (communicationIndex !== -1) {
      mockCommunications.splice(communicationIndex, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
}

export const communicationService = new CommunicationService();
export type { Communication }; 