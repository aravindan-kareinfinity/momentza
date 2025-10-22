import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { galleryService } from '@/services/ServiceFactory';

interface PublicHomeCarouselProps {
  organization: any;
  carouselItems: any[];
  galleryImages: any[];
}

export function PublicHomeCarousel({ 
  organization, 
  carouselItems, 
  galleryImages 
}: PublicHomeCarouselProps) {
  // Function to get proper image URL
  const getImageUrl = (item: any): string => {
    if (!item.imageUrl) {
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=1920&q=80';
    }

    // If it's already a full URL, use it directly
    if (item.imageUrl.startsWith('http')) {
      return item.imageUrl;
    }
    
    // If it's a photo ID, construct Unsplash URL
    if (item.imageUrl.startsWith('photo-')) {
      return `https://images.unsplash.com/${item.imageUrl}?auto=format&fit=crop&w=1920&q=80`;
    }
    
    // If it's a gallery image ID, try to resolve it
    try {
      const resolvedUrl = galleryService.getImageUrl(item.imageUrl);
      return resolvedUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=1920&q=80';
    } catch (error) {
      console.warn('Failed to resolve carousel image URL:', error);
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=1920&q=80';
    }
  };

  // If no organization, don't show carousel
  if (!organization) {
    return null;
  }

  let displayItems: any[] = [];
  if (Array.isArray(carouselItems) && carouselItems.length > 0) {
    displayItems = carouselItems;
  } else if (Array.isArray(galleryImages) && galleryImages.length > 0) {
    displayItems = galleryImages.slice(0, 5).map((img, index) => ({
      id: img.id,
      organizationId: img.organizationId,
      imageUrl: img.url,
      title: img.title,
      description: `Beautiful ${img.category}`,
      order: index + 1,
      isActive: true
    }));
  }
  // Always ensure displayItems is an array
  if (!Array.isArray(displayItems)) displayItems = [];
  if (displayItems.length === 0) return null;

  return (
    <div className="relative mb-12">
      <Carousel className="w-full">
        <CarouselContent>
          {Array.isArray(displayItems) && displayItems.map((item) => (
            <CarouselItem key={item.id}>
              <div className="relative h-96 md:h-[500px] lg:h-[600px]">
                <img
                  src={getImageUrl(item)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=1920&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-center text-white max-w-2xl px-4">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
                      {item.title}
                    </h1>
                    <p className="text-lg md:text-xl lg:text-2xl opacity-90">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4" />
        <CarouselNext className="right-4" />
      </Carousel>
    </div>
  );
}
