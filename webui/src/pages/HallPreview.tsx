import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Star, ArrowLeft } from 'lucide-react';
import { hallService, galleryService } from '@/services/ServiceFactory';

const HallPreview = () => {
  const { hallId } = useParams();
  const navigate = useNavigate();

  // State for data
  const [hall, setHall] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!hallId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [hallData, galleryData] = await Promise.all([
          hallService.getHallById(hallId),
          galleryService.getImagesByOrganization('1')
        ]);
        
        setHall(hallData);
        setGalleryImages(galleryData || []);
      } catch (err) {
        console.error('Failed to load hall preview data:', err);
        setError('Failed to load hall preview data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hallId]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !hall) {
    return (
      <div className="space-y-6">
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
    );
  }

  // Mock image details with titles and categories for hall gallery
  const imageDetails = [
    { title: 'Main Hall Interior', category: 'Interior' },
    { title: 'Elegant Dining Area', category: 'Dining Area' },
    { title: 'Wedding Stage Setup', category: 'Stage' },
    { title: 'Garden Outdoor Area', category: 'Garden' },
    { title: 'Reception Decoration', category: 'Decoration' },
    { title: 'Exterior View', category: 'Exterior' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/halls')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Halls
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Hall Gallery</h2>
          <div className="grid grid-cols-1 gap-4">
            {hall.gallery.map((image, index) => (
              <Card key={index} className="overflow-hidden">
                <img
                  src={`https://images.unsplash.com/${image}?auto=format&fit=crop&w=400&q=80`}
                  alt={imageDetails[index]?.title || `${hall.name} - Image ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{imageDetails[index]?.title || `Gallery Image ${index + 1}`}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {imageDetails[index]?.category || 'General'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
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

          <div className="flex items-center space-x-2">
            <Badge className={hall.isActive ? 'bg-green-500' : 'bg-red-500'}>
              {hall.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallPreview;