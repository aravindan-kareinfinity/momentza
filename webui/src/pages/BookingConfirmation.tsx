import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Calendar, MapPin, Users, Clock } from 'lucide-react';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get booking details from URL params or use defaults
  const bookingId = searchParams.get('bookingId') || 'N/A';
  const customerName = searchParams.get('customerName') || 'Customer';
  const eventDate = searchParams.get('eventDate') || 'TBD';
  const eventType = searchParams.get('eventType') || 'Event';
  const timeSlot = searchParams.get('timeSlot') || 'TBD';
  const guestCount = searchParams.get('guestCount') || '0';
  const totalAmount = searchParams.get('totalAmount') || '0';

  const handleGoHome = () => {
    navigate('/');
  };

  const handleViewBookings = () => {
    navigate('/admin/bookings');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Booking Confirmed!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your booking has been successfully created. We'll be in touch with you soon.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-medium">{eventDate}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Time Slot</p>
                  <p className="font-medium capitalize">{timeSlot}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Guest Count</p>
                  <p className="font-medium">{guestCount} guests</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Event Type</p>
                  <p className="font-medium">{eventType}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">
                  ₹{parseInt(totalAmount).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Booking ID */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Booking ID:</strong> {bookingId}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Please keep this reference number for future communications.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">What's Next?</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• You'll receive a confirmation email shortly</li>
              <li>• Our team will contact you within 24 hours</li>
              <li>• Please review the booking details carefully</li>
              <li>• Contact us if you need any changes</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleGoHome}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
            <Button 
              onClick={handleViewBookings}
              variant="outline"
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View All Bookings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingConfirmation;
