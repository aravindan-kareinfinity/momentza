import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Clock } from 'lucide-react';
import { hallService, organizationService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { Organization } from '@/types';

export function HallsSection() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[HallsSection] Fetching organization and halls data...');
      const [org, hallsData] = await Promise.all([
        organizationService.getCurrentOrganization(),
        hallService.getAllHalls()
      ]);
      
      setOrganization(org);
      setHalls(hallsData);
      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array means this runs only once when the component mounts

  const handleRetry = async () => {
    await fetchData(true);
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !organization || !halls) {
    return (
      <>
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p>Unable to load halls information</p>
            </div>
          </div>
        </section>

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Organization Service Error"
          message={error?.message || 'Unable to load organization data. Please try again.'}
        />
      </>
    );
  }

  return (
    <>
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Beautiful Halls</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our stunning wedding halls at {organization.name}, designed to make your special day unforgettable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {halls.slice(0, 3).map((hall: any) => (
              <Card key={hall.id} className="overflow-hidden">
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={hall.imageUrl || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'}
                    alt={hall.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 right-4">
                    {hall.isActive ? 'Available' : 'Booked'}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">{hall.name}</CardTitle>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{hall.location}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-sm">Capacity: {hall.capacity}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-sm">Full Day</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Morning Rate:</span>
                        <span className="font-semibold">₹{hall.morningRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Evening Rate:</span>
                        <span className="font-semibold">₹{hall.eveningRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Full Day Rate:</span>
                        <span className="font-semibold">₹{hall.fullDayRate}</span>
                      </div>
                    </div>

                    <Button className="w-full mt-4">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              View All Halls
            </Button>
          </div>
        </div>
      </section>

      {/* Server Error Dialog */}
      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetry}
        isLoading={loading}
        title="Organization Service Error"
        message={error?.message || 'Unable to load organization data. Please try again.'}
      />
    </>
  );
}
