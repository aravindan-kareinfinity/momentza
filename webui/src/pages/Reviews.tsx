import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Star, Reply, Trash2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Review, Hall } from '@/types';
import { reviewService, authService, hallService } from '@/services/ServiceFactory';
import { useServiceMutation } from '@/hooks/useService';
import { useToast } from '@/hooks/use-toast';

const Reviews = () => {
  const { toast } = useToast();
  const [newReply, setNewReply] = useState('');

  // State for data
  const [reviews, setReviews] = useState<Review[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for Add Review dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newReview, setNewReview] = useState({
    customerName: '',
    rating: 5,
    comment: '',
    hallId: 'general',
    date: new Date().toISOString().split('T')[0]
  });

  // State for toggle operations
  const [togglingReviews, setTogglingReviews] = useState<Set<string>>(new Set());

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        if (user?.organizationId) {
          console.log('[Reviews] Fetching reviews and halls data...');
          const [reviewsData, hallsData] = await Promise.all([
            reviewService.getReviewsByOrganization(user.organizationId),
            hallService.getAllHalls()
          ]);
          
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
          setHalls(Array.isArray(hallsData) ? hallsData : []);
        } else {
          setReviews([]);
          setHalls([]);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mutation hooks
  const deleteReviewMutation = useServiceMutation(
    (reviewId: string) => Promise.resolve(reviewService.delete(reviewId))
  );

  const createReviewMutation = useServiceMutation(
    (reviewData: Omit<Review, 'id'>) => reviewService.create(reviewData)
  );

  const handleReply = (reviewId: string) => {
    console.log('Replying to review:', reviewId, 'with:', newReply);
    setNewReply('');
  };

  const handleToggleReview = async (reviewId: string, isEnabled: boolean) => {
    try {
      // Set loading state for this specific review
      setTogglingReviews(prev => new Set(prev).add(reviewId));

      // Find the current review
      const currentReview = reviews.find(review => review.id === reviewId);
      if (!currentReview) {
        toast({
          title: 'Error',
          description: 'Review not found',
          variant: 'destructive',
        });
        return;
      }

      // Update the review using the optimized service method (avoids extra GET request)
      await reviewService.updateWithCurrentData(reviewId, currentReview, { isEnabled });

      // Refresh reviews after update
      if (currentUser?.organizationId) {
        const updatedReviews = await reviewService.getReviewsByOrganization(currentUser.organizationId);
        setReviews(Array.isArray(updatedReviews) ? updatedReviews : []);
      }

      toast({
        title: 'Success',
        description: `Review ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Failed to update review:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review status',
        variant: 'destructive',
      });
    } finally {
      // Clear loading state for this review
      setTogglingReviews(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReviewMutation.execute(reviewId);
      // Refresh reviews after deletion
      if (currentUser?.organizationId) {
        try {
          const updatedReviews = await reviewService.getReviewsByOrganization(currentUser.organizationId);
          setReviews(Array.isArray(updatedReviews) ? updatedReviews : []);
        } catch (err) {
          console.error('Failed to refresh reviews:', err);
        }
      }
      toast({
        title: 'Success',
        description: 'Review deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getHallName = (hallId?: string) => {
    if (!hallId) return 'General';
    const hall = halls.find(h => h.id === hallId);
    return hall ? hall.name : 'Unknown Hall';
  };

  const handleAddReview = async () => {
    if (!currentUser?.organizationId) return;

    try {
      const reviewData: Omit<Review, 'id'> = {
        organizationId: currentUser.organizationId,
        hallId: newReview.hallId === 'general' ? undefined : newReview.hallId || undefined,
        customerName: newReview.customerName,
        rating: newReview.rating,
        comment: newReview.comment,
        date: newReview.date,
        isEnabled: true
      };

      await createReviewMutation.execute(reviewData);

      // Refresh reviews after creation
      const updatedReviews = await reviewService.getReviewsByOrganization(currentUser.organizationId);
      setReviews(Array.isArray(updatedReviews) ? updatedReviews : []);

      // Reset form and close dialog
      setNewReview({
        customerName: '',
        rating: 5,
        comment: '',
        hallId: 'general',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddDialog(false);

      toast({
        title: 'Success',
        description: 'Review added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add review',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentUser) {
    return (
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
                {error || 'Unable to load reviews'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure reviews is always an array
  const safeReviews = Array.isArray(reviews) ? reviews : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reviews Management</h1>
          <p className="text-gray-600">Manage customer reviews and feedback</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Total Reviews: {safeReviews.length}
          </Badge>
          <Badge variant="outline">
            Average Rating: {safeReviews.length > 0 ? (safeReviews.reduce((acc, r) => acc + r.rating, 0) / safeReviews.length).toFixed(1) : '0.0'}
          </Badge>
          <Button onClick={() => {
            if (!loading && !error) {
              setShowAddDialog(true);
            }
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Review
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {safeReviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{review.customerName}</CardTitle>
                  <CardDescription>
                    {getHallName(review.hallId)} • {review.date}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(review.rating)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-700 mb-4">{review.comment}</p>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reply to Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="reply">Your Reply</Label>
                          <Textarea
                            id="reply"
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            placeholder="Thank you for your feedback..."
                          />
                        </div>
                        <Button onClick={() => handleReply(review.id)} className="w-full">
                          Send Reply
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteReview(review.id)}
                    disabled={deleteReviewMutation.loading}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {deleteReviewMutation.loading ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor={`enable-${review.id}`} className="text-sm">
                    Show on Landing Page
                  </Label>
                  <Switch
                    id={`enable-${review.id}`}
                    checked={review.isEnabled ?? true}
                    onCheckedChange={(checked) => handleToggleReview(review.id, checked)}
                    disabled={togglingReviews.has(review.id)}
                  />
                  {togglingReviews.has(review.id) && (
                    <div className="text-xs text-gray-500">Updating...</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Review Dialog */}
      {showAddDialog && (
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          try {
            setShowAddDialog(open);
          } catch (error) {
            console.error('Error in dialog onOpenChange:', error);
            setShowAddDialog(false);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Review</DialogTitle>
              <DialogDescription>
                Add a new customer review for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={newReview.customerName}
                  onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="hallSelect">Hall (Optional)</Label>
                <Select 
                  value={newReview.hallId} 
                  onValueChange={(value) => setNewReview({ ...newReview, hallId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hall (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Review</SelectItem>
                    {halls.map((hall) => (
                      <SelectItem key={hall.id} value={hall.id}>
                        {hall.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rating">Rating</Label>
                <Select 
                  value={newReview.rating.toString()} 
                  onValueChange={(value) => setNewReview({ ...newReview, rating: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        <div className="flex items-center">
                          <span className="mr-2">{rating}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reviewDate">Review Date</Label>
                <Input
                  id="reviewDate"
                  type="date"
                  value={newReview.date}
                  onChange={(e) => setNewReview({ ...newReview, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  placeholder="Enter review comment"
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleAddReview}
                  disabled={createReviewMutation.loading || !newReview.customerName || !newReview.comment}
                  className="flex-1"
                >
                  {createReviewMutation.loading ? 'Adding...' : 'Add Review'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Reviews;
