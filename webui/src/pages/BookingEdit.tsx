import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { bookingService, hallService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/types';

const BookingEdit = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for data
  const [booking, setBooking] = useState<Booking | null>(null);
  const [clonedBooking, setClonedBooking] = useState<Booking | null>(null);
  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) {
        setError('No booking ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch the specific booking by ID
        const bookingData = await bookingService.getById(bookingId);
        setBooking(bookingData);
        
        // Clone the booking for editing
        if (bookingData) {
          setClonedBooking({ ...bookingData });
        }
        
        // Fetch hall data if booking exists
        if (bookingData?.hallId) {
          try {
            const hallData = await hallService.getById(bookingData.hallId);
            setHall(hallData);
          } catch (err) {
            console.error('Failed to load hall data:', err);
            setError('Failed to load hall data');
          }
        }
      } catch (err) {
        console.error('Failed to load booking edit data:', err);
        setError('Failed to load booking data. The booking may not exist.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);
  

  
  // Helper function to format date for HTML date input
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Otherwise, parse and format
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '';
      }
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // State initialization with proper type safety
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>('');
  const [eventType, setEventType] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<Booking['timeSlot']>('morning');
  const [guestCount, setGuestCount] = useState<string>('');
  const [status, setStatus] = useState<Booking['status']>('pending');
  const [statusReason, setStatusReason] = useState<string>('');
  const [lastContactDate, setLastContactDate] = useState<string>('');
  const [customerResponse, setCustomerResponse] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Update form state when booking data is loaded
  useEffect(() => {
    if (booking) {
      setCustomerName(booking.customerName || '');
      setCustomerEmail(booking.customerEmail || '');
      setCustomerPhone(booking.customerPhone || '');
      
      // Set event date with proper formatting
      setEventDate(formatDateForInput(booking.eventDate));
      
      setEventType(booking.eventType || '');
      setTimeSlot(booking.timeSlot || 'morning');
      setGuestCount(booking.guestCount?.toString() || '');
      setStatus(booking.status || 'pending');
      
      // Set last contact date with proper formatting
      setLastContactDate(formatDateForInput(booking.lastContactDate));
      
      setCustomerResponse(booking.customerResponse || '');
    }
  }, [booking]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !booking) {
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
                {error || 'Booking not found'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check if main booking details have changed
      const hasBookingDetailsChanged = 
        eventDate !== booking.eventDate ||
        timeSlot !== booking.timeSlot ||
        parseInt(guestCount) !== booking.guestCount;

      // Update main booking details if changed
      if (hasBookingDetailsChanged && clonedBooking) {
        const updatedBooking = {
          ...clonedBooking,
          eventDate,
          timeSlot,
          guestCount: parseInt(guestCount)
        };
        await bookingService.update(booking.id, updatedBooking);
      }

      // Update booking status if changed
      if (status !== booking.status) {
        await bookingService.updateBookingStatus(booking.id, status, statusReason);
      }
      
      // Update communication if provided
      if (lastContactDate || customerResponse) {
        await bookingService.updateBookingCommunication(booking.id, lastContactDate, customerResponse);
      }
      
      toast({
        title: 'Success',
        description: 'Booking updated successfully!',
      });
      
      navigate('/admin/bookings');
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/bookings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
        <h1 className="text-2xl font-bold">Edit Booking</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  disabled
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                disabled
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <p className="text-sm text-gray-600">You can edit the event date, time slot, and guest count below</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hall">Hall</Label>
                <Input
                  id="hall"
                  value={hall?.name || 'Loading...'}
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Input
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  required
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Time Slot</Label>
                <Select value={timeSlot} onValueChange={(value) => setTimeSlot(value as Booking['timeSlot'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="fullday">Full Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guestCount">Guest Count</Label>
                <Input
                  id="guestCount"
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  required
                  min="1"
                  max="2000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Booking['status'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {status !== booking.status && (
              <div className="space-y-2">
                <Label htmlFor="statusReason">Reason for Status Change</Label>
                <Textarea
                  id="statusReason"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Enter reason for status change..."
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastContactDate">Last Contact Date</Label>
                <Input
                  id="lastContactDate"
                  type="date"
                  value={lastContactDate}
                  onChange={(e) => setLastContactDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerResponse">Customer Response</Label>
              <Textarea
                id="customerResponse"
                value={customerResponse}
                onChange={(e) => setCustomerResponse(e.target.value)}
                placeholder="Enter customer response or communication notes..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/bookings')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Booking'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingEdit;
