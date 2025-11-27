import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, X } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { bookingService, hallService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { cn } from '@/lib/utils';

interface HallDetailCalendarProps {
  hallId: string;
  selectedDate: Date | null;
  onDateSelect: React.Dispatch<React.SetStateAction<Date | null>>;
}

export function HallDetailCalendar({
  hallId,
  selectedDate,
  onDateSelect
}: HallDetailCalendarProps) {
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

      console.log('[HallDetailCalendar] Fetching bookings...');
      // Get hall details to get organizationId
      const hall = await hallService.getHallById(hallId);
      if (!hall) {
        throw new Error('Hall not found');
      }
      const data = await bookingService.getBookingsByHall(hallId, hall.organizationId);
      console.log('[HallDetailCalendar] Bookings data:', data);
      setBookings(Array.isArray(data) ? data : []);
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

  // Ensure bookings is always an array
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  // Get booked dates - FIXED: Proper date comparison
  const getBookingStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log(`Checking date: ${dateStr}`);
    
    const dayBookings = safeBookings.filter(booking => {
      // Handle both string and Date formats for eventDate
      const bookingDateStr = booking.eventDate instanceof Date 
        ? format(booking.eventDate, 'yyyy-MM-dd')
        : booking.eventDate?.split('T')[0]; // Handle ISO string
      
      console.log(`Booking date: ${bookingDateStr}, status: ${booking.status}`);
      return bookingDateStr === dateStr && 
             (booking.status === 'confirmed' || booking.status === 'active');
    });

    console.log(`Found ${dayBookings.length} bookings for ${dateStr}`);

    const hasFullDay = dayBookings.some(b => b.timeSlot === 'fullday');
    const hasMorning = dayBookings.some(b => b.timeSlot === 'morning');
    const hasEvening = dayBookings.some(b => b.timeSlot === 'evening');

    let status = 'available';
    
    if (hasFullDay || (hasMorning && hasEvening)) {
      status = 'full';
    } else if (hasMorning) {
      status = 'morning-booked';
    } else if (hasEvening) {
      status = 'evening-booked';
    }

    console.log(`Date ${dateStr} status: ${status}`);
    return status;
  };

  // Disable dates that are fully booked or in the past
  const isDateDisabled = (date: Date) => {
    const status = getBookingStatus(date);
    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));
    return status === 'full' || isPastDate;
  };

  const renderDay = (day: Date) => {
    const status = getBookingStatus(day);
    const dayNumber = day.getDate();
    const isSelected = selectedDate && isSameDay(selectedDate, day);
    const isDisabled = isDateDisabled(day);

    return (
      <div className={cn(
        "relative w-full h-full flex flex-col items-center justify-center p-1 rounded-md cursor-pointer",
        isSelected && "bg-primary text-primary-foreground",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}>
        <span className="text-sm font-medium">{dayNumber}</span>

        {/* Red cross mark for disabled days */}
        {isDisabled && (
          <div className="absolute top-0 right-0">
            <X className="h-3 w-3 text-red-500" />
          </div>
        )}

        <div className="flex gap-1 mt-1">
          {status === 'full' && (
            <X className="h-2 w-2 text-red-500" />
          )}
          {status === 'morning-booked' && (
            <>
              <X className="h-1.5 w-1.5 text-red-400" />
              <Moon className="h-1.5 w-1.5 text-green-500" />
            </>
          )}
          {status === 'evening-booked' && (
            <>
              <Sun className="h-1.5 w-1.5 text-green-500" />
              <X className="h-1.5 w-1.5 text-red-400" />
            </>
          )}
          {status === 'available' && (
            <>
              <Sun className="h-1.5 w-1.5 text-green-500" />
              <Moon className="h-1.5 w-1.5 text-green-500" />
            </>
          )}
        </div>
      </div>
    );
  };

  // Get selected date bookings - FIXED: Proper date comparison
  const selectedDateBookings = selectedDate
    ? safeBookings.filter(booking => {
        // Handle both string and Date formats for eventDate
        const bookingDate = booking.eventDate instanceof Date 
          ? booking.eventDate 
          : new Date(booking.eventDate);
        
        return isSameDay(bookingDate, selectedDate) && 
               (booking.status === 'confirmed' || booking.status === 'active');
      })
    : [];

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Availability Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to load calendar</p>
            </div>
          </CardContent>
        </Card>

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1">
              <Sun className="h-3 w-3 text-green-500" />
              <span>Morning Available</span>
            </div>
            <div className="flex items-center gap-1">
              <Moon className="h-3 w-3 text-green-500" />
              <span>Evening Available</span>
            </div>
            <div className="flex items-center gap-1">
              <X className="h-3 w-3 text-red-500" />
              <span>Booked</span>
            </div>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            disabled={isDateDisabled}
            className="w-full"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 w-full",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
              row: "flex w/full mt-2",
              cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            }}
            components={{
              Day: ({ date, displayMonth, ...props }) => (
                <button
                  {...props}
                  className="h-14 w-full flex flex-col items-center justify-center hover:bg-accent rounded-md transition-colors"
                  disabled={isDateDisabled(date)}
                  onClick={() => onDateSelect(date)}
                >
                  {renderDay(date)}
                </button>
              ),
            }}
          />

          {selectedDate && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">
                Bookings for {format(selectedDate, 'MMMM dd, yyyy')}
              </h4>
              {selectedDateBookings.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {booking.eventType} • {booking.timeSlot}
                        </p>
                      </div>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No confirmed bookings for this date</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}