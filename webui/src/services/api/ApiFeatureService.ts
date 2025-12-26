import { apiClient } from "../http/ApiClient";
import { FeatureItem } from "@/types";

export class ApiFeatureService {
  async getAll(): Promise<FeatureItem[]> {
    return apiClient.get<FeatureItem[]>("/api/feature");
  }

  async getById(id: string): Promise<FeatureItem | null> {
    try {
      return await apiClient.get<FeatureItem>(`/api/feature/${id}`);
    } catch {
      return null;
    }
  }

  async getByBookingId(bookingId: string): Promise<FeatureItem[]> {
    return apiClient.get<FeatureItem[]>(`/api/feature/booking/${bookingId}`);
  }

  async create(feature: Omit<FeatureItem, "id" | "createdAt" | "updatedAt">): Promise<FeatureItem> {
    return apiClient.post<FeatureItem>("/api/feature", feature);
  }

  async update(id: string, feature: Partial<FeatureItem>): Promise<FeatureItem> {
    return apiClient.post<FeatureItem>(`/api/feature/${id}`, feature);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/feature/delete/${id}`,{});
      return true;
    } catch {
      return false;
    }
  }
}
