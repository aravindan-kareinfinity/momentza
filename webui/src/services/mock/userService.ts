import { User } from '../../types';
import { mockUsers } from '../mockData';

class UserService {
  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    return mockUsers.filter(user => user.organizationId === organizationId);
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const newUser = {
      ...user,
      id: Date.now().toString()
    };
    mockUsers.push(newUser);
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
      return mockUsers[userIndex];
    }
    throw new Error('User not found');
  }

  async delete(id: string): Promise<boolean> {
    const index = mockUsers.findIndex(user => user.id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
      return true;
    }
    return false;
  }

  async getById(id: string): Promise<User | null> {
    return mockUsers.find(user => user.id === id) || null;
  }

  async getAll(): Promise<User[]> {
    return mockUsers;
  }
}

export const userService = new UserService();
