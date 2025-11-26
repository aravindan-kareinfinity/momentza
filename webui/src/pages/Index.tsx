
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService, micrositeService, hallService } from '@/services/ServiceFactory';
import { MicrositeComponent } from '@/services/interfaces/IDataService';
import { MicrositePreview } from '@/components/Microsite/MicrositePreview';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const Index = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const [components, setComponents] = useState<MicrositeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackHalls, setFallbackHalls] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let orgId = organizationId;
        
        // If no organizationId in URL, try to get from current user
        if (!orgId) {
          try {
            const currentUser = await authService.getCurrentUser();
            orgId = currentUser?.organizationId;
          } catch (userError) {
            console.warn('Could not get current user, using default organization');
            orgId = '1'; // Default fallback
          }
        }

        if (!orgId) {
          setError('No organization ID available');
          setLoading(false);
          return;
        }

        // Fetch microsite components for the organization
        const fetchedComponents = await micrositeService.getComponents(orgId);
        
        // Filter only active components and sort by orderPosition
        const activeComponents = fetchedComponents
          .filter(comp => comp.isActive)
          .sort((a, b) => a.orderPosition - b.orderPosition);
        
        setComponents(activeComponents);

        // If no microsite components, fetch some fallback data
        if (activeComponents.length === 0) {
          try {
            const halls = await hallService.getAllHalls();
            setFallbackHalls(Array.isArray(halls) ? halls.slice(0, 3) : []);
          } catch (hallsError) {
            console.warn('Could not fetch fallback halls:', hallsError);
          }
        }
      } catch (err) {
        console.error('Failed to fetch microsite components:', err);
        setError('Failed to load page content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  const renderFallbackContent = () => (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          Welcome to Our Wedding Venue
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Create unforgettable memories in our beautiful venues designed for your special day
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/booking')}
            className="text-lg px-8 py-4"
          >
            Book Your Venue
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/halls')}
            className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600"
          >
            View All Halls
          </Button>
        </div>
      </div>

      {/* Halls Preview */}
      {fallbackHalls.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Featured Venues</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our most popular wedding venues, each designed to create the perfect atmosphere for your celebration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fallbackHalls.map((hall, index) => (
              <Card key={hall.id || index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {hall.name || `Hall ${index + 1}`}
                  </span>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{hall.name || `Grand Hall ${index + 1}`}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Capacity: {hall.capacity || '500'} guests
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="text-sm">
                      {hall.price ? `₹${hall.price}` : 'Contact Us'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/halls/preview/${hall.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button 
              onClick={() => navigate('/halls')}
              className="px-8 py-3 text-lg"
            >
              View All Venues
            </Button>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎉</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Perfect Venues</h3>
          <p className="text-gray-600">Beautiful spaces designed for every type of celebration</p>
        </Card>
        <Card className="text-center p-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌟</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Expert Service</h3>
          <p className="text-gray-600">Professional staff to make your day truly special</p>
        </Card>
        <Card className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💝</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Memorable Moments</h3>
          <p className="text-gray-600">Create lasting memories in our stunning venues</p>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Start Planning?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Contact us today to discuss your vision and let us help you create the perfect wedding experience.
        </p>
        <Button 
          size="lg"
          onClick={() => navigate('/contact')}
          className="px-8 py-4 text-lg"
        >
          Get Started
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Page</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3"
          >
            Try Again
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {components.length > 0 ? (
          // Render dynamic microsite components
          <MicrositePreview components={components} />
        ) : (
          // Render fallback content
          renderFallbackContent()
        )}
      </div>
    </AnimatedPage>
  );
};

export default Index;
