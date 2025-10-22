
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { reviewService } from '@/services/ServiceFactory';
import { Review } from '@/types';

interface HallDetailReviewsProps {
  hallId: string;
}

export function HallDetailReviews({ hallId }: HallDetailReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!hallId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('[HallDetailReviews] Fetching reviews for hall:', hallId);
        const reviewsData = await reviewService.getReviewsByHall(hallId);
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
  }, [hallId]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Reviews</h3>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Customer Reviews</h3>
      
      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet for this hall.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{review.customerName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(review.date), 'MMM dd, yyyy')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
