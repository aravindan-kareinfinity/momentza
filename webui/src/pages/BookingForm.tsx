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
import { ArrowLeft, Calendar, MapPin, Users, Clock, Home, MapPinned, Building } from 'lucide-react';
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
    eventDate: selectedDate || '', // Added: Required field for API
    timeSlot: '',
    guestCount: '',
    specialRequests: '',
    selectedFeatures: [] as string[],
    selectedServices: [] as string[],
    // New fields
    address: '',
    village: '',
    city: '',
    roomsRequired: false,
    roomsCount: 0
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
        handoverDate.setHours(14, 0, 0, 0); // 2:00 PM
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
      // Reset time slot if it was forced to fullday
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

  // Set event end date same as start date for single day non-wedding events
  useEffect(() => {
    if (formData.eventStartDate && formData.eventType !== 'Wedding' && !formData.eventEndDate) {
      setFormData(prev => ({ ...prev, eventEndDate: formData.eventStartDate }));
    }
  }, [formData.eventStartDate, formData.eventType]);

  // Update eventDate when eventStartDate changes (for single date compatibility)
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

    // Calculate number of days (for both wedding and non-wedding)
    if (formData.eventStartDate && formData.eventEndDate) {
      const start = new Date(formData.eventStartDate);
      const end = new Date(formData.eventEndDate);
      const timeDiff = end.getTime() - start.getTime();
      days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Inclusive of both start and end dates
    }

    // Calculate base amount based on timeSlot and number of days
    // Wedding can also be multiple days
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

    // Add room charges if required
    if (formData.roomsRequired && formData.roomsCount > 0 && hall.roomRate) {
      amount += hall.roomRate * formData.roomsCount * days;
    }

    setTotalAmount(amount);
  }, [
    formData.timeSlot, 
    formData.selectedFeatures, 
    formData.selectedServices, 
    formData.eventStartDate, 
    formData.eventEndDate, 
    formData.roomsRequired,
    formData.roomsCount,
    hall, 
    services
  ]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hall || dateError) return;

    try {
      // Format dates for API
      let eventStartDateTime = new Date(formData.eventStartDate);
      let eventEndDateTime = new Date(formData.eventEndDate);
      
      // For weddings, handover starts day before the first event day at 2PM
      let handoverStartDate: Date | undefined;
      
      if (formData.eventType === 'Wedding') {
        // Wedding handover starts day before at 2PM
        handoverStartDate = new Date(eventStartDateTime);
        handoverStartDate.setDate(handoverStartDate.getDate() - 1);
        handoverStartDate.setHours(14, 0, 0, 0); // 2:00 PM
        
        // First wedding day starts at 12:00 PM
        eventStartDateTime.setHours(12, 0, 0, 0);
        
        // Last wedding day ends at 11:00 PM
        eventEndDateTime.setHours(23, 0, 0, 0);
      } else {
        // Set times based on timeSlot for non-wedding events
        if (formData.timeSlot === 'morning') {
          eventStartDateTime.setHours(9, 0, 0, 0);
          eventEndDateTime.setHours(15, 0, 0, 0);
        } else if (formData.timeSlot === 'evening') {
          eventStartDateTime.setHours(16, 0, 0, 0);
          eventEndDateTime.setHours(23, 0, 0, 0);
        } else if (formData.timeSlot === 'fullday') {
          eventStartDateTime.setHours(9, 0, 0, 0);
          eventEndDateTime.setHours(23, 0, 0, 0);
        }
      }

      // Calculate number of days for display
      const days = Math.ceil((eventEndDateTime.getTime() - eventStartDateTime.getTime()) / (1000 * 3600 * 24)) + 1;

      const bookingData: any = {
        organizationId: hall.organizationId,
        hallId: hall.id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        eventStartDate: eventStartDateTime.toISOString(),
        eventEndDate: eventEndDateTime.toISOString(),
        eventDate: eventStartDateTime.toISOString(), // Use the single date field for backward compatibility
        eventType: formData.eventType,
        timeSlot: formData.timeSlot as 'morning' | 'evening' | 'fullday',
        guestCount: parseInt(formData.guestCount) || 0,
        totalAmount,
        status: 'pending',
        selectedFeatures: formData.selectedFeatures,
        // New fields
        address: formData.address,
        village: formData.village,
        city: formData.city,
        roomsRequired: formData.roomsRequired,
        roomsCount: formData.roomsRequired ? formData.roomsCount : 0,
        notes: formData.specialRequests
      };

      // Add handoverStartDate only if it's a wedding
      if (formData.eventType === 'Wedding' && handoverStartDate) {
        bookingData.handoverStartDate = handoverStartDate.toISOString();
      }

      console.log('Creating booking with data:', bookingData);

      const booking = await bookingService.createBooking(bookingData);

      console.log('Booking created:', booking);

      // Navigate to confirmation page with booking details
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
                      <Label htmlFor="customerEmail">Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        required
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
                            eventEndDate: e.target.value // Default to same day, user can change
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
                      <Label htmlFor="guestCount">Number of Guests *</Label>
                      <Input
                        id="guestCount"
                        type="number"
                        value={formData.guestCount}
                        onChange={(e) => setFormData(prev => ({ ...prev, guestCount: e.target.value }))}
                        required
                        min="1"
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

                    {/* Rooms Required */}
                    <div className="space-y-3 border rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="roomsRequired"
                          checked={formData.roomsRequired}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            roomsRequired: checked as boolean,
                            roomsCount: checked ? 1 : 0
                          }))}
                        />
                        <Label htmlFor="roomsRequired" className="font-medium flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Rooms Required
                        </Label>
                      </div>
                      
                      {formData.roomsRequired && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="roomsCount">Number of Rooms</Label>
                          <div className="flex items-center space-x-4">
                            <Input
                              id="roomsCount"
                              type="number"
                              value={formData.roomsCount}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                roomsCount: Math.max(1, parseInt(e.target.value) || 1)
                              }))}
                              min="1"
                              max="20"
                              className="w-32"
                            />
                            <span className="text-sm text-gray-600">
                              ₹{hall.roomRate?.toLocaleString() || '0'} per room per day
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
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
                    disabled={!!dateError || !formData.city || !formData.eventType}
                  >
                    Book Now - ₹{totalAmount.toLocaleString()}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary Sidebar */}
          <div>
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

                    {/* Rooms */}
                    {formData.roomsRequired && formData.roomsCount > 0 && hall.roomRate && (
                      <div className="flex justify-between">
                        <span>
                          Rooms ({formData.roomsCount}) × 
                          {formData.eventEndDate ? 
                           ` ${Math.ceil((new Date(formData.eventEndDate).getTime() - new Date(formData.eventStartDate).getTime()) / (1000 * 3600 * 24)) + 1}` : 
                           ' 1'} day(s)
                        </span>
                        <span>
                          ₹{(
                            hall.roomRate * formData.roomsCount * 
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
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default BookingForm;