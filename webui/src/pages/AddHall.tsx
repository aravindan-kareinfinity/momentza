import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { HallFeature } from '@/types';

const AddHall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
  const [newFeature, setNewFeature] = useState({ name: '', charge: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  // Fetch user and gallery data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        if (user?.organizationId) {
          const images = await galleryService.getImagesByOrganization(user.organizationId);
          setGalleryImages(Array.isArray(images) ? images : []);
        }
      } catch (error) {
        console.error('Failed to fetch user or gallery data:', error);
      }
    };
    fetchData();
  }, []);

  // Prefetch gallery images with auth headers and cache blob URLs
  useEffect(() => {
    let isCancelled = false;
    const abortControllers: Record<string, AbortController> = {};

    const getAuthToken = () => {
      try {
        const user = localStorage.getItem('currentUser');
        if (user) {
          const data = JSON.parse(user);
          return data.token || '';
        }
      } catch {}
      return '';
    };

    const getOrganizationId = () => {
      try {
        const storedOrgId = localStorage.getItem('currentOrganizationId') || localStorage.getItem('selectedOrganizationId');
        if (storedOrgId) return storedOrgId;
        const user = localStorage.getItem('currentUser');
        if (user) {
          const data = JSON.parse(user);
          return data.organizationId || '';
        }
      } catch {}
      return '';
    };

    const fetchImage = async (id: string) => {
      if (isCancelled || imageUrls[id]) return;
      const controller = new AbortController();
      abortControllers[id] = controller;
      try {
        const url = galleryService.getImageUrl(id);
        if (!url) return;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'X-Organization-Id': getOrganizationId()
          },
          signal: controller.signal
        });
        if (!res.ok) return;
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        if (!isCancelled) {
          setImageUrls(prev => ({ ...prev, [id]: objectUrl }));
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        // ignore
      } finally {
        delete abortControllers[id];
      }
    };

    const ids = (Array.isArray(galleryImages) ? galleryImages : []).map(img => img.id);
    ids.forEach(id => fetchImage(id));

    return () => {
      isCancelled = true;
      Object.values(abortControllers).forEach(c => c.abort());
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [galleryImages]);

  const handleAddFeature = () => {
    if (newFeature.name && newFeature.charge) {
      setFeatures([...features, { name: newFeature.name, charge: parseInt(newFeature.charge) }]);
      setNewFeature({ name: '', charge: '' });
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleImageToggle = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setLoading(true);

    try {
      const newHall = {
        organizationId: currentUser.organizationId,
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

      await hallService.createHall(newHall);
      
      toast({
        title: 'Success',
        description: 'Hall created successfully!',
      });
      
      navigate('/admin/halls');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create hall',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Add New Hall</h1>
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
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.length > 0 ? (
                galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                      selectedImages.includes(image.id) ? 'border-primary' : 'border-gray-200'
                    }`}
                    onClick={() => handleImageToggle(image.id)}
                  >
                    <img
                      src={imageUrls[image.id] || galleryService.getImageUrl(image.id)}
                      alt={image.title}
                      className="w-full h-24 object-cover"
                    />
                    {selectedImages.includes(image.id) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Badge>Selected</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                      {image.title}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  No gallery images available. Please upload some images first.
                </div>
              )}
            </div>
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
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Hall'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddHall;
