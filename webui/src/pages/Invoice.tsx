import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Download, AlertCircle } from 'lucide-react';
import { bookingService, hallService, billingService } from '@/services/ServiceFactory';
import { runtimeConfig, loadRuntimeConfig } from '@/config/runtimeConfig';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';
import { featureService, servicesService, inventoryService, paymentService } from "@/services/ServiceFactory";

const Invoice = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const invoiceNo = searchParams.get("invoiceNo") || "";
  const invoiceDate = searchParams.get("invoiceDate") || new Date().toISOString().split("T")[0];

  // Runtime config loading
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // State
  const [bookings, setBookings] = useState<any[]>([]);
  const [billingSettings, setBillingSettings] = useState<any>(null);
  const [hall, setHall] = useState<any>(null);
  const [features, setFeatures] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load config
  useEffect(() => {
    const initializeConfig = async () => {
      try {
        await loadRuntimeConfig();
        setConfigLoaded(true);
      } catch (err) {
        setConfigError("Failed to load application configuration");
        setConfigLoaded(true);
      }
    };

    initializeConfig();
  }, []);

  // Fetch data after config loads
  useEffect(() => {
    const fetchData = async () => {
      if (!configLoaded || !bookingId) return;

      try {
        setLoading(true);
        setError(null);

        const bookingData = await bookingService.getById(bookingId);
        const billingData = await billingService.getBillingSettings();

        setBookings([bookingData]);
        setBillingSettings(billingData);

        if (bookingData?.hallId) {
          const hallData = await hallService.getHallById(bookingData.hallId);
          setHall(hallData);
        }

        const [feat, serv, inv, pay] = await Promise.all([
          featureService.getByBookingId(bookingId),
          servicesService.getServiceByBookingId(bookingId),
          inventoryService.getInventoryByBookingId(bookingId),
          paymentService.getPaymentsByBookingId(bookingId)
        ]);

        setFeatures(feat || []);
        setServices(serv || []);
        setInventory(inv || []);
        setPayments(pay || []);

      } catch (err) {
        setError("Failed to load invoice data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [configLoaded, bookingId]);

  const booking = bookings?.find((b: any) => b.id === bookingId) || null;

  // --------------------------
  // ⚠ EARLY RETURN SCREENS
  // --------------------------

  if (!configLoaded) {
    return (
      <AnimatedPage className="min-h-screen bg-white p-8">
        <Card><CardContent className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading application configuration...</p>
        </CardContent></Card>
      </AnimatedPage>
    );
  }

  if (configError) {
    return (
      <AnimatedPage className="min-h-screen bg-white p-8">
        <Card><CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Configuration Error</h3>
          <p>{configError}</p>
        </CardContent></Card>
      </AnimatedPage>
    );
  }

  if (loading) {
    return (
      <AnimatedPage className="min-h-screen bg-white p-8">
        <Card><CardContent className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading invoice data...</p>
        </CardContent></Card>
      </AnimatedPage>
    );
  }

  if (error || !booking || !billingSettings) {
    return (
      <AnimatedPage className="min-h-screen bg-white p-8">
        <Card><CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Unable to load invoice data</h3>
          <p>{error}</p>
        </CardContent></Card>
      </AnimatedPage>
    );
  }

  // ------------------------------
  // ✔ SAFE: NOW booking EXISTS
  // ------------------------------

  const invoiceItems = [
    {
      description: `Hall Booking - ${hall?.name}`,
      amount: booking.totalAmount || 0,
      quantity: 1
    },
    ...features.map(f => ({
      description: `Feature - ${f.name}`,
      amount: f.price,
      quantity: f.quantity
    })),
    ...services.map(s => ({
      description: `Service - ${s.name}`,
      amount: s.price,
      quantity: 1
    })),
    ...inventory.map(i => ({
      description: `Inventory - ${i.name}`,
      amount: i.price,
      quantity: i.quantity
    }))
  ];

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);
  const taxAmount = (subtotal * billingSettings.taxPercentage) / 100;
  const totalAmount = subtotal + taxAmount;



  // ------------------------------
  // Render Invoice
  // ------------------------------

  return (
    <AnimatedPage className="min-h-screen bg-white">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #invoicetab, #invoicetab * {
              visibility: visible !important;
            }
            #invoicetab {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="no-print p-4 bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button onClick={() => window.print()}><Printer className="h-4 w-4" />Print Invoice</Button>
          {/* <Button variant="outline" onClick={() => {
            const htmlContent = document.documentElement.outerHTML;
            const blob = new Blob([htmlContent], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Invoice-${invoiceNo}.html`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4" />Download HTML
          </Button> */}
        </div>
      </div>

      {/* ------------ Invoice Layout ------------ */}
      <div className="max-w-4xl mx-auto p-8 bg-white" id='invoicetab'>

        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">{billingSettings.companyName}</h1>
            <p>{billingSettings.address}</p>
            <p>GST: {billingSettings.gstNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">INVOICE</h2>
            <p><strong>Invoice No:</strong> {invoiceNo}</p>
            <p><strong>Invoice Date:</strong> {new Date(invoiceDate).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold">Bill To:</h3>
            <p>{booking.customerName}</p>
            <p>{booking.customerEmail}</p>
            <p>{booking.customerPhone}</p>
            {booking.billingDetails?.gstNumber && (
              <p>GST: {booking.billingDetails.gstNumber}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold">Event Details:</h3>
            <p><strong>Hall:</strong> {hall?.name}</p>
            <p><strong>Date:</strong> {new Date(booking.eventDate).toLocaleDateString()}</p>
            <p><strong>Time Slot:</strong> {booking.timeSlot}</p>
            <p><strong>Event Type:</strong> {booking.eventType}</p>
            <p><strong>Guest Count:</strong> {booking.guestCount}</p>
          </div>
        </div>

        {/* Invoice Items */}
        <table className="w-full border border-gray-300 mb-8">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">HSN</th>
              <th className="border px-4 py-2">Qty</th>
              <th className="border px-4 py-2">Rate</th>
              <th className="border px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceItems.map((item, i) => (
              <tr key={i}>
                <td className="border px-4 py-2">{item.description}</td>
                <td className="border px-4 py-2 text-center">{billingSettings.hsnNumber}</td>
                <td className="border px-4 py-2 text-center">{item.quantity}</td>
                <td className="border px-4 py-2 text-right">₹{item.amount.toLocaleString()}</td>
                <td className="border px-4 py-2 text-right">₹{(item.amount * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 border border-gray-300">
            <div className="flex justify-between px-4 py-2 border-b">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-4 py-2 border-b">
              <span>GST ({billingSettings.taxPercentage}%):</span>
              <span>₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-4 py-2 font-semibold bg-gray-50">
              <span>Total:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Thank you for choosing our services!</p>
        </div>

      </div>
    </AnimatedPage>
  );
};

export default Invoice;
