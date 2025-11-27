import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  DollarSign, 
  FileText, 
  Plus, 
  Edit,
  Trash2,
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Ticket,
  Settings,
  Download,
  Printer
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  bookingService, 
  settingsService, 
  inventoryService, 
  ticketService, 
  paymentService,
  communicationService, 
  billingService,
  hallService,
  servicesService,
  handoverService,
  featureService
} from '../services/ServiceFactory';
import { TicketItem, Communication,PaymentsItem,Services } from '../services/mockData';
import { FeatureItem } from '@/types';
import { ApiPaymentService } from '../services/api/ApiPaymentService';

// interface PaymentsItem {
//   id: string;
//   date: string;
//   paymentMode: 'cash' | 'card' | 'upi' | 'bank-transfer';
//   amount: number;
//   personName: string;
//   notes: string;
//   createdAt?: string;
//   updatedAt?: string;
// }

interface Feature {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// interface Service {
//   id: string;
//   name: string;
//   price: number;
//   directPay: boolean;
// }

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes: string;
}

// interface HandoverImage {
//   id: string;
//   url: string;
//   category: string;
//   description: string;
// }

interface HandOverImage {
  id: string;
  bookingId: string;
  organizationId: string;
  category: string;
  description?: string;
  url: string;
  uploadedAt: string;
  createdAt: string;
}

// Page-level data interface
interface BookingManagementData {
  bookings: any[];
  eventTypes: any[];
  employees: any[];
  inventoryCatalog: any[];
  inventoryItems: any[];
  ticketCategories: any[];
  servicesCategories: any[];
  hall: any;
  features: any[];
  services: any[];
  tickets: any[];
  payments:any[];
  communication: any[];
  billingSettings: any;
  currentBooking: any;
}

const BookingManagement = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  // Helper functions
  const generateInvoiceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const invoiceNo = `INV-${timestamp}-${random}`;
    setInvoiceNumber(invoiceNo);
    return invoiceNo;
  };

  // Page-level state for all data
  const [pageData, setPageData] = useState<BookingManagementData>({
    bookings: [],
    eventTypes: [],
    employees: [],
    inventoryCatalog: [],
    inventoryItems: [],
    ticketCategories: [],
    servicesCategories: [],
    hall: null,
    features:[],
    services: [],
    tickets: [],
    payments:[],
    communication: [],
    billingSettings: null,
    currentBooking: null
  });



  // Single loading and error state for entire page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // State for all functionality
  // const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([
  //   { id: 'feature-1', name: 'Stage', price: 500, quantity: 1 },
  //   { id: 'feature-2', name: 'Lighting', price: 300, quantity: 1 },
  // ]);
  
  // const [selectedServices, setSelectedServices] = useState<Services[]>([
  //   { id: 'service-1', name: 'Catering', price: 2000, directPay: false},
  //   { id: 'service-2', name: 'Decoration', price: 1500, directPay: false},
  // ]);
  
  // const [payments, setPayments] = useState<PaymentsItem[]>([
  //   { id: 'payment-1', date: new Date().toISOString(), paymentMode: 'cash', amount:1000, personName: 'John Doe', notes: 'Initial payment',bookingId:'234678',createdAt:'2341524', updatedAt:'324551' },
  // ]);
  
  // const [handoverImages, setHandoverImages] = useState<HandoverImage[]>([
  //   { id: 'img-1', url: '/placeholder.svg', category: 'Before Event', description: 'Hall setup before event' },
  // ]);

  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  //
  const [handoverImages, setHandoverImages] = useState<HandOverImage[]>([]);
  useEffect(() => {
    const fetchHandoverImages = async () => {
      if (bookingId) {
        const images = await handoverService.getImages(bookingId);
        setHandoverImages(images);
      }
    };
    fetchHandoverImages();
  }, [bookingId]);

  // Billing information state
  const [billingName, setBillingName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingGST, setBillingGST] = useState('');

  // Time slot state - simplified like in bookings.tsx
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [baseAmount, setBaseAmount] = useState(0);

  // Dialog states
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [showHandoverImageDialog, setShowHandoverImageDialog] = useState(false);
  const [showEditInventoryDialog, setShowEditInventoryDialog] = useState(false);
  const [showCommunicationDialog, setShowCommunicationDialog] = useState(false);
  const [statusChangeDialog, setStatusChangeDialog] = useState({ open: false, bookingId: '', newStatus: '', reason: '' });

  // Form states
  const [newFeature, setNewFeature] = useState({ name: '', quantity: 1 ,price:0});
  const [newService, setNewService] = useState({ name: '', directPay: false });
  const [newPayment, setNewPayment] = useState({ date: new Date().toISOString(), mode: 'cash' as PaymentsItem['paymentMode'], amount: 0, personName: '', notes: '' });
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: '', assignedTo: '', priority: 'medium' as 'low' | 'medium' | 'high', status: 'open' as 'open' | 'in-progress' | 'completed' });
  const [newInventoryItem, setNewInventoryItem] = useState({ name: '',description:'', quantity: 1, price: 0, notes: '' });
  const [newHandoverImage, setNewHandoverImage] = useState({ category: '', description: '' });
  const [selectedHandoverFile, setSelectedHandoverFile] = useState<File | null>(null);
  const [newCommunication, setNewCommunication] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    fromPerson: '', 
    toPerson: '', 
    detail: '',
    Createdat: ''
  });

  // Edit states
  const [editingItem, setEditingItem] = useState<any>(null);

  // Available time slots - simple array like in bookings.tsx
  const availableTimeSlots = [
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
    { value: 'fullday', label: 'Full Day' }
  ];

  // Calculate base amount based on time slot - simplified
  const calculateBaseAmount = (timeSlot: string): number => {
    if (!timeSlot) {
      console.warn('[BookingManagement] No time slot provided for base amount calculation');
      return 0;
    }
    
    // Use the booking's total amount or calculate based on time slot
    const booking = pageData.currentBooking;
    if (booking?.totalAmount && booking.totalAmount > 0) {
      return booking.totalAmount;
    }
    
    // Fallback pricing based on time slot
    const pricing: { [key: string]: number } = {
      'morning': 10000,
      'evening': 15000,
      'fullday': 25000
    };
    
    const baseAmount = pricing[timeSlot] || 0;
    console.log(`[BookingManagement] Base amount calculation for ${timeSlot}: ₹${baseAmount}`);
    
    return baseAmount;
  };

  // Update booking when time slot changes
  const handleTimeSlotChange = async (newTimeSlot: string) => {
    if (!pageData.currentBooking) return;
    
    try {
      const newBaseAmount = calculateBaseAmount(newTimeSlot);
      
      console.log(`[BookingManagement] Time slot change: ${selectedTimeSlot} → ${newTimeSlot}, amount: ₹${newBaseAmount}`);
      
      // Create updated booking object
      const updatedBooking = {
        ...pageData.currentBooking,
        timeSlot: newTimeSlot,
        totalAmount: newBaseAmount,
        updatedAt: new Date().toISOString()
      };
      
      // Update in database
      const result = await bookingService.update(pageData.currentBooking.id, updatedBooking);
      
      if (result) {
        console.log('[BookingManagement] Successfully updated booking in database');
        
        // Update local state immediately
        setSelectedTimeSlot(newTimeSlot);
        setBaseAmount(newBaseAmount);
        setPageData(prev => ({
          ...prev,
          currentBooking: updatedBooking
        }));
        
      } else {
        throw new Error('Failed to update booking in database');
      }
    } catch (error) {
      console.error('[BookingManagement] Failed to update time slot:', error);
      // Revert UI state on error
      setSelectedTimeSlot(pageData.currentBooking.timeSlot);
    }
  };

  // Fetch all data once when page initializes
  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[BookingManagement] Fetching all page data...');

      // First, get all halls to see what's available
      let allHalls = [];
      try {
        allHalls = await hallService.getAllHalls();
        console.log('[BookingManagement] Available halls:', allHalls);
      } catch (hallError) {
        console.warn('[BookingManagement] Could not fetch halls:', hallError);
      }

      // First, try to load the specific booking if bookingId is present
      let currentBooking = null as any;

      if (bookingId) {
        try {
          currentBooking = await bookingService.getById(bookingId);
          console.log('[BookingManagement] Loaded booking by id:', bookingId, currentBooking);
        } catch (getByIdErr) {
          console.warn('[BookingManagement] Failed to load booking by id, will fallback to organization bookings', getByIdErr);
        }
      }

      // Determine organizationId from either the booking (if loaded) or from page data
      const organizationId = currentBooking?.organizationId || pageData.currentBooking?.organizationId || (pageData.bookings?.[0]?.organizationId);

      if (!organizationId) {
        throw new Error('Organization ID not found for fetching bookings and related data');
      }

      // Fetch all supporting data in parallel with resilience
      const results = await Promise.allSettled([
        bookingService.getBookingsByOrganization(organizationId),
        settingsService.getEventTypes(),
        settingsService.getEmployees(),
        settingsService.getInventoryItems(),
        settingsService.getTicketCategories(),
        servicesService.getAllServices(),
        billingService.getBillingSettings()
      ]);

      const getOrDefault = <T,>(idx: number, def: T): T => {
        const r = results[idx];
        if (r && r.status === 'fulfilled') {
          return (r as PromiseFulfilledResult<T>).value;
        }
        console.error('[BookingManagement] Failed fetching index', idx, r && r.status === 'rejected' ? r.reason : 'unknown');
        return def;
      };

      const bookings = getOrDefault<any[]>(0, []);
      const eventTypes = getOrDefault<any[]>(1, []);
      const employees = getOrDefault<any[]>(2, []);
      const inventoryCatalog = getOrDefault<any[]>(3, []);
      const ticketCategories = getOrDefault<any[]>(4, []);
      const servicesCategories = getOrDefault<any[]>(5, []);
      const billingSettings = getOrDefault<any>(6, null);

      // Find current booking
      currentBooking = currentBooking || bookings.find((b: any) => b.id === bookingId) || pageData.currentBooking || null;

      // Try to get the hall - use first available hall if the specified one doesn't exist
      let hall = null;
      const bookingHallId = currentBooking?.hallId;

      if (bookingHallId) {
        try {
          hall = await hallService.getById(bookingHallId);
          console.log('[BookingManagement] Found hall with ID:', bookingHallId, hall);
        } catch (hallError) {
          console.warn(`[BookingManagement] Hall with ID ${bookingHallId} not found, trying first available hall`);
          // Use first available hall as fallback
          if (allHalls.length > 0) {
            hall = allHalls[0];
            console.log('[BookingManagement] Using fallback hall:', hall);
          }
        }
      }

      // If still no hall and we have halls available, use the first one
      if (!hall && allHalls.length > 0) {
        hall = allHalls[0];
        console.log('[BookingManagement] Using first available hall as fallback:', hall);
      }

      // Fetch booking-specific data
      const bookingIdSafe = currentBooking?.id || bookingId || '1';
      const [featureRes,servicesRes,inventoryRes, ticketsRes,paymentRes, commsRes] = await Promise.allSettled([
        featureService.getById(bookingIdSafe),
        servicesService.getServiceByBookingId(bookingIdSafe),
        inventoryService.getInventoryByBookingId(bookingIdSafe),
        ticketService.getTicketsByBookingId(bookingIdSafe),
        paymentService.getPaymentsByBookingId(bookingIdSafe),
        communicationService.getCommunicationsByBookingId(bookingIdSafe)
      ]);

      // Normalize tickets and communications so they are always arrays
      const featuresRaw = featureRes.status === 'fulfilled' ? featureRes.value : [];
      const servicesRaw = servicesRes.status === 'fulfilled' ? servicesRes.value : [];
      const inventoryRaw = inventoryRes.status === 'fulfilled' ? inventoryRes.value : [];
      const ticketsRaw = ticketsRes.status === 'fulfilled' ? ticketsRes.value : [];
      const paymentRaw= paymentRes.status === 'fulfilled' ? paymentRes.value : [];
      const communicationsRaw = commsRes.status === 'fulfilled' ? commsRes.value : [];

      const features = Array.isArray(featuresRaw) ? featuresRaw : (featuresRaw ? [featuresRaw] : []);
      const services = Array.isArray(servicesRaw) ? servicesRaw : (servicesRaw ? [servicesRaw] : []);
      const inventory = Array.isArray(inventoryRaw) ? inventoryRaw : (inventoryRaw ? [inventoryRaw] : []);
      const tickets = Array.isArray(ticketsRaw) ? ticketsRaw : (ticketsRaw ? [ticketsRaw] : []);
      const payments = Array.isArray(paymentRaw) ? paymentRaw : (paymentRaw ? [paymentRaw] : []);
      const communications = Array.isArray(communicationsRaw) ? communicationsRaw : (communicationsRaw ? [communicationsRaw] : []);

      if (servicesRes.status === 'rejected') console.warn('[BookingManagement] Failed fetching tickets:', servicesRes.reason);
      if (inventoryRes.status === 'rejected') console.warn('[BookingManagement] Failed fetching tickets:', inventoryRes.reason);
      if (ticketsRes.status === 'rejected') console.warn('[BookingManagement] Failed fetching tickets:', ticketsRes.reason);
      if (paymentRes.status === 'rejected') console.warn('[BookingManagement] Failed fetching tickets:', paymentRes.reason);
      if (commsRes.status === 'rejected') console.warn('[BookingManagement] Failed fetching communications:', commsRes.reason);

      // Set time slot and calculate base amount from current booking
      if (currentBooking) {
        const initialTimeSlot = currentBooking.timeSlot || '';
        setSelectedTimeSlot(initialTimeSlot);
        
        // Calculate base amount from time slot (use stored totalAmount if available)
        const calculatedBaseAmount = currentBooking.totalAmount > 0 ? currentBooking.totalAmount : calculateBaseAmount(initialTimeSlot);
        setBaseAmount(calculatedBaseAmount);
        
        console.log(`[BookingManagement] Initial booking setup:`, {
          timeSlot: initialTimeSlot,
          calculatedBaseAmount: calculatedBaseAmount,
          storedTotalAmount: currentBooking.totalAmount
        });

        // If stored total amount is 0 but we have a time slot, update the booking
        if (currentBooking.totalAmount === 0 && initialTimeSlot && calculatedBaseAmount > 0) {
          console.log('[BookingManagement] Updating booking with calculated base amount');
          const updatedBooking = {
            ...currentBooking,
            totalAmount: calculatedBaseAmount,
            updatedAt: new Date().toISOString()
          };
          await bookingService.update(currentBooking.id, updatedBooking);
          currentBooking = updatedBooking;
        }
      }

      setPageData({
        bookings,
        eventTypes,
        employees,
        inventoryCatalog,
        inventoryItems: inventory,
        features,
        services,
        servicesCategories,
        ticketCategories,
        hall,
        tickets,
        payments,
        communication: communications,
        billingSettings,
        currentBooking
      });

      // Auto-populate billing details from booking
      if (currentBooking?.billingDetails) {
        setBillingName(currentBooking.billingDetails.billingName || '');
        setBillingAddress(currentBooking.billingDetails.billingAddress || '');
        setBillingGST(currentBooking.billingDetails.gstNumber || '');
      }

      // Auto-generate invoice number and date if empty
      if (!invoiceNumber) {
        setInvoiceNumber(generateInvoiceNumber());
      }
      if (!invoiceDate) {
        setInvoiceDate(new Date().toISOString().split('T')[0]);
      }

      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      console.error('[BookingManagement] Error fetching page data:', error);
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data once when page mounts
  useEffect(() => {
    fetchPageData();
  }, [bookingId]);

  const handleRetry = async () => {
    await fetchPageData();
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Handle booking status change from dialog
  const handleStatusChange = async (
    bookingId: string,
    newStatus: string,
    reason?: string
  ) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus as any, reason);

      if (reason) {
        // Record the communication entry about the status change
        await bookingService.updateBookingCommunication(
          bookingId,
          new Date().toISOString().split('T')[0],
          `Status changed to ${newStatus}. Reason: ${reason}`
        );
      }

      // Refresh page data to reflect latest status
      await fetchPageData();

      // Close and reset the dialog state
      setStatusChangeDialog({ open: false, bookingId: '', newStatus: '', reason: '' });
    } catch (e) {
      console.error('[BookingManagement] Failed to change status', e);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pageData.currentBooking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Unable to load booking data</p>
        </div>
        
        <ServerErrorDialog
          isOpen={showErrorDialog}
          onClose={handleCloseErrorDialog}
          onRetry={handleRetry}
          isLoading={loading}
          title="Booking Data Error"
          message={error?.message || 'Unable to load booking data. Please try again.'}
        />
      </div>
    );
  }

  // Extract data for easier access
  const {
    currentBooking: booking,
    eventTypes:availableFeatureCatalog,
    employees,
    inventoryCatalog,
    inventoryItems: bookingInventoryItems,
    ticketCategories: availableTicketCategories,
    hall,
    servicesCategories :availableServiceCategories,
    features:featuresList,
    services:servicesList,
    tickets: ticketsList,
    communication: communicationsList,
    billingSettings
  } = pageData;

const availableInventoryItems = Array.isArray(inventoryCatalog) ? inventoryCatalog : (inventoryCatalog ? [inventoryCatalog] : []);
const availableServiceItem = Array.isArray(availableServiceCategories) ? availableServiceCategories : (availableServiceCategories ? [availableServiceCategories] : []);
const availableFeatureItem = Array.isArray(availableFeatureCatalog) ? availableFeatureCatalog : (availableFeatureCatalog ? [availableFeatureCatalog] : []);
  // Defensive normalization for render-time lists
  const ticketsArray = Array.isArray(ticketsList) ? ticketsList : (ticketsList ? [ticketsList] : []);
  const servicesArray = Array.isArray(servicesList) ? servicesList : (servicesList ? [servicesList] : []);
  const bookingInventoryArray = Array.isArray(bookingInventoryItems) ? bookingInventoryItems : (bookingInventoryItems ? [bookingInventoryItems] : []);
  const featureArray = Array.isArray(featuresList) ?featuresList : (featuresList ? [featuresList] : []);
  const masterFeatures = hall?.features || [];
  
  // Use the calculated baseAmount from state
  const bookingSafe: any = booking || {};
  const bookingGuestCount = Number(bookingSafe.guestCount) || 0;
  const bookingEventDateIso = bookingSafe.eventDate && !isNaN(Date.parse(bookingSafe.eventDate))
    ? new Date(bookingSafe.eventDate).toISOString().split('T')[0]
    : '';

  // Calculate totals - use the baseAmount from state
  const safeBookingTotal = baseAmount;
  const featuresTotal = featureArray.reduce((sum, f) => sum + (Number( f.price ) * Number(f.quantity || 0)), 0);
  const servicesTotal = servicesArray.filter(s => !s.directPay).reduce((sum, s) => sum + Number(s.price || 0), 0);
  const inventoryTotal = bookingInventoryArray.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const safeDiscount = Number(discount || 0);
  const totalCharges = safeBookingTotal + featuresTotal + servicesTotal + inventoryTotal - safeDiscount;

  const totalPayments = pageData.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const gstPercentage = Number(billingSettings?.taxPercentage || 0);
  const taxAmount = Math.round((totalCharges * gstPercentage) / 100);
  const billAmount = totalCharges + taxAmount;
  const balanceAmount = billAmount - totalPayments;

  // Debug log to verify calculations
  console.log('[BookingManagement] Current state:', { 
    selectedTimeSlot,
    baseAmount, 
    safeBookingTotal
  });

  // Billing handlers
  const handleSaveBillingInfo = async () => {
    if (!booking) return;
    const updatedBooking = {
      ...booking,
      billingDetails: {
        billingName,
        billingAddress,
        gstNumber: billingGST
      }
    };
    await bookingService.update(booking.id, updatedBooking);
    await fetchPageData();
  };

 // Feature handlers
 const handleAddFeature = async () => {
  try {
    const featureData = {
      name: newFeature.name,
      quantity: newFeature.quantity,
      price:newFeature.price ,
      organizationId: pageData.currentBooking?.organizationId
    };

    const created = await featureService.create(featureData);

    setPageData(prev => ({
      ...prev,
      features: [...prev.features, created]
    }));

    setNewFeature({ name: "", quantity: 1, price: 0 });
    setShowFeatureDialog(false);
  } catch (err) {
    console.error("Failed to create feature", err);
  }
};

// Update the feature selection handler
const handleFeatureSelect = (featureName: string) => {
  const selectedFeature = masterFeatures.find(f => f.name === featureName);
  if (selectedFeature) {
    setNewFeature({
      ...newFeature,
      name: featureName,
      price: selectedFeature.charge || 0
    });
  }
};

const handleEditFeature = (feature: any) => {
  setEditingItem(feature);
  setNewFeature({
    name: feature.name,
    quantity: feature.quantity,
    price: feature.price
  });
  setShowFeatureDialog(true);
};

const handleUpdateFeature = async () => {
  try {
    const updated = await featureService.update(editingItem.id, {
      name: newFeature.name,
      quantity: newFeature.quantity,
      price: newFeature.price
    });

    setPageData(prev => ({
      ...prev,
      features: prev.features.map(f =>
        f.id === updated.id ? updated : f
      )
    }));

    setEditingItem(null);
    setShowFeatureDialog(false);
  } catch (err) {
    console.error("Failed to update feature", err);
  }
};



const handleDeleteFeature = async (id: string, reason: string) => {
  try {
    const ok = await featureService.delete(id);
    if (!ok) return;

    setPageData(prev => ({
      ...prev,
      features: prev.features.filter(f => f.id !== id)
    }));
  } catch (err) {
    console.error("Failed to delete feature", err);
  }
};

  // Service handlers
const handleAddService = async () => {
  try {
    const service = availableServiceCategories.find(s => s.name === newService.name);
    if (service) {
      const serviceData: Omit<Services, 'id'> = {
        name: service.name,
        price: service.basePrice,
        directPay: Boolean(newService.directPay), 
        bookingId: bookingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Actually create the service
      const createdService = await servicesService.addService(serviceData);
      
      // Update local state
      setPageData(prev => ({
        ...prev,
        services: [...prev.services, createdService]
      }));
      
      // Reset form
      setNewService({ name: '', directPay: false });
      setShowServiceDialog(false);
    }
  } catch (error) {
    console.error('Error adding service:', error);
    alert('Failed to add service');
  }
};

const handleEditService = (service: Services) => {
  setEditingItem(service);
  setNewService({ 
    name: service.name, 
    directPay: service.directPay 
  });
  setShowServiceDialog(true);
};

const handleUpdateService = async () => {
  if (!editingItem) return;
  
  try {
    const service = availableServiceCategories.find(s => s.name === newService.name);
    if (service) {
      const updatedServiceData = {
        name: service.name,
        price: service.basePrice,
        directPay: Boolean(newService.directPay),
        bookingId: bookingId,
        updatedAt: new Date().toISOString()
      };
      
      const updatedService = await servicesService.updateService(editingItem.id, updatedServiceData);
      
      // Update local state immediately
      setPageData(prev => ({
        ...prev,
        services: prev.services.map(service => 
          service.id === updatedService.id ? updatedService : service
        )
      }));
      
      // Reset form and close dialog
      setEditingItem(null);
      setNewService({ name: '', directPay: false });
      setShowServiceDialog(false);
      
      console.log('Service updated successfully');
    }
  } catch (error) {
    console.error('Error updating service:', error);
    alert('Failed to update service. Please try again.');
  }
};

const handleDeleteService = async (serviceId: string, reason: string) => {
  if (!reason) {
    alert('Please provide a reason for deletion.');
    return;
  }

  if (!confirm(`Are you sure you want to delete this service? Reason: ${reason}`)) {
    return;
  }

  try {
    const success = await servicesService.deleteService(serviceId);
    if (success) {
      // Update local state immediately
      setPageData(prev => ({
        ...prev,
        services: prev.services.filter(service => service.id !== serviceId)
      }));
      console.log('Service deleted successfully');
    } else {
      alert('Failed to delete service. Please try again.');
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    alert('Failed to delete service. Please try again.');
  }
};
 // import { ApiPaymentService } from '../services/ApiPaymentService';

  // In your component
 //const paymentService = new ApiPaymentService();
  
  // Updated handlers using the service
  const handleAddPayment = async () => {
    try {
      const paymentData: Omit<PaymentsItem, 'id'> = {
        paymentMode: newPayment.mode, // Map 'mode' to 'paymentMode'
        amount: newPayment.amount,
        personName: newPayment.personName,
        notes: newPayment.notes,
        date: newPayment.date,
        bookingId: bookingId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
        // Add any other required properties from PaymentsItem
      };
      
      const createdPayment = await paymentService.create(paymentData);
      
      // Update local state immediately
     // setPayments(prev => [createdPayment, ...prev]);
      
      // Reset form
      setNewPayment({ 
        date: new Date().toISOString(), 
        mode: 'cash', 
        amount: 0, 
        personName: '', 
        notes: '' 
      });
      setShowPaymentDialog(false);
      
      console.log('Payment created successfully');
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    }
  };
  
  const handleEditPayment = (payment: PaymentsItem) => {
    setEditingItem(payment);
    // Map PaymentsItem properties back to your form state
    setNewPayment({ 
      date: payment.date,
      mode: payment.paymentMode as any, // Cast if paymentMode is compatible with your mode type
      amount: payment.amount,
      personName: payment.personName,
      notes: payment.notes
    });
    setShowPaymentDialog(true);
  };
  
  const handleUpdatePayment = async () => {
    if (!editingItem) return;
    
    try {
      const updatedPayment = await paymentService.update(editingItem.id, {
        paymentMode: newPayment.mode, // Map 'mode' to 'paymentMode'
        amount: newPayment.amount,
        personName: newPayment.personName,
        notes: newPayment.notes,
        date: newPayment.date
      });
      
      // Update local state immediately
      // setPayments(prev => prev.map(payment => 
      //   payment.id === updatedPayment.id ? updatedPayment : payment
      // ));
      
      // Reset form and close dialog
      setEditingItem(null);
      setNewPayment({ 
        date: new Date().toISOString(), 
        mode: 'cash', 
        amount: 0, 
        personName: '', 
        notes: '' 
      });
      setShowPaymentDialog(false);
      
      console.log('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment. Please try again.');
    }
  };

  const handleDeletePayment = async (paymentId: string, reason: string) => {
    if (!reason) {
      alert('Please provide a reason for deletion.');
      return;
    }
  
    if (!confirm(`Are you sure you want to delete this payment? Reason: ${reason}`)) {
      return;
    }
  
    try {
      const success = await paymentService.delete(paymentId);
      if (success) {
       // setPayments(prev => prev.filter(payment => payment.id !== paymentId));
        console.log('Payment deleted successfully');
      } else {
        alert('Failed to delete payment. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    }
  }
  
  

  // Ticket handlers
const handleAddTicket = async () => {
  try {
    const ticketData: Omit<TicketItem, 'id'> = {
      title: newTicket.title,
      description: newTicket.description,
      category: newTicket.category,
      assignedTo: newTicket.assignedTo,
      priority: newTicket.priority,
      status: newTicket.status,
      bookingId: bookingId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const createdTicket = await ticketService.createTicket(ticketData);
    
    // Update local state immediately - don't wait for fetchPageData
    setPageData(prev => ({
      ...prev,
      tickets: [createdTicket, ...prev.tickets]
    }));
    
    // Reset form and close dialog
    setNewTicket({ 
      title: '', 
      description: '', 
      category: '', 
      assignedTo: '', 
      priority: 'medium', 
      status: 'open' 
    });
    setShowTicketDialog(false);
    
    console.log('Ticket created successfully');
  } catch (error) {
    console.error('Error creating ticket:', error);
    alert('Failed to create ticket. Please try again.');
  }
};

const handleEditTicket = (ticket: TicketItem) => {
  setEditingItem(ticket);
  setNewTicket({ 
    title: ticket.title, 
    category: ticket.category,
    description: ticket.description || '', 
    assignedTo: ticket.assignedTo, 
    priority: ticket.priority,
    status: ticket.status
  });
  setShowTicketDialog(true);
};

const handleUpdateTicket = async () => {
  if (!editingItem) return;
  
  try {
    const updatedTicket = await ticketService.updateTicket(editingItem.id, {
      title: newTicket.title,
      description: newTicket.description,
      category: newTicket.category,
      assignedTo: newTicket.assignedTo,
      priority: newTicket.priority,
      status: newTicket.status
    });
    
    // Update local state immediately
    setPageData(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket => 
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )
    }));
    
    // Reset form and close dialog
    setEditingItem(null);
    setNewTicket({ 
      title: '', 
      description: '', 
      category: '', 
      assignedTo: '', 
      priority: 'medium', 
      status: 'open' 
    });
    setShowTicketDialog(false);
    
    console.log('Ticket updated successfully');
  } catch (error) {
    console.error('Error updating ticket:', error);
    alert('Failed to update ticket. Please try again.');
  }
};

const handleDeleteTicket = async (ticketId: string, reason: string) => {
  if (!reason) {
    alert('Please provide a reason for deletion.');
    return;
  }

  if (!confirm(`Are you sure you want to delete this ticket? Reason: ${reason}`)) {
    return;
  }

  try {
    const success = await ticketService.deleteTicket(ticketId);
    if (success) {
      // Update local state immediately
      setPageData(prev => ({
        ...prev,
        tickets: prev.tickets.filter(ticket => ticket.id !== ticketId)
      }));
      console.log('Ticket deleted successfully');
    } else {
      alert('Failed to delete ticket. Please try again.');
    }
  } catch (error) {
    console.error('Error deleting ticket:', error);
    alert('Failed to delete ticket. Please try again.');
  }
};

  // Inventory handlers
const handleAddInventoryItem = async () => {
  try {
    const orgId = pageData.currentBooking?.organizationId || pageData.bookings?.[0]?.organizationId || '';

    const newItem = await inventoryService.create({
      name: newInventoryItem.name,
      description: newInventoryItem.notes || '',
      quantity: Number(newInventoryItem.quantity) || 0,
      price: Number(newInventoryItem.price) || 0,
      organizationid: orgId,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
      notes: newInventoryItem.notes || '',
      bookingId: bookingId,
    } as any);

    // Update local state immediately
    setPageData(prev => ({
      ...prev,
      inventoryItems: [...prev.inventoryItems, newItem]
    }));

    // Reset form and close dialog
    setNewInventoryItem({ name: '',description:'', quantity: 1, price: 0, notes: '' });
    setShowInventoryDialog(false);
    
    console.log('Inventory item added successfully');
  } catch (error) {
    console.error('Error adding inventory item:', error);
    alert('Failed to add inventory item. Please try again.');
  }
};

const handleEditInventory = (item: InventoryItem) => {
  setEditingItem(item);
  setNewInventoryItem({ 
    name: item.name, 
    description:item.notes,
    quantity: item.quantity, 
    price: item.price, 
    notes: item.notes 
  });
  setShowEditInventoryDialog(true);
};

const handleUpdateInventory = async () => {
  if (!editingItem) return;

  try {
    const updatedItem = await inventoryService.update(editingItem.id, {
      ...editingItem,
      name: newInventoryItem.name,
      description:newInventoryItem.notes || '',
      quantity: Number(newInventoryItem.quantity) || 0,
      price: Number(newInventoryItem.price) || 0,
      notes: newInventoryItem.notes
    });

    // Update local state immediately
    setPageData(prev => ({
      ...prev,
      inventoryItems: prev.inventoryItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    }));

    // Reset form and close dialog
    setEditingItem(null);
    setNewInventoryItem({ name: '',description:'', quantity: 1, price: 0, notes: '' });
    setShowEditInventoryDialog(false);
    
    console.log('Inventory item updated successfully');
  } catch (error) {
    console.error('Error updating inventory item:', error);
    alert('Failed to update inventory item. Please try again.');
  }
};

const handleDeleteInventory = async (itemId: string, reason: string) => {
  if (!reason) {
    alert('Please provide a reason for deletion.');
    return;
  }

  if (!confirm(`Are you sure you want to delete this inventory item? Reason: ${reason}`)) {
    return;
  }

  try {
    const success = await inventoryService.delete(itemId);
    if (success) {
      // Update local state immediately
      setPageData(prev => ({
        ...prev,
        inventoryItems: prev.inventoryItems.filter(item => item.id !== itemId)
      }));
      console.log('Inventory item deleted successfully');
    } else {
      alert('Failed to delete inventory item. Please try again.');
    }
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    alert('Failed to delete inventory item. Please try again.');
  }
};
  // Handover image handlers
  const handleAddHandoverImage = async () => {
    if (!selectedHandoverFile) return alert("Please choose a file");
  
    const orgId = pageData.currentBooking?.organizationId;
    if (!orgId) return alert("Missing organization id");
  
    const formData = new FormData();
    formData.append("file", selectedHandoverFile);
    formData.append("category", newHandoverImage.category);
    formData.append("description", newHandoverImage.description);
    formData.append("organizationId", orgId); // 🔥 ADD THIS
    formData.append("bookingId", bookingId!); // optional
  
    await handoverService.uploadImage(bookingId!, formData);
  
    const images = await handoverService.getImages(bookingId!);
    setHandoverImages(images);
  
    setSelectedHandoverFile(null);
    setShowHandoverImageDialog(false);
  };
  // Inventory item selection handler
  const handleInventoryItemSelect = (itemName: string) => {
    const selectedItem = availableInventoryItems.find(item => item.name === itemName);
    if (selectedItem) {
      setNewInventoryItem(prev => ({
        ...prev,
        name: itemName,
        price: Number(selectedItem.price) || 0
      }));
    }
  };

  // Communication handlers
  const handleAddCommunication = async () => {
    try {
      const bookingIdVal = pageData.currentBooking?.id || bookingId || '';

      const selectedDate = new Date(newCommunication.date);
    const now = new Date();
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const communicationData: any = {
        booking_id: bookingIdVal,
      //  bookingId: bookingIdVal,
        date: newCommunication.date,
        time: selectedDate.toISOString(), 
        from_Person: newCommunication.fromPerson,
        //fromPerson: newCommunication.fromPerson,
        to_Person: newCommunication.toPerson,
        //toPerson: newCommunication.toPerson,
        communication: newCommunication.detail,
        detail: newCommunication.detail
      };

      console.log('[BookingManagement] Creating communication:', communicationData);
      try {
        await communicationService.createCommunication(communicationData);
      } catch (err: any) {
        console.error('[BookingManagement] createCommunication failed', err);
        if (err && err.data) console.error('API error data:', err.data);
        throw err;
      }

      await fetchPageData();

      setNewCommunication({ 
        date: new Date().toISOString().split('T')[0], 
        fromPerson: '', 
        toPerson: '', 
        detail: '',
        Createdat: ''
      });
      setShowCommunicationDialog(false);
    } catch (err) {
      console.error('[BookingManagement] Failed to create communication', err);
      const anyErr: any = err;
      if (anyErr && anyErr.data) {
        console.error('[BookingManagement] Server response body:', anyErr.data);
      }
    }
  };

  const handleDeleteCommunication = async (communicationId: string, reason: string) => {
    await communicationService.deleteCommunication(communicationId);
    await fetchPageData();
    console.log(`Communication deleted. Reason: ${reason}`);
  };

  const viewInvoicePDF = async () => {
    if (!booking) return;
    await handleSaveBillingInfo();
    navigate(`/admin/invoice/${booking.id}?invoiceNo=${invoiceNumber}&invoiceDate=${invoiceDate}`);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Manage Booking</h1>
            <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
              Back to Bookings
            </Button>
          </div>
          <p className="text-gray-500">Manage all aspects of this booking.</p>
        </div>

        {/* Booking Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Booking Summary</CardTitle>
              <Badge variant={
                booking.status === 'confirmed' ? 'default' :
                booking.status === 'pending' ? 'secondary' :
                booking.status === 'cancelled' ? 'destructive' : 'outline'
              }>
                {booking.status || 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{booking.customerName}</p>
                  <p className="text-xs text-gray-500">{booking.customerEmail} • {booking.customerPhone}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{hall?.name || 'Unknown Hall'}</p>
                  <p className="text-xs text-gray-500">{bookingEventDateIso} - {selectedTimeSlot}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{bookingGuestCount} guests</p>
                  <p className="text-xs text-gray-500">{booking.eventType}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">₹{safeBookingTotal.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Base Amount ({selectedTimeSlot})</p>
                </div>
              </div>
            </div>
            
            {/* Last Contact Date */}
            {booking.lastContactDate && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Last Contact: {new Date(booking.lastContactDate).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Customer Name</Label>
              <Input type="text" value={booking.customerName} readOnly />
            </div>
            <div>
              <Label>Customer Email</Label>
              <Input type="email" value={booking.customerEmail} readOnly />
            </div>
            <div>
              <Label>Customer Phone</Label>
              <Input type="tel" value={booking.customerPhone} readOnly />
            </div>
            <div>
              <Label>Event Type</Label>
              <Input type="text" value={booking.eventType} readOnly />
            </div>
            <div>
              <Label>Hall</Label>
              <Input type="text" value={hall?.name || 'Unknown Hall'} readOnly />
            </div>
            <div>
              <Label>Event Date</Label>
              <Input type="date" value={bookingEventDateIso} readOnly />
            </div>
            <div>
  <Label>Time Slot</Label>
  <Input 
    type="text" 
    value={selectedTimeSlot} 
    readOnly
  />
  
</div>
            <div>
              <Label>Guest Count</Label>
              <Input type="number" value={bookingGuestCount} readOnly />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="features" className="w-full">
          <TabsList>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="handover">Handover Images</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Features Management</CardTitle>
                  <Button onClick={() => setShowFeatureDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {featureArray.map((feature) => (
                    <div key={feature.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{feature.name}</span>
                        <span className="text-gray-500 ml-2">Qty: {feature.quantity}</span>
                        <span className="text-gray-500 ml-2">₹{feature.price} each</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="font-semibold">₹{(feature.price * feature.quantity).toLocaleString()}</span>
                        <Button variant="outline" size="sm" onClick={() => handleEditFeature(feature)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const reason = prompt('Please provide reason for deletion:');
                          if (reason) handleDeleteFeature(feature.id, reason);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="flex justify-between font-semibold">
                    <span>Total Features Amount:</span>
                    <span>₹{featuresTotal.toLocaleString()}</span>
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle>Services Management</CardTitle>
        <Button onClick={() => setShowServiceDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {servicesArray.map((service) => (
          <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <span className="font-medium">{service.name}</span>
              <Badge variant={service.directPay ? "secondary" : "default"} className="ml-2">
                {service.directPay ? "Direct Pay" : "Include in Bill"}
              </Badge>
              {service.notes && <p className="text-sm text-gray-600 mt-1">{service.notes}</p>}
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-semibold">₹{service.price.toLocaleString()}</span>
              <Button variant="outline" size="sm" onClick={() => handleEditService(service)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const reason = prompt('Please provide reason for deletion:');
                if (reason) handleDeleteService(service.id, reason);
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {servicesArray.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No services added to this booking.</p>
            <p className="text-sm">Click "Add Service" to add services.</p>
          </div>
        )}
      </div>
      
      {/* Services Total */}
      {/* {servicesArray.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <div className="flex justify-between font-semibold">
            <span>Total Services Amount:</span>
            <span>₹{servicesArray.reduce((sum, service) => sum + (service.price || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      )} */}
    </CardContent>
  </Card>
</TabsContent>

          <TabsContent value="inventory">
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle>Inventory Management</CardTitle>
        <Button onClick={() => setShowInventoryDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
          {bookingInventoryArray.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <span className="font-medium">{item.name}</span>
              <span className="text-gray-500 ml-2">Qty: {item.quantity}</span>
              <span className="text-gray-500 ml-2">₹{item.charge} each</span>
              {item.notes && <p className="text-sm text-gray-600">{item.notes}</p>}
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
              <Button variant="outline" size="sm" onClick={() => handleEditInventory(item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const reason = prompt('Please provide reason for deletion:');
                if (reason) handleDeleteInventory(item.id, reason);
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {bookingInventoryArray.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No inventory items found.</p>
            <p className="text-sm">Click "Add Item" to add inventory items.</p>
          </div>
        )}
      </div>
      
      {/* Inventory Total
      {bookingInventoryArray.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <div className="flex justify-between font-semibold">
            <span>Total Inventory Amount:</span>
            <span>₹{bookingInventoryArray.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
          </div>
        </div>
      )} */}
    </CardContent>
  </Card>
</TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Payments</CardTitle>
                  <Button onClick={() => setShowPaymentDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pageData.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{new Date(payment.date).toLocaleDateString()}</span>
                        <span className="text-gray-500 ml-2">{payment.paymentMode.toUpperCase()}</span>
                        <span className="text-gray-500 ml-2">{payment.personName}</span>
                        {payment.notes && <p className="text-sm text-gray-600">{payment.notes}</p>}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="font-semibold">₹{payment.amount.toLocaleString()}</span>
                        <Button variant="outline" size="sm" onClick={() => handleEditPayment(payment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const reason = prompt('Please provide reason for deletion:');
                          if (reason) handleDeletePayment(payment.id, reason);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tickets</CardTitle>
                  <Button onClick={() => setShowTicketDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticketsArray.map((ticket, idx) => (
                    <div key={ticket?.id || `ticket-${idx}`} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{ticket.title}</span>
                          <Badge 
                            variant={
                              ticket.status === 'open' ? 'default' :
                              ticket.status === 'in-progress' ? 'secondary' :
                              ticket.status === 'resolved' ? 'outline' : 'destructive'
                            }
                          >
                            {ticket.status}
                          </Badge>
                          <Badge 
                            variant={
                              ticket.priority === 'high' ? 'destructive' :
                              ticket.priority === 'medium' ? 'default' : 'outline'
                            }
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Category: {ticket.category}</span>
                          <span>Assigned to: {ticket.assignedTo}</span>
                          <span>Booking: {ticket.bookingId}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTicket(ticket)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const reason = prompt('Please provide reason for deletion:');
                          if (reason) handleDeleteTicket(ticket.id, reason);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="handover">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Handover Images</CardTitle>
                  <Button onClick={() => setShowHandoverImageDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {handoverImages.map((image) => (
                    <div key={image.id} className="border rounded-lg p-4">
                      <img src={image.url} alt={image.description} className="w-full h-32 object-cover rounded mb-2" />
                      <Badge variant="outline" className="mb-2">{image.category}</Badge>
                      <p className="text-sm text-gray-600">{image.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Communication History</CardTitle>
                  <Button onClick={() => setShowCommunicationDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Communication
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {communicationsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No communication records found.</p>
                    <p className="text-sm">Click "Add Communication" to start tracking communications.</p>
                  </div>
                ) : (
                  communicationsList.map((communication) => (
                    <div key={communication.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {communication.date} at {communication.time}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Please provide reason for deletion:');
                            if (reason) handleDeleteCommunication(communication.id, reason);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="font-medium text-blue-600">From:</span>
                        <span>{communication.from_Person}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-green-600">To:</span>
                        <span>{communication.to_Person}</span>
                      </div>
                      <p className="text-sm text-gray-700">{communication.detail}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Charges Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Charges Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Base Total:</span>
                <span>₹{safeBookingTotal.toLocaleString()}</span>
              </div>
              
              {featuresTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Features Total:</span>
                  <span>₹{featuresTotal.toLocaleString()}</span>
                </div>
              )}
              
              {servicesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Services Total:</span>
                  <span>₹{servicesTotal.toLocaleString()}</span>
                </div>
              )}

              {inventoryTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Inventory Total:</span>
                  <span>₹{inventoryTotal.toLocaleString()}</span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({discountReason}):</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{totalCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-yellow-700">
                  <span>Tax (GST {gstPercentage}%)</span>
                  <span>₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-green-700">
                  <span>Bill Amount</span>
                  <span>₹{billAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Total Payments:</span>
                  <span>₹{totalPayments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-blue-600">
                  <span>Balance to be Paid:</span>
                  <span>₹{balanceAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Label htmlFor="discount">Discount Amount</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
                <Label htmlFor="discount-reason" className="mt-2">Discount Reason</Label>
                <Input
                  id="discount-reason"
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="Enter reason for discount"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice & Billing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Billing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Billing Information</h3>
                
                <div>
                  <Label>Billing Name</Label>
                  <Input type="text"
                    value={billingSettings.companyName} readOnly
                    // onChange={(e) => setBillingName(e.target.value)}
                    // placeholder="Enter billing name"
                   
                  />
                </div>

                <div>
                  <Label>Billing Address</Label>
                  <Textarea
                    //value={billingAddress}
                    value={billingSettings.address} readOnly
                    rows={3}
                  />
                </div>

                <div>
                  <Label>GST Number</Label>
                  <Input
                    value={billingSettings.gstNumber} readOnly
                    //placeholder="Enter GST number (optional)"
                  />
                  
                </div>

              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details</h3>
              
                <div className="space-y-2">
                  <Label>Invoice Number</Label>
                  <div className="flex gap-2">
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Click Generate to create invoice number"
                      readOnly
                    />
                    <Button onClick={() => setInvoiceNumber(generateInvoiceNumber())}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>

                <Button onClick={viewInvoicePDF} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  View & Generate Invoice PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feature Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Feature' : 'Add Feature'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Feature</Label>
              <Select value={newFeature.name} onValueChange={(value) => setNewFeature({...newFeature, name: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feature" />
                </SelectTrigger>
                <SelectContent>
                  {masterFeatures.map(feature => (
                    <SelectItem key={feature.name} value={feature.name}>
                      {feature.name} - ₹{feature.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={newFeature.quantity}
                onChange={(e) => setNewFeature({...newFeature, quantity: parseInt(e.target.value)})}
              />
            </div>
            <div>
        <Label>Price per Unit</Label>
        <Input
          type="number"
          value={newFeature.price}  // ✅ CORRECT - using feature price
          onChange={(e) => setNewFeature({...newFeature, price: Number(e.target.value) || 0})}  // ✅ CORRECT
          min="0"
          step="0.01"
        />
      </div>
            <Button onClick={editingItem ? handleUpdateFeature : handleAddFeature} className="w-full">
  {editingItem ? 'Update Feature' : 'Add Feature'}
</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service</Label>
              <Select value={newService.name} onValueChange={(value) => setNewService({...newService, name: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
  {availableServiceItem.map(service => (
    <SelectItem key={service.id} value={service.name}>
      {service.name} - ₹{service.basePrice || 0}
    </SelectItem>
  ))}
</SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="directPay"
                checked={newService.directPay}
                onCheckedChange={(checked) => setNewService({...newService, directPay: checked})}
              />
              <Label htmlFor="directPay">Direct Pay (won't be included in charges breakdown)</Label>
            </div>
            <Button onClick={editingItem ? handleUpdateService : handleAddService} className="w-full">
  {editingItem ? 'Update Service' : 'Add Service'}
</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
              />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <Select value={newPayment.mode} onValueChange={(value: PaymentsItem['paymentMode']) => setNewPayment({...newPayment, mode: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Person Name</Label>
              <Input
                value={newPayment.personName}
                onChange={(e) => setNewPayment({...newPayment, personName: e.target.value})}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newPayment.notes}
                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
              />
            </div>
            <Button onClick={handleAddPayment} className="w-full">
              {editingItem ? 'Update Payment' : 'Add Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Ticket' : 'Add Ticket'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newTicket.title}
                onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
              />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select value={newTicket.assignedTo} onValueChange={(value) => setNewTicket({...newTicket, assignedTo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ticket Category</Label>
              <Select value={newTicket.category} onValueChange={(value) => setNewTicket({...newTicket, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket category" />
                </SelectTrigger>
                <SelectContent>
                  {availableTicketCategories.map(item => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
                
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={newTicket.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTicket({...newTicket, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={newTicket.status} onValueChange={(value: 'open' | 'in-progress' | 'completed') => setNewTicket({...newTicket, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={editingItem ? handleUpdateTicket : handleAddTicket} className="w-full">
              {editingItem ? 'Update Ticket' : 'Add Ticket'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Select 
                value={newInventoryItem.name}
                onValueChange={handleInventoryItemSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {availableInventoryItems.map(item => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name} - ₹{item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={newInventoryItem.quantity}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, quantity: Number(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Price per Unit</Label>
              <Input
                type="number"
                value={newInventoryItem.price}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, price: Number(e.target.value) || 0})}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newInventoryItem.notes}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, notes: e.target.value})}
              />
            </div>
            <Button onClick={handleAddInventoryItem} className="w-full">
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={showEditInventoryDialog} onOpenChange={setShowEditInventoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name</Label>
              <Select 
                value={newInventoryItem.name}
                onValueChange={handleInventoryItemSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {availableInventoryItems.map(item => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name} - ₹{item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={newInventoryItem.quantity}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, quantity: Number(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Price per Unit</Label>
              <Input
                type="number"
                value={newInventoryItem.price}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, price: Number(e.target.value) || 0})}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newInventoryItem.notes}
                onChange={(e) => setNewInventoryItem({...newInventoryItem, notes: e.target.value})}
              />
            </div>
            <Button onClick={handleUpdateInventory} className="w-full">
              Update Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Handover Image Dialog */}
<Dialog open={showHandoverImageDialog} onOpenChange={setShowHandoverImageDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Handover Image</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label>Category</Label>
        <Select 
          value={newHandoverImage.category} 
          onValueChange={(value) => setNewHandoverImage({...newHandoverImage, category: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Before Event">Before Event</SelectItem>
            <SelectItem value="During Event">During Event</SelectItem>
            <SelectItem value="After Event">After Event</SelectItem>
            <SelectItem value="Damage Report">Damage Report</SelectItem>
            <SelectItem value="Setup">Setup</SelectItem>
            <SelectItem value="Cleanup">Cleanup</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={newHandoverImage.description}
          onChange={(e) => setNewHandoverImage({...newHandoverImage, description: e.target.value})}
          placeholder="Describe the image"
        />
      </div>
      <div>
        <Label>Upload Image</Label>
        <Input 
          type="file" 
          accept="image/*" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedHandoverFile(file);
            }
          }}
        />
        {selectedHandoverFile && (
          <p className="text-sm text-green-600 mt-1">
            Selected: {selectedHandoverFile.name}
          </p>
        )}
      </div>
      <Button 
        onClick={handleAddHandoverImage} 
        className="w-full"
        disabled={!selectedHandoverFile || !newHandoverImage.category}
      >
        Add Image
      </Button>
    </div>
  </DialogContent>
</Dialog>

      {/* Communication Dialog */}
      <Dialog open={showCommunicationDialog} onOpenChange={setShowCommunicationDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Communication</DialogTitle>
    </DialogHeader>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Date</Label>
        <Input
          type="date"
          value={newCommunication.date}
          onChange={(e) => setNewCommunication({...newCommunication, date: e.target.value})}
        />
      </div>
      <div>
        <Label>From</Label>
        <Select 
          value={newCommunication.fromPerson} 
          onValueChange={(value) => setNewCommunication({...newCommunication, fromPerson: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map(employee => (
              <SelectItem key={employee.id} value={employee.name}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>To</Label>
        <Input
          value={newCommunication.toPerson}
          onChange={(e) => setNewCommunication({...newCommunication, toPerson: e.target.value})}
        />
      </div>
      <div className="w-full md:col-span-2">
        <Label>Detail</Label>
        <Textarea
          value={newCommunication.detail}
          onChange={(e) => setNewCommunication({...newCommunication, detail: e.target.value})}
        />
      </div>
      <Button onClick={handleAddCommunication}>
        Add Communication
      </Button>
    </div>
  </DialogContent>
</Dialog>
</>
  );
};

export default BookingManagement;