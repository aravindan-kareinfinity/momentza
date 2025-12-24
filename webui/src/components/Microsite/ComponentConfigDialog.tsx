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
  
  const [config, setConfig] = useState<any>(currentConfig || {});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  // Initialize config when component type changes or dialog opens
  useEffect(() => {
    if (open) {
      const defaultConfigs: Record<string, any> = {
        carousel: {
          slotTime: 5,
          textPosition: 'center',
          width: 'full'
        },
        halls: {
          itemsPerPage: 6,
          showFilters: true,
          width: 'full',
          height: 400
        },
        reviews: {
          maxReviews: 5,
          showRating: true,
          width: 'full'
        },
        text: {
          title: '',
          description: '',
          alignment: 'left',
          width: 'full'
        },
        image: {
          title: '',
          description: '',
          width: 'full',
          height: 300,
          images: [], // Changed to array for multiple images
          imageIds: [],
          textPosition: 'center'
        }
      };

      if (currentConfig) {
        setConfig(currentConfig);
      } else {
        setConfig(defaultConfigs[componentType] || {});
      }
    }
  }, [open, currentConfig, componentType]);

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

  // Initialize selectedImageIds from config when it changes
  useEffect(() => {
    if (config.imageIds && Array.isArray(config.imageIds)) {
      setSelectedImageIds(config.imageIds);
    } else if (config.imageId) {
      setSelectedImageIds([config.imageId]);
    } else {
      setSelectedImageIds([]);
    }
  }, [config.imageId, config.imageIds]);

  // Handle backward compatibility for existing imageUrl configs
  useEffect(() => {
    if (config.imageUrl && !config.imageId && galleryImages.length > 0) {
      const image = galleryImages.find(img => img.url === config.imageUrl);
      if (image) {
        setConfig(prev => ({ 
          ...prev, 
          imageId: image.id,
          imageIds: [image.id],
          images: [image]
        }));
      }
    }
  }, [config.imageUrl, config.imageId, galleryImages]);

  const handleImageUpload = async (file: File) => {
    if (!currentUser || !currentUser.organizationId) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImage(true);
    try {
      const uploadedImage = await galleryService.uploadImage(
        file,
        currentUser.organizationId,
        `Microsite Image - ${Date.now()}`,
        'Microsite'
      );
      
      // Add the new image to galleryImages and select it
      setGalleryImages(prev => [...prev, uploadedImage]);
      setSelectedImageIds(prev => [...prev, uploadedImage.id]);
      setConfig(prev => ({ 
        ...prev, 
        imageId: uploadedImage.id,
        imageIds: [...prev.imageIds || [], uploadedImage.id],
        images: [...prev.images || [], uploadedImage],
        imageUrl: uploadedImage.url
      }));
      
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
      console.error('Image upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageSelection = (imageId: string) => {
    const isSelected = selectedImageIds.includes(imageId);
    let newSelectedIds: string[];
    
    if (isSelected) {
      // Remove image
      newSelectedIds = selectedImageIds.filter(id => id !== imageId);
    } else {
      // Add image
      newSelectedIds = [...selectedImageIds, imageId];
    }

    setSelectedImageIds(newSelectedIds);

    // Get the actual image objects
    const selectedImages = galleryImages.filter(img => newSelectedIds.includes(img.id));
    const imageUrls = newSelectedIds.map(id => galleryService.getImageUrl(id));

    setConfig(prev => ({
      ...prev,
      imageIds: newSelectedIds,
      images: selectedImages,
      imageUrls: imageUrls,
      // For single image compatibility
      imageId: newSelectedIds.length === 1 ? newSelectedIds[0] : undefined,
      imageUrl: imageUrls.length === 1 ? imageUrls[0] : undefined
    }));
  };

  const renderCarouselConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="slotTime">Slot Time (seconds)</Label>
        <Input
          id="slotTime"
          type="number"
          min="1"
          value={config.slotTime || 5}
          onChange={(e) => setConfig(prev => ({ 
            ...prev, 
            slotTime: Math.max(1, parseInt(e.target.value) || 5) 
          }))}
        />
      </div>
      <div>
        <Label htmlFor="textPosition">Text Position</Label>
        <Select
          value={config.textPosition || 'center'}
          onValueChange={(value) => setConfig(prev => ({ ...prev, textPosition: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
            min="100"
            value={config.height || 400}
            onChange={(e) => setConfig(prev => ({ 
              ...prev, 
              height: Math.max(100, parseInt(e.target.value) || 400) 
            }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="itemsPerPage">Items Per Page</Label>
        <Input
          id="itemsPerPage"
          type="number"
          min="1"
          max="24"
          value={config.itemsPerPage || 6}
          onChange={(e) => setConfig(prev => ({ 
            ...prev, 
            itemsPerPage: Math.max(1, Math.min(24, parseInt(e.target.value) || 6)) 
          }))}
        />
      </div>
    </div>
  );

  const renderReviewsConfig = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="maxReviews">Maximum Reviews to Show</Label>
        <Input
          id="maxReviews"
          type="number"
          min="1"
          max="50"
          value={config.maxReviews || 5}
          onChange={(e) => setConfig(prev => ({ 
            ...prev, 
            maxReviews: Math.max(1, Math.min(50, parseInt(e.target.value) || 5)) 
          }))}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showRating"
          checked={config.showRating !== false}
          onChange={(e) => setConfig(prev => ({ ...prev, showRating: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="showRating">Show Star Ratings</Label>
      </div>
    </div>
  );

  const renderImageConfig = () => {
    return (
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
            rows={3}
          />
        </div>

        <div>
          <Label>Text Position Over Image</Label>
          <Select
            value={config.textPosition || 'center'}
            onValueChange={(value) => setConfig(prev => ({ ...prev, textPosition: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Select Images from Gallery</Label>
            <div className="text-sm text-gray-500">
              {selectedImageIds.length} image(s) selected
            </div>
          </div>
          <div className="border rounded-md p-2">
            {uploadingImage ? (
              <div className="text-center py-4">
                <p>Uploading image...</p>
              </div>
            ) : (
              <>
                {/* <div className="mb-2">
                  <Label htmlFor="uploadImage" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors">
                      <p className="text-sm">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-500 mt-1">Upload new image to gallery</p>
                    </div>
                    <input
                      id="uploadImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </Label>
                </div> */}
                
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {galleryImages.length === 0 ? (
                    <div className="col-span-3 text-center py-4 text-gray-500">
                      No images in gallery. Upload one above.
                    </div>
                  ) : (
                    galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                          selectedImageIds.includes(image.id) 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleImageSelection(image.id)}
                      >
                        <img
                          src={galleryService.getImageUrl(image.id)}
                          alt={image.title || 'Gallery image'}
                          className="w-full h-20 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                          }}
                        />
                        {selectedImageIds.includes(image.id) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Badge className="text-xs bg-primary">Selected</Badge>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {image.title || 'Untitled'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
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
              min="100"
              value={config.height || 300}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                height: Math.max(100, parseInt(e.target.value) || 300) 
              }))}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTextConfig = () => {
    const selectedImageId = config.imageId || '';

    return (
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
          <Label>Optional Image</Label>
          <div className="grid grid-cols-4 gap-2 mt-2 max-h-60 overflow-y-auto">
            <div
              className={`relative cursor-pointer rounded-lg border-2 ${
                !selectedImageId ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-gray-300'
              } flex items-center justify-center h-16`}
              onClick={() => setConfig(prev => ({ 
                ...prev, 
                imageId: null, 
                imageUrl: null,
                image: null 
              }))}
            >
              <span className={`text-xs ${!selectedImageId ? 'text-primary font-medium' : 'text-gray-500'}`}>
                No Image
              </span>
              {!selectedImageId && (
                <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg" />
              )}
            </div>
            {galleryImages.map((image) => (
              <div
                key={image.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                  selectedImageId === image.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ 
                  ...prev, 
                  imageId: image.id, 
                  imageUrl: galleryService.getImageUrl(image.id),
                  image: image 
                }))}
              >
                <img
                  src={galleryService.getImageUrl(image.id)}
                  alt={image.title}
                  className="w-full h-16 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                  }}
                />
                {selectedImageId === image.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Badge className="text-xs bg-primary">Selected</Badge>
                  </div>
                )}
              </div>
            ))}
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
  };

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
        return <p className="text-center py-4">No configuration available for this component type.</p>;
    }
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      carousel: 'Carousel Settings',
      halls: 'Halls Grid Settings',
      reviews: 'Reviews Settings',
      image: 'Image Block Settings',
      text: 'Text Block Settings',
      search: 'Search Settings'
    };
    return titles[componentType] || 'Component Settings';
  };

  const handleSaveConfig = () => {
    // Validate configuration
    const formattedConfig = { ...config };

    // Ensure proper data types
    if (formattedConfig.height !== undefined) {
      formattedConfig.height = parseInt(formattedConfig.height) || 300;
    }
    if (formattedConfig.slotTime !== undefined) {
      formattedConfig.slotTime = parseInt(formattedConfig.slotTime) || 5;
    }
    if (formattedConfig.maxReviews !== undefined) {
      formattedConfig.maxReviews = parseInt(formattedConfig.maxReviews) || 5;
    }
    if (formattedConfig.itemsPerPage !== undefined) {
      formattedConfig.itemsPerPage = parseInt(formattedConfig.itemsPerPage) || 6;
    }

    // Component-specific validation
    switch (componentType) {
      case 'image':
        if (!formattedConfig.images || formattedConfig.images.length === 0) {
          toast({
            title: 'Warning',
            description: 'Please select at least one image',
            variant: 'destructive',
          });
          return;
        }
        break;
      case 'text':
        if (!formattedConfig.title?.trim() || !formattedConfig.description?.trim()) {
          toast({
            title: 'Warning',
            description: 'Please provide both title and description for the text block',
            variant: 'destructive',
          });
          return;
        }
        break;
    }

    onSave(formattedConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {renderConfigContent()}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveConfig}
              type="button"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};