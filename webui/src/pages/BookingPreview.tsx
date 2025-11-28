import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { bookingService, hallService } from "@/services/ServiceFactory";
import { AnimatedPage } from "@/components/Layout/AnimatedPage";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const BookingPreview = () => {
  const { hallName, bookingId } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
  
        const allHalls = await hallService.getAllHalls();
  
        // Find hall by slug
        const matchedHall = allHalls.find(h =>
          h.name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") === hallName
        );
  
        setHall(matchedHall);
  
        const bookingData = await bookingService.getById(bookingId!);
        setBooking(bookingData);
      } catch (error) {
        console.error("Failed to load preview:", error);
      } finally {
        setLoading(false);
      }
    };
  
    loadData();
  }, [hallName, bookingId]);
  
  

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen p-8">
        <Card><CardContent>Loading preview...</CardContent></Card>
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

  if (!hall) {
    return (
      <AnimatedPage className="min-h-screen p-8">
        <Card><CardContent>Hall not found in system.</CardContent></Card>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen flex justify-center p-8 bg-gray-50">
      <Card className="w-full max-w-3xl shadow-md">
        <CardContent className="p-8">

          <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">
            Booking Preview
          </h1>

          {/* Event Status */}
          <div className="text-center mb-6">
            <span className={`px-4 py-2 rounded-full text-white 
              ${booking.status === "confirmed" ? "bg-green-600" : "bg-yellow-500"}
            `}>
              {booking.status?.toUpperCase()}
            </span>
          </div>

          {/* Booking Details */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Booking Details</h2>

            <div className="grid grid-cols-2 gap-4 text-gray-700">
              <p><strong>Event Date:</strong> {booking.eventDate}</p>
              <p><strong>Time Slot:</strong> {booking.timeSlot}</p>
              <p><strong>Guest Count:</strong> {booking.guestCount}</p>
              <p><strong>Event Type:</strong> {booking.eventType}</p>
              <p><strong>Hall:</strong> {hall?.name}</p>
              <p><strong>Total Amount:</strong> ₹{booking.totalAmount}</p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            Preview Mode — This is not a confirmation.
          </div>
          
        </CardContent>
      </Card>
    </AnimatedPage>
  );
};

export default BookingPreview;
