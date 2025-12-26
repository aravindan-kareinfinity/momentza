import { mockGalleryImages, GalleryImage } from '../mockData';

class GalleryService {
  getImagesByOrganization(organizationId: string): GalleryImage[] {
    return mockGalleryImages.filter(image => image.organizationId === organizationId);
  }

  async uploadImage(file: File, organizationId: string, title: string, category: string): Promise<GalleryImage> {
    // Simulate file upload - in real implementation, this would upload to a cloud service
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organizationId', organizationId);
    formData.append('title', title);
    formData.append('category', category);

    // Mock upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a mock URL for the uploaded file
    const mockUploadedUrl = `https://images.unsplash.com/photo-${Date.now()}`;

    const newImage = {
      id: Date.now().toString(),
      organizationId,
      url: mockUploadedUrl,
      title,
      category,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    mockGalleryImages.push(newImage);
    return newImage;
  }

  createImage(image: Omit<GalleryImage, 'id' | 'uploadedAt'>): GalleryImage {
    const newImage = {
      ...image,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    mockGalleryImages.push(newImage);
    return newImage;
  }

  async update(
    id: string,
    data: Partial<GalleryImage>
  ): Promise<GalleryImage> {
    const index = mockGalleryImages.findIndex(img => img.id === id);

    if (index === -1) {
      throw new Error('Image not found');
    }

    mockGalleryImages[index] = {
      ...mockGalleryImages[index],
      ...data,
    };

    return Promise.resolve(mockGalleryImages[index]);
  }

  deleteImage(id: string): boolean {
    const index = mockGalleryImages.findIndex(image => image.id === id);
    if (index !== -1) {
      mockGalleryImages.splice(index, 1);
      return true;
    }
    return false;
  }

  getImagesByCategory(organizationId: string, category: string): GalleryImage[] {
    return this.getImagesByOrganization(organizationId)
      .filter(image => image.category === category);
  }

  getImageUrl(id: string): string {
    // For mock service, return the original URL since we don't have a real API endpoint
    const image = mockGalleryImages.find(img => img.id === id);
    return image ? image.url : '';
  }
}

export const galleryService = new GalleryService();
export type { GalleryImage };
