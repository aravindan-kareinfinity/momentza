import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar, Phone, Mail, Clock } from 'lucide-react';
import { bookingService, hallService, billingService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { format } from 'date-fns';

interface BookingDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

export function BookingDetailDialog({ isOpen, onClose, bookingId }: BookingDetailDialogProps) {
  // State for data
  const [booking, setBooking] = useState<any>(null);
  const [hall, setHall] = useState<any>(null);
  const [billingSettings, setBillingSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Fetch data when dialog opens
  const fetchData = async () => {
    if (!isOpen || !bookingId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('[BookingDetailDialog] Fetching booking details...');
      const [bookingData, billingData] = await Promise.all([
        bookingService.getById(bookingId),
        billingService.getBillingSettings()
      ]);
      
      setBooking(bookingData);
      setBillingSettings(billingData);
      
      // Fetch hall data if booking exists
      if (bookingData?.hallId) {
        try {
          const hallData = await hallService.getById(bookingData.hallId);
          setHall(hallData);
        } catch (err) {
          console.error('Failed to load hall data:', err);
        }
      }
      
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
  }, [isOpen, bookingId]);

  const handleRetry = async () => {
    await fetchData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Loading state
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to load booking details</p>
            </div>
          </DialogContent>
        </Dialog>

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Booking Service Error"
          message={error?.message || 'Unable to load booking details. Please try again.'}
        />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Booking Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{booking.customerName}</h3>
              <p className="text-gray-600">Booking #{booking.id}</p>
            </div>
            <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
              {booking.status}
            </Badge>
          </div>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Event Date</p>
                  <p className="text-lg">{format(new Date(booking.eventDate), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Event Type</p>
                  <p className="text-lg">{booking.eventType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Guest Count</p>
                  <p className="text-lg">{booking.guestCount} guests</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time Slot</p>
                  <p className="text-lg">{booking.timeSlot}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Details */}
          {hall && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Venue Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Hall Name</p>
                    <p className="text-lg">{hall.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-lg">{hall.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Capacity</p>
                    <p className="text-lg">{hall.capacity} guests</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rate</p>
                    <p className="text-lg">₹{hall.rateCard.fullDayRate.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Name</p>
                  <p className="text-lg">{booking.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Number</p>
                  <p className="text-lg flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {booking.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {booking.customerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-lg flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {format(new Date(booking.createdAt), 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          {billingSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg font-semibold">₹{booking.totalAmount?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Advance Paid</p>
                    <p className="text-lg">₹{booking.advanceAmount?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Balance</p>
                    <p className="text-lg">₹{((booking.totalAmount || 0) - (booking.advanceAmount || 0)).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">GST Rate</p>
                    <p className="text-lg">{billingSettings.taxPercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
