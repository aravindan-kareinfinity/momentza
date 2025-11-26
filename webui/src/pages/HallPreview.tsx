import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Star, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { hallService, galleryService } from '@/services/ServiceFactory';

const HallPreview = () => {
  const { hallId } = useParams();
  const navigate = useNavigate();

  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch hall data
  useEffect(() => {
    const fetchData = async () => {
      if (!hallId) return;

      try {
        setLoading(true);
        const hallData = await hallService.getHallById(hallId);
        console.log('Hall data:', hallData);
        console.log('Hall gallery:', hallData?.gallery);
        setHall(hallData);
      } catch (err) {
        setError('Failed to load hall data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hallId]);

  // Get image URL - same logic as HallEdit
  const getImageUrl = (imageIdentifier: string) => {
    if (!imageIdentifier) return '';
    
    // If it's already a full URL, return it
    if (imageIdentifier.startsWith('http')) {
      return imageIdentifier;
    }
    
    // If it's an image ID, construct URL like HallEdit does
    return galleryService.getImageUrl(imageIdentifier);
  };

  // Simple image titles
  const imageTitles = ['Main Hall', 'Dining Area', 'Stage', 'Garden', 'Reception', 'Exterior'];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !hall) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || 'Hall not found'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/halls')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Halls
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate('/admin/halls')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Halls
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gallery Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Hall Gallery</h2>
          
          {hall.gallery && hall.gallery.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {hall.gallery.map((imageIdentifier: string, index: number) => {
                const imageUrl = getImageUrl(imageIdentifier);
                console.log(`Image ${index}:`, imageIdentifier, 'URL:', imageUrl);
                
                return (
                  <Card key={index} className="overflow-hidden">
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${hall.name} - ${imageTitles[index] || `Image ${index + 1}`}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, show placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback when no image or image fails to load */}
                      {!imageUrl && (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <span className="text-sm">No Image</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {imageTitles[index] || `Image ${index + 1}`}
                        </h4>
                        <Badge variant="secondary">
                          {imageTitles[index] ? imageTitles[index].split(' ')[0] : 'General'}
                        </Badge>
                      </div>
                      {/* Debug info */}
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        ID: {imageIdentifier}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images available for this hall</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Hall Details Section */}
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
                <span className="font-semibold">₹{hall.rateCard?.morningRate?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Evening Rate:</span>
                <span className="font-semibold">₹{hall.rateCard?.eveningRate?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Full Day Rate:</span>
                <span className="font-semibold">₹{hall.rateCard?.fullDayRate?.toLocaleString() || '0'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              {hall.features && hall.features.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {hall.features.map((feature: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span>{feature.name}</span>
                      <Badge variant="secondary">
                        +₹{feature.charge?.toLocaleString() || '0'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No features</p>
              )}
            </CardContent>
          </Card>

          <Badge className={hall.isActive ? 'bg-green-500' : 'bg-red-500'}>
            {hall.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default HallPreview;