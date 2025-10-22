import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { hallService, bookingService, servicesService } from '@/services/ServiceFactory';
import { Hall, Booking } from '@/types';

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
  const eventTypes = ['Wedding', 'Birthday Party', 'Corporate Event', 'Conference'];
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventDate: selectedDate || '',
    eventType: '',
    timeSlot: '',
    guestCount: '',
    specialRequests: '',
    selectedFeatures: [] as string[],
    selectedServices: [] as string[]
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{value: string, label: string, price: number}>>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Focus first input on mount
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // Fetch time slots when date changes
  const fetchTimeSlots = useCallback(async () => {
    if (formData.eventDate && hallId) {
      try {
        const dateObj = new Date(formData.eventDate);
        const slots = await hallService.getAvailableTimeSlots(hallId, dateObj);
        setAvailableTimeSlots(Array.isArray(slots) ? slots : []);
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
        setAvailableTimeSlots([]);
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.eventDate, hallId]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // Calculate total when dependencies change
  const calculateTotal = useCallback(() => {
    if (!hall || !formData.timeSlot) return;

    let amount = 0;
    
    switch (formData.timeSlot) {
      case 'morning':
        amount += hall.rateCard.morningRate;
        break;
      case 'evening':
        amount += hall.rateCard.eveningRate;
        break;
      case 'fullday':
        amount += hall.rateCard.fullDayRate;
        break;
    }

    formData.selectedFeatures.forEach(featureId => {
      const feature = hall.features.find(f => f.name === featureId);
      if (feature) {
        amount += feature.charge;
      }
    });

    formData.selectedServices.forEach(serviceId => {
      const service = services?.find(s => s.id === serviceId);
      if (service) {
        amount += service.basePrice;
      }
    });

    setTotalAmount(amount);
  }, [formData.timeSlot, formData.selectedFeatures, formData.selectedServices, hall, services]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hall) return;

    try {
      const booking = await bookingService.createBooking({
        organizationId: hall.organizationId,
        hallId: hall.id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        eventDate: formData.eventDate,
        eventType: formData.eventType,
        timeSlot: formData.timeSlot as 'morning' | 'evening' | 'fullday',
        guestCount: parseInt(formData.guestCount),
        totalAmount,
        status: 'pending',
        selectedFeatures: formData.selectedFeatures,
      });

      console.log('Booking created:', booking);
      
      // Navigate to confirmation page with booking details
      const params = new URLSearchParams({
        bookingId: booking.id || 'N/A',
        customerName: formData.customerName,
        eventDate: formData.eventDate,
        eventType: formData.eventType,
        timeSlot: formData.timeSlot,
        guestCount: formData.guestCount,
        totalAmount: totalAmount.toString()
      });
      
      navigate(`/booking-confirmation?${params.toString()}`);
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

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  // Show error state
  if (error || !hall) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                    <div>
                      <Label htmlFor="eventDate">Event Date *</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventType">Event Type *</Label>
                      <Select value={formData.eventType} onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}>
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
                      <Select value={formData.timeSlot} onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableTimeSlots || []).map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    />
                  </div>

                  {hall.features.length > 0 && (
                    <div>
                      <Label>Additional Features</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {hall.features.map((feature) => (
                          <div key={feature.name} className="flex items-center space-x-2">
                            <Checkbox
                              id={feature.name}
                              checked={formData.selectedFeatures.includes(feature.name)}
                              onCheckedChange={(checked) => handleFeatureChange(feature.name, checked as boolean)}
                            />
                            <Label htmlFor={feature.name} className="text-sm">
                              {feature.name} (+₹{feature.charge})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {services && services.length > 0 && (
                    <div>
                      <Label>Additional Services</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {services.map((service) => (
                          <div key={service.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={service.id}
                              checked={formData.selectedServices.includes(service.id)}
                              onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
                            />
                            <Label htmlFor={service.id} className="text-sm">
                              {service.name} (+₹{service.basePrice})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special requirements or notes..."
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Book Now - ₹{totalAmount.toLocaleString()}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    {hall.name}
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formData.eventDate}
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    {formData.timeSlot}
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2" />
                    {formData.guestCount} guests
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Pricing Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    {formData.timeSlot && (
                      <div className="flex justify-between">
                        <span>Hall ({formData.timeSlot})</span>
                        <span>₹{hall.rateCard[`${formData.timeSlot}Rate` as keyof typeof hall.rateCard]?.toLocaleString()}</span>
                      </div>
                    )}
                    {formData.selectedFeatures.map(featureName => {
                      const feature = hall.features.find(f => f.name === featureName);
                      return feature ? (
                        <div key={featureName} className="flex justify-between">
                          <span>{feature.name}</span>
                          <span>₹{feature.charge.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                    {formData.selectedServices.map(serviceId => {
                      const service = services?.find(s => s.id === serviceId);
                      return service ? (
                        <div key={serviceId} className="flex justify-between">
                          <span>{service.name}</span>
                          <span>₹{service.basePrice.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="border-t mt-2 pt-2 font-semibold">
                    <div className="flex justify-between">
                      <span>Total Amount</span>
                      <span>₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
