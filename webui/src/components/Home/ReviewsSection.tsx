import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { organizationService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { Organization } from '@/types';

export function ReviewsSection() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const fetchOrganization = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[ReviewsSection] Fetching organization data...');
      const org = await organizationService.getCurrentOrganization();
      setOrganization(org);
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
    fetchOrganization();
  }, []); // Empty dependency array means this runs only once when the component mounts

  const handleRetry = async () => {
    await fetchOrganization(true);
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error || !organization) {
    return (
      <>
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p>Unable to load reviews</p>
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
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our satisfied clients have to say about their experience with {organization.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">5.0</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  "Absolutely stunning venue! The staff was incredibly professional and made our wedding day perfect. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Sarah & John</p>
                    <p className="text-sm text-gray-500">Wedding Couple</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review 2 */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">5.0</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  "The attention to detail was amazing. Everything was perfectly organized and the venue looked beautiful. Thank you!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">Michael & Lisa</p>
                    <p className="text-sm text-gray-500">Wedding Couple</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review 3 */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">5.0</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  "Professional service from start to finish. The venue exceeded our expectations and our guests loved it!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-semibold">David & Emma</p>
                    <p className="text-sm text-gray-500">Wedding Couple</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
