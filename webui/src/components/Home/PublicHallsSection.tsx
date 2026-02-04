import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Users,
  Clock,
  Sun,
  Moon,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Zap,
  Wind,
  Shield,
  Car,
  Utensils
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicHallCalendar } from './PublicHallCalendar';
import { galleryService, bookingService } from '@/services/ServiceFactory';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface PublicHallsSectionProps {
  halls: any[];
  config?: {
    width?: string;
    height?: number;
  };
}

export function PublicHallsSection({ halls, config }: PublicHallsSectionProps) {
  const navigate = useNavigate();
  const [selectedDates, setSelectedDates] = useState<Record<string, Date | null>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [expandedHalls, setExpandedHalls] = useState<Record<string, boolean>>({});

  // Function to get image URL for a hall
  const getImageUrl = (hall: any): string => {
    if (!hall.gallery || hall.gallery.length === 0) {
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80';
    }

    const galleryItem = hall.gallery[0];

    // If it's already a full URL, use it directly
    if (galleryItem.startsWith('http')) {
      return galleryItem;
    }

    // If it's a photo ID, construct Unsplash URL
    if (galleryItem.startsWith('photo-')) {
      return `https://images.unsplash.com/${galleryItem}?auto=format&fit=crop&w=800&q=80`;
    }

    // If it's a gallery image ID, try to resolve it
    try {
      const resolvedUrl = galleryService.getImageUrl(galleryItem);
      return resolvedUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80';
    } catch (error) {
      console.warn('Failed to resolve gallery image URL:', error);
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80';
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
      // const params = new URLSearchParams({
      //   date: selectedDate.toISOString().split('T')[0]
      // });
      const params = new URLSearchParams({
        date: format(selectedDate, 'yyyy-MM-dd')
      });
      navigate(`/booking/${hallId}?${params.toString()}`);
    }
  };

  const toggleHallExpand = (hallId: string) => {
    setExpandedHalls(prev => ({
      ...prev,
      [hallId]: !prev[hallId]
    }));
  };

  // Helper functions for hall features





  if (!halls || halls.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">


      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {halls.map((hall) => {
          const isExpanded = expandedHalls[hall.id];

          return (
            <Card
              key={hall.id}
              className="group overflow-hidden border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl rounded-2xl bg-white"
              style={{
                width: config?.width ? `${config.width}px` : undefined,
                height: config?.height ? `${config.height}px` : undefined
              }}
            >
              {/* Image Section */}
              <div className="aspect-[4/3] relative overflow-hidden">
                <img
                  src={getImageUrl(hall)}
                  alt={hall.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Badge className="absolute top-4 right-4 bg-white/95 text-gray-800 border-none shadow-lg font-semibold px-3 py-1.5">
                  {hall.type || 'Wedding Hall'}
                </Badge>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">{hall.name}</h3>
                  <div className="flex items-center text-white/90">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{hall.location}</span>
                  </div>
                </div>
              </div>

              <CardHeader className="pb-4 pt-6 px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      <Users className="h-4 w-4 mr-1.5" />
                      {hall.amenities?.capacity?.hall || 'N/A'} Capacity
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ₹{hall.rateCard?.morningRate?.toLocaleString() || '0'}
                      <span className="text-sm font-normal text-gray-500 ml-1">starting price</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-5 space-y-3">
                {/* Hall Features Card - Integrated from your code */}
                <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="p-4 pb-3 border-b bg-gradient-to-r from-gray-50 to-gray-100/50">
                    <CardTitle className="text-base font-bold text-gray-800 flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2.5" />
                      Hall Capacity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-5">
                    {/* Capacity Info */}
                    <div className="grid grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-1">Hall Capacity</div>
                        <div className="text-xl font-bold text-blue-700">
                          {hall.amenities?.capacity?.hall || 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">guests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-1">Dining</div>
                        <div className="text-xl font-bold text-green-700">
                          {hall.amenities?.capacity?.dining || 'N/A'}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">people</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-600 mb-1">Parking</div>
                        <div className="text-xl font-bold text-purple-700">
                          {hall.amenities?.capacity?.parking || '0'}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">vehicles</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendar Section */}
                <div className="pt-2">
                  <PublicHallCalendar
                    hallId={hall.id}
                    onDateSelect={(date) => handleDateSelect(hall.id, date)}
                    selectedDate={selectedDates[hall.id] || null}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex gap-3 px-6 pb-6 pt-0">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/hall/${hall.id}`)}
                  className="flex-1 border-primary text-primary hover:bg-primary/5 hover:border-primary/80"
                >
                  View Hall
                </Button>
                <Button
                  onClick={() => handleBookingClick(hall.id)}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                  disabled={!selectedDates[hall.id]}
                >
                  Book Now
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}