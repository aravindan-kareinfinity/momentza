import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock, Sun, Moon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicHallCalendar } from './PublicHallCalendar';
import { galleryService, bookingService } from '@/services/ServiceFactory';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface PublicHallsSectionProps {
  halls: any[];
}

export function PublicHallsSection({ halls }: PublicHallsSectionProps) {
  const navigate = useNavigate();
  const [selectedDates, setSelectedDates] = useState<Record<string, Date | null>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Function to get image URL for a hall
  const getImageUrl = (hall: any): string => {
    if (!hall.gallery || hall.gallery.length === 0) {
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
    }

    const galleryItem = hall.gallery[0];
    
    // If it's already a full URL, use it directly
    if (galleryItem.startsWith('http')) {
      return galleryItem;
    }
    
    // If it's a photo ID, construct Unsplash URL
    if (galleryItem.startsWith('photo-')) {
      return `https://images.unsplash.com/${galleryItem}?auto=format&fit=crop&w=400&q=80`;
    }
    
    // If it's a gallery image ID, try to resolve it
    try {
      const resolvedUrl = galleryService.getImageUrl(galleryItem);
      return resolvedUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
    } catch (error) {
      console.warn('Failed to resolve gallery image URL:', error);
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
    }
  };

  const handleDateSelect = (hallId: string, date: Date | null) => {
    setSelectedDates(prev => ({
      ...prev,
      [hallId]: date
    }));
  };

  const handleBookingClick = (hallId: string) => {
    const selectedDate = selectedDates[hallId];
    if (selectedDate) {
      const params = new URLSearchParams({
        date: selectedDate.toISOString().split('T')[0]
      });
      navigate(`/booking/${hallId}?${params.toString()}`);
    }
  };

  if (!halls || halls.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Wedding Halls</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our beautiful venues perfect for your special day. Each hall is designed 
            to create magical moments and unforgettable memories.
          </p>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {halls.map((hall) => (
            <Card key={hall.id} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={getImageUrl(hall)}
                  alt={hall.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <Badge className="absolute top-2 right-2" variant="secondary">
                  Wedding Hall
                </Badge>
              </div>

              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {hall.name}
                  <span className="text-lg font-bold text-primary">
                    ₹{hall.rateCard.morningRate.toLocaleString()}+
                  </span>
                </CardTitle>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {hall.location}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Up to {hall.capacity} guests
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {hall.features && hall.features.length} amenities
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2">
                  Beautiful venue located at {hall.address} with premium facilities and excellent service.
                </p>

                <div className="flex flex-wrap gap-1">
                  {hall.features && hall.features.slice(0, 3).map((feature: any) => (
                    <Badge key={feature.name} variant="outline" className="text-xs">
                      {feature.name}
                    </Badge>
                  ))}
                  {hall.features && hall.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{hall.features.length - 3} more
                    </Badge>
                  )}
                </div>

                <PublicHallCalendar
                  hallId={hall.id}
                  onDateSelect={(date) => handleDateSelect(hall.id, date)}
                  selectedDate={selectedDates[hall.id] || null}
                />
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/hall/${hall.id}`)}
                  className="flex-1"
                >
                  View Details
                </Button>
                <Button 
                  onClick={() => handleBookingClick(hall.id)}
                  className="flex-1"
                  disabled={!selectedDates[hall.id]}
                >
                  Book Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
