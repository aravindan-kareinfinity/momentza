import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Star, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { hallService, galleryService } from '@/services/ServiceFactory';
import { TopNavigation } from '@/components/Layout/TopNavigation';
import { PublicFooter } from '@/components/Home/PublicFooter';
import { HallDetailCalendar } from '@/components/HallDetail/HallDetailCalendar';
import { HallDetailReviews } from '@/components/HallDetail/HallDetailReviews';
import { CheckCircle, XCircle, Utensils, Car, Home } from 'lucide-react';


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

        const hallData = await hallService.getHallById(hallId);
        console.log('Hall data:', hallData);
        console.log('Hall gallery:', hallData?.gallery);
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

  // Get image URL - using the same logic as HallPreview
  const getImageUrl = (imageIdentifier: string) => {
    if (!imageIdentifier) return '';

    // If it's already a full URL, return it
    if (imageIdentifier.startsWith('http')) {
      return imageIdentifier;
    }

    // If it's an image ID, construct URL using galleryService
    return galleryService.getImageUrl(imageIdentifier);
  };

  // Image titles and descriptions
  // const imageDetails = [
  //   { title: 'Main Hall', description: 'Spacious main hall perfect for large celebrations' },
  //   { title: 'Stage Area', description: 'Beautiful stage setup for ceremonies and performances' },
  //   { title: 'Reception Area', description: 'Welcoming reception space for guests' },
  //   { title: 'Dining Area', description: 'Elegant dining space with modern amenities' },
  //   { title: 'Exterior View', description: 'Beautiful building exterior and entrance' },
  //   { title: 'Garden View', description: 'Scenic garden area for outdoor photography' }
  // ];

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
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
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
          {/* Gallery Section - Updated with HallPreview logic */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Hall Gallery</h2>

            {hall.gallery && hall.gallery.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {hall.gallery.map((imageIdentifier: string, index: number) => {
                  const imageUrl = getImageUrl(imageIdentifier);

                  return (
                    <Card key={index} className="overflow-hidden">
                      <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${hall.name} - Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon className="h-12 w-12 mb-2" />
                            <span className="text-sm">No Image Available</span>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">
                            Gallery Image {index + 1}
                          </h4>

                          <Badge variant="secondary">
                            Photo {index + 1}
                          </Badge>
                        </div>

                        <p className="text-gray-600 text-sm mt-1">
                          Venue photo
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

            {/* Title & Location */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">{hall.name}</h1>
                <div className="flex items-center text-yellow-500">
                  <Star className="h-6 w-6 fill-current" />
                  <span className="ml-1 text-lg">4.8</span>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                {hall.address}
              </div>
            </div>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Morning Rate</span>
                  <span className="font-semibold">
                    ₹{hall.rateCard?.morningRate?.toLocaleString() || '0'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Evening Rate</span>
                  <span className="font-semibold">
                    ₹{hall.rateCard?.eveningRate?.toLocaleString() || '0'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Full Day Rate</span>
                  <span className="font-semibold">
                    ₹{hall.rateCard?.fullDayRate?.toLocaleString() || '0'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            {hall.amenities && (
              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">

                  {/* Food Type */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Food Type</span>
                    <Badge variant="secondary">Veg & Non-Veg</Badge>
                  </div>

                  {/* Capacity */}
                  <div>
                    <h4 className="font-semibold mb-3">Capacity</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <Users className="mx-auto mb-1 h-4 w-4 text-blue-600" />
                        <p className="text-gray-600">Hall</p>
                        <p className="text-xl font-bold text-blue-700">
                          {hall.amenities.capacity.hall}
                        </p>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <Utensils className="mx-auto mb-1 h-4 w-4 text-green-600" />
                        <p className="text-gray-600">Dining</p>
                        <p className="text-xl font-bold text-green-700">
                          {hall.amenities.capacity.dining}
                        </p>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                        <Car className="mx-auto mb-1 h-4 w-4 text-purple-600" />
                        <p className="text-gray-600">Parking</p>
                        <p className="text-xl font-bold text-purple-700">
                          {hall.amenities.capacity.parking}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Rooms */}
                  <div>
                    <h4 className="font-semibold mb-3">Rooms Available</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-gray-600">Free</p>
                        <p className="text-xl font-bold text-green-700">
                          {hall.amenities.rooms.free}
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-gray-600">AC</p>
                        <p className="text-xl font-bold text-blue-700">
                          {hall.amenities.rooms.rentedAc}
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <p className="text-gray-600">Non-AC</p>
                        <p className="text-xl font-bold text-yellow-700">
                          {hall.amenities.rooms.rentedNonAc}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Facilities */}
                  <div>
                    <h4 className="font-semibold mb-2">Facilities</h4>

                    <div className="space-y-2 text-sm">

                      {/* Generator */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Generator</span>

                        {hall.amenities.facilities.generator ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            <XCircle className="h-4 w-4" />
                            Not Available
                          </span>
                        )}
                      </div>

                      {/* Air Conditioning */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Air Conditioning</span>

                        {hall.amenities.facilities.airConditioning ? (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500 font-medium">
                            <XCircle className="h-4 w-4" />
                            Not Available
                          </span>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Rules */}
                  {hall.amenities.rules?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Important Rules</h4>
                      <div className="flex flex-wrap gap-2">
                        {hall.amenities.rules.map((rule: string, i: number) => (
                          <Badge key={i} variant="outline">{rule}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features & Add-ons</CardTitle>
              </CardHeader>

              <CardContent>
                {hall.features?.length ? (
                  <div className="space-y-3">
                    {hall.features.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span>{f.name}</span>
                        <Badge variant="secondary">+₹{f.charge}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No features available</p>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

        <HallDetailReviews hallId={hall.id} />
      </div>

      <PublicFooter />
    </div>
  );
};

export default HallDetail;