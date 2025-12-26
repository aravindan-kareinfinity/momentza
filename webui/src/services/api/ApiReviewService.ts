import { IReviewService } from '../interfaces/IDataService';
import { Review } from '../../types';
import { apiClient } from '../http/ApiClient';

export class ApiReviewService implements IReviewService {
  async getAll(): Promise<Review[]> {
    return apiClient.get<Review[]>('/api/reviews');
  }

  async getById(id: string): Promise<Review | null> {
    try {
      return await apiClient.get<Review>(`/api/reviews/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<Review, 'id'>): Promise<Review> {
    return apiClient.post<Review>('/api/reviews', data);
  }

  async update(id: string, data: Partial<Review>): Promise<Review> {
    // First get the current review to merge with the update data
    const currentReview = await this.getById(id);
    if (!currentReview) {
      throw new Error('Review not found');
    }
    
    // Merge the current review with the update data to create full Review object
    const fullReview: Review = {
      ...currentReview,
      ...data,
      id: id // Ensure the ID is set correctly
    };
    
    // Call PUT with full Review object in request body
    return apiClient.post<Review>(`/api/reviews/${id}`, fullReview);
  }

  // Optimized update method that takes the current review to avoid extra GET request
  async updateWithCurrentData(id: string, currentReview: Review, data: Partial<Review>): Promise<Review> {
    // Merge the current review with the update data to create full Review object
    const fullReview: Review = {
      ...currentReview,
      ...data,
      id: id // Ensure the ID is set correctly
    };
    
    // Call PUT with full Review object in request body
    return apiClient.post<Review>(`/api/reviews/${id}/update`, fullReview);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/api/reviews/${id}/delete`, {});
      return true;
    } catch (error) {
      return false;
    }
  }

  async getReviewsByOrganization(organizationId: string): Promise<Review[]> {
    return apiClient.get<Review[]>(`/api/reviews/organizations/${organizationId}`);
  }

  async getReviewsByHall(hallId: string): Promise<Review[]> {
    return apiClient.get<Review[]>(`/api/halls/${hallId}/reviews`);
  }

  async getAverageRating(organizationId: string): Promise<number> {
    return apiClient.get<number>(`/api/reviews/organizations/${organizationId}/average-rating`);
  }
} 