
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PublicHallsSection } from '@/components/Home/PublicHallsSection';
import { PublicReviewsSection } from '@/components/Home/PublicReviewsSection';
import { PublicHomeCarousel } from '@/components/Home/PublicHomeCarousel';

interface ComponentConfig {
  slotTime?: number;
  width?: string;
  height?: string;
  maxCount?: number;
  title?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  imagePosition?: 'left' | 'right';
  textAlignment?: 'left' | 'right';
  alignment?: 'left' | 'center' | 'right';
  blockWidth?: '1/4' | '1/3' | '1/2' | 'full';
  textPosition?: 'top' | 'center' | 'bottom';
  showGalleryButton?: boolean;
}

interface PreviewComponent {
  id: string;
  type: string;
  orderPosition: number;
  isActive: boolean;
  config?: ComponentConfig;
}

interface MicrositePreviewProps {
  components: PreviewComponent[];
  organization?: any;
  halls?: any[];
  carouselItems?: any[];
  galleryImages?: any[];
  reviews?: any[];
}

export function MicrositePreview({ 
  components, 
  organization,
  halls = [],
  carouselItems = [],
  galleryImages = [],
  reviews = []
}: MicrositePreviewProps) {
  const navigate = useNavigate();

  const getWidthClass = (width?: string) => {
    switch (width) {
      case '1/4': return 'w-1/4';
      case '1/3': return 'w-1/3';
      case '1/2': return 'w-1/2';
      default: return 'w-full';
    }
  };

  const renderComponent = (component: PreviewComponent) => {
    if (!component.isActive) return null;

    const config = component.config || {};

    switch (component.type) {
      case 'carousel':
        // Use real carousel component if we have data
        if (organization && (carouselItems.length > 0 || galleryImages.length > 0)) {
          return (
            <PublicHomeCarousel
              organization={organization}
              carouselItems={carouselItems}
              galleryImages={galleryImages}
              textPosition={config.textPosition || 'center'}
              slotTime={config.slotTime}
            />
          );
        }
        // Fallback to placeholder
        return (
          <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                  {config.title || organization?.name || 'Welcome to Our Venue'}
                </h2>
                <p className="text-lg md:text-xl mb-6">
                  {config.description || 'Make your special day unforgettable'}
                </p>
                <div className="flex justify-center space-x-4">
                  <Button 
                    className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100"
                    onClick={() => navigate('/booking')}
                  >
                    Book Now
                  </Button>
                  <Button 
                    variant="outline"
                    className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600"
                    onClick={() => navigate('/halls')}
                  >
                    View Halls
                  </Button>
                </div>
                {config.slotTime && (
                  <div className="mt-6 text-sm opacity-75">
                    Auto-advance: {config.slotTime}s
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'halls':
        // Use real halls component if we have halls data
        if (halls && halls.length > 0) {
          return <PublicHallsSection halls={halls} config={{
            width: config.width,
            height: config.height ? parseInt(config.height) : undefined
          }} />;
        }
        // Fallback to placeholder
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {config.title || 'Our Wedding Halls'}
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {config.description || 'Discover our beautiful venues perfect for your special day. Each hall is designed to create unforgettable memories.'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">Hall {i}</span>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">Grand Hall {i}</h3>
                    <p className="text-sm text-gray-600 mb-3">Capacity: 500 guests</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-sm">₹50,000</Badge>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center">
              <Button 
                onClick={() => navigate('/halls')}
                className="px-6 py-3"
              >
                View All Halls
              </Button>
            </div>
          </div>
        );

      case 'reviews':
        // Use real reviews component if we have organization
        if (organization) {
          return <PublicReviewsSection organization={organization} />;
        }
        // Fallback to placeholder
        const maxReviews = config.maxCount || 6;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">{config.title || 'Customer Reviews'}</h2>
            {reviews && reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.slice(0, Math.min(maxReviews, reviews.length)).map((review: any, i: number) => (
                  <Card key={review.id || i}>
                    <CardContent className="p-4">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-500">
                          {'★'.repeat(review.rating || 5)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        "{review.comment || review.feedback || 'Amazing venue with excellent service!'}"
                      </p>
                      <p className="text-sm font-semibold">
                        - {review.customerName || review.customer?.name || 'Customer'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: Math.min(maxReviews, 6) }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-500">
                          {'★'.repeat(5)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        "Amazing venue with excellent service. Highly recommended!"
                      </p>
                      <p className="text-sm font-semibold">- Customer {i + 1}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <p className="text-center text-sm text-gray-500">
              Showing {reviews ? Math.min(maxReviews, reviews.length) : Math.min(maxReviews, 6)} reviews
            </p>
          </div>
        );

      case 'text':
        const alignmentClass =
                              config.alignment === 'right' ? 'text-right' :
                              config.alignment === 'center' ? 'text-center' : 'text-left';
        return (
          <div className={`${getWidthClass(config.width)} mx-auto`}>
            <div className={`flex ${config.imagePosition === 'right' ? 'flex-row-reverse' : 'flex-row'} items-center gap-8`}>
              {config.imageUrl && (
                <div className="flex-shrink-0 w-56 h-40">
                  <img
                    src={config.imageUrl}
                    alt={config.title}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}
              <div className={`flex-1 ${alignmentClass}`}>
                {config.title && (
                  <h2 className="text-3xl font-bold mb-4 text-gray-800">{config.title}</h2>
                )}
                {config.description && (
                  <p className="text-lg text-gray-600 leading-relaxed">{config.description}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'image':
        const imageUrls = config.imageUrls || (config.imageUrl ? [config.imageUrl] : []);
        return (
          <div className="text-center">
            {imageUrls.length > 0 && (
              <div className={`grid gap-4 ${imageUrls.length === 1 ? 'grid-cols-1' : imageUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {imageUrls.slice(0, 6).map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt={config.title || `Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg shadow-lg"
                  />
                ))}
              </div>
            )}
            {config.title && (
              <p className="mt-4 text-gray-600">{config.title}</p>
            )}
          </div>
        );

      // case 'search':
      //   return (
      //     <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
      //       <CardContent className="p-8">
      //         <div className="text-center">
      //           <h2 className="text-3xl font-bold text-gray-800 mb-4">Find Your Perfect Hall</h2>
      //           <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
      //             Search through our collection of beautiful venues to find the perfect setting for your special day
      //           </p>
      //           <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
      //             <input 
      //               type="text" 
      //               placeholder="Search halls by name, location, or capacity..." 
      //               className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      //             />
      //             <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
      //               Search
      //             </button>
      //           </div>
      //           <div className="mt-4 text-sm text-gray-500">
      //             Popular searches: Large venues, Outdoor spaces, Intimate settings
      //           </div>
      //         </div>
      //       </CardContent>
      //     </Card>
      //   );

      // default:
      //   return (
      //     <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
      //       {component.type} component
      //     </div>
      //   );
    }
  };

  const activeComponents = components
    .filter(c => c.isActive)
            .sort((a, b) => a.orderPosition - b.orderPosition);

  return (
    <div className="space-y-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {activeComponents.map((component) => (
          <div key={component.id} className="mb-8">
            {renderComponent(component)}
          </div>
        ))}
        {activeComponents.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {organization?.name || 'Welcome'}
            </h1>
            <p className="text-gray-600">This page is being configured. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}