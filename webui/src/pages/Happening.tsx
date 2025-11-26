import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Phone, Mail, Clock, IndianRupee, Settings, FileText, User } from 'lucide-react';
import { bookingService, hallService, authService, servicesService } from '@/services/ServiceFactory';
import { useServiceMutation } from '@/hooks/useService';
import { useNavigate } from 'react-router-dom';
import { Booking } from '@/types';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const Happening = () => {
  const navigate = useNavigate();
  const [showHandOverDialog, setShowHandOverDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [handOverDetails, setHandOverDetails] = useState({
    personName: '',
    ebReading: 0,
    advanceAmount: 0,
    handOverDate: new Date().toISOString().split('T')[0]
  });

  // State for data
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        // Fetch all data in parallel
        const [bookingsData, servicesData] = await Promise.all([
          user?.organizationId ? bookingService.getActiveBookings(user.organizationId) : Promise.resolve([]),
          servicesService.getAllServices()
        ]);
        
        setActiveBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setAvailableServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err) {
        console.error('Failed to load happening data:', err);
        setError('Failed to load happening data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Mutation hook for recording hand over
  const handOverMutation = useServiceMutation(
    (data: { bookingId: string; handOverDetails: any }) => 
      Promise.resolve(bookingService.recordHandOver(data.bookingId, data.handOverDetails))
  );

  const handleHandOver = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowHandOverDialog(true);
  };

  const submitHandOver = async () => {
    if (!selectedBooking) return;
    
    try {
      await handOverMutation.execute({
        bookingId: selectedBooking.id,
        handOverDetails
      });
      
      // Refresh bookings after hand over
      if (currentUser?.organizationId) {
        try {
          const updatedBookings = await bookingService.getActiveBookings(currentUser.organizationId);
          setActiveBookings(Array.isArray(updatedBookings) ? updatedBookings : []);
        } catch (err) {
          console.error('Failed to refresh bookings:', err);
        }
      }
      
      setShowHandOverDialog(false);
      setSelectedBooking(null);
      setHandOverDetails({
        personName: '',
        ebReading: 0,
        advanceAmount: 0,
        handOverDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Failed to record hand over:', error);
    }
  };

  const handleManageBooking = (booking: Booking) => {
    navigate(`/admin/happening/manage/${booking.id}`);
  };

  // Loading state
  if (loading) {
    return (
      <AnimatedPage className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AnimatedPage>
    );
  }

  // Error state
  if (error || !currentUser) {
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
                {error || 'Unable to load active bookings'}
              </p>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Happening Now</h1>
          <p className="text-gray-600">Active bookings and events currently in progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Array.isArray(activeBookings) ? activeBookings : []).map((booking) => {
          // Note: In a real app, you would fetch hall data for each booking
          // For now, we'll use a placeholder since hallService.getHallById is async
          const hallName = `Hall ${booking.hallId}`;
          
          return (
            <Card key={booking.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {booking.customerName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      {hallName}
                    </div>
                  </div>
                  <Badge variant={booking.isActive ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Event Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{new Date(booking.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="capitalize">{booking.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{booking.guestCount} guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span>₹{booking.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Customer Contact */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{booking.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{booking.customerEmail}</span>
                  </div>
                </div>

                {/* Services & Features */}
                {booking.selectedFeatures && booking.selectedFeatures.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Services & Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {booking.selectedFeatures.map((featureId, index) => {
                        const service = availableServices.find(s => s.id === featureId);
                        
                        if (service) {
                          return (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service.name} - ₹{service.basePrice}
                            </Badge>
                          );
                        }
                        return (
                          <Badge key={index} variant="outline" className="text-xs">
                            {featureId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Booking & Invoice Details */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Booking & Invoice Details
                  </h4>
                  <div className="text-xs space-y-1">
                    <div><strong>Booking ID:</strong> {booking.id}</div>
                    <div><strong>Event Type:</strong> {booking.eventType}</div>
                    <div><strong>Booking Date:</strong> {new Date(booking.createdAt).toLocaleDateString()}</div>
                    {booking.billingDetails && (
                      <>
                        <div><strong>Billing Name:</strong> {booking.billingDetails.billingName}</div>
                        <div><strong>Billing Address:</strong> {booking.billingDetails.billingAddress}</div>
                        <div><strong>GST Number:</strong> {booking.billingDetails.gstNumber}</div>
                      </>
                    )}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Hall Booking:</span>
                        <span>₹{booking.totalAmount.toLocaleString()}</span>
                      </div>
                      {booking.selectedFeatures?.map(featureId => {
                        const service = availableServices.find(s => s.id === featureId);
                        const charge = service?.basePrice || 0;
                        const name = service?.name || featureId;
                        
                        return charge > 0 ? (
                          <div key={featureId} className="flex justify-between text-xs">
                            <span>{name}:</span>
                            <span>₹{charge.toLocaleString()}</span>
                          </div>
                        ) : null;
                      })}
                      <div className="flex justify-between font-semibold pt-1 border-t">
                        <span>Total:</span>
                        <span>₹{(booking.totalAmount + (booking.selectedFeatures || []).reduce((sum, featureId) => {
                          const service = availableServices.find(s => s.id === featureId);
                          return sum + (service?.basePrice || 0);
                        }, 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hand Over Details if available */}
                {booking.handOverDetails && (
                  <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Hand Over Details
                    </h4>
                    <div className="text-xs space-y-1">
                      <div><strong>Handed Over To:</strong> {booking.handOverDetails.personName}</div>
                      <div><strong>EB Reading:</strong> {booking.handOverDetails.ebReading}</div>
                      <div><strong>Advance Amount:</strong> ₹{booking.handOverDetails.advanceAmount}</div>
                      <div><strong>Hand Over Date:</strong> {new Date(booking.handOverDetails.handOverDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleHandOver(booking)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Hand Over
                  </Button>
                  <Button 
                    onClick={() => handleManageBooking(booking)}
                    size="sm"
                    className="flex-1"
                  >
                    Manage Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hand Over Dialog */}
      <Dialog open={showHandOverDialog} onOpenChange={setShowHandOverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Hand Over</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="personName">Person Name</Label>
              <Input
                id="personName"
                value={handOverDetails.personName}
                onChange={(e) => setHandOverDetails(prev => ({ ...prev, personName: e.target.value }))}
                placeholder="Enter person name"
              />
            </div>
            <div>
              <Label htmlFor="ebReading">EB Reading</Label>
              <Input
                id="ebReading"
                type="number"
                value={handOverDetails.ebReading}
                onChange={(e) => setHandOverDetails(prev => ({ ...prev, ebReading: parseInt(e.target.value) || 0 }))}
                placeholder="Enter EB reading"
              />
            </div>
            <div>
              <Label htmlFor="advanceAmount">Advance Amount</Label>
              <Input
                id="advanceAmount"
                type="number"
                value={handOverDetails.advanceAmount}
                onChange={(e) => setHandOverDetails(prev => ({ ...prev, advanceAmount: parseInt(e.target.value) || 0 }))}
                placeholder="Enter advance amount"
              />
            </div>
            <div>
              <Label htmlFor="handOverDate">Hand Over Date</Label>
              <Input
                id="handOverDate"
                type="date"
                value={handOverDetails.handOverDate}
                onChange={(e) => setHandOverDetails(prev => ({ ...prev, handOverDate: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={submitHandOver}
                disabled={handOverMutation.loading}
                className="flex-1"
              >
                {handOverMutation.loading ? 'Recording...' : 'Record Hand Over'}
              </Button>
              <Button 
                onClick={() => setShowHandOverDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
};

export default Happening;
