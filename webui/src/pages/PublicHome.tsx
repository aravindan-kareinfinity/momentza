
import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { TopNavigation } from '@/components/Layout/TopNavigation';
import { PublicHomeCarousel } from '@/components/Home/PublicHomeCarousel';
import { PublicHallsSection } from '@/components/Home/PublicHallsSection';
import { CustomerClicksSection } from '@/components/Home/CustomerClicksSection';
import { PublicReviewsSection } from '@/components/Home/PublicReviewsSection';
import { PublicFooter } from '@/components/Home/PublicFooter';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { 
  organizationService, 
  hallService, 
  carouselService, 
  galleryService, 
  customerClicksService, 
  reviewService 
} from '@/services/ServiceFactory';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

// Page-level context data
interface PublicHomeData {
  organization: any;
  halls: any[];
  carouselItems: any[];
  galleryImages: any[];
  customerClicks: any[];
  reviews: any[];
}

// UUID validation function
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const PublicHome = () => {
  const [searchParams] = useSearchParams();
  const { orgId } = useParams<{ orgId?: string }>();
  const orgIdFromSearch = searchParams.get('orgId');
  
  // Priority: route param > search param
  // Only treat as organization ID if it's a valid UUID
  const orgIdFromUrl = (orgId && isValidUUID(orgId)) ? orgId : 
                       (orgIdFromSearch && isValidUUID(orgIdFromSearch)) ? orgIdFromSearch : null;
  
  // Page-level state for all data
  const [pageData, setPageData] = useState<PublicHomeData>({
    organization: null,
    halls: [],
    carouselItems: [],
    galleryImages: [],
    customerClicks: [],
    reviews: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Fetch all data once when page initializes
  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PublicHome] Fetching all page data...');

      let organization;
      
      // If organization ID is provided in URL, use it directly
      if (orgIdFromUrl) {
        console.log('[PublicHome] Using organization ID from URL:', orgIdFromUrl);
        try {
          organization = await organizationService.getCurrentOrganization(orgIdFromUrl);
          console.log('[PublicHome] Organization fetched by ID:', organization);
        } catch (error) {
          console.error('[PublicHome] Error fetching organization by ID:', error);
          throw new Error(`Organization with ID '${orgIdFromUrl}' not found. Please check if the organization exists.`);
        }
      } else {
        // Fallback to current organization
        console.log('[PublicHome] No organization ID in URL, using current organization');
        try {
          organization = await organizationService.getCurrentOrganization();
          console.log('[PublicHome] Current organization fetched:', organization);
        } catch (error) {
          console.error('[PublicHome] Error fetching current organization:', error);
          throw new Error('Unable to fetch current organization. Please check your connection and try again.');
        }
      }
      
      if (!organization?.id) {
        const errorMsg = orgIdFromUrl 
          ? `Organization with ID '${orgIdFromUrl}' not found. Please verify the organization ID is correct.`
          : 'No organization found. Please check your configuration.';
        throw new Error(errorMsg);
      }

      // Fetch all data in parallel
      const [
        halls,
        carouselItems,
        galleryImages,
        customerClicks,
        reviews
      ] = await Promise.all([
        hallService.getHallsByOrganization(organization.id),
        carouselService.getCarouselItems(organization.id),
        galleryService.getImagesByOrganization(organization.id),
        customerClicksService.getAll(),
        reviewService.getReviewsByOrganization(organization.id)
      ]);

      setPageData({
        organization,
        halls,
        carouselItems,
        galleryImages,
        customerClicks,
        reviews
      });

      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      console.error('[PublicHome] Error fetching page data:', error);
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [orgIdFromUrl]); // Re-run when organization ID changes

  const handleRetry = async () => {
    await fetchPageData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Loading state
  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-background">
        <TopNavigation organization={null} />
        <main>
          <div className="animate-pulse">
            <div className="h-96 md:h-[500px] lg:h-[600px] bg-gray-200 rounded mb-12"></div>
            <div className="container mx-auto px-4">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <div className="h-32 bg-gray-900"></div>
      </AnimatedPage>
    );
  }

  // Error state
  if (error || !pageData.organization) {
    return (
      <AnimatedPage className="min-h-screen bg-background">
        <TopNavigation organization={null} />
        <main>
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <p>Unable to load page data</p>
            </div>
          </div>
        </main>
        <div className="h-32 bg-gray-900"></div>
        
        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Page Data Error"
          message={error?.message || 'Unable to load page data. Please try again.'}
        />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-background">
      <TopNavigation organization={pageData.organization} />
      <main>
        <PublicHomeCarousel 
          organization={pageData.organization}
          carouselItems={pageData.carouselItems}
          galleryImages={pageData.galleryImages}
        />
        <PublicHallsSection 
          halls={pageData.halls}
        />
        <CustomerClicksSection 
          customerClicks={pageData.customerClicks}
        />
        <PublicReviewsSection 
          organization={pageData.organization}
        />
      </main>
      <PublicFooter 
        organization={pageData.organization}
      />

      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetry}
        isLoading={loading}
        title="Page Data Error"
        message={error?.message || 'Unable to load page data. Please try again.'}
      />
    </AnimatedPage>
  );
};

export default PublicHome;
