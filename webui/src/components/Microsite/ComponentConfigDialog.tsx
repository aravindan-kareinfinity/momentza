import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { galleryService, authService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { GalleryImage } from '@/services/mockData';

interface ComponentConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  componentType: string;
  currentConfig?: any;
  onSave: (config: any) => void;
}

export const ComponentConfigDialog = ({ 
  open, 
  onOpenChange, 
  componentType, 
  currentConfig, 
  onSave 
}: ComponentConfigDialogProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const { toast } = useToast();
  
  const [config, setConfig] = useState(currentConfig || {});
  const [uploadingImage, setUploadingImage] = useState(false);

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
        setGalleryImages([]);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Handle backward compatibility for existing imageUrl configs
  useEffect(() => {
    if (config.imageUrl && !config.imageId && galleryImages.length > 0) {
      // Try to find the image by URL to get the ID
      const image = galleryImages.find(img => img.url === config.imageUrl);
      if (image) {
        setConfig(prev => ({ ...prev, imageId: image.id }));
      }
    }
  }, [config.imageUrl, config.imageId, galleryImages]);

  // Reset config when dialog opens or component type changes
  useEffect(() => {
    if (open) {
      if (currentConfig) {
        setConfig(currentConfig);
      } else {
        // Set default values for new components
        const defaultConfig: any = {};
        
        switch (componentType) {
          case 'carousel':
            defaultConfig.slotTime = 5;
            break;
          case 'halls':
            defaultConfig.itemsPerPage = 6;
            defaultConfig.showFilters = true;
            break;
          case 'reviews':
            defaultConfig.maxReviews = 5;
            defaultConfig.showRating = true;
            break;
          case 'text':
            defaultConfig.title = '';
            defaultConfig.description = '';
            defaultConfig.alignment = 'left';
            defaultConfig.width = 'full';
            break;
          case 'image':
            defaultConfig.width = 'full';
            defaultConfig.height = 300;
            defaultConfig.position = 'center';
            break;
        }
        
        setConfig(defaultConfig);
      }
    }
  }, [open, currentConfig, componentType]);

  const handleImageUpload = async (file: File) => {
    if (!currentUser) return;

    setUploadingImage(true);
    try {
      const uploadedImage = await galleryService.uploadImage(
        file,
        currentUser.organizationId,
        `Microsite Image - ${Date.now()}`,
        'Microsite'
      );
      
      setConfig(prev => ({ ...prev, imageId: uploadedImage.id, imageUrl: uploadedImage.url }));
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const renderCarouselConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="slotTime">Slot Time (seconds)</Label>
        <Input
          id="slotTime"
          type="number"
          value={config.slotTime || 5}
          onChange={(e) => setConfig(prev => ({ ...prev, slotTime: parseInt(e.target.value) }))}
        />
      </div>
    </div>
  );

  const renderHallsConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width">Width</Label>
          <Select 
            value={config.width || 'full'} 
            onValueChange={(value) => setConfig(prev => ({ ...prev, width: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1/4">1/4 Width</SelectItem>
              <SelectItem value="1/3">1/3 Width</SelectItem>
              <SelectItem value="1/2">1/2 Width</SelectItem>
              <SelectItem value="full">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="height">Height (px)</Label>
          <Input
            id="height"
            type="number"
            value={config.height || 400}
            onChange={(e) => setConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
          />
        </div>
      </div>
    </div>
  );

  const renderReviewsConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="maxCount">Maximum Review Count</Label>
        <Input
          id="maxCount"
          type="number"
          value={config.maxCount || 6}
          onChange={(e) => setConfig(prev => ({ ...prev, maxCount: parseInt(e.target.value) }))}
        />
      </div>
    </div>
  );

  const renderImageConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={config.title || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={config.description || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <Label>Select Image from Gallery or Upload New</Label>
        <div className="grid grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                config.imageId === image.id ? 'border-primary' : 'border-gray-200'
              }`}
              onClick={() => setConfig(prev => ({ ...prev, imageId: image.id, imageUrl: galleryService.getImageUrl(image.id) }))}
            >
              <img
                src={galleryService.getImageUrl(image.id)}
                alt={image.title}
                className="w-full h-16 object-cover"
              />
              {config.imageId === image.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Badge className="text-xs">Selected</Badge>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2">
          <Label htmlFor="imageUpload">Or Upload New Image</Label>
          <Input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploadingImage}
          />
          {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="imagePosition">Image Position</Label>
        <Select 
          value={config.imagePosition || 'center'} 
          onValueChange={(value) => setConfig(prev => ({ ...prev, imagePosition: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="imageWidth">Width</Label>
          <Select 
            value={config.width || 'full'} 
            onValueChange={(value) => setConfig(prev => ({ ...prev, width: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1/4">1/4 Width</SelectItem>
              <SelectItem value="1/3">1/3 Width</SelectItem>
              <SelectItem value="1/2">1/2 Width</SelectItem>
              <SelectItem value="full">Full Width</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="imageHeight">Height (px)</Label>
          <Input
            id="imageHeight"
            type="number"
            value={config.height || 300}
            onChange={(e) => setConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
          />
        </div>
      </div>
    </div>
  );

  const renderTextConfig = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="textTitle">Title</Label>
          <Input
            id="textTitle"
            value={config.title || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="textAlignment">Text Alignment</Label>
          <Select 
            value={config.alignment || 'left'} 
            onValueChange={(value) => setConfig(prev => ({ ...prev, alignment: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="textDescription">Description</Label>
        <Textarea
          id="textDescription"
          value={config.description || ''}
          onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
        />
      </div>

      <div>
        <Label>Image from Gallery (Optional)</Label>
        <div className="grid grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto">
          <div
            className={`relative cursor-pointer rounded-lg border-2 ${
              !config.imageId ? 'border-primary bg-gray-100' : 'border-gray-200'
            } flex items-center justify-center h-16`}
            onClick={() => setConfig(prev => ({ ...prev, imageId: null, imageUrl: null }))}
          >
            <span className="text-xs text-gray-500">No Image</span>
            {!config.imageId && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Badge className="text-xs">Selected</Badge>
              </div>
            )}
          </div>
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                config.imageId === image.id ? 'border-primary' : 'border-gray-200'
              }`}
              onClick={() => setConfig(prev => ({ ...prev, imageId: image.id, imageUrl: galleryService.getImageUrl(image.id) }))}
            >
              <img
                src={galleryService.getImageUrl(image.id)}
                alt={image.title}
                className="w-full h-16 object-cover"
              />
              {config.imageId === image.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Badge className="text-xs">Selected</Badge>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2">
          <Label htmlFor="textImageUpload">Or Upload New Image</Label>
          <Input
            id="textImageUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploadingImage}
          />
          {uploadingImage && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="textWidth">Block Width</Label>
        <Select 
          value={config.width || 'full'} 
          onValueChange={(value) => setConfig(prev => ({ ...prev, width: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1/4">1/4 Width</SelectItem>
            <SelectItem value="1/3">1/3 Width</SelectItem>
            <SelectItem value="1/2">1/2 Width</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderConfigContent = () => {
    switch (componentType) {
      case 'carousel':
        return renderCarouselConfig();
      case 'halls':
        return renderHallsConfig();
      case 'reviews':
        return renderReviewsConfig();
      case 'image':
        return renderImageConfig();
      case 'text':
        return renderTextConfig();
      default:
        return <p>No configuration available for this component type.</p>;
    }
  };

  const getTitle = () => {
    const titles = {
      carousel: 'Carousel Settings',
      halls: 'Halls Grid Settings',
      reviews: 'Reviews Settings',
      image: 'Image Block Settings',
      text: 'Text Block Settings',
      search: 'Search Settings'
    };
    return titles[componentType as keyof typeof titles] || 'Component Settings';
  };

  const handleSaveConfig = () => {
    // Validate and format the configuration
    const formattedConfig = { ...config };
    

    
    // Ensure required fields are present based on component type
    switch (componentType) {
      case 'carousel':
        if (!formattedConfig.slotTime || formattedConfig.slotTime < 1) {
          formattedConfig.slotTime = 5; // Default value
        }
        break;
      case 'halls':
        if (!formattedConfig.itemsPerPage || formattedConfig.itemsPerPage < 1) {
          formattedConfig.itemsPerPage = 6; // Default value
        }
        if (!formattedConfig.showFilters) {
          formattedConfig.showFilters = true; // Default value
        }
        break;
      case 'reviews':
        if (!formattedConfig.maxReviews || formattedConfig.maxReviews < 1) {
          formattedConfig.maxReviews = 5; // Default value
        }
        if (!formattedConfig.showRating) {
          formattedConfig.showRating = true; // Default value
        }
        break;
      case 'image':
        if (!formattedConfig.imageId && !formattedConfig.imageUrl) {
          toast({
            title: 'Warning',
            description: 'Please select an image or upload a new one',
            variant: 'destructive',
          });
          return;
        }
        break;
      case 'text':
        if (!formattedConfig.title || !formattedConfig.description) {
          toast({
            title: 'Warning',
            description: 'Please provide both title and description for the text block',
            variant: 'destructive',
          });
          return;
        }
        break;
    }

    // Call the parent's onSave function with the formatted config
    onSave(formattedConfig);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {renderConfigContent()}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveConfig()}>
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
