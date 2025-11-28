import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Calendar, MapPin, Users, Clock, AlertCircle } from "lucide-react";
import { AnimatedPage } from "@/components/Layout/AnimatedPage";
import { bookingService, hallService } from "@/services/ServiceFactory";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const { hallName, bookingId } = useParams();

  const [booking, setBooking] = useState<any>(null);
  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load all halls and match slug
        const allHalls = await hallService.getAllHalls();
        const matchedHall = allHalls.find(h =>
          h.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") === hallName
        );
        setHall(matchedHall);

        // Load booking details
        const bookingData = await bookingService.getById(bookingId!);
        setBooking(bookingData);

      } catch (err) {
        console.error("Error loading booking:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hallName, bookingId]);

  // const handleGoHome = () => navigate("/");

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen p-8 flex justify-center items-center">
        <Card><CardContent>Loading...</CardContent></Card>
      </AnimatedPage>
    );
  }

  if (!booking) {
    return (
      <AnimatedPage className="min-h-screen p-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-red-600">Booking Not Found</h3>
          </CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <CardTitle className="text-2xl font-bold text-gray-900">
            Booking Details
          </CardTitle>

          <p className="text-gray-600 mt-2">
            Preview of your booking.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Status */}
          <div className="text-center">
            <span
              className={`px-4 py-2 rounded-full text-white text-sm font-semibold 
              ${
                booking.status === "confirmed"
                  ? "bg-green-600"
                  : booking.status === "pending"
                  ? "bg-yellow-500"
                  : booking.status === "cancelled"
                  ? "bg-red-600"
                  : booking.status === "active"
                  ? "bg-blue-600"
                  : "bg-gray-600"
              }`}
            >
              {booking.status.toUpperCase()}
            </span>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Booking Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Event Date</p>
                  <p className="font-medium">{booking.eventDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Time Slot</p>
                  <p className="font-medium">{booking.timeSlot}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="font-medium">{booking.guestCount}</p>
                </div>
              </div>

              {/* <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Hall</p>
                  <p className="font-medium">{hall?.name}</p>
                </div>
              </div> */}

              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Event Type</p>
                  <p className="font-medium">{booking.eventType}</p>
                </div>
              </div>

            </div>

            {/* Amount */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Total Amount:
                </span>
                <span className="text-xl font-bold text-green-600">
                  ₹{booking.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Booking ID */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Booking ID:</strong> {booking.id}
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

          {/* Buttons */}
          {/* <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleGoHome} className="flex-1 bg-green-600 hover:bg-green-700">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div> */}

        </CardContent>
      </Card>
    </AnimatedPage>
  );
};

export default BookingConfirmation;
