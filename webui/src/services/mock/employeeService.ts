import { MasterDataItem, settingsService } from './settingsService';

class EmployeeService {
  getAllEmployees(): MasterDataItem[] {
    return settingsService.getEmployees();
  }

  getEmployeeById(id: string): MasterDataItem | undefined {
    return settingsService.getEmployees().find(employee => employee.id === id);
  }

  getEmployeeByName(name: string): MasterDataItem | undefined {
    return settingsService.getEmployees().find(employee => employee.name === name);
  }

  createEmployee(employee: Omit<MasterDataItem, 'id'>): MasterDataItem {
    return settingsService.addEmployee(employee.name);
  }

  updateEmployee(id: string, updates: Partial<MasterDataItem>): MasterDataItem {
    if (updates.name) {
      return settingsService.updateEmployee(id, updates.name);
    }
    throw new Error('Only name updates are supported');
  }

  deleteEmployee(id: string): boolean {
    return settingsService.deleteEmployee(id);
  }

  // Method to sync with settings data - now just returns the current data
  syncWithSettings(settingsEmployees: MasterDataItem[]): void {
    // This method is now a no-op since we're using the settings service directly
    console.log('Employee service now uses settings service directly');
  }
}

export const employeeService = new EmployeeService(); 