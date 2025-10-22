import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { carouselService, authService, galleryService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { CarouselItem } from '@/types';
import { GalleryImage } from '@/services/mockData';

const Carousel = () => {
  const { toast } = useToast();
  
  // State for data
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        if (user?.organizationId) {
          // Fetch carousel items and gallery images in parallel
          const [itemsData, imagesData] = await Promise.all([
            carouselService.getCarouselItems(user.organizationId),
            galleryService.getImagesByOrganization(user.organizationId)
          ]);
          
          setCarouselItems(Array.isArray(itemsData) ? itemsData : []);
          setGalleryImages(Array.isArray(imagesData) ? imagesData : []);
        } else {
          setCarouselItems([]);
          setGalleryImages([]);
        }
      } catch (err) {
        console.error('Failed to load carousel data:', err);
        setError('Failed to load carousel data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clonedEntity, setClonedEntity] = useState<CarouselItem | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({ 
        title: 'Error', 
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return;
    }

    if (!title.trim() || !description.trim() || !selectedImage) {
      toast({ 
        title: 'Error', 
        description: 'Title, description, and image selection are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingId && clonedEntity) {
        console.log('Updating carousel item:', editingId);
        // Merge edited fields with cloned entity
        const updatedEntity: CarouselItem = {
          ...clonedEntity,
          imageUrl: selectedImage,
          title: title.trim(),
          description: description.trim()
        };
        await carouselService.update(editingId, updatedEntity);
        toast({ title: 'Carousel item updated successfully' });
      } else {
        console.log('Creating new carousel item');
        await carouselService.create({
          organizationId: currentUser.organizationId,
          imageUrl: selectedImage,
          title: title.trim(),
          description: description.trim(),
          orderPosition: (carouselItems?.length || 0) + 1,
          isActive: true
        });
        toast({ title: 'Carousel item created successfully' });
      }
      
      resetForm();
      // Refresh data
      if (currentUser?.organizationId) {
        try {
          const updatedItems = await carouselService.getCarouselItems(currentUser.organizationId);
          setCarouselItems(updatedItems || []);
        } catch (err) {
          console.error('Failed to refresh carousel items:', err);
        }
      }
    } catch (error) {
      console.error('Error saving carousel item:', error);
      toast({ 
        title: 'Error', 
        description: editingId ? 'Failed to update carousel item' : 'Failed to create carousel item',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setTitle('');
    setDescription('');
    setSelectedImage(galleryImages.length > 0 ? galleryImages[0].id : '');
    setEditingId(null);
    setClonedEntity(null);
  };

  // Initialize selected image when form is opened
  const handleShowForm = () => {
    setShowForm(true);
    if (!selectedImage && galleryImages.length > 0) {
      setSelectedImage(galleryImages[0].id);
    }
  };

  const handleEdit = (item: CarouselItem) => {
    console.log('Editing carousel item:', item);
    // Clone the current entity and keep it in memory
    const clonedItem: CarouselItem = { ...item };
    setClonedEntity(clonedItem);
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setSelectedImage(item.imageUrl);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    console.log('Deleting carousel item:', id);
    try {
      const success = await carouselService.delete(id);
      if (success) {
        // Refresh data
        if (currentUser?.organizationId) {
          try {
            const updatedItems = await carouselService.getCarouselItems(currentUser.organizationId);
            setCarouselItems(updatedItems || []);
          } catch (err) {
            console.error('Failed to refresh carousel items:', err);
          }
        }
        toast({ title: 'Carousel item deleted successfully' });
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete carousel item',
        variant: 'destructive'
      });
    }
  };

  const handleMoveUp = async (id: string) => {
    if (!currentUser) return;
    
    console.log('Moving item up:', id);
    try {
      const success = await carouselService.moveItemUp(id, currentUser.organizationId);
      if (success) {
        // Refresh data
        if (currentUser?.organizationId) {
          try {
            const updatedItems = await carouselService.getCarouselItems(currentUser.organizationId);
            setCarouselItems(updatedItems || []);
          } catch (err) {
            console.error('Failed to refresh carousel items:', err);
          }
        }
        toast({ title: 'Position updated successfully' });
      } else {
        toast({ 
          title: 'Info', 
          description: 'Item is already at the top',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error moving item up:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update position',
        variant: 'destructive'
      });
    }
  };

  const handleMoveDown = async (id: string) => {
    if (!currentUser) return;
    
    console.log('Moving item down:', id);
    try {
      const success = await carouselService.moveItemDown(id, currentUser.organizationId);
      if (success) {
        // Refresh data
        if (currentUser?.organizationId) {
          try {
            const updatedItems = await carouselService.getCarouselItems(currentUser.organizationId);
            setCarouselItems(updatedItems || []);
          } catch (err) {
            console.error('Failed to refresh carousel items:', err);
          }
        }
        toast({ title: 'Position updated successfully' });
      } else {
        toast({ 
          title: 'Info', 
          description: 'Item is already at the bottom',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error moving item down:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update position',
        variant: 'destructive'
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (!currentUser) return;
    
    console.log('Toggling status for item:', id);
    try {
      await carouselService.toggleItemStatus(id);
      // Refresh data
      if (currentUser?.organizationId) {
        try {
          const updatedItems = await carouselService.getCarouselItems(currentUser.organizationId);
          setCarouselItems(updatedItems || []);
        } catch (err) {
          console.error('Failed to refresh carousel items:', err);
        }
      }
      toast({ title: 'Status updated successfully' });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentUser) {
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
                {error || 'Unable to load carousel data'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = Array.isArray(carouselItems) ? carouselItems : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Carousel Management</h1>
          <p className="text-gray-600">Manage your homepage carousel images and content</p>
        </div>
        <Button onClick={handleShowForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Carousel Item
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Carousel Item</CardTitle>
            <CardDescription>
              Select an image from the gallery and add title and description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Select Image</Label>
                {galleryImages.length === 0 ? (
                  <div className="mt-2 p-4 border border-gray-200 rounded-lg text-center text-gray-500">
                    No images available in gallery. Please upload some images first.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {galleryImages.map((image) => (
                      <div
                        key={image.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                          selectedImage === image.id ? 'border-primary' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedImage(image.id)}
                      >
                        <img
                          src={galleryService.getImageUrl(image.id)}
                          alt={image.title}
                          className="w-full h-24 object-cover"
                        />
                        {selectedImage === image.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Badge>Selected</Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter carousel item title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Enter carousel item description"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!selectedImage}>
                  {editingId ? 'Update' : 'Create'} Item
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="relative h-48">
              <img
                src={galleryService.getImageUrl(item.imageUrl)}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-2 right-2">
                Order : {item.orderPosition}
              </Badge>
              
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-white/80"
                  onClick={() => handleMoveUp(item.id)}
                  disabled={item.orderPosition <= 1}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 bg-white/80"
                  onClick={() => handleMoveDown(item.id)}
                  disabled={item.orderPosition >= items.length}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-between items-center">
                <Badge variant={item.isActive ? 'default' : 'secondary'}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(item.id)}
                  >
                    {item.isActive ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No carousel items</h3>
              <p>Create your first carousel item to get started.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Carousel;
