import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Hall, HallFeature } from '@/types';
import { hallService, galleryService, authService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GalleryImage } from '@/services/mockData';

interface EditHallDialogProps {
  hall: Hall;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHallUpdated: () => void;
}

export function EditHallDialog({ hall, open, onOpenChange, onHallUpdated }: EditHallDialogProps) {
  const [name, setName] = useState(hall.name);
  const [capacity, setCapacity] = useState(hall.capacity.toString());
  const [location, setLocation] = useState(hall.location);
  const [address, setAddress] = useState(hall.address);
  const [features, setFeatures] = useState<HallFeature[]>(hall.features || []);
  const [morningRate, setMorningRate] = useState(hall.rateCard.morningRate.toString());
  const [eveningRate, setEveningRate] = useState(hall.rateCard.eveningRate.toString());
  const [fullDayRate, setFullDayRate] = useState(hall.rateCard.fullDayRate.toString());
  const [selectedImages, setSelectedImages] = useState<string[]>(hall.gallery || []);
  const [isActive, setIsActive] = useState(hall.isActive);
  const [loading, setLoading] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: '', charge: '' });
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const fetchGalleryImages = useCallback(async () => {
    if (!currentUser?.organizationId) return;
    
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
  }, [currentUser?.organizationId]);

  useEffect(() => {
    if (currentUser && open) {
      fetchGalleryImages();
    }
  }, [currentUser, open, fetchGalleryImages]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      
      onHallUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update hall',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Hall</DialogTitle>
          <DialogDescription>
            Update the hall information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
          
          <div className="space-y-4">
            <Label>Features & Additional Charges</Label>
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
          </div>
          
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

          <div className="space-y-4">
            <Label>Gallery Images</Label>
            {galleryLoading ? (
              <div className="text-center py-4">Loading gallery images...</div>
            ) : galleryError ? (
              <div className="text-center py-4 text-red-500">Error loading gallery images</div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                      selectedImages.includes(image.url) ? 'border-primary' : 'border-gray-200'
                    }`}
                    onClick={() => handleImageToggle(image.url)}
                  >
                    <img
                      src={`${image.url}?auto=format&fit=crop&w=200&q=80`}
                      alt={image.title}
                      className="w-full h-24 object-cover"
                    />
                    {selectedImages.includes(image.url) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Badge>Selected</Badge>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                      {image.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Hall'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
