import React from 'react';
import { useService, useServiceMutation } from '../hooks/useService';
import { 
  bookingService, 
  settingsService, 
  inventoryService 
} from '../services/ServiceFactory';

export const ServiceArchitectureExample: React.FC = () => {
  // Example of using the service hooks for data fetching
  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refresh: refreshBookings
  } = useService(() => bookingService().getBookingsByOrganization('org1'), {
    cacheTime: 2 * 60 * 1000 // 2 minutes
  });

  const {
    data: eventTypes,
    loading: eventTypesLoading,
    error: eventTypesError
  } = useService(() => settingsService().getEventTypes());

  const {
    data: inventoryItems,
    loading: inventoryLoading,
    error: inventoryError
  } = useService(() => inventoryService().getAllInventoryItems());

  // Example of using mutation hooks
  const updateBookingMutation = useServiceMutation(
    (data: { id: string; status: string; reason?: string }) => 
      bookingService().updateBookingStatus(data.id, data.status as any, data.reason)
  );

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    const result = await updateBookingMutation.execute({ 
      id: bookingId, 
      status: newStatus 
    });
    if (result) {
      refreshBookings(); // Refresh the data after successful update
    }
  };

  // Error handling UI
  if (bookingsError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading bookings
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{bookingsError}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={refreshBookings}
                  className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (bookingsLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Service Architecture Example</h1>
      
      {/* Bookings Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Bookings</h2>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-2">
            {bookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{booking.customerName}</p>
                    <p className="text-sm text-gray-600">{booking.eventType}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                      disabled={updateBookingMutation.loading}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                    >
                      {updateBookingMutation.loading ? 'Updating...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No bookings found</p>
        )}
      </div>

      {/* Event Types Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Event Types</h2>
        {eventTypesLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : eventTypesError ? (
          <p className="text-red-500">Error loading event types: {eventTypesError}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {eventTypes?.map((eventType) => (
              <span key={eventType.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {eventType.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Inventory Items Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Inventory Items</h2>
        {inventoryLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ) : inventoryError ? (
          <p className="text-red-500">Error loading inventory: {inventoryError}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {Array.isArray(inventoryItems) && inventoryItems.map((item) => (
              <div key={item.id} className="border rounded p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">₹{item.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mutation Error Display */}
      {updateBookingMutation.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 text-sm">
            Error updating booking: {updateBookingMutation.error}
          </p>
          <button
            onClick={updateBookingMutation.clearError}
            className="mt-2 text-red-600 text-sm hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}; 