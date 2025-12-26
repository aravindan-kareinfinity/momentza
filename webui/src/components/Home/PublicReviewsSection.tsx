import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Organization, Review } from '@/types';
import { reviewService } from '@/services/ServiceFactory';

interface PublicReviewsSectionProps {
  organization: Organization;
}

export function PublicReviewsSection({ organization }: PublicReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!organization?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('[PublicReviewsSection] Fetching reviews for organization:', organization.id);
        const reviewsData = await reviewService.getReviewsByOrganization(organization.id);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [organization?.id]);

  if (!organization) {
    return null;
  }

  // const safeReviews = Array.isArray(reviews) ? reviews : [];
  const safeReviews = Array.isArray(reviews) ? reviews.filter(review => review.isEnabled === true) : [];
  const displayReviews = safeReviews.slice(0, 3);

  // Loading state
  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Customer Reviews</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what our customers have to say about {organization.name}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="animate-pulse">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className="h-4 w-4 bg-gray-300 rounded mr-1"></div>
                        ))}
                      </div>
                      <div className="h-4 w-8 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
                        <div className="h-3 w-20 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Customer Reviews</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what our customers have to say about {organization.name}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Unable to load reviews at this time.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Customer Reviews</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See what our customers have to say about {organization.name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayReviews.length > 0 ? (
            displayReviews.map((review: Review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.rating}.0</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                    <div>
                      <p className="font-semibold">{review.customerName}</p>
                      <p className="text-sm text-gray-500">Customer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No reviews available yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
