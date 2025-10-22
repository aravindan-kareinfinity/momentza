import { mockBillingSettings, BillingSettings } from '../mockData';

class BillingService {
  async getBillingSettings(): Promise<BillingSettings> {
    return Promise.resolve(mockBillingSettings);
  }

  async updateBillingSettings(settings: Partial<BillingSettings>): Promise<BillingSettings> {
    Object.assign(mockBillingSettings, settings);
    return Promise.resolve(mockBillingSettings);
  }
}

export const billingService = new BillingService();
export type { BillingSettings };
