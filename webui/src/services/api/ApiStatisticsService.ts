import { IStatisticsService } from '../interfaces/IDataService';
import { StatusData, HallUtilization, MonthlyData, GrowthMetrics, CustomerInsights } from '../mockData';
import { apiClient } from '../http/ApiClient';

export class ApiStatisticsService implements IStatisticsService {
  async getBasicStatistics(organizationId: string): Promise<any> {
    return apiClient.get<any>(`/api/statistics/organizations/${organizationId}/basic`);
  }
  async getLeadMetrics(organizationId: string): Promise<any> {
    return apiClient.get<any>(`/api/statistics/organizations/${organizationId}/leads`);
  }
  async getStatusDistribution(organizationId: string): Promise<StatusData[]> {
    return apiClient.get<StatusData[]>(`/api/statistics/organizations/${organizationId}/status-distribution`);
  }
  async getHallUtilization(organizationId: string): Promise<HallUtilization[]> {
    return apiClient.get<HallUtilization[]>(`/api/statistics/organizations/${organizationId}/hall-utilization`);
  }
  async getMonthlyData(): Promise<MonthlyData[]> {
    return apiClient.get<MonthlyData[]>(`/api/statistics/monthly`);
  }
  async getGrowthMetrics(organizationId: string): Promise<GrowthMetrics> {
    return apiClient.get<GrowthMetrics>(`/api/statistics/organizations/${organizationId}/growth`);
  }
  async getCustomerInsights(organizationId: string): Promise<CustomerInsights> {
    return apiClient.get<CustomerInsights>(`/api/statistics/organizations/${organizationId}/customer-insights`);
  }
  async getChartConfig(): Promise<any> {
    return apiClient.get<any>(`/api/statistics/chart-config`);
  }
  async getAllStatistics(organizationId: string): Promise<any> {
    return apiClient.get<any>(`/api/statistics/organizations/${organizationId}/all`);
  }
} 