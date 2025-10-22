import React, { useState, useEffect, useRef } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { carouselService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

interface HomeCarouselProps {
  organizationId: string;
}

export function HomeCarousel({ organizationId }: HomeCarouselProps) {
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const hasFetchedRef = useRef(false);

  // Fetch data on component mount
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[HomeCarousel] Fetching carousel items...');
      const items = await carouselService.getCarouselItems(organizationId);
      setCarouselItems(items || []);
      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasFetchedRef.current && organizationId) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, []); // Empty dependency array - only run once

  const handleRetry = async () => {
    await fetchData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || carouselItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, carouselItems.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative mb-12">
        <div className="animate-pulse">
          <div className="h-96 md:h-[500px] lg:h-[600px] bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !carouselItems || carouselItems.length === 0) {
    return (
      <>
        <div className="relative mb-12">
          <div className="relative w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">No carousel items available</p>
            </div>
          </div>
        </div>

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Carousel Service Error"
          message={error?.message || 'Unable to load carousel items. Please try again.'}
        />
      </>
    );
  }

  const safeCarouselItems = Array.isArray(carouselItems) ? carouselItems : [];
  if (!organizationId || safeCarouselItems.length === 0) {
    return null;
  }

  return (
    <div className="relative mb-12">
      <Carousel className="w-full">
        <CarouselContent>
                     {safeCarouselItems.map((item, index) => (
             <CarouselItem key={item.id}>
              <div className="relative h-96 md:h-[500px] lg:h-[600px]">
                <img
                  src={`https://images.unsplash.com/${item.imageUrl}?auto=format&fit=crop&w=1920&q=80`}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
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
