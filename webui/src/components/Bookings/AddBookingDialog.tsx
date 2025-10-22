import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Booking } from '@/types';
import { authService, hallService, bookingService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

interface AddBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingAdded: () => void;
}

export function AddBookingDialog({ isOpen, onClose, onBookingAdded }: AddBookingDialogProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    eventType: '',
    eventDate: undefined as Date | undefined,
    timeSlot: '',
    guestCount: '',
    hallId: '',
    notes: ''
  });

  // State for data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [halls, setHalls] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data on component mount
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[AddBookingDialog] Fetching data...');
      const [user, hallsData] = await Promise.all([
        authService.getCurrentUser(),
        hallService.getAllHalls()
      ]);
      
      setCurrentUser(user);
      setHalls(hallsData || []);
      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch time slots when hall and date are selected
  const fetchTimeSlots = async () => {
    if (!formData.hallId || !formData.eventDate) {
      setTimeSlots([]);
      return;
    }

    try {
      const slots = await hallService.getAvailableTimeSlots(formData.hallId, formData.eventDate);
      setTimeSlots(slots || []);
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      setTimeSlots([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchTimeSlots();
  }, [formData.hallId, formData.eventDate]);

  const handleRetry = async () => {
    await fetchData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.hallId || !formData.eventDate || !formData.timeSlot) {
      return;
    }

    try {
      setSubmitting(true);
      await bookingService.createBooking({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        eventType: formData.eventType,
        eventDate: formData.eventDate?.toISOString() || '',
        timeSlot: formData.timeSlot as "morning" | "evening" | "fullday",
        guestCount: parseInt(formData.guestCount) || 0,
        hallId: formData.hallId,
        organizationId: currentUser?.organizationId || '',
        status: 'pending',
        totalAmount: 0
      });
      onBookingAdded();
      onClose();
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        eventType: '',
        eventDate: undefined,
        timeSlot: '',
        guestCount: '',
        hallId: '',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to create booking:', error);
      setError(error as Error);
      setShowErrorDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Loading state
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Booking</DialogTitle>
          </DialogHeader>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error || !currentUser || !halls) {
    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Booking</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to load booking form</p>
            </div>
          </DialogContent>
        </Dialog>

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Booking Service Error"
          message={error?.message || 'Unable to load booking data. Please try again.'}
        />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Booking</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={formData.eventType} onValueChange={(value) => handleInputChange('eventType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="corporate">Corporate Event</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.eventDate ? format(formData.eventDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventDate}
                    onSelect={(date) => handleInputChange('eventDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hallId">Hall *</Label>
              <Select value={formData.hallId} onValueChange={(value) => handleInputChange('hallId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hall" />
                </SelectTrigger>
                <SelectContent>
                  {halls.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name} - ₹{hall.rateCard.fullDayRate.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeSlot">Time Slot *</Label>
              <Select 
                value={formData.timeSlot} 
                onValueChange={(value) => handleInputChange('timeSlot', value)}
                disabled={!formData.hallId || !formData.eventDate || timeSlots.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={timeSlots.length === 0 ? "No slots available" : "Select time slot"} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots?.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label} - ₹{slot.price.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount">Guest Count</Label>
              <Input
                id="guestCount"
                type="number"
                value={formData.guestCount}
                onChange={(e) => handleInputChange('guestCount', e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                !formData.customerName || 
                !formData.hallId || 
                !formData.eventDate || 
                !formData.timeSlot ||
                submitting
              }
            >
              {submitting ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
