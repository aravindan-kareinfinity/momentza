import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
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
    eventDate: '',
    eventStartDate: undefined as Date | undefined,
    eventEndDate: undefined as Date | undefined,
    timeSlot: '' as 'morning' | 'evening' | 'fullday' | '',
    guestCount: '',
    hallId: '',
    notes: '',
    totalAmount: 0,
    // New fields
    address: '',
    village: '',
    city: '',
    roomsRequired: false,
    roomsCount: 0
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  const [showHandoverInfo, setShowHandoverInfo] = useState(false);
  const [actualHandoverDate, setActualHandoverDate] = useState<Date | undefined>(undefined);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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

  // Handle event type change
  useEffect(() => {
    if (formData.eventType === 'wedding') {
      setShowHandoverInfo(true);
      // Auto-select fullday for wedding events
      setFormData(prev => ({ ...prev, timeSlot: 'fullday' }));
      
      // Calculate handover date if start date is set
      if (formData.eventStartDate) {
        const handoverDate = subDays(formData.eventStartDate, 1);
        setActualHandoverDate(handoverDate);
      }
    } else {
      setShowHandoverInfo(false);
      setActualHandoverDate(undefined);
      // Reset time slot if it was forced to fullday
      if (formData.timeSlot === 'fullday' && formData.eventType === 'wedding') {
        setFormData(prev => ({ ...prev, timeSlot: '' }));
      }
    }
  }, [formData.eventType, formData.eventStartDate]);

  // Validate dates when they change
  useEffect(() => {
    if (formData.eventStartDate && formData.eventEndDate) {
      const start = new Date(formData.eventStartDate);
      const end = new Date(formData.eventEndDate);
      
      // Reset end date if it's before start date
      if (end < start) {
        setFormData(prev => ({ ...prev, eventEndDate: undefined }));
        setDateError('End date cannot be before start date');
      } else {
        setDateError('');
        
        // Check if multi-day event is selected as morning/evening slot
        const isMultiDay = start.getTime() !== end.getTime();
        if (isMultiDay && formData.timeSlot && formData.timeSlot !== 'fullday') {
          setDateError('Multi-day events must use "Full Day" time slot');
        } else {
          setDateError('');
        }
      }
    } else {
      setDateError('');
    }
  }, [formData.eventStartDate, formData.eventEndDate, formData.timeSlot]);

  // Calculate total amount based on timeSlot selection and event type
  useEffect(() => {
    if (formData.timeSlot && formData.hallId && formData.eventStartDate && formData.eventEndDate) {
      const selectedHall = halls.find(hall => hall.id === formData.hallId);
      if (!selectedHall || !selectedHall.rateCard) return;
      
      const { rateCard } = selectedHall;
      let calculatedAmount = 0;
      
      // Calculate number of days (inclusive of both start and end dates)
      const start = new Date(formData.eventStartDate);
      const end = new Date(formData.eventEndDate);
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      // For weddings, check if it's multi-day wedding celebration
      const isMultiDayWedding = formData.eventType === 'wedding' && days > 1;
      
      if (formData.eventType === 'wedding') {
        // Wedding pricing logic
        if (isMultiDayWedding) {
          // Multi-day wedding celebration
          // First day: Full wedding rate (includes handover day before)
          // Subsequent days: Apply normal full day rate for each additional day
          calculatedAmount = rateCard.fullDayRate; // First day (wedding day with handover)
          if (days > 1) {
            calculatedAmount += rateCard.fullDayRate * (days - 1); // Additional celebration days
          }
        } else {
          // Single day wedding (with handover day before)
          calculatedAmount = rateCard.fullDayRate; // Wedding rate (includes handover)
        }
      } else {
        // Non-wedding events
        switch (formData.timeSlot) {
          case 'morning':
            calculatedAmount = (rateCard.morningRate || rateCard.halfDayRate || rateCard.fullDayRate * 0.6) * days;
            break;
          case 'evening':
            calculatedAmount = (rateCard.eveningRate || rateCard.halfDayRate || rateCard.fullDayRate * 0.6) * days;
            break;
          case 'fullday':
            calculatedAmount = rateCard.fullDayRate * days;
            break;
          default:
            calculatedAmount = 0;
        }
      }
      
      // Add room charges if rooms required
      if (formData.roomsRequired && formData.roomsCount > 0 && selectedHall.roomRate) {
        calculatedAmount += selectedHall.roomRate * formData.roomsCount * days;
      }
      
      setFormData(prev => ({ ...prev, totalAmount: calculatedAmount }));
    } else {
      setFormData(prev => ({ ...prev, totalAmount: 0 }));
    }
  }, [formData.timeSlot, formData.hallId, formData.eventStartDate, formData.eventEndDate, formData.eventType, formData.roomsRequired, formData.roomsCount, halls]);

  // Set event end date same as start date for single day events (non-wedding)
  useEffect(() => {
    if (formData.eventStartDate && formData.eventType !== 'wedding' && !formData.eventEndDate) {
      setFormData(prev => ({ ...prev, eventEndDate: formData.eventStartDate }));
    }
    
    // For weddings, also set end date same as start if not set
    if (formData.eventStartDate && formData.eventType === 'wedding' && !formData.eventEndDate) {
      setFormData(prev => ({ ...prev, eventEndDate: formData.eventStartDate }));
    }
  }, [formData.eventStartDate, formData.eventType]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleRetry = async () => {
    await fetchData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.hallId || !formData.eventStartDate || 
        !formData.eventEndDate || !formData.timeSlot || dateError) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Format dates to ISO strings
      const startDate = new Date(formData.eventStartDate);
      const endDate = new Date(formData.eventEndDate);
      let handoverStartDate: Date | undefined;
      
      // Calculate if it's a multi-day event
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      const isMultiDay = days > 1;
      const isWedding = formData.eventType === 'wedding';
      
      // Set times based on timeSlot, event type, and duration
      if (isWedding) {
        // Wedding events
        if (isMultiDay) {
          // Multi-day wedding celebration
          // First day: Handover starts day before at 2PM, event starts at event day 12PM
          handoverStartDate = subDays(startDate, 1);
          handoverStartDate.setHours(14, 0, 0, 0); // 2:00 PM day before
          
          startDate.setHours(12, 0, 0, 0); // Wedding starts at 12:00 PM on first day
          
          // Last day ends at 11:00 PM
          endDate.setHours(23, 0, 0, 0);
          
          // For multi-day weddings, middle days are full days
          // We'll set appropriate times for each day in the backend
        } else {
          // Single day wedding (with handover day before)
          handoverStartDate = subDays(startDate, 1);
          handoverStartDate.setHours(14, 0, 0, 0); // 2:00 PM day before
          
          startDate.setHours(12, 0, 0, 0); // Wedding starts at 12:00 PM
          endDate.setHours(23, 0, 0, 0); // 11:00 PM on wedding day
        }
      } else {
        // Non-wedding events
        if (formData.timeSlot === 'morning') {
          startDate.setHours(9, 0, 0, 0); // 9:00 AM
          endDate.setHours(15, 0, 0, 0); // 3:00 PM
        } else if (formData.timeSlot === 'evening') {
          startDate.setHours(16, 0, 0, 0); // 4:00 PM
          endDate.setHours(23, 0, 0, 0); // 11:00 PM
        } else if (formData.timeSlot === 'fullday') {
          startDate.setHours(9, 0, 0, 0); // 9:00 AM
          endDate.setHours(23, 0, 0, 0); // 11:00 PM
        }
        
        // For multi-day events with full day, adjust end date time
        if (isMultiDay && formData.timeSlot === 'fullday') {
          endDate.setHours(23, 0, 0, 0); // Last day ends at 11:00 PM
        }
      }
      
      await bookingService.createBooking({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        eventType: formData.eventType,
        eventDate: startDate.toISOString(),
        eventStartDate: startDate.toISOString(),
        eventEndDate: endDate.toISOString(),
        handoverStartDate: handoverStartDate ? handoverStartDate.toISOString() : undefined,
        timeSlot: formData.timeSlot,
        guestCount: parseInt(formData.guestCount) || 0,
        hallId: formData.hallId,
        organizationId: currentUser?.organizationId || '',
        status: 'pending',
        totalAmount: formData.totalAmount,
        // New fields
        address: formData.address,
        village: formData.village,
        city: formData.city,
        roomsRequired: formData.roomsRequired,
        roomsCount: formData.roomsRequired ? formData.roomsCount : 0,
        notes: formData.notes
      });
      
      onBookingAdded();
      onClose();
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        eventType: '',
        eventDate: '',
        eventStartDate: undefined,
        eventEndDate: undefined,
        timeSlot: '',
        guestCount: '',
        hallId: '',
        notes: '',
        totalAmount: 0,
        address: '',
        village: '',
        city: '',
        roomsRequired: false,
        roomsCount: 0
      });
      setDateError('');
      setShowHandoverInfo(false);
      setActualHandoverDate(undefined);
    } catch (error) {
      setError(error as Error);
      setShowErrorDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="eventType">Event Type *</Label>
              <Select 
                value={formData.eventType} 
                onValueChange={(value) => handleInputChange('eventType', value)}
                required
              >
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

            {/* Address Fields */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Full address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="village">Village/Town</Label>
              <Input
                id="village"
                value={formData.village}
                onChange={(e) => handleInputChange('village', e.target.value)}
                placeholder="Village or town name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City/District</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City or district"
              />
            </div>

            {/* Event Start Date */}
            <div className="space-y-2">
              <Label htmlFor="eventStartDate">Event Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.eventStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.eventStartDate ? format(formData.eventStartDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventStartDate}
                    onSelect={(date) => handleInputChange('eventStartDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Event End Date - Show for ALL event types including wedding */}
            <div className="space-y-2">
              <Label htmlFor="eventEndDate">Event End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.eventEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.eventEndDate ? format(formData.eventEndDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.eventEndDate}
                    onSelect={(date) => handleInputChange('eventEndDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {formData.eventType === 'wedding' && (
                <p className="text-xs text-gray-500">
                  Select end date for multi-day wedding celebrations
                </p>
              )}
            </div>

            {/* Wedding Handover Information */}
            {showHandoverInfo && actualHandoverDate && formData.eventStartDate && (
              <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <div className="text-blue-600 font-medium mr-2">ℹ️ Wedding Information:</div>
                  <div className="text-sm text-blue-700">
                    {formData.eventStartDate.getTime() === formData.eventEndDate?.getTime() ? (
                      <>
                        <strong>Single Day Wedding:</strong> Hall will be handed over on{' '}
                        <strong>{format(actualHandoverDate, "PPP")} at 2:00 PM</strong> (day before the wedding). 
                        Event starts on <strong>{format(formData.eventStartDate, "PPP")} at 12:00 PM</strong>.
                      </>
                    ) : (
                      <>
                        <strong>Multi-Day Wedding Celebration:</strong><br />
                        • Handover: <strong>{format(actualHandoverDate, "PPP")} at 2:00 PM</strong><br />
                        • Wedding Day: <strong>{format(formData.eventStartDate, "PPP")} at 12:00 PM</strong><br />
                        • Celebration ends: <strong>{format(formData.eventEndDate!, "PPP")} at 11:00 PM</strong>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {dateError && (
              <div className="col-span-2">
                <p className="text-sm text-red-500">{dateError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hallId">Hall *</Label>
              <Select 
                value={formData.hallId} 
                onValueChange={(value) => handleInputChange('hallId', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hall" />
                </SelectTrigger>
                <SelectContent>
                  {halls.map((hall) => (
                    <SelectItem key={hall.id} value={hall.id}>
                      {hall.name} - ₹{hall.rateCard?.fullDayRate?.toLocaleString() || '0'}
                      {hall.roomRate && ` (Rooms: ₹${hall.roomRate?.toLocaleString() || '0'}/room)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeSlot">Time Slot *</Label>
              <Select 
                value={formData.timeSlot} 
                onValueChange={(value: 'morning' | 'evening' | 'fullday') => handleInputChange('timeSlot', value)}
                disabled={!formData.hallId || !formData.eventStartDate || formData.eventType === 'wedding'}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    formData.eventType === 'wedding' ? 'Full Day (Wedding)' : 'Select time slot'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (9 AM - 3 PM)</SelectItem>
                  <SelectItem value="evening">Evening (4 PM - 11 PM)</SelectItem>
                  <SelectItem value="fullday">Full Day (9 AM - 11 PM)</SelectItem>
                </SelectContent>
              </Select>
              {formData.eventType === 'wedding' && (
                <p className="text-xs text-gray-500">Wedding events are always Full Day</p>
              )}
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

            {/* Rooms Required Checkbox and Count */}
            <div className="space-y-2 col-span-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="roomsRequired"
                  checked={formData.roomsRequired}
                  onCheckedChange={(checked) => handleInputChange('roomsRequired', checked)}
                />
                <Label htmlFor="roomsRequired" className="cursor-pointer">
                  Rooms Required
                </Label>
              </div>
              
              {formData.roomsRequired && (
                <div className="ml-6 mt-2">
                  <Label htmlFor="roomsCount">Number of Rooms</Label>
                  <Input
                    id="roomsCount"
                    type="number"
                    value={formData.roomsCount}
                    onChange={(e) => handleInputChange('roomsCount', parseInt(e.target.value) || 0)}
                    min="1"
                    max="20"
                    className="w-32"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Additional ₹{halls.find(h => h.id === formData.hallId)?.roomRate?.toLocaleString() || '0'} per room per day
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any special requirements, decorations, or additional information..."
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold">Total Amount:</span>
                {formData.eventStartDate && formData.eventEndDate && (
                  <p className="text-sm text-gray-500">
                    {formData.eventType === 'wedding' ? (
                      formData.eventStartDate.getTime() === formData.eventEndDate.getTime() ? (
                        'Single day wedding (includes handover day before)'
                      ) : (
                        `Multi-day wedding celebration (${Math.ceil((formData.eventEndDate.getTime() - formData.eventStartDate.getTime()) / (1000 * 3600 * 24)) + 1} days)`
                      )
                    ) : formData.eventStartDate.getTime() !== formData.eventEndDate.getTime() ? (
                      `Multi-day booking (${Math.ceil((formData.eventEndDate.getTime() - formData.eventStartDate.getTime()) / (1000 * 3600 * 24)) + 1} days)`
                    ) : (
                      'Single day booking'
                    )}
                  </p>
                )}
                {formData.roomsRequired && formData.roomsCount > 0 && (
                  <p className="text-sm text-gray-500">
                    Includes {formData.roomsCount} room(s)
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600 block">
                  ₹{formData.totalAmount.toLocaleString()}
                </span>
                {formData.timeSlot && formData.hallId && (
                  <span className="text-sm text-gray-500">
                    {formData.eventType === 'wedding' ? 
                      (formData.eventStartDate?.getTime() === formData.eventEndDate?.getTime() ? 
                        'Wedding Rate (with handover)' : 
                        'Wedding Multi-day Rate') : 
                     formData.timeSlot === 'morning' ? 'Morning Rate' :
                     formData.timeSlot === 'evening' ? 'Evening Rate' : 'Full Day Rate'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                !formData.customerName || 
                !formData.hallId || 
                !formData.eventStartDate || 
                !formData.eventEndDate || 
                !formData.timeSlot ||
                !!dateError ||
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