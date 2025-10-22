import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Sun, Moon, X } from 'lucide-react';
import { format } from 'date-fns';
import { bookingService, hallService } from '@/services/ServiceFactory';
import { cn } from '@/lib/utils';

interface PublicHallCalendarProps {
  hallId: string;
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
}

export function PublicHallCalendar({ hallId, onDateSelect, selectedDate }: PublicHallCalendarProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<any>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!hallId) return;
      
      try {
        setBookingsLoading(true);
        setBookingsError(null);
        // Get hall details to get organizationId
        const hall = await hallService.getHallById(hallId);
        if (!hall) {
          throw new Error('Hall not found');
        }
        const data = await bookingService.getBookingsByHall(hallId, hall.organizationId);
        // Ensure we always have an array
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookingsError(error);
        setBookings([]); // Set empty array on error
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [hallId]);

  // Loading state
  if (bookingsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Error state
  if (bookingsError) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load calendar</p>
      </div>
    );
  }

  // Ensure bookings is always an array
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  // Get booked dates
  const bookedDates = safeBookings
    .filter(booking => booking.status === 'confirmed' || booking.status === 'active')
    .map(booking => new Date(booking.eventDate));

  // Disable booked dates
  const disabledDates = {
    before: new Date(),
    after: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    dates: bookedDates
  };

  const getBookingStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = safeBookings.filter(booking => 
      booking.eventDate === dateStr && 
      (booking.status === 'confirmed' || booking.status === 'active')
    );

    const hasFullDay = dayBookings.some(b => b.timeSlot === 'fullday');
    const hasMorning = dayBookings.some(b => b.timeSlot === 'morning');
    const hasEvening = dayBookings.some(b => b.timeSlot === 'evening');

    if (hasFullDay || (hasMorning && hasEvening)) {
      return 'full';
    } else if (hasMorning) {
      return 'morning-booked';
    } else if (hasEvening) {
      return 'evening-booked';
    }
    return 'available';
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onDateSelect(null);
      return;
    }
    
    const status = getBookingStatus(date);
    if (status === 'full') {
      return; // Can't select fully booked days
    }
    
    onDateSelect(date);
  };

  const renderDay = (day: Date) => {
    const status = getBookingStatus(day);
    const dayNumber = day.getDate();
    const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    const isDisabled = status === 'full' || day < new Date();
    
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

  return (
    <div className="w-full border-t pt-4 mt-4">
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
      
      <div className="w-full px-4 sm:px-6 lg:px-8" style={{padding: '0px'}}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={disabledDates}
          className="w-full"
          classNames={{
		      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
	          month: "space-y-4 w-full",
	          table: "w-full border-collapse space-y-1",
	          head_row: "flex w-full",
	          head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem]",
	          row: "flex w-full mt-2",
	          cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          }}
          components={{
            Day: ({ date, displayMonth, ...props }) => (
              <button
                {...props}
                className="h-14 w-full flex flex-col items-center justify-center hover:bg-accent rounded-md transition-colors"
                disabled={getBookingStatus(date) === 'full' || date < new Date()}
                onClick={() => handleDateSelect(date)}
              >
                {renderDay(date)}
              </button>
            ),
          }}
        />
      </div>
      
      {selectedDate && (
        <div className="text-sm text-gray-600 text-center mt-4 px-4 sm:px-6 lg:px-8">
          Selected: {selectedDate.toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
