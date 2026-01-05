import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapPin, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { hallService, authService } from '@/services/ServiceFactory';
import { Hall } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

const EnableHall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [inactiveHalls, setInactiveHalls] = useState<Hall[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [updatingHalls, setUpdatingHalls] = useState<Record<string, boolean>>({});

  // Fetch inactive halls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        // Fetch all halls
        const allHalls = await hallService.getEnableHalls();
        
        // Filter only inactive halls
        const inactive = Array.isArray(allHalls) 
          ? allHalls.filter(hall => hall.isActive === false)
          : [];
        
        setInactiveHalls(inactive);
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

  // Handle enabling a hall - FIXED: Using updateHall instead of updateHallStatus
  const handleEnableHall = async (hallId: string) => {
    try {
      setUpdatingHalls(prev => ({ ...prev, [hallId]: true }));
      
      // 1. First, get the complete hall data
      const hallData = await hallService.getHallById(hallId);
      
      if (!hallData) {
        toast({
          title: 'Error',
          description: 'Hall not found',
          variant: 'destructive',
        });
        return;
      }
      
      // 2. Create complete update payload
      const updatePayload = {
        ...hallData, // Include ALL hall data
        isActive: true, // Only change this field
      };
      
      // 3. Send complete payload
      await hallService.updateHall(hallId, updatePayload);
      
      // Update local state
      setInactiveHalls(prev => prev.filter(hall => hall.id !== hallId));
      
      toast({
        title: 'Success',
        description: 'Hall enabled successfully!',
      });
    } catch (err) {
      console.error('Failed to enable hall:', err);
      toast({
        title: 'Error',
        description: 'Failed to enable hall. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingHalls(prev => ({ ...prev, [hallId]: false }));
    }
  };

  // Handle batch enable all halls - FIXED: Using updateHall instead of updateHallStatus
  const handleEnableAllHalls = async () => {
    try {
      // Create loading state for all halls
      const allUpdating: Record<string, boolean> = {};
      inactiveHalls.forEach(hall => {
        allUpdating[hall.id] = true;
      });
      setUpdatingHalls(allUpdating);
      
      // Enable all halls concurrently using updateHall
      const enablePromises = inactiveHalls.map(hall => 
        hallService.updateHall(hall.id, { isActive: true } as any)
      );
      
      await Promise.all(enablePromises);
      
      // Clear the list
      setInactiveHalls([]);
      
      toast({
        title: 'Success',
        description: `All ${inactiveHalls.length} halls have been enabled!`,
      });
    } catch (err) {
      console.error('Failed to enable all halls:', err);
      toast({
        title: 'Error',
        description: 'Failed to enable some halls. Please try again.',
        variant: 'destructive',
      });
      
      // Refetch to get updated status
      try {
        const allHalls = await hallService.getAllHalls();
        const inactive = Array.isArray(allHalls) 
          ? allHalls.filter(hall => hall.isActive === false)
          : [];
        setInactiveHalls(inactive);
      } catch (fetchError) {
        console.error('Failed to refresh hall data:', fetchError);
      }
    } finally {
      setUpdatingHalls({});
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      const allHalls = await hallService.getAllHalls();
      const inactive = Array.isArray(allHalls) 
        ? allHalls.filter(hall => hall.isActive === false)
        : [];
      
      setInactiveHalls(inactive);
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

  // Loading state
  if (loading) {
    return (
      <AnimatedPage className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-60 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Error state
  if (error || !currentUser) {
    return (
      <AnimatedPage className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
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

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Halls Service Error"
          message={error?.message || 'Unable to load halls data. Please try again.'}
        />
      </AnimatedPage>
    );
  }

  // If no inactive halls found
  if (inactiveHalls.length === 0) {
    return (
      <AnimatedPage className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Enable Halls</h1>
            <p className="text-gray-600">Activate inactive wedding halls</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/halls')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Halls
          </Button>
        </div>

        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">All Halls Are Active!</CardTitle>
            <CardDescription>
              There are currently no inactive halls to enable.
            </CardDescription>
            <div className="pt-4">
              <Button onClick={() => navigate('/admin/halls')}>
                Return to Halls Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enable Halls</h1>
          <p className="text-gray-600">
            {inactiveHalls.length} inactive {inactiveHalls.length === 1 ? 'hall' : 'halls'} found
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/halls')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Halls
          </Button>
          
          <Button
            onClick={handleEnableAllHalls}
            disabled={Object.keys(updatingHalls).length > 0}
            variant="secondary"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Enable All ({inactiveHalls.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inactiveHalls.map((hall) => (
          <Card key={hall.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{hall.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {hall.location}
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="ml-2">
                  Inactive
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium text-gray-700">Capacity</div>
                  <div>{hall.capacity} guests</div>
                </div>
                
                {hall.address && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-700">Address</div>
                    <div className="text-gray-600">{hall.address}</div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    {/* <div className="font-medium text-gray-700">Status</div> */}
                    <div className="flex items-center">
                      {/* <Switch
                        checked={false}
                        disabled={updatingHalls[hall.id]}
                        onCheckedChange={() => handleEnableHall(hall.id)}
                        className="mr-2"
                      /> */}
                      {/* <span ><Badge variant="destructive" className="ml-0">
                  Inactive
                </Badge></span> */}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleEnableHall(hall.id)}
                    disabled={updatingHalls[hall.id]}
                    size="sm"
                  >
                    {updatingHalls[hall.id] ? 'Enabling...' : 'Enable Hall'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Note about enabling halls:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Enabling a hall will make it visible to customers for bookings</li>
              <li>You can always disable a hall again from the Hall Edit page</li>
              <li>Make sure all hall information is complete before enabling</li>
            </ul>
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
    </AnimatedPage>
  );
};

export default EnableHall;