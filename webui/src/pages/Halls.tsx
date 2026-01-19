import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Plus, Edit, Eye } from 'lucide-react';
import { hallService, authService, galleryService } from '@/services/ServiceFactory';
import { Hall } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

const Halls = () => {
  const navigate = useNavigate();

  // State for data
  const [halls, setHalls] = useState<Hall[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // rules
  const [rulesOpen, setRulesOpen] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);

  // Function to get image URL for a hall
  const getImageUrl = (hall: Hall): string => {
    if (!hall.gallery || hall.gallery.length === 0) {
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
    }

    const galleryItem = hall.gallery[0];

    // If it's already a full URL, use it directly
    if (galleryItem.startsWith('http')) {
      return galleryItem;
    }

    // If it's a photo ID, construct Unsplash URL
    if (galleryItem.startsWith('photo-')) {
      return `https://images.unsplash.com/${galleryItem}?auto=format&fit=crop&w=400&q=80`;
    }

    // If it's a gallery image ID, try to resolve it
    try {
      const resolvedUrl = galleryService.getImageUrl(galleryItem);
      return resolvedUrl || 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
    } catch (error) {
      console.warn('Failed to resolve gallery image URL:', error);
      return 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[Halls] Fetching all halls data from API...');
        // Get current user - this is async!
        const user = await authService.getCurrentUser();
        setCurrentUser(user);

        // Fetch all halls directly from API
        const hallsData = await hallService.getAllHalls();
        setHalls(hallsData || []);

        setShowErrorDialog(false);
      } catch (err) {
        const error = err as Error;
        console.error('Failed to load halls data:', error);
        setError(error);
        setShowErrorDialog(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRetry = async () => {
    // Reset and refetch data
    setLoading(true);
    setError(null);

    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);

      // Fetch all halls directly from API
      const hallsData = await hallService.getAllHalls();
      setHalls(hallsData || []);

      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const handleEditHall = (hall: Hall) => {
    navigate(`/admin/halls/edit/${hall.id}`);
  };

  const handlePreviewHall = (hall: Hall) => {
    navigate(`/admin/halls/preview/${hall.id}`);
  };

  const handleAddHall = () => {
    navigate('/admin/halls/add');
  };
  const updateHallStatus = () => {
    navigate('/admin/halls/enable');
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
      <>
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
                  {error?.message || 'Unable to load halls'}
                </p>
                <Button onClick={handleRetry} className="mt-2">Retry</Button>
              </div>
            </div>
          </div>
        </div>

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Halls Service Error"
          message={error?.message || 'Unable to load halls data. Please try again.'}
        />
      </>
    );
  }

  const safeHalls = Array.isArray(halls) ? halls : [];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Halls Management</h1>
          <p className="text-gray-600">Manage your wedding halls and their details</p>
        </div>
        <div className="flex flex-row gap-4">
          <Button onClick={updateHallStatus}>
            Enable Hall
          </Button>
          <Button onClick={handleAddHall}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Hall
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeHalls.map((hall) => (
          <Card key={hall.id} className="overflow-hidden relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
              onClick={() => handleEditHall(hall)}
            >
              <Edit className="h-4 w-4" />
            </Button>

            <div className="relative h-48">
              <img
                src={getImageUrl(hall)}
                alt={hall.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <Badge className="absolute bottom-2 left-2">
                {hall.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <CardHeader>
              <CardTitle>{hall.name}</CardTitle>
              {/* <CardDescription className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {hall.location}
              </CardDescription> */}

              <CardDescription className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {hall.address}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">

                {/* Capacity */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    Hall: {hall.amenities.capacity.hall} guests
                  </div>
                  <div className="text-gray-600">
                    Dining: {hall.amenities.capacity.dining} | Parking: {hall.amenities.capacity.parking}
                  </div>
                </div>

                {/* Food Type */}
                <Badge variant="outline">
                  {hall.amenities.foodType === 'veg' && 'Veg Only'}
                  {hall.amenities.foodType === 'non-veg' && 'Non-Veg Only'}
                  {hall.amenities.foodType === 'both' && 'Veg & Non-Veg'}
                </Badge>

                {/* Rooms */}
                <div className="text-sm text-gray-600">
                  Rooms: {hall.amenities.rooms.free} Free · {hall.amenities.rooms.rentedAc} AC · {hall.amenities.rooms.rentedNonAc} Non-AC
                </div>

                {/* Facilities */}
                <div className="flex flex-wrap gap-1">
                  {hall.amenities.facilities.generator && (
                    <Badge variant="secondary" className="text-xs">Generator</Badge>
                  )}
                  {hall.amenities.facilities.airConditioning && (
                    <Badge variant="secondary" className="text-xs">Air-Conditioned</Badge>
                  )}
                </div>


                {/* Pricing */}
                <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                  <div>
                    <span className="text-gray-500">Morning</span>
                    <div className="font-semibold">₹{hall.rateCard.morningRate.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Evening</span>
                    <div className="font-semibold">₹{hall.rateCard.eveningRate.toLocaleString()}</div>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-2 text-sm pt-3">
                  {/* Preview */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handlePreviewHall(hall)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>

                  {/* Rules */}
                  {hall.amenities.rules?.length > 0 ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        setSelectedRules(hall.amenities.rules);
                        setRulesOpen(true);
                      }}
                    >
                      📜 View Rules ({hall.amenities.rules.length})
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full opacity-50 cursor-not-allowed"
                      disabled
                    >
                      📜 No Rules
                    </Button>
                  )}
                </div>


              </div>
            </CardContent>

          </Card>
        ))}
      </div>

      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetry}
        isLoading={loading}
        title="Halls Service Error"
        message={error?.message || 'Unable to load halls data. Please try again.'}
      />

      {/* RULES MODAL — PLACE HERE */}
      {rulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-lg">Hall Rules</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRulesOpen(false)}
              >
                ✕
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto">
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {selectedRules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3 text-right">
              <Button onClick={() => setRulesOpen(false)}>Close</Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Halls;
