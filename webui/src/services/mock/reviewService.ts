import { IReviewService } from '../interfaces/IDataService';
import { Review } from '../../types';
import { mockReviews } from '../mockData';

class ReviewService implements IReviewService {
  async getAll(): Promise<Review[]> {
    return Promise.resolve(mockReviews);
  }

  async getById(id: string): Promise<Review | null> {
    const review = mockReviews.find(review => review.id === id);
    return Promise.resolve(review || null);
  }

  async create(data: Omit<Review, 'id'>): Promise<Review> {
    const newReview = {
      ...data,
      id: Date.now().toString()
    };
    mockReviews.push(newReview);
    return Promise.resolve(newReview);
  }

  async update(id: string, data: Partial<Review>): Promise<Review> {
    const reviewIndex = mockReviews.findIndex(review => review.id === id);
    if (reviewIndex !== -1) {
      // Merge the current review with the update data to create full Review object
      const fullReview: Review = {
        ...mockReviews[reviewIndex],
        ...data,
        id: id // Ensure the ID is set correctly
      };
      mockReviews[reviewIndex] = fullReview;
      return Promise.resolve(fullReview);
    }
    throw new Error('Review not found');
  }

  async delete(id: string): Promise<boolean> {
    const index = mockReviews.findIndex(review => review.id === id);
    if (index !== -1) {
      mockReviews.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }

  async getReviewsByOrganization(organizationId: string): Promise<Review[]> {
    const reviews = mockReviews.filter(review => review.organizationId === organizationId);
    return Promise.resolve(reviews);
  }

  async getReviewsByHall(hallId: string): Promise<Review[]> {
    const reviews = mockReviews.filter(review => review.hallId === hallId);
    return Promise.resolve(reviews);
  }

  async getAverageRating(organizationId: string): Promise<number> {
    const reviews = await this.getReviewsByOrganization(organizationId);
    if (reviews.length === 0) return Promise.resolve(0);
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Promise.resolve(total / reviews.length);
  }

  // Optimized update method that takes the current review to avoid extra lookup
  async updateWithCurrentData(id: string, currentReview: Review, data: Partial<Review>): Promise<Review> {
    const reviewIndex = mockReviews.findIndex(review => review.id === id);
    if (reviewIndex !== -1) {
      // Merge the current review with the update data to create full Review object
      const fullReview: Review = {
        ...currentReview,
        ...data,
        id: id // Ensure the ID is set correctly
      };
      mockReviews[reviewIndex] = fullReview;
      return Promise.resolve(fullReview);
    }
    throw new Error('Review not found');
  }

  // Legacy method for backward compatibility
  deleteReview(id: string): boolean {
    const index = mockReviews.findIndex(review => review.id === id);
    if (index !== -1) {
      mockReviews.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const reviewService = new ReviewService();
