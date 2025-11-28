import { IGalleryService } from '../interfaces/IDataService';
import { GalleryImage } from '../mockData';
import { apiClient } from '../http/ApiClient';
import { buildApiUrl } from '@/environment';

export class ApiGalleryService implements IGalleryService {
  async getAll(): Promise<GalleryImage[]> {
    return apiClient.get<GalleryImage[]>('/api/gallery');
  }

  async getById(id: string): Promise<GalleryImage | null> {
    try {
      return await apiClient.get<GalleryImage>(`/api/gallery/${id}`);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async create(data: Omit<GalleryImage, 'id'>): Promise<GalleryImage> {
    return apiClient.post<GalleryImage>('/api/gallery', data);
  }

  async update(id: string, data: Partial<GalleryImage>): Promise<GalleryImage> {
    return apiClient.put<GalleryImage>(`/api/gallery/${id}`, data);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/gallery/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getImagesByOrganization(organizationId: string): Promise<GalleryImage[]> {
    return apiClient.get<GalleryImage[]>(`/api/gallery/organizations/${organizationId}`);
  }

  async getImagesByCategory(organizationId: string, category: string): Promise<GalleryImage[]> {
    return apiClient.get<GalleryImage[]>(`/api/gallery/organizations/${organizationId}/category/${encodeURIComponent(category)}`);
  }

  async uploadImage(file: File, organizationId: string, title: string, category: string): Promise<GalleryImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    return apiClient.upload<GalleryImage>(`/api/gallery/organizations/${organizationId}/upload`, formData);
  }

  async createImage(image: Omit<GalleryImage, 'id' | 'uploadedAt'>): Promise<GalleryImage> {
    return apiClient.post<GalleryImage>('/api/gallery', image);
  }

  async deleteImage(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/gallery/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get image URL using the API endpoint
  getImageUrl(id: string): string {
    return buildApiUrl(`/api/gallery/${id}/image`);
  }
} 