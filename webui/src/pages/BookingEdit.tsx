import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Home, Building, CalendarIcon } from 'lucide-react';
import { bookingService, hallService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { Booking } from '@/types';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, parseISO, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

const BookingEdit = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for data
  const [originalBooking, setOriginalBooking] = useState<Booking | null>(null);
  const [hall, setHall] = useState<any>(null);
  const [halls, setHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [eventStartDate, setEventStartDate] = useState<Date | undefined>(undefined);
  const [eventEndDate, setEventEndDate] = useState<Date | undefined>(undefined);
  const [eventType, setEventType] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<Booking['timeSlot']>('morning');
  const [guestCount, setGuestCount] = useState<string>('');
  const [status, setStatus] = useState<Booking['status']>('pending');
  const [statusReason, setStatusReason] = useState<string>('');
  const [lastContactDate, setLastContactDate] = useState<string>('');
  const [customerResponse, setCustomerResponse] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // New fields state
  const [address, setAddress] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Room fields state - Updated to match response structure
  const [roomsRequired, setRoomsRequired] = useState<boolean>(false);
  const [requireFreeRooms, setRequireFreeRooms] = useState<boolean>(false);
  const [requireAcRooms, setRequireAcRooms] = useState<boolean>(false);
  const [requireNonAcRooms, setRequireNonAcRooms] = useState<boolean>(false);
  const [freeRoomsCount, setFreeRoomsCount] = useState<number>(0);
  const [acRoomsCount, setAcRoomsCount] = useState<number>(0);
  const [nonAcRoomsCount, setNonAcRoomsCount] = useState<number>(0);
  
  // Wedding specific state
  const [showHandoverInfo, setShowHandoverInfo] = useState<boolean>(false);
  const [actualHandoverDate, setActualHandoverDate] = useState<Date | undefined>(undefined);
  const [dateError, setDateError] = useState<string>('');
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Available event types
  const availableEventTypes = [
    'wedding',
    'reception',
    'birthday',
    'corporate',
    'conference',
    'seminar',
    'anniversary',
    'baby shower',
    'other'
  ];

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
        
        // Fetch all halls for selection
        const allHalls = await hallService.getAllHalls();
        setHalls(allHalls);
        
        // Fetch the specific booking by ID
        const bookingData = await bookingService.getById(bookingId);
        setOriginalBooking(bookingData);
        
        console.log('Fetched booking data:', bookingData);
        
        // Set total amount from response
        if (bookingData?.totalAmount) {
          setTotalAmount(bookingData.totalAmount);
        }
        
        // Fetch current hall data if booking exists
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

  // Update form state when booking data is loaded
  useEffect(() => {
    if (originalBooking) {
      console.log('Setting form state from booking:', originalBooking);
      
      setCustomerName(originalBooking.customerName || '');
      setCustomerEmail(originalBooking.customerEmail || '');
      setCustomerPhone(originalBooking.customerPhone || '');
      
      // Set event dates
      if (originalBooking.eventStartDate) {
        const startDate = parseISO(originalBooking.eventStartDate);
        setEventStartDate(startDate);
      }
      if (originalBooking.eventEndDate) {
        const endDate = parseISO(originalBooking.eventEndDate);
        setEventEndDate(endDate);
      }
      
      setEventType(originalBooking.eventType || '');
      setTimeSlot(originalBooking.timeSlot || 'morning');
      setGuestCount(originalBooking.guestCount?.toString() || '');
      setStatus(originalBooking.status || 'pending');
      
      // Set last contact date
      if (originalBooking.lastContactDate) {
        const date = parseISO(originalBooking.lastContactDate);
        setLastContactDate(format(date, 'yyyy-MM-dd'));
      }
      
      setCustomerResponse(originalBooking.customerResponse || '');
      
      // Set new fields
      setAddress(originalBooking.address || '');
      setVillage(originalBooking.village || '');
      setCity(originalBooking.city || '');
      setRoomsRequired(originalBooking.roomsRequired || false);
      setNotes(originalBooking.notes || '');
      
      // Set room details from response
      if (originalBooking.roomDetails) {
        const roomDetails = originalBooking.roomDetails;
        console.log('Room details from response:', roomDetails);
        
        // Handle both lowercase and uppercase property names
        const roomsCount = roomDetails.RoomsCount || roomDetails.RoomsCount;
        const charges = roomDetails.Charges || roomDetails.Charges;
        
        if (roomsCount) {
          const freeCount = roomsCount.Free || roomsCount.Free || 0;
          const acCount = roomsCount.RentedAc || roomsCount.RentedAc || 0;
          const nonAcCount = roomsCount.RentedNonAc || roomsCount.RentedNonAc || 0;
          
          console.log('Room counts:', { freeCount, acCount, nonAcCount });
          
          setFreeRoomsCount(freeCount);
          setAcRoomsCount(acCount);
          setNonAcRoomsCount(nonAcCount);
          
          // Determine which room types are required
          if (freeCount > 0) {
            setRequireFreeRooms(true);
          }
          if (acCount > 0) {
            setRequireAcRooms(true);
          }
          if (nonAcCount > 0) {
            setRequireNonAcRooms(true);
          }
        }
      }
      
      // Check if it's a multi-day event
      if (originalBooking.eventStartDate && originalBooking.eventEndDate) {
        const start = parseISO(originalBooking.eventStartDate);
        const end = parseISO(originalBooking.eventEndDate);
        setIsMultiDay(!isSameDay(start, end));
      }
      
      // Trigger wedding handover info if event type is wedding
      if (originalBooking.eventType === 'wedding' && originalBooking.eventStartDate) {
        setShowHandoverInfo(true);
        const startDate = parseISO(originalBooking.eventStartDate);
        const handoverDate = subDays(startDate, 1);
        setActualHandoverDate(handoverDate);
      }
    }
  }, [originalBooking]);

  // Handle event type change for wedding
  useEffect(() => {
    if (eventType === 'wedding') {
      setShowHandoverInfo(true);
      // Auto-select fullday for wedding events
      setTimeSlot('fullday');
      
      // Calculate handover date (day before at 2PM)
      if (eventStartDate) {
        const handoverDate = subDays(eventStartDate, 1);
        setActualHandoverDate(handoverDate);
      }
    } else {
      setShowHandoverInfo(false);
      setActualHandoverDate(undefined);
    }
  }, [eventType, eventStartDate]);

  // Handle date changes
  useEffect(() => {
    if (eventStartDate && eventEndDate) {
      const start = startOfDay(new Date(eventStartDate));
      const end = startOfDay(new Date(eventEndDate));
      
      // Check if end date is before start date
      if (end < start) {
        setEventEndDate(eventStartDate);
        setDateError('End date cannot be before start date');
        setIsMultiDay(false);
        return;
      }
      
      // Check if multi-day
      const multiDay = !isSameDay(start, end);
      setIsMultiDay(multiDay);
      
      // Check if multi-day event is selected as morning/evening slot
      if (multiDay && timeSlot && timeSlot !== 'fullday' && eventType !== 'wedding') {
        setDateError('Multi-day events must use "Full Day" time slot');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [eventStartDate, eventEndDate, timeSlot, eventType]);

  // Calculate number of days
  const calculateDays = () => {
    if (!eventStartDate || !eventEndDate) return 0;
    const start = startOfDay(eventStartDate);
    const end = startOfDay(eventEndDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calculate hall charges (without rooms)
  const calculateHallCharges = (): number => {
    if (!hall?.rateCard || !timeSlot || !eventStartDate || !eventEndDate) return 0;
    
    const { rateCard } = hall;
    let calculatedAmount = 0;
    
    // Calculate number of days
    const days = calculateDays();
    
    if (eventType === 'wedding') {
      // Wedding pricing logic
      if (isMultiDay) {
        // Multi-day wedding celebration
        calculatedAmount = rateCard.fullDayRate * days;
      } else {
        // Single day wedding (with handover day before)
        calculatedAmount = rateCard.fullDayRate; // Wedding rate (includes handover)
      }
    } else {
      // Non-wedding events
      const dailyRate = () => {
        switch (timeSlot) {
          case 'morning':
            return rateCard.morningRate || rateCard.halfDayRate || rateCard.fullDayRate * 0.6;
          case 'evening':
            return rateCard.eveningRate || rateCard.halfDayRate || rateCard.fullDayRate * 0.6;
          case 'fullday':
            return rateCard.fullDayRate;
          default:
            return 0;
        }
      };
      
      calculatedAmount = dailyRate() * days;
    }
    
    return Math.round(calculatedAmount);
  };

  // Calculate room charges
  const calculateRoomCharges = () => {
    if (!eventStartDate || !eventEndDate || !hall) return { acCharges: 0, nonAcCharges: 0, total: 0 };
    
    const days = calculateDays();
    const availableRooms = hall?.amenities?.rooms || {
      acRoomRate: 0,
      nonAcRoomRate: 0
    };
    
    const acCharges = availableRooms.acRoomRate * acRoomsCount * days;
    const nonAcCharges = availableRooms.nonAcRoomRate * nonAcRoomsCount * days;
    const total = acCharges + nonAcCharges;
    
    return { acCharges, nonAcCharges, total };
  };

  // Calculate total amount (hall + room charges)
  const calculateTotalAmount = (): number => {
    const hallCharges = calculateHallCharges();
    const roomCharges = calculateRoomCharges();
    
    return hallCharges + roomCharges.total;
  };

  // Update total amount when dependencies change
  useEffect(() => {
    if (eventStartDate && eventEndDate && hall && timeSlot) {
      const calculated = calculateTotalAmount();
      setTotalAmount(calculated);
    }
  }, [eventStartDate, eventEndDate, hall, timeSlot, eventType, 
      requireAcRooms, acRoomsCount, requireNonAcRooms, nonAcRoomsCount, isMultiDay]);

  // Handle hall change
  const handleHallChange = (newHallId: string) => {
    const selectedHall = halls.find(h => h.id === newHallId);
    if (selectedHall) {
      setHall(selectedHall);
    }
  };

  // Set time based on time slot
  const setTimeForTimeSlot = (date: Date, timeSlot: string, isStart: boolean = true): Date => {
    const newDate = new Date(date);
    
    if (eventType === 'wedding') {
      if (isStart) {
        newDate.setHours(12, 0, 0, 0); // Wedding starts at 12:00 PM
      } else {
        newDate.setHours(23, 0, 0, 0); // Ends at 11:00 PM
      }
    } else {
      switch (timeSlot) {
        case 'morning':
          if (isStart) {
            newDate.setHours(9, 0, 0, 0); // 9:00 AM
          } else {
            newDate.setHours(15, 0, 0, 0); // 3:00 PM
          }
          break;
        case 'evening':
          if (isStart) {
            newDate.setHours(16, 0, 0, 0); // 4:00 PM
          } else {
            newDate.setHours(23, 0, 0, 0); // 11:00 PM
          }
          break;
        case 'fullday':
          if (isStart) {
            newDate.setHours(9, 0, 0, 0); // 9:00 AM
          } else {
            newDate.setHours(23, 0, 0, 0); // 11:00 PM
          }
          break;
        default:
          if (isStart) {
            newDate.setHours(9, 0, 0, 0);
          } else {
            newDate.setHours(23, 0, 0, 0);
          }
      }
    }
    
    return newDate;
  };

  // Handle main room requirement toggle
  const handleRequireRoomsChange = (checked: boolean) => {
    setRoomsRequired(checked);
    
    // Reset all room selections when turning off rooms required
    if (!checked) {
      setRequireFreeRooms(false);
      setRequireAcRooms(false);
      setRequireNonAcRooms(false);
      setFreeRoomsCount(0);
      setAcRoomsCount(0);
      setNonAcRoomsCount(0);
    } else {
      // When turning on rooms required, auto-check at least one room type if none selected
      if (!requireFreeRooms && !requireAcRooms && !requireNonAcRooms) {
        setRequireAcRooms(true);
        setAcRoomsCount(1);
      }
    }
  };

  // Handle room count change with validation
  const handleRoomCountChange = (roomType: string, value: string) => {
    const numValue = parseInt(value) || 0;
    
    // Get available rooms from selected hall
    const availableRooms = hall?.amenities?.rooms || {
      free: 0,
      rentedAc: 0,
      rentedNonAc: 0
    };
    
    // Set max rooms based on availability
    const maxRooms = {
      'freeRoomsCount': availableRooms.free,
      'acRoomsCount': availableRooms.rentedAc,
      'nonAcRoomsCount': availableRooms.rentedNonAc
    }[roomType] || 20;
    
    const finalValue = Math.min(Math.max(0, numValue), maxRooms);
    
    switch (roomType) {
      case 'freeRoomsCount':
        setFreeRoomsCount(finalValue);
        // Auto-check/uncheck the checkbox based on count
        setRequireFreeRooms(finalValue > 0);
        break;
      case 'acRoomsCount':
        setAcRoomsCount(finalValue);
        // Auto-check/uncheck the checkbox based on count
        setRequireAcRooms(finalValue > 0);
        break;
      case 'nonAcRoomsCount':
        setNonAcRoomsCount(finalValue);
        // Auto-check/uncheck the checkbox based on count
        setRequireNonAcRooms(finalValue > 0);
        break;
    }
  };

  // Calculate total rooms count
  const calculateTotalRoomsCount = () => {
    return freeRoomsCount + acRoomsCount + nonAcRoomsCount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalBooking) {
      toast({
        title: 'Error',
        description: 'No booking data found',
        variant: 'destructive',
      });
      return;
    }

    if (!eventStartDate || !eventEndDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }

    if (dateError) {
      toast({
        title: 'Error',
        description: dateError,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Calculate days and room charges
      const days = calculateDays();
      const roomCharges = calculateRoomCharges();
      
      // Set times for start and end dates
      const eventStartDateTime = setTimeForTimeSlot(eventStartDate, timeSlot, true);
      const eventEndDateTime = setTimeForTimeSlot(eventEndDate, timeSlot, false);
      
      // Calculate handover date for weddings
      let handoverStartDate: Date | undefined;
      if (eventType === 'wedding') {
        handoverStartDate = subDays(eventStartDateTime, 1);
        handoverStartDate.setHours(14, 0, 0, 0); // 2:00 PM day before
      }
      
      // Prepare room details according to backend model - Use uppercase for consistency
      const roomDetails: any = {
        Charges: {
          AcRoomCharges: roomCharges.acCharges,
          NonAcRoomCharges: roomCharges.nonAcCharges,
          TotalRoomCharges: roomCharges.total
        },
        RoomsCount: {
          Free: freeRoomsCount,
          RentedAc: acRoomsCount,
          RentedNonAc: nonAcRoomsCount
        }
      };
      
      // Calculate final total amount
      const finalTotalAmount = calculateTotalAmount();
      
      // Prepare the updated booking object
      const updatedBooking: any = {
        id: originalBooking.id,
        organizationId: originalBooking.organizationId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        eventStartDate: eventStartDateTime.toISOString(),
        eventEndDate: eventEndDateTime.toISOString(),
        eventDate: format(eventStartDate, 'yyyy-MM-dd'),
        eventType: eventType,
        timeSlot: timeSlot,
        guestCount: parseInt(guestCount) || 0,
        address: address,
        village: village,
        city: city,
        roomsRequired: roomsRequired,
        roomsCount: calculateTotalRoomsCount(),
        roomDetails: roomDetails,
        notes: notes,
        // FIX: Use the calculated total amount instead of original
        totalAmount: finalTotalAmount,
        status: status,
        hallId: originalBooking.hallId, // Keep original hall ID
        updatedAt: new Date().toISOString(),
        lastContactDate: lastContactDate || null,
        customerResponse: customerResponse || null,
        isActive: originalBooking.isActive !== false
      };
      
      // Add handover date for weddings
      if (eventType === 'wedding' && handoverStartDate) {
        updatedBooking.handoverStartDate = handoverStartDate.toISOString();
      }

      console.log('Updating booking with data:', JSON.stringify(updatedBooking, null, 2));

      // Update booking
      await bookingService.update(originalBooking.id, updatedBooking);

      // Update booking status log if status changed
      if (status !== originalBooking.status || statusReason) {
        await bookingService.updateBookingStatus(
          originalBooking.id, 
          status, 
          statusReason || `Status changed from ${originalBooking.status} to ${status}`
        );
      }

      toast({
        title: 'Success',
        description: `Booking updated successfully! Total Amount: ₹${finalTotalAmount.toLocaleString()}`,
      });

      // Navigate back after a brief delay
      setTimeout(() => {
        navigate('/admin/bookings');
      }, 1000);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <AnimatedPage className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Show error state
  if (error || !originalBooking) {
    return (
      <AnimatedPage className="space-y-6">
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
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/admin/bookings')}
          >
            Back to Bookings
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  // Get available rooms from selected hall
  const availableRooms = hall?.amenities?.rooms || {
    free: 0,
    rentedAc: 0,
    rentedNonAc: 0,
    acRoomRate: 0,
    nonAcRoomRate: 0
  };

  // Calculate breakdown for display
  const hallCharges = calculateHallCharges();
  const roomCharges = calculateRoomCharges();

  return (
    <AnimatedPage className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, Street, Area"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="village">Village/Town</Label>
                <Input
                  id="village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Enter village or town"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City/District *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city or district"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <p className="text-sm text-gray-600">You can edit the event details below</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hall">Hall *</Label>
                <Select 
                  value={hall?.id || ''} 
                  onValueChange={handleHallChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hall" />
                  </SelectTrigger>
                  <SelectContent>
                    {halls.map((hallItem) => (
                      <SelectItem key={hallItem.id} value={hallItem.id}>
                        {hallItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hall && (
                  <p className="text-sm text-gray-600 mt-1">
                    Current: {hall.name}
                    {hall.rateCard && (
                      <span className="ml-2">
                        (₹{hall.rateCard.fullDayRate?.toLocaleString()}/day)
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select 
                  value={eventType} 
                  onValueChange={(value) => {
                    setEventType(value);
                    if (value === 'wedding') {
                      setTimeSlot('fullday');
                    }
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEventTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Event Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventStartDate">Event Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventStartDate ? format(eventStartDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={eventStartDate}
                      onSelect={setEventStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventEndDate">Event End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !eventEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {eventEndDate ? format(eventEndDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={eventEndDate}
                      onSelect={setEventEndDate}
                      disabled={(date) => !eventStartDate || date < eventStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {eventType === 'wedding' && (
                  <p className="text-xs text-gray-500">
                    Select end date for multi-day wedding celebrations
                  </p>
                )}
              </div>
            </div>
            
            {dateError && (
              <div className="col-span-2">
                <Alert variant="destructive">
                  <AlertDescription>{dateError}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Wedding Handover Information */}
            {showHandoverInfo && actualHandoverDate && eventStartDate && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-700">
                  {isMultiDay ? (
                    <>
                      <strong>Multi-Day Wedding Celebration:</strong><br />
                      • Handover: <strong>{format(actualHandoverDate, "PPP")} at 2:00 PM</strong><br />
                      • Wedding Day: <strong>{format(eventStartDate, "PPP")} at 12:00 PM</strong><br />
                      • Celebration ends: <strong>{format(eventEndDate!, "PPP")} at 11:00 PM</strong><br />
                      • Duration: {calculateDays()} days
                    </>
                  ) : (
                    <>
                      <strong>Single Day Wedding:</strong> Hall will be handed over on{' '}
                      <strong>{format(actualHandoverDate, "PPP")} at 2:00 PM</strong> (day before the wedding). 
                      Event starts on <strong>{format(eventStartDate, "PPP")} at 12:00 PM</strong>.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Slot Select */}
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Time Slot *</Label>
                <Select 
                  value={timeSlot} 
                  onValueChange={(value: Booking['timeSlot']) => setTimeSlot(value)}
                  disabled={eventType === 'wedding' || !eventStartDate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      eventType === 'wedding' ? 'Full Day (Wedding)' : 'Select time slot'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (00 AM - 12 PM)</SelectItem>
                    <SelectItem value="evening">Evening (02 PM - 11 PM)</SelectItem>
                    <SelectItem value="fullday">Full Day (00 AM - 11 PM)</SelectItem>
                  </SelectContent>
                </Select>
                {eventType === 'wedding' && (
                  <p className="text-xs text-gray-500 mt-1">Wedding events are always Full Day</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guestCount">Guest Count</Label>
                <Input
                  id="guestCount"
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                />
              </div>
            </div>

            {/* Rooms Required Section */}
            <div className="space-y-2 border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="roomsRequired"
                  checked={roomsRequired}
                  onCheckedChange={(checked) => handleRequireRoomsChange(checked as boolean)}
                  disabled={!hall}
                />
                <Label htmlFor="roomsRequired" className="cursor-pointer font-medium">
                  Rooms Required
                </Label>
              </div>
              
              {roomsRequired && (
                <div className="space-y-4 ml-6 border-l-2 border-gray-300 pl-4">
                  {/* Check if hall has rooms available */}
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
                              checked={requireFreeRooms}
                              onCheckedChange={(checked) => {
                                setRequireFreeRooms(checked as boolean);
                                if (checked) {
                                  setFreeRoomsCount(freeRoomsCount > 0 ? freeRoomsCount : 1);
                                } else {
                                  setFreeRoomsCount(0);
                                }
                              }}
                            />
                            <Label htmlFor="requireFreeRooms" className="font-medium">
                              Free Rooms (Available: {availableRooms.free})
                            </Label>
                          </div>
                          
                          {requireFreeRooms && (
                            <div className="ml-6 space-y-2">
                              <div className="flex items-center space-x-4">
                                <div className="w-32">
                                  <Label htmlFor="freeRoomsCount">Number of Rooms</Label>
                                  <Input
                                    id="freeRoomsCount"
                                    type="number"
                                    value={freeRoomsCount}
                                    onChange={(e) => handleRoomCountChange('freeRoomsCount', e.target.value)}
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
                              checked={requireAcRooms}
                              onCheckedChange={(checked) => {
                                setRequireAcRooms(checked as boolean);
                                if (checked) {
                                  setAcRoomsCount(acRoomsCount > 0 ? acRoomsCount : 1);
                                } else {
                                  setAcRoomsCount(0);
                                }
                              }}
                            />
                            <Label htmlFor="requireAcRooms" className="font-medium">
                              AC Rooms (Available: {availableRooms.rentedAc})
                            </Label>
                          </div>
                          
                          {requireAcRooms && (
                            <div className="ml-6 space-y-2">
                              <div className="flex items-center space-x-4">
                                <div className="w-32">
                                  <Label htmlFor="acRoomsCount">Number of Rooms</Label>
                                  <Input
                                    id="acRoomsCount"
                                    type="number"
                                    value={acRoomsCount}
                                    onChange={(e) => handleRoomCountChange('acRoomsCount', e.target.value)}
                                    min="1"
                                    max={availableRooms.rentedAc}
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-600">
                                    Max: {availableRooms.rentedAc} room(s) available
                                    {availableRooms.acRoomRate > 0 && (
                                      <span className="ml-2 text-blue-600 font-medium">
                                        (₹{availableRooms.acRoomRate * acRoomsCount}/day)
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
                              checked={requireNonAcRooms}
                              onCheckedChange={(checked) => {
                                setRequireNonAcRooms(checked as boolean);
                                if (checked) {
                                  setNonAcRoomsCount(nonAcRoomsCount > 0 ? nonAcRoomsCount : 1);
                                } else {
                                  setNonAcRoomsCount(0);
                                }
                              }}
                            />
                            <Label htmlFor="requireNonAcRooms" className="font-medium">
                              Non-AC Rooms (Available: {availableRooms.rentedNonAc})
                            </Label>
                          </div>
                          
                          {requireNonAcRooms && (
                            <div className="ml-6 space-y-2">
                              <div className="flex items-center space-x-4">
                                <div className="w-32">
                                  <Label htmlFor="nonAcRoomsCount">Number of Rooms</Label>
                                  <Input
                                    id="nonAcRoomsCount"
                                    type="number"
                                    value={nonAcRoomsCount}
                                    onChange={(e) => handleRoomCountChange('nonAcRoomsCount', e.target.value)}
                                    min="1"
                                    max={availableRooms.rentedNonAc}
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-600">
                                    Max: {availableRooms.rentedNonAc} room(s) available
                                    {availableRooms.nonAcRoomRate > 0 && (
                                      <span className="ml-2 text-amber-600 font-medium">
                                        (₹{availableRooms.nonAcRoomRate * nonAcRoomsCount}/day)
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
                      {!requireFreeRooms && !requireAcRooms && !requireNonAcRooms && (
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

            {/* Total Amount Display with Breakdown */}
            <div className="border-t pt-4 mt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">Total Amount Calculation</span>
                    {eventStartDate && eventEndDate && (
                      <p className="text-sm text-gray-500">
                        {eventType === 'wedding' ? (
                          isMultiDay ? (
                            `Multi-day wedding celebration (${calculateDays()} days)`
                          ) : (
                            'Single day wedding (includes handover day before)'
                          )
                        ) : isMultiDay ? (
                          `Multi-day booking (${calculateDays()} days)`
                        ) : (
                          'Single day booking'
                        )}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600 block">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {originalBooking.totalAmount !== totalAmount ? (
                        <span className="text-amber-600">
                          (Updated from ₹{originalBooking.totalAmount.toLocaleString()})
                        </span>
                      ) : 'Current total'}
                    </span>
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="border-t pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-2">Hall Charges:</p>
                      <div className="space-y-1 pl-4">
                        <div className="flex justify-between">
                          <span>Base Rate:</span>
                          <span>₹{hallCharges.toLocaleString()}</span>
                        </div>
                        <div className="text-gray-500">
                          {eventType === 'wedding' ? 'Wedding Rate' : 
                           timeSlot === 'morning' ? 'Morning Slot' :
                           timeSlot === 'evening' ? 'Evening Slot' : 'Full Day Slot'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-2">Room Charges:</p>
                      <div className="space-y-1 pl-4">
                        {requireAcRooms && acRoomsCount > 0 && (
                          <div className="flex justify-between">
                            <span>{acRoomsCount} AC Room(s):</span>
                            <span>₹{roomCharges.acCharges.toLocaleString()}</span>
                          </div>
                        )}
                        {requireNonAcRooms && nonAcRoomsCount > 0 && (
                          <div className="flex justify-between">
                            <span>{nonAcRoomsCount} Non-AC Room(s):</span>
                            <span>₹{roomCharges.nonAcCharges.toLocaleString()}</span>
                          </div>
                        )}
                        {requireFreeRooms && freeRoomsCount > 0 && (
                          <div className="flex justify-between">
                            <span>{freeRoomsCount} Free Room(s):</span>
                            <span className="text-green-600">Free</span>
                          </div>
                        )}
                        {!roomsRequired && (
                          <div className="text-gray-500">No rooms selected</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes & Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any special notes or additional information..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            
            {status !== originalBooking.status && (
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
            <div className="space-y-2">
              <Label htmlFor="lastContactDate">Last Contact Date</Label>
              <Input
                id="lastContactDate"
                type="date"
                value={lastContactDate}
                onChange={(e) => setLastContactDate(e.target.value)}
              />
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
          <Button 
            type="submit" 
            disabled={submitting || !!dateError}
            className="min-w-[120px]"
          >
            {submitting ? 'Updating...' : 'Update Booking'}
          </Button>
        </div>
      </form>
    </AnimatedPage>
  );
};

export default BookingEdit;