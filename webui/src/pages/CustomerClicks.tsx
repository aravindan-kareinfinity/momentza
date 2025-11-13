import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { customerClicksService, hallService, authService } from '@/services/ServiceFactory';
import { CustomerClick } from '@/services/mockData';
import { format } from 'date-fns';

// Extended interface for the form data
interface CustomerClickFormData {
  image: string;
  date: string;
  functionName: string;
  title: string;
  boyName: string;
  girlName: string;
  hallId: string;
  message: string;
}

// Extended CustomerClick interface for the mock data
interface ExtendedCustomerClick extends CustomerClick {
  image?: string;
  boyName?: string;
  girlName?: string;
}

const CustomerClicks = () => {
  // State for data
  const [customerClicks, setCustomerClicks] = useState<CustomerClick[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user first
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        if (user?.organizationId) {
          try {
            // Fetch customer clicks and halls in parallel
            const [clicksData, hallsData] = await Promise.all([
              customerClicksService.getAll(),
              hallService.getAllHalls()
            ]);
            
            console.log('Fetched clicks data:', clicksData);
            console.log('Fetched halls data:', hallsData);
            
            setCustomerClicks(Array.isArray(clicksData) ? clicksData : []);
            const hallsArray = Array.isArray(hallsData) ? hallsData : [];
            setHalls(hallsArray);
            
            // Set default hall ID to first available hall
            if (hallsArray.length > 0) {
              setNewClick(prev => ({ 
                ...prev, 
                hallId: hallsArray[0].id,
                message: ''
              }));
            }
          } catch (hallError) {
            console.error('Error fetching halls:', hallError);
            // If halls fail to load, still try to load clicks
            try {
              const clicksData = await customerClicksService.getAll();
              setCustomerClicks(Array.isArray(clicksData) ? clicksData : []);
            } catch (clickError) {
              console.error('Error fetching clicks:', clickError);
              setCustomerClicks([]);
            }
            // Try to fetch halls using getAllHalls as fallback
            try {
              const hallsData = await hallService.getAllHalls();
              setHalls(Array.isArray(hallsData) ? hallsData : []);
            } catch (fallbackHallError) {
              console.error('Error fetching halls with fallback:', fallbackHallError);
              setHalls([]);
            }
          }
        } else {
          setCustomerClicks([]);
          setHalls([]);
        }
      } catch (err) {
        console.error('Failed to load customer clicks:', err);
        setError('Failed to load customer clicks');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClick, setEditingClick] = useState<ExtendedCustomerClick | null>(null);
  const [newClick, setNewClick] = useState<CustomerClickFormData>({
    image: '',
    date: '',
    functionName: '',
    title: '',
    boyName: '',
    girlName: '',
    hallId: '',
    message: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!currentUser?.organizationId) {
      console.error('No organization ID available');
      return;
    }

    if (!newClick.date || !newClick.title || !newClick.hallId) {
      console.error('Required fields missing:', {
        date: newClick.date,
        title: newClick.title,
        hallId: newClick.hallId
      });
      alert('Please fill in all required fields: Event Date, Title, and Hall');
      return;
    }

    if (halls.length === 0) {
      console.error('No halls available');
      alert('No halls are available. Please try again later.');
      return;
    }

    setUploading(true);
    try {
      // Use the same upload endpoint for both create and update
      const uploadData = {
        id: editingClick?.id, // Include ID for updates, undefined for creates
        customerId: editingClick?.customerId, // Include existing customerId for updates
        eventDate: newClick.date,
        eventType: newClick.title,
        message: newClick.message,
        hallId: newClick.hallId,
        boyName: newClick.boyName,
        girlName: newClick.girlName,
        imageBase64: selectedImage ? await convertFileToBase64(selectedImage) : undefined
      };
      
      await customerClicksService.createCustomerClick(uploadData);
      
      // Refresh data
      try {
        const updatedClicks = await customerClicksService.getAll();
        setCustomerClicks(updatedClicks || []);
      } catch (err) {
        console.error('Failed to refresh customer clicks:', err);
      }
      
      setShowAddForm(false);
      setEditingClick(null);
      setNewClick({
        image: '',
        date: '',
        functionName: '',
        title: '',
        boyName: '',
        girlName: '',
        hallId: halls.length > 0 ? halls[0].id : '1',
        message: ''
      });
      setSelectedImage(null);
    } catch (error) {
      console.error('Error saving customer click:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (click: ExtendedCustomerClick) => {
    setEditingClick(click);
    setNewClick({
      image: click.image || '',
      date: click.eventDate || '',
      functionName: click.eventType || '',
      title: click.eventType || '', // Use eventType as title for existing records
      boyName: click.boyName || '',
      girlName: click.girlName || '',
      hallId: click.hallId || '1',
      message: click.message || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await customerClicksService.delete(id);
      // Refresh data
      try {
        const updatedClicks = await customerClicksService.getAll();
        setCustomerClicks(updatedClicks || []);
      } catch (err) {
        console.error('Failed to refresh customer clicks:', err);
      }
    } catch (error) {
      console.error('Error deleting customer click:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const openAddForm = () => {
    setEditingClick(null);
    setNewClick({
      image: '',
      date: '',
      functionName: '',
      title: '',
      boyName: '',
      girlName: '',
      hallId: halls.length > 0 ? halls[0].id : '1', // Default to '1' if no halls available
      message: ''
    });
    setSelectedImage(null);
    setShowAddForm(true);
  };

  // Fetch protected images with auth headers and cache blob URLs
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
        const url = customerClicksService.getImageUrl(id);
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
        // ignore per-image failures
      } finally {
        delete abortControllers[id];
      }
    };

    const ids = (Array.isArray(customerClicks) ? customerClicks : []).map(c => c.id);
    ids.forEach(id => fetchImage(id));

    return () => {
      isCancelled = true;
      Object.values(abortControllers).forEach(c => c.abort());
      // Revoke created object URLs
      Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [customerClicks]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
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
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const clicks = Array.isArray(customerClicks) ? customerClicks : [];

  // Show add form view
  if (showAddForm) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAddForm(false)}
              className="mr-4"
            >
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{editingClick ? 'Edit' : 'Add'} Customer Click</h1>
              <p className="text-gray-600">Upload customer event images and memories</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side - Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Event Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newClick.date}
                  onChange={(e) => setNewClick(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newClick.title}
                  onChange={(e) => setNewClick(prev => ({ ...prev, title: e.target.value, functionName: e.target.value }))}
                  placeholder="e.g., Wedding Reception"
                />
              </div>
              
              <div>
                <Label htmlFor="boyName">Boy Name</Label>
                <Input
                  id="boyName"
                  value={newClick.boyName}
                  onChange={(e) => setNewClick(prev => ({ ...prev, boyName: e.target.value }))}
                  placeholder="Groom name (optional)"
                />
              </div>
              
              <div>
                <Label htmlFor="girlName">Girl Name</Label>
                <Input
                  id="girlName"
                  value={newClick.girlName}
                  onChange={(e) => setNewClick(prev => ({ ...prev, girlName: e.target.value }))}
                  placeholder="Bride name (optional)"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={newClick.message}
                  onChange={(e) => setNewClick(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Special message or notes"
                />
              </div>
              
              <div>
                <Label htmlFor="hallId">Hall</Label>
                <Select value={newClick.hallId} onValueChange={(value) => setNewClick(prev => ({ ...prev, hallId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hall" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(halls) && halls.length > 0 ? (
                      halls.map((hall) => (
                        <SelectItem key={hall.id} value={hall.id}>
                          {hall.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No halls available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSave} className="w-full" disabled={uploading}>
                {uploading ? 'Uploading...' : (editingClick ? 'Update' : 'Add')} Customer Click
              </Button>
            </div>

            {/* Right side - Image Upload and Preview */}
            <div className="space-y-4">
              <div>
                <Label>Image</Label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button asChild variant="outline" className="w-full">
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              
              {selectedImage && (
                <div className="aspect-video relative border rounded overflow-hidden">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main list view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Customer Clicks</h1>
            <p className="text-gray-600">Manage customer event images and memories</p>
          </div>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer Click
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clicks.map((click) => {
            const extendedClick = click as ExtendedCustomerClick;
            return (
              <Card key={click.id} className="overflow-hidden">
                <div className="aspect-[4/3] relative">
                  <img
                    src={imageUrls[click.id] || customerClicksService.getImageUrl(click.id)}
                    alt={click.eventType}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg">{click.eventType}</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {extendedClick.boyName && <p className="text-sm">Boy: {extendedClick.boyName}</p>}
                  {extendedClick.girlName && <p className="text-sm">Girl: {extendedClick.girlName}</p>}
                  <p className="text-sm text-gray-500">
                    Hall: {Array.isArray(halls) ? halls.find(h => h.id === click.hallId)?.name || 'Unknown Hall' : 'Unknown Hall'}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {format(new Date(click.eventDate), 'MMM dd, yyyy')}
                  </Badge>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(extendedClick)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(click.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomerClicks;
