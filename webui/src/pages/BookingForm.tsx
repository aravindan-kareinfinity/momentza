import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Calendar, MapPin, Users, Clock, Home, MapPinned, Building, Utensils, Info, FileText, CheckCircle2, Shield, Bed } from 'lucide-react';
import { hallService, bookingService, servicesService } from '@/services/ServiceFactory';
import { Hall, Booking } from '@/types';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const BookingForm = () => {
  const { hallId } = useParams<{ hallId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const firstInputRef = useRef<HTMLInputElement>(null);

  const selectedDate = searchParams.get('date');

  // State for data
  const [hall, setHall] = useState<Hall | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!hallId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [hallData, servicesData] = await Promise.all([
          hallService.getById(hallId),
          servicesService.getAllServices()
        ]);

        setHall(hallData);
        setServices(servicesData || []);
      } catch (err) {
        console.error('Failed to load booking form data:', err);
        setError('Failed to load booking form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hallId]);

  // Mock event types from settings
  const eventTypes = ['Wedding', 'Birthday Party', 'Corporate Event', 'Conference', 'Reception', 'Other'];

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventStartDate: selectedDate || '',
    eventEndDate: selectedDate || '',
    eventType: '',
    eventDate: selectedDate || '',
    timeSlot: '',
    guestCount: '',
    specialRequests: '',
    selectedFeatures: [] as string[],
    selectedServices: [] as string[],
    // New fields
    address: '',
    village: '',
    city: '',
    // Main checkbox for requiring rooms
    requireRooms: false,
    // Individual room types
    requireFreeRooms: false,
    requireAcRooms: false,
    requireNonAcRooms: false,
    freeRoomsCount: 0,
    acRoomsCount: 0,
    nonAcRoomsCount: 0,
    // Terms and conditions
    acceptedTerms: false
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{ value: string, label: string, price: number }>>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [dateError, setDateError] = useState('');
  const [showHandoverInfo, setShowHandoverInfo] = useState(false);
  const [actualHandoverDate, setActualHandoverDate] = useState<string>('');

  // Focus first input on mount
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // Handle event type change for wedding
  useEffect(() => {
    if (formData.eventType === 'Wedding') {
      setShowHandoverInfo(true);
      // Auto-select fullday for wedding events
      setFormData(prev => ({ ...prev, timeSlot: 'fullday' }));
      
      // Calculate handover date (day before at 2PM)
      if (formData.eventStartDate) {
        const handoverDate = new Date(formData.eventStartDate);
        handoverDate.setDate(handoverDate.getDate() - 1);
        handoverDate.setHours(14, 0, 0, 0);
        setActualHandoverDate(handoverDate.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
    } else {
      setShowHandoverInfo(false);
      setActualHandoverDate('');
      if (formData.timeSlot === 'fullday') {
        setFormData(prev => ({ ...prev, timeSlot: '' }));
      }
    }
  }, [formData.eventType, formData.eventStartDate]);

  // Validate dates when they change
  useEffect(() => {
    if (formData.eventStartDate && formData.eventEndDate) {
      const start = new Date(formData.eventStartDate);
      const end = new Date(formData.eventEndDate);
      
      if (end < start) {
        setFormData(prev => ({ ...prev, eventEndDate: formData.eventStartDate }));
        setDateError('End date cannot be before start date');
      } else {
        setDateError('');
        
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

  // Set event end date same as start date for single day non-wedding events
  useEffect(() => {
    if (formData.eventStartDate && formData.eventType !== 'Wedding' && !formData.eventEndDate) {
      setFormData(prev => ({ ...prev, eventEndDate: formData.eventStartDate }));
    }
  }, [formData.eventStartDate, formData.eventType]);

  // Update eventDate when eventStartDate changes
  useEffect(() => {
    if (formData.eventStartDate) {
      setFormData(prev => ({ ...prev, eventDate: formData.eventStartDate }));
    }
  }, [formData.eventStartDate]);

  // Fetch time slots when date changes
  const fetchTimeSlots = useCallback(async () => {
    if (formData.eventStartDate && hallId) {
      try {
        const dateObj = new Date(formData.eventStartDate);
        const slots = await hallService.getAvailableTimeSlots(hallId, dateObj);
        setAvailableTimeSlots(Array.isArray(slots) ? slots : []);
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        setAvailableTimeSlots([]);
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.eventStartDate, hallId]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Calculate total when dependencies change
  const calculateTotal = useCallback(() => {
    if (!hall || !formData.timeSlot) return;

    let amount = 0;
    let days = 1;

    // Calculate number of days
    if (formData.eventStartDate && formData.eventEndDate) {
      const start = new Date(formData.eventStartDate);
      const end = new Date(formData.eventEndDate);
      const timeDiff = end.getTime() - start.getTime();
      days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }

    // Calculate base amount
    switch (formData.timeSlot) {
      case 'morning':
        amount += (hall.rateCard.morningRate || hall.rateCard.fullDayRate * 0.6) * days;
        break;
      case 'evening':
        amount += (hall.rateCard.eveningRate || hall.rateCard.fullDayRate * 0.6) * days;
        break;
      case 'fullday':
        amount += hall.rateCard.fullDayRate * days;
        break;
    }

    // Add feature charges
    formData.selectedFeatures.forEach(featureName => {
      const feature = hall.features.find(f => f.name === featureName);
      if (feature) {
        amount += feature.charge * days;
      }
    });

    // Add service charges
    formData.selectedServices.forEach(serviceId => {
      const service = services?.find(s => s.id === serviceId);
      if (service) {
        amount += service.basePrice * days;
      }
    });

    // Add room charges if required - only for rented rooms
    // Free rooms have no charge
    if (formData.requireAcRooms && formData.acRoomsCount > 0 && hall.amenities?.rooms?.acRoomRate) {
      amount += hall.amenities.rooms.acRoomRate * formData.acRoomsCount * days;
    }
    
    if (formData.requireNonAcRooms && formData.nonAcRoomsCount > 0 && hall.amenities?.rooms?.nonAcRoomRate) {
      amount += hall.amenities.rooms.nonAcRoomRate * formData.nonAcRoomsCount * days;
    }
    // Free rooms have no charge, so no amount added

    setTotalAmount(amount);
  }, [
    formData.timeSlot, 
    formData.selectedFeatures, 
    formData.selectedServices, 
    formData.eventStartDate, 
    formData.eventEndDate,
    formData.requireAcRooms,
    formData.acRoomsCount,
    formData.requireNonAcRooms,
    formData.nonAcRoomsCount,
    hall, 
    services
  ]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  // Check if rooms are available in the hall
  const hasRoomsAvailable = () => {
    if (!hall?.amenities?.rooms) return false;
    const { free, rentedAc, rentedNonAc } = hall.amenities.rooms;
    return free > 0 || rentedAc > 0 || rentedNonAc > 0;
  };

  // Handle main room requirement toggle
  const handleRequireRoomsChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      requireRooms: checked,
      // Reset all room selections when turning off rooms required
      requireFreeRooms: checked ? prev.requireFreeRooms : false,
      requireAcRooms: checked ? prev.requireAcRooms : false,
      requireNonAcRooms: checked ? prev.requireNonAcRooms : false,
      freeRoomsCount: checked ? prev.freeRoomsCount : 0,
      acRoomsCount: checked ? prev.acRoomsCount : 0,
      nonAcRoomsCount: checked ? prev.nonAcRoomsCount : 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!hall || dateError || !formData.acceptedTerms) return;
  
    try {
      // Format dates for API
      let eventStartDateTime = new Date(formData.eventStartDate);
      let eventEndDateTime = new Date(formData.eventEndDate);
      
      let handoverStartDate: Date | undefined;
      
      // Set time based on timeslot
      switch(formData.timeSlot) {
        case 'morning':
          eventStartDateTime.setHours(9, 0, 0, 0);
          eventEndDateTime.setHours(15, 0, 0, 0);
          break;
        case 'evening':
          eventStartDateTime.setHours(16, 0, 0, 0);
          eventEndDateTime.setHours(23, 0, 0, 0);
          break;
        case 'fullday':
          eventStartDateTime.setHours(9, 0, 0, 0);
          eventEndDateTime.setHours(23, 0, 0, 0);
          break;
      }
  
      // For weddings, set handover date
      if (formData.eventType === 'Wedding') {
        handoverStartDate = new Date(eventStartDateTime);
        handoverStartDate.setDate(handoverStartDate.getDate() - 1);
        handoverStartDate.setHours(14, 0, 0, 0);
      }
  
      // Calculate number of days
      const timeDiff = eventEndDateTime.getTime() - eventStartDateTime.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  
      // Prepare room details according to backend model
      let roomDetails: any = null;
      if (formData.requireRooms) {
        // Calculate charges
        const acCharges = formData.requireAcRooms && formData.acRoomsCount > 0 
          ? (hall.amenities?.rooms?.acRoomRate || 0) * formData.acRoomsCount * days 
          : 0;
        
        const nonAcCharges = formData.requireNonAcRooms && formData.nonAcRoomsCount > 0 
          ? (hall.amenities?.rooms?.nonAcRoomRate || 0) * formData.nonAcRoomsCount * days 
          : 0;
        
        // Create room details in exact format backend expects
        roomDetails = {
          Charges: {
            AcRoomCharges: acCharges,
            NonAcRoomCharges: nonAcCharges,
            TotalRoomCharges: acCharges + nonAcCharges
          },
          RoomsCount: {
            Free: formData.requireFreeRooms ? formData.freeRoomsCount : 0,
            RentedAc: formData.requireAcRooms ? formData.acRoomsCount : 0,
            RentedNonAc: formData.requireNonAcRooms ? formData.nonAcRoomsCount : 0
          }
        };
      }
  
      // Calculate total rooms count
      const totalRoomsCount = (formData.requireFreeRooms ? formData.freeRoomsCount : 0) +
                             (formData.requireAcRooms ? formData.acRoomsCount : 0) +
                             (formData.requireNonAcRooms ? formData.nonAcRoomsCount : 0);
  
      // Prepare booking data according to backend model
      const bookingData = {
        // Required fields
        id: '', // Let backend generate or add: Date.now().toString(),
        organizationId: hall.organizationId,
        hallId: hall.id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        eventStartDate: eventStartDateTime.toISOString(),
        eventEndDate: eventEndDateTime.toISOString(),
        handoverStartDate: handoverStartDate ? handoverStartDate.toISOString() : eventStartDateTime.toISOString(), // Provide default
        eventDate: eventStartDateTime.toISOString(), // Backward compatibility
        eventType: formData.eventType,
        timeSlot: formData.timeSlot,
        guestCount: parseInt(formData.guestCount) || 0,
        totalAmount: totalAmount,
        status: 'pending', // Default status
        isActive: true, // Default
        
        // Optional fields with defaults
        address: formData.address || '',
        city: formData.city || '',
        village: formData.village || '',
        notes: formData.specialRequests || '',
        
        // Room related fields
        roomsRequired: formData.requireRooms,
        roomsCount: totalRoomsCount,
        roomDetails: roomDetails || { Charges: { AcRoomCharges: 0, NonAcRoomCharges: 0, TotalRoomCharges: 0 }, RoomsCount: { Free: 0, RentedAc: 0, RentedNonAc: 0 } },
        
        // Backend defaults (can be omitted or set)
        customerResponse: '',
        lastContactDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
  
      const booking = await bookingService.createBooking(bookingData);
  
      const params = new URLSearchParams({
        bookingId: booking.id || 'N/A',
        customerName: formData.customerName,
        eventStartDate: formData.eventStartDate,
        eventEndDate: formData.eventEndDate,
        eventType: formData.eventType,
        timeSlot: formData.timeSlot,
        guestCount: formData.guestCount,
        totalAmount: totalAmount.toString()
      });
  
      navigate(`/${hall.name}/${booking.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleFeatureChange = (featureName: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: checked
        ? [...prev.selectedFeatures, featureName]
        : prev.selectedFeatures.filter(f => f !== featureName)
    }));
  };

  const handleServiceChange = (serviceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: checked
        ? [...prev.selectedServices, serviceId]
        : prev.selectedServices.filter(s => s !== serviceId)
    }));
  };

  // Update handover info when dates change for wedding
  useEffect(() => {
    if (formData.eventType === 'Wedding' && formData.eventStartDate) {
      const handoverDate = new Date(formData.eventStartDate);
      handoverDate.setDate(handoverDate.getDate() - 1);
      handoverDate.setHours(14, 0, 0, 0);
      setActualHandoverDate(handoverDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
  }, [formData.eventType, formData.eventStartDate]);

  // Check if facilities are available
  const hasFacilities = () => {
    if (!hall?.amenities?.facilities) return false;
    const { generator, airConditioning } = hall.amenities.facilities;
    return generator || airConditioning;
  };

  // Show loading state
  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Show error state
  if (error || !hall) {
    return (
      <AnimatedPage className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
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
                  {error || 'Hall not found'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Get available rooms count from hall
  const availableRooms = hall.amenities?.rooms || {
    free: 0,
    rentedAc: 0,
    rentedNonAc: 0,
    acRoomRate: 0,
    nonAcRoomRate: 0
  };

  return (
    <AnimatedPage className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Event</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Full Name *</Label>
                      <Input
                        ref={firstInputRef}
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email </Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerPhone">Phone Number *</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold flex items-center">
                      <Home className="h-4 w-4 mr-2" />
                      Address Information
                    </h3>
                    
                    <div>
                      <Label htmlFor="address">Full Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="House no, Street, Area"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="village">Village/Town</Label>
                        <Input
                          id="village"
                          value={formData.village}
                          onChange={(e) => setFormData(prev => ({ ...prev, village: e.target.value }))}
                          placeholder="Enter village or town"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City/District *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          required
                          placeholder="Enter city or district"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event Information */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold">Event Information</h3>
                    <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eventStartDate">Event Start Date *</Label>
                        <Input
                          id="eventStartDate"
                          type="date"
                          value={formData.eventStartDate}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            eventStartDate: e.target.value,
                            eventEndDate: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="eventEndDate">Event End Date *</Label>
                        <Input
                          id="eventEndDate"
                          type="date"
                          value={formData.eventEndDate}
                          onChange={(e) => setFormData(prev => ({ ...prev, eventEndDate: e.target.value }))}
                          required
                          min={formData.eventStartDate}
                        />
                      </div>
                    </div>
                    <p className="text-red-500 text-sm col-span-2">Choose the date correctly for the event.Once check the event type and event date</p>
    
                    </div>

                    {dateError && (
                      <div className="col-span-2">
                        <p className="text-sm text-red-500">{dateError}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="eventType">Event Type *</Label>
                        <Select 
                          value={formData.eventType} 
                          onValueChange={(value) => setFormData(prev => ({ 
                            ...prev, 
                            eventType: value,
                            timeSlot: value === 'Wedding' ? 'fullday' : prev.timeSlot
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timeSlot">Time Slot *</Label>
                        <Select 
                          value={formData.timeSlot} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
                          disabled={!formData.eventStartDate || formData.eventType === 'Wedding'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              formData.eventType === 'Wedding' ? 'Full Day (Wedding)' : 'Select time slot'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {(availableTimeSlots || []).map((slot) => (
                              <SelectItem key={slot.value} value={slot.value}>
                                {slot.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.eventType === 'Wedding' && (
                          <p className="text-xs text-gray-500 mt-1">Wedding events are always Full Day with early handover</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="guestCount">Number of Guests </Label>
                      <Input
                        id="guestCount"
                        type="number"
                        value={formData.guestCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestCount: e.target.value }))}
                      />
                    </div>

                    {/* Wedding Handover Information */}
                    {showHandoverInfo && actualHandoverDate && formData.eventStartDate && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>Wedding Handover:</strong> Hall will be handed over on{' '}
                              <strong>{actualHandoverDate}</strong> (day before the first wedding day). 
                              Event starts at <strong>12:00 PM</strong> on the first wedding day.
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Rooms Required Section - Only shown if hall has rooms available */}
                    {hasRoomsAvailable() && (
                      <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requireRooms"
                            checked={formData.requireRooms}
                            onCheckedChange={(checked) => handleRequireRoomsChange(checked as boolean)}
                          />
                          <Label htmlFor="requireRooms" className="font-medium flex items-center">
                            <Bed className="h-4 w-4 mr-2" />
                            Require Rooms for Stay
                          </Label>
                        </div>

                        {/* Room selection - Only shown when requireRooms is checked */}
{formData.requireRooms && (
  <div className="space-y-4 ml-6 border-l-2 border-gray-300 pl-4">
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
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty input for better UX
                    if (value === '') {
                      setFormData(prev => ({ ...prev, freeRoomsCount: 0 }));
                      return;
                    }
                    
                    const numValue = parseInt(value);
                    // Validate only on blur or when complete number is entered
                    if (!isNaN(numValue)) {
                      setFormData(prev => ({ 
                        ...prev, 
                        freeRoomsCount: Math.min(
                          Math.max(0, numValue),
                          availableRooms.free
                        )
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseInt(e.target.value);
                    if (isNaN(numValue) || numValue < 1) {
                      setFormData(prev => ({ ...prev, freeRoomsCount: 1 }));
                    } else if (numValue > availableRooms.free) {
                      setFormData(prev => ({ ...prev, freeRoomsCount: availableRooms.free }));
                    }
                  }}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData(prev => ({ ...prev, acRoomsCount: 0 }));
                      return;
                    }
                    
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setFormData(prev => ({ 
                        ...prev, 
                        acRoomsCount: Math.min(
                          Math.max(0, numValue),
                          availableRooms.rentedAc
                        )
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseInt(e.target.value);
                    if (isNaN(numValue) || numValue < 1) {
                      setFormData(prev => ({ ...prev, acRoomsCount: 1 }));
                    } else if (numValue > availableRooms.rentedAc) {
                      setFormData(prev => ({ ...prev, acRoomsCount: availableRooms.rentedAc }));
                    }
                  }}
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
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData(prev => ({ ...prev, nonAcRoomsCount: 0 }));
                      return;
                    }
                    
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      setFormData(prev => ({ 
                        ...prev, 
                        nonAcRoomsCount: Math.min(
                          Math.max(0, numValue),
                          availableRooms.rentedNonAc
                        )
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseInt(e.target.value);
                    if (isNaN(numValue) || numValue < 1) {
                      setFormData(prev => ({ ...prev, nonAcRoomsCount: 1 }));
                    } else if (numValue > availableRooms.rentedNonAc) {
                      setFormData(prev => ({ ...prev, nonAcRoomsCount: availableRooms.rentedNonAc }));
                    }
                  }}
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

    {/* Info message when no room type is selected
    {!formData.requireFreeRooms && !formData.requireAcRooms && !formData.requireNonAcRooms && (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <p className="text-sm text-yellow-700">
          Please select at least one room type above
        </p>
      </div>
    )} */}
  </div>
)}

                            {/* Info message when no room type is selected
                            {!formData.requireFreeRooms && !formData.requireAcRooms && !formData.requireNonAcRooms && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <p className="text-sm text-yellow-700">
                                  Please select at least one room type above
                                </p>
                              </div>
                            )} */}
                          </div>
                        )}
                      </div>
            

                  {/* Additional Features */}
                  {hall.features.length > 0 && (
                    <div className="border-t pt-4">
                      <Label>Additional Features</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {hall.features.map((feature) => (
                          <div key={feature.name} className="flex items-center space-x-2">
                            <Checkbox
                              id={feature.name}
                              checked={formData.selectedFeatures.includes(feature.name)}
                              onCheckedChange={(checked) => handleFeatureChange(feature.name, checked as boolean)}
                            />
                            <Label htmlFor={feature.name} className="text-sm cursor-pointer">
                              {feature.name} (+₹{feature.charge}/day)
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Services */}
                  {services && services.length > 0 && (
                    <div className="border-t pt-4">
                      <Label>Additional Services</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={service.id}
                              checked={formData.selectedServices.includes(service.id)}
                              onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                            />
                            <Label htmlFor={service.id} className="text-sm cursor-pointer">
                              {service.name} (+₹{service.basePrice}/day)
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  <div className="border-t pt-4">
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special requirements, decorations, or additional information..."
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={!!dateError || !formData.city || !formData.eventType || !formData.acceptedTerms}
                  >
                    Book Now - ₹{totalAmount.toLocaleString()}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* TOP: Booking Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">{hall.name}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {formData.eventStartDate === formData.eventEndDate ? (
                        formData.eventStartDate
                      ) : (
                        <span>
                          {formData.eventStartDate} to {formData.eventEndDate}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {formData.timeSlot || 'Not selected'}
                      {formData.eventStartDate && formData.eventEndDate && 
                       formData.eventStartDate !== formData.eventEndDate && (
                        <span className="ml-1">
                          ({Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1} days)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formData.guestCount || '0'} guests</span>
                  </div>
                  {formData.eventType === 'Wedding' && showHandoverInfo && (
                    <div className="flex items-start text-sm pt-2 border-t">
                      <MapPinned className="h-4 w-4 mr-2 text-blue-500 mt-0.5" />
                      <div>
                        <span className="font-medium text-blue-600">Wedding Handover</span>
                        <p className="text-xs text-gray-600 mt-1">
                          Day before at 2:00 PM to wedding day at 12:00 PM
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Pricing Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    {formData.timeSlot && formData.eventStartDate && (
                      <div className="flex justify-between">
                        <span>
                          Hall ({formData.timeSlot}) × 
                          {formData.eventEndDate ? 
                           ` ${Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1}` : 
                           ' 1'} day(s)
                        </span>
                        <span>
                          ₹{(
                            (hall.rateCard[`${formData.timeSlot}Rate` as keyof typeof hall.rateCard] || 
                            (formData.timeSlot === 'fullday' ? hall.rateCard.fullDayRate : hall.rateCard.fullDayRate * 0.6)) * 
                            (formData.eventEndDate ? 
                             Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1 : 1)
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Features */}
                    {formData.selectedFeatures.map(featureName => {
                      const feature = hall.features.find(f => f.name === featureName);
                      const days = formData.eventEndDate ? 
                        Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1 : 1;
                      return feature ? (
                        <div key={featureName} className="flex justify-between">
                          <span>{feature.name} × {days} day(s)</span>
                          <span>₹{(feature.charge * days).toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}

                    {/* Services */}
                    {formData.selectedServices.map(serviceId => {
                      const service = services?.find(s => s.id === serviceId);
                      const days = formData.eventEndDate ? 
                        Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1 : 1;
                      return service ? (
                        <div key={serviceId} className="flex justify-between">
                          <span>{service.name} × {days} day(s)</span>
                          <span>₹{(service.basePrice * days).toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}

                    {/* Rooms - Updated with proper rate access */}
                    {formData.requireFreeRooms && formData.freeRoomsCount > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Free Rooms ({formData.freeRoomsCount}) × 
                          {formData.eventEndDate ? 
                           ` ${Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1}` : 
                           ' 1'} day(s)
                        </span>
                        <span className="text-green-600">Free</span>
                      </div>
                    )}
                    
                    {formData.requireAcRooms && formData.acRoomsCount > 0 && availableRooms.acRoomRate > 0 && (
                      <div className="flex justify-between">
                        <span>
                          AC Rooms ({formData.acRoomsCount}) × 
                          {formData.eventEndDate ? 
                           ` ${Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1}` : 
                           ' 1'} day(s)
                        </span>
                        <span>
                          ₹{(
                            availableRooms.acRoomRate * formData.acRoomsCount * 
                            (formData.eventEndDate ? 
                             Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1 : 1)
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {formData.requireNonAcRooms && formData.nonAcRoomsCount > 0 && availableRooms.nonAcRoomRate > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Non-AC Rooms ({formData.nonAcRoomsCount}) × 
                          {formData.eventEndDate ? 
                           ` ${Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1}` : 
                           ' 1'} day(s)
                        </span>
                        <span>
                          ₹{(
                            availableRooms.nonAcRoomRate * formData.nonAcRoomsCount * 
                            (formData.eventEndDate ? 
                             Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1 : 1)
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Total Amount */}
                  <div className="border-t mt-3 pt-3 font-semibold text-base">
                    <div className="flex justify-between items-center">
                      <span>Total Amount</span>
                      <span className="text-lg text-green-600">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    {formData.eventType === 'Wedding' && (
                      <p className="text-xs text-gray-500 mt-1">
                        * Wedding rate includes handover from previous day 2PM
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MIDDLE: Hall Features & Facilities - Compact Version */}
            <Card className="border border-gray-300">
              <CardHeader className="p-4 pb-2 border-b">
                <CardTitle className="text-base font-bold text-gray-800">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    Hall Features
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 space-y-4">
                {/* Capacity Info - Small Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Hall</div>
                    <div className="text-lg font-bold text-blue-700">{hall.amenities?.capacity?.hall || 'N/A'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Dining</div>
                    <div className="text-lg font-bold text-green-700">{hall.amenities?.capacity?.dining || 'N/A'}</div>
                  </div>
                  {hall.amenities?.capacity?.parking && hall.amenities.capacity.parking > 0 && (
                    <div className="text-center">
                      <div className="text-xs text-gray-600">Parking</div>
                      <div className="text-lg font-bold text-purple-700">{hall.amenities.capacity.parking}</div>
                    </div>
                  )}
                </div>

                {/* Food Type - Simple Badge */}
                {hall.amenities?.foodType && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Food Type</div>
                    <div className={`px-3 py-1 rounded text-sm font-bold ${hall.amenities.foodType === 'veg' 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : hall.amenities.foodType === 'non-veg' 
                      ? 'bg-red-100 text-red-800 border border-red-300' 
                      : 'bg-blue-100 text-blue-800 border border-blue-300'}`}>
                      {hall.amenities.foodType === 'both' ? 'Veg & Non-Veg' : 
                      hall.amenities.foodType === 'veg' ? 'Vegetarian Only' : 'Non-Vegetarian Only'}
                    </div>
                  </div>
                )}

                {/* Rooms - Only show if available */}
                {hasRoomsAvailable() && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Rooms Available</div>
                    <div className="flex gap-1">
                      {availableRooms.free > 0 && (
                        <div className="flex-1 bg-green-50 border border-green-200 rounded p-2 text-center">
                          <div className="text-xs text-green-700">Free</div>
                          <div className="font-bold text-green-900">{availableRooms.free}</div>
                        </div>
                      )}
                      {availableRooms.rentedAc > 0 && (
                        <div className="flex-1 bg-blue-50 border border-blue-200 rounded p-2 text-center">
                          <div className="text-xs text-blue-700">AC</div>
                          <div className="font-bold text-blue-900">{availableRooms.rentedAc}</div>
                          {availableRooms.acRoomRate > 0 && (
                            <div className="text-xs text-blue-600">₹{availableRooms.acRoomRate}/Per Room</div>
                          )}
                        </div>
                      )}
                      {availableRooms.rentedNonAc > 0 && (
                        <div className="flex-1 bg-amber-50 border border-amber-200 rounded p-2 text-center">
                          <div className="text-xs text-amber-700">Non-AC</div>
                          <div className="font-bold text-amber-900">{availableRooms.rentedNonAc}</div>
                          {availableRooms.nonAcRoomRate > 0 && (
                            <div className="text-xs text-amber-600">₹{availableRooms.nonAcRoomRate}/Per Room</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Facilities - Simple List */}
                {hasFacilities() && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Facilities</div>
                    <div className="space-y-1">
                      {hall.amenities.facilities.generator && (
                        <div className="flex items-center text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-gray-800">Generator</span>
                          <span className="ml-auto text-xs text-green-600 font-bold">✓</span>
                        </div>
                      )}
                      {hall.amenities.facilities.airConditioning && (
                        <div className="flex items-center text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-gray-800">Air Conditioned</span>
                          <span className="ml-auto text-xs text-blue-600 font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rules - Small Preview */}
                {hall.amenities?.rules && hall.amenities.rules.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Important Rules</div>
                    <div className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-2 max-h-20 overflow-y-auto">
                      {hall.amenities.rules.slice(0, 2).map((rule, index) => (
                        <div key={index} className="flex items-start mb-1">
                          <span className="text-gray-500 mr-1">•</span>
                          <span className="flex-1">{rule}</span>
                        </div>
                      ))}
                      {hall.amenities.rules.length > 2 && (
                        <div className="text-blue-600 text-center text-xs pt-1">
                          View all {hall.amenities.rules.length} rules
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BOTTOM: Terms and Conditions Card */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <CardTitle className="flex items-center text-gray-700">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    By proceeding with the booking, you agree to the following terms:
                  </p>
                  
                  <div className="space-y-2 pl-4">
                    <div className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 mr-2"></div>
                      <p className="text-gray-600">Booking confirmation is subject to availability and hall management approval</p>
                    </div>
                    <div className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 mr-2"></div>
                      <p className="text-gray-600">Advance payment may be required to confirm the booking</p>
                    </div>
                    <div className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 mr-2"></div>
                      <p className="text-gray-600">Cancellation policy applies as per hall rules</p>
                    </div>
                    <div className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 mr-2"></div>
                      <p className="text-gray-600">Any damage to property will be charged separately</p>
                    </div>
                    <div className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-1.5 mr-2"></div>
                      <p className="text-gray-600">Hall rules and regulations must be strictly followed</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="acceptedTerms"
                        checked={formData.acceptedTerms}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptedTerms: checked as boolean }))}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="acceptedTerms" className="font-medium flex items-center text-gray-700">
                          <FileText className="h-4 w-4 mr-2" />
                          I accept all terms and conditions *
                        </Label>
                        {!formData.acceptedTerms && (
                          <p className="text-sm text-red-500">
                            You must accept the terms and conditions to proceed with booking
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default BookingForm;