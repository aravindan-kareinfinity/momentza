import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { hallService, galleryService, authService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { HallFeature, Hall } from '@/types';
import { GalleryImage } from '@/services/mockData';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const HallEdit = () => {
  const { hallId } = useParams<{ hallId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [hall, setHall] = useState<Hall | null>(null);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [features, setFeatures] = useState<HallFeature[]>([]);
  const [morningRate, setMorningRate] = useState('');
  const [eveningRate, setEveningRate] = useState('');
  const [fullDayRate, setFullDayRate] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: '', charge: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Fetch user and gallery data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        if (user?.organizationId) {
          setGalleryLoading(true);
          setGalleryError(null);
          const images = await galleryService.getImagesByOrganization(user.organizationId);
          setGalleryImages(Array.isArray(images) ? images : []);
        }
      } catch (error) {
        console.error('Failed to fetch user or gallery data:', error);
        setGalleryError('Failed to load gallery images');
        setGalleryImages([]);
      } finally {
        setGalleryLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchHall = useCallback(async () => {
    if (!hallId) return;
    
    try {
      const hallData = await hallService.getHallById(hallId);
      if (hallData) {
        setHall(hallData);
        setName(hallData.name || '');
        setCapacity(hallData.capacity ? hallData.capacity.toString() : '');
        setLocation(hallData.location || '');
        setAddress(hallData.address || '');
        setFeatures(hallData.features || []);
        setMorningRate(hallData.rateCard?.morningRate ? hallData.rateCard.morningRate.toString() : '');
        setEveningRate(hallData.rateCard?.eveningRate ? hallData.rateCard.eveningRate.toString() : '');
        setFullDayRate(hallData.rateCard?.fullDayRate ? hallData.rateCard.fullDayRate.toString() : '');
        setSelectedImages(hallData.gallery || []);
        setIsActive(hallData.isActive || false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load hall data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [hallId, toast]);

  const fetchGalleryImages = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setGalleryLoading(true);
      setGalleryError(null);
      const images = await galleryService.getImagesByOrganization(currentUser.organizationId);
      setGalleryImages(Array.isArray(images) ? images : []);
    } catch (error) {
      console.error('Failed to load gallery images:', error);
      setGalleryError('Failed to load gallery images');
      setGalleryImages([]);
    } finally {
      setGalleryLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchHall();
    fetchGalleryImages();
  }, [fetchHall, fetchGalleryImages]);

  if (loading) {
    return <AnimatedPage className="space-y-6">Loading...</AnimatedPage>;
  }

  if (!hall) {
    return <AnimatedPage className="space-y-6">Hall not found</AnimatedPage>;
  }

  const handleAddFeature = () => {
    if (newFeature.name && newFeature.charge) {
      setFeatures([...features, { name: newFeature.name, charge: parseInt(newFeature.charge) }]);
      setNewFeature({ name: '', charge: '' });
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleImageToggle = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl) 
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const getImageIdentifier = (image: any) => {
    return image.url || image.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const updatedHall = {
        ...hall,
        name,
        capacity: parseInt(capacity),
        location,
        address,
        features,
        rateCard: {
          morningRate: parseInt(morningRate),
          eveningRate: parseInt(eveningRate),
          fullDayRate: parseInt(fullDayRate),
        },
        gallery: selectedImages,
        isActive,
      };

      hallService.updateHall(hall.id, updatedHall);
      
      toast({
        title: 'Success',
        description: 'Hall updated successfully!',
      });
      
      navigate('/admin/halls');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update hall',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/halls')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Halls
        </Button>
        <h1 className="text-2xl font-bold">Edit Hall</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hall Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features & Additional Charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Feature name"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
              />
              <Input
                placeholder="Additional charge (₹)"
                type="number"
                value={newFeature.charge}
                onChange={(e) => setNewFeature({ ...newFeature, charge: e.target.value })}
              />
              <Button type="button" onClick={handleAddFeature}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{feature.name} - ₹{feature.charge}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="morningRate">Morning Rate (₹)</Label>
                <Input
                  id="morningRate"
                  type="number"
                  value={morningRate}
                  onChange={(e) => setMorningRate(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eveningRate">Evening Rate (₹)</Label>
                <Input
                  id="eveningRate"
                  type="number"
                  value={eveningRate}
                  onChange={(e) => setEveningRate(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullDayRate">Full Day Rate (₹)</Label>
                <Input
                  id="fullDayRate"
                  type="number"
                  value={fullDayRate}
                  onChange={(e) => setFullDayRate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gallery Images</CardTitle>
          </CardHeader>
          <CardContent>
            {galleryLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading gallery images...</p>
              </div>
            ) : galleryError ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-600 mb-4">{galleryError}</p>
                <Button 
                  variant="outline" 
                  onClick={() => fetchGalleryImages()}
                  className="text-sm"
                >
                  Try Again
                </Button>
              </div>
            ) : galleryImages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">No gallery images available</p>
                <p className="text-sm text-gray-500">Upload images in the Gallery section to use them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImages.includes(getImageIdentifier(image)) 
                        ? 'border-green-500 bg-green-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleImageToggle(getImageIdentifier(image))}
                  >
                    <img
                      src={image.url ? `${image.url}?auto=format&fit=crop&w=200&q=80` : galleryService.getImageUrl(image.id)}
                      alt={image.title}
                      className={`w-full h-24 object-cover transition-all duration-200 ${
                        selectedImages.includes(getImageIdentifier(image)) 
                          ? 'brightness-110 saturate-110' 
                          : ''
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    {selectedImages.includes(getImageIdentifier(image)) && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <Badge className="bg-green-500 text-white border-green-600">
                          ✓ Selected
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                      {image.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/halls')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Hall'}
          </Button>
        </div>
      </form>
    </AnimatedPage>
  );
};

export default HallEdit;
