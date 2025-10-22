
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComponentConfig {
  slotTime?: number;
  width?: string;
  height?: string;
  maxCount?: number;
  title?: string;
  description?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right';
  textAlignment?: 'left' | 'right';
  blockWidth?: '1/4' | '1/3' | '1/2' | 'full';
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
}

export function MicrositePreview({ components }: MicrositePreviewProps) {
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
        return (
          <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Welcome to Our Venue</h2>
                <p className="text-lg md:text-xl mb-6">Make your special day unforgettable</p>
                <div className="flex justify-center space-x-4">
                  <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                    Book Now
                  </button>
                  <button className="px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
                    View Halls
                  </button>
                </div>
                <div className="mt-6 text-sm opacity-75">
                  Auto-advance: {config.slotTime || 5}s
                </div>
              </div>
            </div>
          </div>
        );

      case 'halls':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Wedding Halls</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover our beautiful venues perfect for your special day. Each hall is designed to create unforgettable memories.
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
              <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                View All Halls
              </button>
            </div>
          </div>
        );

      case 'reviews':
        const maxReviews = config.maxCount || 6;
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Customer Reviews</h2>
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
            <p className="text-center text-sm text-gray-500">Showing {Math.min(maxReviews, 6)} reviews</p>
          </div>
        );

      case 'text':
        const alignmentClass = config.textAlignment === 'center' ? 'text-center' : 
                              config.textAlignment === 'right' ? 'text-right' : 'text-left';
        return (
          <div className={`${getWidthClass(config.blockWidth)} mx-auto`}>
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
        return (
          <div className="text-center">
            {config.imageUrl && (
              <img 
                src={config.imageUrl} 
                alt={config.title} 
                className="w-full max-w-2xl mx-auto rounded-lg"
              />
            )}
            {config.title && (
              <p className="mt-2 text-gray-600">{config.title}</p>
            )}
          </div>
        );

      case 'search':
        return (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Find Your Perfect Hall</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Search through our collection of beautiful venues to find the perfect setting for your special day
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input 
                    type="text" 
                    placeholder="Search halls by name, location, or capacity..." 
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Search
                  </button>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Popular searches: Large venues, Outdoor spaces, Intimate settings
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            {component.type} component
          </div>
        );
    }
  };

  const activeComponents = components
    .filter(c => c.isActive)
            .sort((a, b) => a.orderPosition - b.orderPosition);

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {activeComponents.map((component) => (
          <div key={component.id} className="mb-8">
            {renderComponent(component)}
          </div>
        ))}
        {activeComponents.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome</h1>
            <p className="text-gray-600">This page is being configured. Please check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
