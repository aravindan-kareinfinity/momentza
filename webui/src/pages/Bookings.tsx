import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, User, MapPin, Users, Plus, MessageCircle, Edit, Settings, Search } from 'lucide-react';
import { 
  bookingService, 
  hallService, 
  authService 
} from '@/services/ServiceFactory';
import { useServiceMutation } from '@/hooks/useService';
import { AddBookingDialog } from '@/components/Bookings/AddBookingDialog';
import { CommunicationDialog } from '@/components/Bookings/CommunicationDialog';
import { StatusChangeDialog } from '@/components/Bookings/StatusChangeDialog';
import { Booking, User as UserType } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

const Bookings = () => {
  const navigate = useNavigate();
  
  // State for data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user first
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        if (!user?.organizationId) {
          setLoading(false);
          return;
        }
        
        console.log('[Bookings] Fetching bookings and halls data...');
        const [bookingsData, hallsData] = await Promise.all([
          bookingService.getBookingsByOrganization(user.organizationId),
          hallService.getAllHalls()
        ]);
        
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setHalls(Array.isArray(hallsData) ? hallsData : []);
        setIsSearchActive(false); // Ensure we start with no search active
        setShowErrorDialog(false);
      } catch (err) {
        const error = err as Error;
        console.error('Failed to load bookings data:', error);
        setError(error);
        setShowErrorDialog(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array - runs only once

  const handleRetry = async () => {
    // Reset and refetch data
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }
      
      const [bookingsData, hallsData] = await Promise.all([
        bookingService.getBookingsByOrganization(user.organizationId),
        hallService.getAllHalls()
      ]);
      
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setHalls(Array.isArray(hallsData) ? hallsData : []);
      setIsSearchActive(false); // Ensure we start with no search active
      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  const refreshBookings = async () => {
    if (!currentUser?.organizationId) {
      return;
    }
    
    try {
      const bookingsData = await bookingService.getBookingsByOrganization(currentUser.organizationId);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setIsSearchActive(false); // Reset search state when refreshing
    } catch (err) {
      console.error('Failed to refresh bookings:', err);
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [communicationBooking, setCommunicationBooking] = useState<Booking | null>(null);
  const [statusChangeBooking, setStatusChangeBooking] = useState<Booking | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Mutation hooks
  const updateBookingStatusMutation = useServiceMutation(
    (data: { id: string; status: Booking['status']; reason?: string }) => 
      bookingService.updateBookingStatus(data.id, data.status, data.reason)
  );

  const updateBookingCommunicationMutation = useServiceMutation(
    (data: { id: string; lastContactDate: string; customerResponse: string }) => 
      bookingService.updateBookingCommunication(data.id, data.lastContactDate, data.customerResponse)
  );

  const toggleBookingActiveMutation = useServiceMutation(
    (data: { id: string; isActive: boolean }) => 
      bookingService.toggleBookingActive(data.id, data.isActive)
  );

  const getHallName = (hallId: string) => {
    const hall = halls?.find(h => h.id === hallId);
    return hall?.name || 'Unknown Hall';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDateDDMMYYYY = (input: string) => {
    if (!input) {
      return '';
    }
    // Support both YYYY-MM-DD and full ISO date-time
    const [yStr, mStr, dStr] = input.split('T')[0].split('-');
    const yyyy = yStr?.padStart(4, '0') || '';
    const mm = mStr ? String(parseInt(mStr, 10)).padStart(2, '0') : '';
    const dd = dStr ? String(parseInt(dStr, 10)).padStart(2, '0') : '';
    if (!yyyy || !mm || !dd) {
      // Fallback to native formatting if parsing fails
      try {
        const d = new Date(input);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear());
        return `${day}/${month}/${year}`;
      } catch {
        return input;
      }
    }
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status'], reason?: string) => {
    await updateBookingStatusMutation.execute({ id: bookingId, status: newStatus, reason });
    
    if (reason) {
      await updateBookingCommunicationMutation.execute({
        id: bookingId,
        lastContactDate: new Date().toISOString().split('T')[0],
        customerResponse: `Status changed to ${newStatus}. Reason: ${reason}`
      });
    }
    
    await refreshBookings();
  };

  const handleEditBooking = (booking: Booking) => {
    navigate(`/admin/bookings/edit/${booking.id}`);
  };

  const handleManageBooking = (booking: Booking) => {
    navigate(`/admin/happening/manage/${booking.id}`);
  };

  const handleActiveToggle = async (bookingId: string, isActive: boolean) => {
    await toggleBookingActiveMutation.execute({ id: bookingId, isActive });
    await refreshBookings();
  };

  const isUpcoming = (eventDate: string) => {
    const today = new Date();
    const bookingDate = new Date(eventDate);
    return bookingDate >= today;
  };

  const handleSearch = async (params?: {
    organizationId?: string;
    eventDateFrom?: string;
    eventDateTo?: string;
    status?: string;
    searchTerm?: string;
  }) => {
    const effectiveOrganizationId = params?.organizationId || currentUser?.organizationId;
    if (!effectiveOrganizationId) {
      return;
    }

    setIsSearching(true);
    try {
      // Build search request object
      const searchRequest: any = {
        organizationId: effectiveOrganizationId
      };

      // Determine status
      const effectiveStatus = params?.status ?? statusFilter;
      if (effectiveStatus && effectiveStatus !== 'all') {
        if (effectiveStatus === 'upcoming') {
          searchRequest.eventDateFrom = new Date().toISOString().split('T')[0];
        } else {
          searchRequest.status = effectiveStatus;
        }
      }

      // Determine date range
      const effectiveDateFrom = params?.eventDateFrom ?? dateFrom;
      const effectiveDateTo = params?.eventDateTo ?? dateTo;
      if (effectiveDateFrom) {
        searchRequest.eventDateFrom = effectiveDateFrom;
      }
      if (effectiveDateTo) {
        searchRequest.eventDateTo = effectiveDateTo;
      }

      // Determine search term
      const effectiveSearchTerm = params?.searchTerm ?? searchTerm;
      if (effectiveSearchTerm) {
        searchRequest.searchTerm = effectiveSearchTerm;
        searchRequest.CustomerName = effectiveSearchTerm;
      }

      console.log('[Bookings] Searching with request:', searchRequest);

      // Call the API with search parameters
      const searchResults = await bookingService.searchBookings(searchRequest);
      setBookings(Array.isArray(searchResults) ? searchResults : []);
      setIsSearchActive(true);

    } catch (err) {
      console.error('Search failed:', err);
      // Keep existing bookings on search error
    } finally {
      setIsSearching(false);
    }
  };

  // Apply client-side date range filtering so UI updates immediately when dates change
  const filteredBookings = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    if (!dateFrom && !dateTo) {
      return list;
    }

    // Normalize to date-only (avoid timezone issues)
    const toDateOnlyTs = (isoOrDateOnly: string): number => {
      const [y, m, d] = isoOrDateOnly.split('T')[0].split('-').map((v) => parseInt(v, 10));
      return Date.UTC(y, m - 1, d);
    };

    const fromTs = dateFrom ? toDateOnlyTs(dateFrom) : null;
    const toTs = dateTo ? toDateOnlyTs(dateTo) : null;

    return list.filter((booking) => {
      const eventTs = toDateOnlyTs(booking.eventDate);
      if (fromTs !== null && eventTs < fromTs) {
        return false;
      }
      if (toTs !== null && eventTs > toTs) {
        return false;
      }
      return true;
    });
  }, [bookings, dateFrom, dateTo]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
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
                {error.message}
              </p>
              <Button onClick={handleRetry} className="mt-2">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bookings Management</h1>
          <p className="text-gray-600">View and manage all hall bookings</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Booking
        </Button>
      </div>

      {/* Enhanced Search and Filter Section */}
      <Card className={isSearchActive ? "ring-2 ring-blue-200 bg-blue-50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
            {isSearchActive && (
              <Badge variant="secondary" className="ml-2">
                Search Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bookings</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="pending">New Leads</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from">Event Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Event Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handleSearch()}
                disabled={isSearching}
                className="min-w-[120px]"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
              
              {(searchTerm || dateFrom || dateTo || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setSearchTerm('');
                    setDateFrom('');
                    setDateTo('');
                    setStatusFilter('all');
                    setIsSearchActive(false);
                    
                    // Reset to show all bookings
                    if (currentUser?.organizationId) {
                      try {
                        const allBookings = await bookingService.getBookingsByOrganization(currentUser.organizationId);
                        setBookings(Array.isArray(allBookings) ? allBookings : []);
                      } catch (err) {
                        console.error('Failed to reset bookings:', err);
                      }
                    }
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            <span className="text-sm text-gray-600">
              {isSearchActive 
                ? `Found ${filteredBookings.length} booking(s) matching your search`
                : `Showing ${filteredBookings.length} booking(s)`
              }
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{booking.customerName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditBooking(booking)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                {getHallName(booking.hallId)}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDateDDMMYYYY(booking.eventDate)} - {booking.timeSlot}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                {booking.guestCount} guests
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2" />
                {booking.customerEmail} • {booking.customerPhone}
              </div>

              {booking.lastContactDate && (
                <div className="text-sm text-gray-600">
                  <strong>Last Contact:</strong> {formatDateDDMMYYYY(booking.lastContactDate)}
                </div>
              )}

              {booking.customerResponse && (
                <div className="text-sm text-gray-600">
                  <strong>Response:</strong> {booking.customerResponse}
                </div>
              )}
              
              {statusFilter === 'upcoming' && booking.status === 'confirmed' && (
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Label htmlFor={`active-${booking.id}`} className="text-sm">
                    Mark as Active
                  </Label>
                  <Switch
                    id={`active-${booking.id}`}
                    checked={booking.isActive || false}
                    onCheckedChange={(checked) => handleActiveToggle(booking.id, checked)}
                  />
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Event Type:</span>
                  <Badge variant="outline">{booking.eventType}</Badge>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-semibold">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCommunicationBooking(booking)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Communication
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setStatusChangeBooking(booking)}
                  >
                    Change Status
                  </Button>
                </div>
                
                {booking.status === 'completed' && (
                  <Button 
                    size="sm"
                    onClick={() => handleManageBooking(booking)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {isSearchActive ? "No Search Results Found" : "No Bookings Found"}
            </h3>
            <p className="text-gray-500">
              {isSearchActive 
                ? "No bookings match your search criteria. Try adjusting your search terms or filters."
                : bookings?.length === 0 
                  ? "No bookings available." 
                  : "No bookings match your current filters. Try adjusting your search criteria."
              }
            </p>
          </CardContent>
        </Card>
      )}

      <AddBookingDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onBookingAdded={refreshBookings}
      />

      <CommunicationDialog
        isOpen={!!communicationBooking}
        onClose={() => setCommunicationBooking(null)}
        bookingId={communicationBooking?.id || ''}
        onCommunicationAdded={refreshBookings}
      />

      <StatusChangeDialog
        booking={statusChangeBooking}
        open={!!statusChangeBooking}
        onOpenChange={(open) => !open && setStatusChangeBooking(null)}
        onStatusChanged={handleStatusChange}
      />

      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetry}
        isLoading={loading}
        title="Bookings Service Error"
        message={error?.message || 'Unable to load bookings data. Please try again.'}
      />
    </div>
  );
};

export default Bookings;
