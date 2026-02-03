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
    address: '',
    village: '',
    city: '',
    requireRooms: false,
    requireFreeRooms: false,
    requireAcRooms: false,
    requireNonAcRooms: false,
    freeRoomsCount: 0,
    acRoomsCount: 0,
    nonAcRoomsCount: 0,
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [halls, setHalls] = useState<any[]>([]);
  const [selectedHall, setSelectedHall] = useState<any>(null);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  const [showHandoverInfo, setShowHandoverInfo] = useState(false);
  const [actualHandoverDate, setActualHandoverDate] = useState<Date | undefined>(undefined);

  // Get available rooms from selected hall
  const availableRooms = selectedHall?.amenities?.rooms || {
    free: 0,
    rentedAc: 0,
    rentedNonAc: 0,
    acRoomRate: 0,
    nonAcRoomRate: 0
  };

  // SIMPLIFIED: Fetch data when dialog opens - move fetchData inside useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      
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

    fetchData();
  }, [isOpen]); // Only depends on isOpen

  // Simplified: Handle event type change
  useEffect(() => {
    if (formData.eventType === 'wedding') {
      setShowHandoverInfo(true);
      // Only set timeSlot to fullday if it's not already set
      if (formData.timeSlot !== 'fullday') {
        setFormData(prev => ({ ...prev, timeSlot: 'fullday' }));
      }
    } else {
      setShowHandoverInfo(false);
    }
  }, [formData.eventType]); // Don't include timeSlot in dependencies

  // Calculate handover date
  useEffect(() => {
    if (formData.eventType === 'wedding' && formData.eventStartDate) {
      const handoverDate = subDays(formData.eventStartDate, 1);
      setActualHandoverDate(handoverDate);
    } else {
      setActualHandoverDate(undefined);
    }
  }, [formData.eventType, formData.eventStartDate]);

  // Validate dates
  useEffect(() => {
    if (formData.eventStartDate && formData.eventEndDate) {
      const start = new Date(formData.eventStartDate);
      const end = new Date(formData.eventEndDate);
      
      if (end < start) {
        setFormData(prev => ({ ...prev, eventEndDate: undefined }));
        setDateError('End date cannot be before start date');
      } else {
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

  // Update selected hall
  useEffect(() => {
    if (formData.hallId) {
      const hall = halls.find(h => h.id === formData.hallId);
      setSelectedHall(hall);
      
      // Reset room selections
      setFormData(prev => ({
        ...prev,
        requireRooms: false,
        requireFreeRooms: false,
        requireAcRooms: false,
        requireNonAcRooms: false,
        freeRoomsCount: 0,
        acRoomsCount: 0,
        nonAcRoomsCount: 0,
      }));
    } else {
      setSelectedHall(null);
    }
  }, [formData.hallId, halls]);

  // Calculate total amount - SIMPLIFIED to remove unnecessary dependencies
  useEffect(() => {
    const calculateTotal = () => {
      if (!formData.timeSlot || !formData.hallId || !formData.eventStartDate || !formData.eventEndDate) {
        setFormData(prev => ({ ...prev, totalAmount: 0 }));
        return;
      }
      
      if (!selectedHall || !selectedHall.rateCard) return;
      
      const { rateCard } = selectedHall;
      let calculatedAmount = 0;
      
      const start = new Date(formData.eventStartDate);
      const end = new Date(formData.eventEndDate);
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      if (formData.eventType === 'wedding') {
        calculatedAmount = rateCard.fullDayRate * days;
      } else {
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
      
      // Add room charges
      if (formData.requireAcRooms && formData.acRoomsCount > 0 && availableRooms.acRoomRate) {
        calculatedAmount += availableRooms.acRoomRate * formData.acRoomsCount * days;
      }
      
      if (formData.requireNonAcRooms && formData.nonAcRoomsCount > 0 && availableRooms.nonAcRoomRate) {
        calculatedAmount += availableRooms.nonAcRoomRate * formData.nonAcRoomsCount * days;
      }
      
      setFormData(prev => ({ ...prev, totalAmount: calculatedAmount }));
    };
    
    calculateTotal();
  }, [
    formData.timeSlot,
    formData.hallId,
    formData.eventStartDate,
    formData.eventEndDate,
    formData.eventType,
    formData.requireAcRooms,
    formData.acRoomsCount,
    formData.requireNonAcRooms,
    formData.nonAcRoomsCount,
    selectedHall,
    availableRooms.acRoomRate,
    availableRooms.nonAcRoomRate
  ]);

  // Set event end date same as start date
  useEffect(() => {
    if (formData.eventStartDate && !formData.eventEndDate) {
      setFormData(prev => ({ ...prev, eventEndDate: formData.eventStartDate }));
    }
  }, [formData.eventStartDate, formData.eventEndDate]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Use setTimeout to avoid state updates during render
      const timer = setTimeout(() => {
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
          requireRooms: false,
          requireFreeRooms: false,
          requireAcRooms: false,
          requireNonAcRooms: false,
          freeRoomsCount: 0,
          acRoomsCount: 0,
          nonAcRoomsCount: 0,
        });
        setSelectedHall(null);
        setDateError('');
        setShowHandoverInfo(false);
        setActualHandoverDate(undefined);
        setError(null);
        setShowErrorDialog(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleRetry = async () => {
    setLoading(true);
    try {
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

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const handleRequireRoomsChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      requireRooms: checked,
      requireFreeRooms: false,
      requireAcRooms: false,
      requireNonAcRooms: false,
      freeRoomsCount: 0,
      acRoomsCount: 0,
      nonAcRoomsCount: 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.hallId || !formData.eventStartDate || 
        !formData.eventEndDate || !formData.timeSlot || dateError) {
      return;
    }
  
    try {
      setSubmitting(true);
      
      const startDate = new Date(formData.eventStartDate);
      const endDate = new Date(formData.eventEndDate);
      let handoverStartDate: Date | undefined;
      
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      const isMultiDay = days > 1;
      const isWedding = formData.eventType === 'wedding';
      
      if (isWedding) {
        if (isMultiDay) {
          handoverStartDate = subDays(startDate, 1);
          handoverStartDate.setHours(14, 0, 0, 0);
          startDate.setHours(12, 0, 0, 0);
          endDate.setHours(23, 0, 0, 0);
        } else {
          handoverStartDate = subDays(startDate, 1);
          handoverStartDate.setHours(14, 0, 0, 0);
          startDate.setHours(12, 0, 0, 0);
          endDate.setHours(23, 0, 0, 0);
        }
      } else {
        if (formData.timeSlot === 'morning') {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(12, 0, 0, 0);
        } else if (formData.timeSlot === 'evening') {
          startDate.setHours(14, 0, 0, 0);
          endDate.setHours(23, 0, 0, 0);
        } else if (formData.timeSlot === 'fullday') {
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 0, 0, 0);
        }
      }
      
      let roomDetails: any = {
        Charges: {
          AcRoomCharges: 0,
          NonAcRoomCharges: 0,
          TotalRoomCharges: 0
        },
        RoomsCount: {
          Free: 0,
          RentedAc: 0,
          RentedNonAc: 0
        }
      };
      
      let totalRoomsCount = 0;
      
      if (formData.requireRooms) {
        if (formData.requireFreeRooms && formData.freeRoomsCount > 0) {
          roomDetails.RoomsCount.Free = formData.freeRoomsCount;
          totalRoomsCount += formData.freeRoomsCount;
        }
        
        if (formData.requireAcRooms && formData.acRoomsCount > 0) {
          roomDetails.RoomsCount.RentedAc = formData.acRoomsCount;
          totalRoomsCount += formData.acRoomsCount;
          roomDetails.Charges.AcRoomCharges = availableRooms.acRoomRate * formData.acRoomsCount * days;
        }
        
        if (formData.requireNonAcRooms && formData.nonAcRoomsCount > 0) {
          roomDetails.RoomsCount.RentedNonAc = formData.nonAcRoomsCount;
          totalRoomsCount += formData.nonAcRoomsCount;
          roomDetails.Charges.NonAcRoomCharges = availableRooms.nonAcRoomRate * formData.nonAcRoomsCount * days;
        }
        
        roomDetails.Charges.TotalRoomCharges = roomDetails.Charges.AcRoomCharges + roomDetails.Charges.NonAcRoomCharges;
      }
      
      const bookingData: any = {
        id: Date.now().toString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || '',
        eventType: formData.eventType,
        eventDate: startDate.toISOString(),
        eventStartDate: startDate.toISOString(),
        eventEndDate: endDate.toISOString(),
        handoverStartDate: handoverStartDate ? handoverStartDate.toISOString() : startDate.toISOString(),
        timeSlot: formData.timeSlot,
        guestCount: parseInt(formData.guestCount) || 0,
        hallId: formData.hallId,
        organizationId: currentUser?.organizationId || '',
        totalAmount: formData.totalAmount,
        address: formData.address || '',
        city: formData.city || '',
        village: formData.village || '',
        notes: formData.notes || '',
        roomsRequired: formData.requireRooms,
        roomsCount: totalRoomsCount,
        roomDetails: roomDetails,
        status: 'pending',
        isActive: true,
        customerResponse: '',
        lastContactDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('Booking data being sent:', JSON.stringify(bookingData, null, 2));
      
      await bookingService.createBooking(bookingData);
      
      onBookingAdded();
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      setError(error as Error);
      setShowErrorDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoomCountChange = (roomType: 'freeRoomsCount' | 'acRoomsCount' | 'nonAcRoomsCount', value: string) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, [roomType]: 0 }));
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      const maxRooms = {
        freeRoomsCount: availableRooms.free,
        acRoomsCount: availableRooms.rentedAc,
        nonAcRoomsCount: availableRooms.rentedNonAc
      }[roomType];
      
      setFormData(prev => ({ 
        ...prev, 
        [roomType]: Math.min(Math.max(0, numValue), maxRooms)
      }));
    }
  };

  const handleRoomCountBlur = (roomType: 'freeRoomsCount' | 'acRoomsCount' | 'nonAcRoomsCount') => {
    const currentValue = formData[roomType];
    const maxRooms = {
      freeRoomsCount: availableRooms.free,
      acRoomsCount: availableRooms.rentedAc,
      nonAcRoomsCount: availableRooms.rentedNonAc
    }[roomType];
    
    if (currentValue < 1) {
      setFormData(prev => ({ ...prev, [roomType]: 1 }));
    } else if (currentValue > maxRooms) {
      setFormData(prev => ({ ...prev, [roomType]: maxRooms }));
    }
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
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                required
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
              <Label htmlFor="city">City/District *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City or district"
                required
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

            {/* Event End Date */}
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
                      {hall.name} {/*- ₹{hall.rateCard?.fullDayRate?.toLocaleString() || '0'}
                      {hall.amenities?.rooms && (
                        <span className="text-xs ml-2">
                          {hall.amenities.rooms.free > 0 && `Free:${hall.amenities.rooms.free} `}
                          {hall.amenities.rooms.rentedAc > 0 && `AC:${hall.amenities.rooms.rentedAc} `}
                          {hall.amenities.rooms.rentedNonAc > 0 && `Non-AC:${hall.amenities.rooms.rentedNonAc}`}
                        </span>
                      )}*/}
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
                  <SelectItem value="morning">Morning (00 AM - 12 PM)</SelectItem>
                  <SelectItem value="evening">Evening (02 PM - 11 PM)</SelectItem>
                  <SelectItem value="fullday">Full Day (00 AM - 11 PM)</SelectItem>
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
          </div>

          {/* Rooms Required Section */}
          <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="roomsRequired"
                checked={formData.requireRooms}
                onCheckedChange={(checked) => handleRequireRoomsChange(checked as boolean)}
                disabled={!formData.hallId}
              />
              <Label htmlFor="roomsRequired" className="cursor-pointer font-medium">
                Rooms Required
              </Label>
            </div>
            
            {formData.requireRooms && (
              <div className="space-y-4 ml-6 border-l-2 border-gray-300 pl-4">
                {availableRooms.free === 0 && availableRooms.rentedAc === 0 && availableRooms.rentedNonAc === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-700">
                      No rooms available in this hall
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Free Rooms */}
                    {availableRooms.free > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requireFreeRooms"
                            checked={formData.requireFreeRooms}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              requireFreeRooms: checked as boolean,
                              freeRoomsCount: checked ? 1 : 0
                            }))}
                          />
                          <Label htmlFor="requireFreeRooms" className="font-medium">
                            Free Rooms (Available: {availableRooms.free})
                          </Label>
                        </div>
                        
                        {formData.requireFreeRooms && (
                          <div className="ml-6 space-y-2">
                            <div className="flex items-center space-x-4">
                              <div className="w-32">
                                <Label htmlFor="freeRoomsCount">Number of Rooms</Label>
                                <Input
                                  id="freeRoomsCount"
                                  type="number"
                                  value={formData.freeRoomsCount}
                                  onChange={(e) => handleRoomCountChange('freeRoomsCount', e.target.value)}
                                  onBlur={() => handleRoomCountBlur('freeRoomsCount')}
                                  min="1"
                                  max={availableRooms.free}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                  Max: {availableRooms.free} room(s) available
                                  <span className="ml-2 text-green-600 font-medium">
                                    (Free of charge)
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AC Rooms */}
                    {availableRooms.rentedAc > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requireAcRooms"
                            checked={formData.requireAcRooms}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              requireAcRooms: checked as boolean,
                              acRoomsCount: checked ? 1 : 0
                            }))}
                          />
                          <Label htmlFor="requireAcRooms" className="font-medium">
                            AC Rooms (Available: {availableRooms.rentedAc})
                          </Label>
                        </div>
                        
                        {formData.requireAcRooms && (
                          <div className="ml-6 space-y-2">
                            <div className="flex items-center space-x-4">
                              <div className="w-32">
                                <Label htmlFor="acRoomsCount">Number of Rooms</Label>
                                <Input
                                  id="acRoomsCount"
                                  type="number"
                                  value={formData.acRoomsCount}
                                  onChange={(e) => handleRoomCountChange('acRoomsCount', e.target.value)}
                                  onBlur={() => handleRoomCountBlur('acRoomsCount')}
                                  min="1"
                                  max={availableRooms.rentedAc}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                  Max: {availableRooms.rentedAc} room(s) available
                                  {availableRooms.acRoomRate > 0 && (
                                    <span className="ml-2 text-blue-600 font-medium">
                                      (₹{availableRooms.acRoomRate * formData.acRoomsCount}/day)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Non-AC Rooms */}
                    {availableRooms.rentedNonAc > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requireNonAcRooms"
                            checked={formData.requireNonAcRooms}
                            onCheckedChange={(checked) => setFormData(prev => ({ 
                              ...prev, 
                              requireNonAcRooms: checked as boolean,
                              nonAcRoomsCount: checked ? 1 : 0
                            }))}
                          />
                          <Label htmlFor="requireNonAcRooms" className="font-medium">
                            Non-AC Rooms (Available: {availableRooms.rentedNonAc})
                          </Label>
                        </div>
                        
                        {formData.requireNonAcRooms && (
                          <div className="ml-6 space-y-2">
                            <div className="flex items-center space-x-4">
                              <div className="w-32">
                                <Label htmlFor="nonAcRoomsCount">Number of Rooms</Label>
                                <Input
                                  id="nonAcRoomsCount"
                                  type="number"
                                  value={formData.nonAcRoomsCount}
                                  onChange={(e) => handleRoomCountChange('nonAcRoomsCount', e.target.value)}
                                  onBlur={() => handleRoomCountBlur('nonAcRoomsCount')}
                                  min="1"
                                  max={availableRooms.rentedNonAc}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                  Max: {availableRooms.rentedNonAc} room(s) available
                                  {availableRooms.nonAcRoomRate > 0 && (
                                    <span className="ml-2 text-amber-600 font-medium">
                                      (₹{availableRooms.nonAcRoomRate * formData.nonAcRoomsCount}/day)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info message when no room type is selected */}
                    {!formData.requireFreeRooms && !formData.requireAcRooms && !formData.requireNonAcRooms && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-700">
                          Please select at least one room type above
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
                {(formData.requireFreeRooms || formData.requireAcRooms || formData.requireNonAcRooms) && (
                  <p className="text-sm text-gray-500">
                    Includes: 
                    {formData.requireFreeRooms && formData.freeRoomsCount > 0 && ` ${formData.freeRoomsCount} free room(s)`}
                    {formData.requireAcRooms && formData.acRoomsCount > 0 && ` ${formData.acRoomsCount} AC room(s)`}
                    {formData.requireNonAcRooms && formData.nonAcRoomsCount > 0 && ` ${formData.nonAcRoomsCount} non-AC room(s)`}
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