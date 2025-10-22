import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { hallService, galleryService, authService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { Hall, HallFeature } from '@/types';
import { GalleryImage } from '@/services/mockData';

interface AddHallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHallAdded: () => void;
}

export function AddHallDialog({ open, onOpenChange, onHallAdded }: AddHallDialogProps) {
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

  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    address: '',
    morningRate: '',
    eveningRate: '',
    fullDayRate: '',
    isActive: true
  });

  const [features, setFeatures] = useState<HallFeature[]>([]);
  const [newFeature, setNewFeature] = useState({ name: '', charge: '' });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleAddFeature = () => {
    if (newFeature.name && newFeature.charge) {
      setFeatures([...features, {
        name: newFeature.name,
        charge: parseInt(newFeature.charge)
      }]);
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

    setSubmitting(true);
    try {
      await hallService.createHall({
        organizationId: currentUser.organizationId,
        name: formData.name,
        capacity: parseInt(formData.capacity),
        location: formData.location,
        address: formData.address,
        features,
        rateCard: {
          morningRate: parseInt(formData.morningRate),
          eveningRate: parseInt(formData.eveningRate),
          fullDayRate: parseInt(formData.fullDayRate)
        },
        gallery: selectedImages.length > 0 ? selectedImages : ['photo-1649972904349-6e44c42644a7'],
        isActive: formData.isActive
      });
      
      toast({
        title: 'Hall Added',
        description: 'New hall has been added successfully.',
      });

      onHallAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        capacity: '',
        location: '',
        address: '',
        morningRate: '',
        eveningRate: '',
        fullDayRate: '',
        isActive: true
      });
      setFeatures([]);
      setSelectedImages([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add hall.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (galleryLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Hall</DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (galleryError || !currentUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Hall</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Unable to load required data</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Hall</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Hall Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Full Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="morningRate">Morning Rate (₹) *</Label>
              <Input
                id="morningRate"
                type="number"
                value={formData.morningRate}
                onChange={(e) => setFormData({...formData, morningRate: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="eveningRate">Evening Rate (₹) *</Label>
              <Input
                id="eveningRate"
                type="number"
                value={formData.eveningRate}
                onChange={(e) => setFormData({...formData, eveningRate: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="fullDayRate">Full Day Rate (₹) *</Label>
              <Input
                id="fullDayRate"
                type="number"
                value={formData.fullDayRate}
                onChange={(e) => setFormData({...formData, fullDayRate: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <Label>Features & Charges</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Feature name"
                  value={newFeature.name}
                  onChange={(e) => setNewFeature({...newFeature, name: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Charge (₹)"
                  value={newFeature.charge}
                  onChange={(e) => setNewFeature({...newFeature, charge: e.target.value})}
                />
                <Button type="button" onClick={handleAddFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {feature.name} (+₹{feature.charge})
                    <Trash2 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveFeature(index)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Gallery Images</Label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
              {galleryImages?.map((image) => (
                <div
                  key={image.id}
                  className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                    selectedImages.includes(image.id) ? 'border-primary' : 'border-gray-200'
                  }`}
                  onClick={() => handleImageToggle(image.id)}
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-20 object-cover"
                  />
                  {selectedImages.includes(image.id) && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        ✓
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Hall'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
