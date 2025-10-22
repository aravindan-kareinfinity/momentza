import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { bookingService, hallService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

interface HallBookingCalendarProps {
  hallId: string;
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
}

export function HallBookingCalendar({ hallId, onDateSelect, selectedDate }: HallBookingCalendarProps) {
  // State for data
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Fetch data when hallId is available
  const fetchData = async () => {
    if (!hallId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('[HallBookingCalendar] Fetching bookings...');
      // Get hall details to get organizationId
      const hall = await hallService.getHallById(hallId);
      if (!hall) {
        throw new Error('Hall not found');
      }
      const data = await bookingService.getBookingsByHall(hallId, hall.organizationId);
      setBookings(data || []);
      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hallId]);

  const handleRetry = async () => {
    await fetchData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Error state
  if (error || !bookings) {
    return (
      <>
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load calendar</p>
        </div>

        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Booking Service Error"
          message={error?.message || 'Unable to load calendar data. Please try again.'}
        />
      </>
    );
  }

  // Get booked dates
  const bookedDates = bookings
    .filter(booking => booking.status === 'confirmed' || booking.status === 'active')
    .map(booking => new Date(booking.eventDate));

  // Disable booked dates
  const disabledDates = {
    before: new Date(),
    after: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    dates: bookedDates
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Select Date</h4>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={disabledDates}
          className="rounded-md border"
        />
      </div>
      {selectedDate && (
        <div className="text-sm text-gray-600">
          Selected: {selectedDate.toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
