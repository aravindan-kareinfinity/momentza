import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Star, ArrowLeft } from 'lucide-react';
import { hallService } from '@/services/ServiceFactory';
import { TopNavigation } from '@/components/Layout/TopNavigation';
import { PublicFooter } from '@/components/Home/PublicFooter';
import { HallDetailCalendar } from '@/components/HallDetail/HallDetailCalendar';
import { HallDetailReviews } from '@/components/HallDetail/HallDetailReviews';

const HallDetail = () => {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // State for data
  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!hallId) return;

      try {
        setLoading(true);
        setError(null);
        
        const hallData = await hallService.getById(hallId);
        setHall(hallData);
      } catch (err) {
        console.error('Failed to load hall detail:', err);
        setError('Failed to load hall detail');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hallId]);

  // Mock image data with titles and descriptions
  const imageDetails = [
    { title: 'Main Hall', description: 'Spacious main hall perfect for large celebrations' },
    { title: 'Dining Area', description: 'Elegant dining space with modern amenities' },
    { title: 'Stage Area', description: 'Beautiful stage setup for ceremonies and performances' },
    { title: 'Garden View', description: 'Scenic garden area for outdoor photography' }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  // Show error state
  if (error || !hall) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading data
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error || 'Hall not found'}
                </p>
              </div>
            </div>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const handleBookNow = () => {
    if (selectedDate) {
      const params = new URLSearchParams({
        date: selectedDate.toISOString().split('T')[0]
      });
      navigate(`/booking/${hall.id}?${params.toString()}`);
    } else {
      navigate(`/booking/${hall.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {hall.gallery.slice(0, 4).map((image, index) => (
                <div key={index} className="space-y-2">
                  <img
                    src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=600&q=80`}
                    alt={imageDetails[index]?.title || `${hall.name} - Image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="px-2">
                    <h4 className="font-semibold text-lg">{imageDetails[index]?.title || `Gallery Image ${index + 1}`}</h4>
                    <p className="text-gray-600 text-sm">{imageDetails[index]?.description || 'Beautiful venue space'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">{hall.name}</h1>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-6 w-6 fill-current" />
                  <span className="ml-1 text-lg">4.8</span>
                </div>
              </div>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                {hall.address}
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                Capacity: {hall.capacity} guests
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Morning Rate:</span>
                  <span className="font-semibold">₹{hall.rateCard.morningRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Evening Rate:</span>
                  <span className="font-semibold">₹{hall.rateCard.eveningRate.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Full Day Rate:</span>
                  <span className="font-semibold">₹{hall.rateCard.fullDayRate.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features & Add-ons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {hall.features.map((feature, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>{feature.name}</span>
                      <Badge variant="secondary">+₹{feature.charge.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <HallDetailCalendar
              hallId={hall.id}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
            />

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleBookNow}
              disabled={!selectedDate}
            >
              {selectedDate ? 'Book Now' : 'Select Date to Book'}
            </Button>
          </div>
        </div>

        <HallDetailReviews hallId={hall.id} />
      </div>

      <PublicFooter />
    </div>
  );
};

export default HallDetail;
