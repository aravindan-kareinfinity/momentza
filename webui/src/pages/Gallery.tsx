import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, Edit, Trash2 } from 'lucide-react';
import { galleryService, settingsService, authService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { GalleryImage } from '@/services/mockData';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const Gallery = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImage, setNewImage] = useState({
    title: '',
    category: '',
    file: null as File | null
  });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const hasFetchedRef = useRef(false);

  // Fetch user data first
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

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const [imagesData, categoriesData] = await Promise.all([
        galleryService.getImagesByOrganization(currentUser.organizationId),
        settingsService.getImageCategories()
      ]);
      
      setImages(Array.isArray(imagesData) ? imagesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gallery data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organizationId, toast]);

  useEffect(() => {
    if (currentUser && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  if (loading) {
    return (
      <AnimatedPage className="space-y-6">
        <div>Loading...</div>
      </AnimatedPage>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage({ ...newImage, file });
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
    }
  };

  const handleAddImage = async () => {
    if (!currentUser || !newImage.file || !newImage.title || !newImage.category) {
      toast({
        title: 'Error',
        description: 'Please fill all fields and select an image',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const uploadedImage = await galleryService.uploadImage(
        newImage.file,
        currentUser.organizationId,
        newImage.title,
        newImage.category
      );
      
      setImages(prev => [...prev, uploadedImage]);
      setNewImage({ title: '', category: '', file: null });
      setShowDialog(false);
      
      // Clean up preview URL
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      }
      
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
      setUploading(false);
    }
  };

  const handleEditImage = (image: any) => {
    setEditingImage({
      ...image,
      title: image.title,
      category: image.category
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingImage.title || !editingImage.category) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    const safeImages = Array.isArray(images) ? images : [];
    setImages(safeImages.map(img => 
      img.id === editingImage.id 
        ? { ...img, title: editingImage.title, category: editingImage.category }
        : img
    ));
    
    setShowEditDialog(false);
    setEditingImage(null);
    
    toast({
      title: 'Success',
      description: 'Image updated successfully',
    });
  };

  const handleDeleteImage = (id: string) => {
    try {
      galleryService.deleteImage(id);
      const safeImages = Array.isArray(images) ? images : [];
      setImages(safeImages.filter(img => img.id !== id));
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };

  // Ensure arrays are always arrays
  const safeImages = Array.isArray(images) ? images : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gallery Management</h1>
          <p className="text-gray-600">Manage your hall images and gallery</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) {
          // Reset form when dialog closes
          setNewImage({ title: '', category: '', file: null });
          if (filePreview) {
            URL.revokeObjectURL(filePreview);
            setFilePreview(null);
          }
        }
      }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Upload New Image</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newImage.title}
                    onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newImage.category} onValueChange={(value) => setNewImage({ ...newImage, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file">Select Image</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                <Button onClick={handleAddImage} className="w-full" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>

              {/* Right side - Preview */}
              <div className="space-y-4">
                <Label>Image Preview</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                  {filePreview ? (
                    <div className="w-full">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-full h-auto max-h-[300px] object-contain rounded-lg"
                      />
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        {newImage.file?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No image selected</p>
                      <p className="text-sm">Select an image to see preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeImages.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative h-48">
              <img
                src={galleryService.getImageUrl(image.id)}
                alt={image.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{image.title}</CardTitle>
              <CardDescription>
                <Badge variant="secondary">{image.category}</Badge>
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditImage(image)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteImage(image.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editingImage?.title || ''}
                onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Select 
                value={editingImage?.category || ''} 
                onValueChange={(value) => setEditingImage({ ...editingImage, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {safeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} className="flex-1">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
};

export default Gallery;
