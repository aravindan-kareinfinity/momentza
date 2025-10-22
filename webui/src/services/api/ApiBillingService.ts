import { IBillingService } from '../interfaces/IDataService';
import { BillingSettings } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiBillingService implements IBillingService {
  async getBillingSettings(): Promise<BillingSettings> {
    return apiClient.get<BillingSettings>('/api/billing/settings');
  }

  async updateBillingSettings(settings: Partial<BillingSettings>): Promise<BillingSettings> {
    return apiClient.put<BillingSettings>('/api/billing/settings', settings);
  }
} 