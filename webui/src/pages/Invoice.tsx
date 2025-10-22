import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Download, AlertCircle } from 'lucide-react';
import { bookingService, hallService, billingService } from '@/services/ServiceFactory';
import { runtimeConfig, loadRuntimeConfig } from '@/config/runtimeConfig';

const Invoice = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const invoiceNo = searchParams.get('invoiceNo') || '';
  const invoiceDate = searchParams.get('invoiceDate') || new Date().toISOString().split('T')[0];

  // State for runtime configuration
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // State for data
  const [bookings, setBookings] = useState<any[]>([]);
  const [billingSettings, setBillingSettings] = useState<any>(null);
  const [hall, setHall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load runtime configuration on component mount
  useEffect(() => {
    const initializeConfig = async () => {
      try {
        await loadRuntimeConfig();
        setConfigLoaded(true);
        console.log('Invoice: Runtime config loaded successfully:', runtimeConfig);
      } catch (error) {
        console.error('Invoice: Failed to load runtime config:', error);
        setConfigError('Failed to load application configuration');
        setConfigLoaded(true); // Still set to true to show error state
      }
    };

    initializeConfig();
  }, []);

  // Fetch data after config is loaded
  useEffect(() => {
    const fetchData = async () => {
      if (!configLoaded) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [bookingsData, billingData] = await Promise.all([
          bookingService.getBookingsByOrganization('org-123'),
          billingService.getBillingSettings()
        ]);
        
        setBookings(bookingsData || []);
        setBillingSettings(billingData);
        
        // Get the specific booking
        const booking = bookingsData?.find((b: any) => b.id === bookingId);
        
        // Fetch hall data if booking exists
        if (booking?.hallId) {
          try {
            const hallData = await hallService.getHallById(booking.hallId);
            setHall(hallData);
          } catch (err) {
            console.error('Failed to load hall data:', err);
            setError('Failed to load hall data');
          }
        }
      } catch (err) {
        console.error('Failed to load invoice data:', err);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [configLoaded, bookingId]);

  const booking = bookings?.find((b: any) => b.id === bookingId) || null;

  // Mock invoice items - in real app, this would come from booking service
  const invoiceItems = [
    { description: 'Hall Booking - ' + (hall?.name || 'Hall'), amount: booking?.totalAmount || 0, quantity: 1 },
    { description: 'Stage Setup', amount: 500, quantity: 1 },
    { description: 'Lighting System', amount: 300, quantity: 1 },
    { description: 'Sound System', amount: 800, quantity: 1 },
  ];

  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
  const taxAmount = billingSettings ? (subtotal * billingSettings.taxPercentage) / 100 : 0;
  const totalAmount = subtotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a blob with the HTML content
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNo}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Configuration loading state
  if (!configLoaded) {
    return (
      <div className="min-h-screen bg-white p-8">
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading application configuration...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Configuration error state
  if (configError) {
    return (
      <div className="min-h-screen bg-white p-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Configuration Error</h3>
            <p className="text-gray-600 mb-4">{configError}</p>
            <p className="text-sm text-gray-500">
              API Base URL: {runtimeConfig.VITE_API_BASE_URL}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Data loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading invoice data...</p>
            <p className="text-sm text-gray-400 mt-2">
              Using API: {runtimeConfig.VITE_API_BASE_URL}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Data error state
  if (error || !booking || !billingSettings) {
    return (
      <div className="min-h-screen bg-white p-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Unable to load invoice data</h3>
            <p className="text-gray-600 mb-4">
              Please check your connection and try again.
            </p>
            {error && <p className="text-sm text-red-500">Error: {error}</p>}
            <p className="text-sm text-gray-500 mt-4">
              API Base URL: {runtimeConfig.VITE_API_BASE_URL}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print Controls - Hidden during print */}
      <div className="no-print p-4 bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download HTML
          </Button>
          {/* Debug info - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="ml-auto text-xs text-gray-500">
              API: {runtimeConfig.VITE_API_BASE_URL}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">{billingSettings.companyName}</h1>
            <div className="text-gray-600">
              <p>{billingSettings.address}</p>
              <p>GST: {billingSettings.gstNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
            <div className="text-gray-600">
              <p><strong>Invoice No:</strong> {invoiceNo}</p>
              <p><strong>Invoice Date:</strong> {new Date(invoiceDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Bill To:</h3>
            <div className="text-gray-600">
              <p className="font-medium">{booking.customerName}</p>
              <p>{booking.customerEmail}</p>
              <p>{booking.customerPhone}</p>
              {booking.billingDetails && (
                <>
                  <p className="mt-2">{booking.billingDetails.billingAddress}</p>
                  {booking.billingDetails.gstNumber && (
                    <p>GST: {booking.billingDetails.gstNumber}</p>
                  )}
                </>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Event Details:</h3>
            <div className="text-gray-600">
              <p><strong>Hall:</strong> {hall?.name}</p>
              <p><strong>Event Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}</p>
              <p><strong>Time Slot:</strong> {booking.timeSlot}</p>
              <p><strong>Event Type:</strong> {booking.eventType}</p>
              <p><strong>Guest Count:</strong> {booking.guestCount}</p>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-3 text-center">HSN</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Qty</th>
                <th className="border border-gray-300 px-4 py-3 text-right">Rate</th>
                <th className="border border-gray-300 px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-3">{item.description}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{billingSettings.hsnNumber}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">₹{item.amount.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">₹{(item.amount * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="border border-gray-300">
              <div className="flex justify-between px-4 py-2 border-b border-gray-300">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-4 py-2 border-b border-gray-300">
                <span>GST ({billingSettings.taxPercentage}%):</span>
                <span>₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-4 py-3 bg-gray-50 font-semibold text-lg">
                <span>Total:</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Payment Details:</h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Bank Name:</strong> {billingSettings.bankName}</p>
                <p><strong>Account Number:</strong> {billingSettings.bankAccount}</p>
              </div>
              <div>
                <p><strong>IFSC Code:</strong> {billingSettings.ifscNumber}</p>
                <p><strong>Payment Terms:</strong> Due on event date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Terms & Conditions:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. Payment is due on or before the event date.</p>
            <p>2. Any damages to the property will be charged separately.</p>
            <p>3. Cancellation policy applies as per booking terms.</p>
            <p>4. All disputes are subject to local jurisdiction.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Thank you for choosing our services!</p>
          <p>For any queries, please contact us at {billingSettings.companyName}</p>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
