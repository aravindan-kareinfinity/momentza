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
import { useToast } from '@/hooks/use-toast';
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
  Printer,
  ChevronLeft,
  Home,
  Smartphone,
  Package,
  CreditCard,
  Camera,
  MessageCircle,
  Users,
  Layers
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  bookingService,
  settingsService,
  inventoryService,
  ticketService,
  communicationService,
  billingService,
  hallService,
  servicesService,
  handoverService,
  paymentService,
  featureService
} from '../services/ServiceFactory';
import { Services, TicketItem, Communication } from '../services/mockData';
import { PaymentsItem } from '@/types';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

interface Feature {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  directPay: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  charge: number;
  notes: string;
}

interface HandoverImage {
  id: string;
  bookingId: string;
  organizationId: string;
  category: string;
  description?: string;
  url?: string;
  uploadedAt: string;
  createdAt: string;
}

interface BookingManagementData {
  bookings: any[];
  eventTypes: any[];
  employees: any[];
  inventoryCatalog: any[];
  inventoryItems: any[];
  ticketCategories: any[];
  servicesCategories: any[];
  hall: any;
  services: any[];
  tickets: any[];
  payments: any[];
  communication: any[];
  billingSettings: any;
  currentBooking: any;
  features: any[];
}

const MobileBookingManagement = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    services: [],
    tickets: [],
    payments: [],
    communication: [],
    billingSettings: null,
    currentBooking: null,
    features: []
  });

  // Single loading and error state for entire page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const features = pageData.features || [];
  const [handoverImages, setHandoverImages] = useState<HandoverImage[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [billingName, setBillingName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingGST, setBillingGST] = useState('');
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
  const [newFeature, setNewFeature] = useState({name: '',quantity: 1,price: 0});
  const [newService, setNewService] = useState({ name: '', directPay: false });
  const [newPayment, setNewPayment] = useState({ date: new Date().toISOString(), mode: 'cash' as PaymentsItem['paymentMode'], amount: 0, personName: '', notes: '' });
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: '', assignedTo: '', priority: 'medium' as 'low' | 'medium' | 'high', status: 'open' as 'open' | 'in-progress' | 'completed' });
  const [newInventoryItem, setNewInventoryItem] = useState({ name: '', quantity: 1, charge: 0 });
  const [newHandoverImage, setNewHandoverImage] = useState({ category: '', description: '' });
  const [selectedHandoverFile, setSelectedHandoverFile] = useState<File | null>(null);
  const [newCommunication, setNewCommunication] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' }),
    fromPerson: '',
    toPerson: '',
    detail: '',
    Createdat: ''
  });

  // Edit states
  const [editingItem, setEditingItem] = useState<any>(null);

  // Available time slots
  const availableTimeSlots = [
    { value: 'morning', label: 'Morning' },
    { value: 'evening', label: 'Evening' },
    { value: 'fullday', label: 'Full Day' }
  ];

  // Calculate base amount based on time slot
  const calculateBaseAmount = (timeSlot: string): number => {
    if (!timeSlot) return 0;

    const booking = pageData.currentBooking;
    if (booking?.totalAmount && booking.totalAmount > 0) {
      return booking.totalAmount;
    }

    const pricing: { [key: string]: number } = {
      'morning': 10000,
      'evening': 15000,
      'fullday': 25000
    };

    return pricing[timeSlot] || 0;
  };

  // Update booking when time slot changes
  const handleTimeSlotChange = async (newTimeSlot: string) => {
    if (!pageData.currentBooking) return;

    try {
      const newBaseAmount = calculateBaseAmount(newTimeSlot);

      const updatedBooking = {
        ...pageData.currentBooking,
        timeSlot: newTimeSlot,
        totalAmount: newBaseAmount,
        updatedAt: new Date().toISOString()
      };

      const result = await bookingService.update(pageData.currentBooking.id, updatedBooking);

      if (result) {
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
      setSelectedTimeSlot(pageData.currentBooking.timeSlot);
    }
  };

  // Fetch all data once when page initializes
  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[BookingManagement] Fetching all page data...');

      let allHalls = [];
      try {
        allHalls = await hallService.getAllHalls();
      } catch (hallError) {
        console.warn('[BookingManagement] Could not fetch halls:', hallError);
      }

      let currentBooking = null as any;

      if (bookingId) {
        try {
          currentBooking = await bookingService.getById(bookingId);
        } catch (getByIdErr) {
          console.warn('[BookingManagement] Failed to load booking by id', getByIdErr);
        }
      }

      const organizationId = currentBooking?.organizationId || pageData.currentBooking?.organizationId || (pageData.bookings?.[0]?.organizationId);

      if (!organizationId) {
        throw new Error('Organization ID not found for fetching bookings and related data');
      }

      const results = await Promise.allSettled([
        bookingService.getBookingsByOrganization(organizationId),
        settingsService.getEventTypes(),
        settingsService.getEmployees(),
        settingsService.getTicketCategories(),
        servicesService.getAllServices(),
        billingService.getBillingSettings(),
        settingsService.getInventoryItems()
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
      const ticketCategories = getOrDefault<any[]>(3, []);
      const servicesCategories = getOrDefault<any[]>(4, []);
      const billingSettings = getOrDefault<any>(5, null);
      const inventoryCatalog = getOrDefault<any[]>(6, []);

      currentBooking = currentBooking || bookings.find((b: any) => b.id === bookingId) || pageData.currentBooking || null;

      let hall = null;
      const bookingHallId = currentBooking?.hallId;

      if (bookingHallId) {
        try {
          hall = await hallService.getById(bookingHallId);
        } catch (hallError) {
          console.warn(`[BookingManagement] Hall with ID ${bookingHallId} not found`);
          if (allHalls.length > 0) {
            hall = allHalls[0];
          }
        }
      }

      if (!hall && allHalls.length > 0) {
        hall = allHalls[0];
      }

      const bookingIdSafe = currentBooking?.id || bookingId || '1';
      const [servicesRes, inventoryRes, ticketsRes, paymentRes, commsRes, featuresRes] = await Promise.allSettled([
        servicesService.getServiceByBookingId(bookingIdSafe),
        inventoryService.getInventoryByBookingId(bookingIdSafe),
        ticketService.getTicketsByBookingId(bookingIdSafe),
        paymentService.getPaymentsByBookingId(bookingIdSafe),
        communicationService.getCommunicationsByBookingId(bookingIdSafe),
        featureService.getByBookingId(bookingIdSafe)
      ]);

      const servicesRaw = servicesRes.status === 'fulfilled' ? servicesRes.value : [];
      const inventoryRaw = inventoryRes.status === 'fulfilled' ? inventoryRes.value : [];
      const ticketsRaw = ticketsRes.status === 'fulfilled' ? ticketsRes.value : [];
      const paymentRaw = paymentRes.status === 'fulfilled' ? paymentRes.value : [];
      const communicationsRaw = commsRes.status === 'fulfilled' ? commsRes.value : [];
      const featuresRaw = featuresRes.status === 'fulfilled' ? featuresRes.value : [];

      const services = Array.isArray(servicesRaw) ? servicesRaw : (servicesRaw ? [servicesRaw] : []);
      const inventory = Array.isArray(inventoryRaw) ? inventoryRaw : (inventoryRaw ? [inventoryRaw] : []);
      const tickets = Array.isArray(ticketsRaw) ? ticketsRaw : (ticketsRaw ? [ticketsRaw] : []);
      const fetchedPayments = Array.isArray(paymentRaw) ? paymentRaw : [];
      const communications = Array.isArray(communicationsRaw) ? communicationsRaw : (communicationsRaw ? [communicationsRaw] : []);
      const features = Array.isArray(featuresRaw) ? featuresRaw : (featuresRaw ? [featuresRaw] : []);

      let handoverImagesList: any[] = [];
      try {
        handoverImagesList = await handoverService.getImages(bookingIdSafe);
      } catch (err) {
        console.warn("[BookingManagement] Failed to load handover images", err);
      }

      setHandoverImages(handoverImagesList);

      if (currentBooking) {
        const initialTimeSlot = currentBooking.timeSlot || '';
        setSelectedTimeSlot(initialTimeSlot);

        const calculatedBaseAmount = currentBooking.totalAmount > 0 ? currentBooking.totalAmount : calculateBaseAmount(initialTimeSlot);
        setBaseAmount(calculatedBaseAmount);

        if (currentBooking.totalAmount === 0 && initialTimeSlot && calculatedBaseAmount > 0) {
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
        inventoryItems : inventory,
        services,
        servicesCategories,
        ticketCategories,
        hall,
        tickets,
        payments: fetchedPayments,
        communication: communications,
        billingSettings,
        currentBooking,
        features
      });

      if (currentBooking?.billingDetails) {
        setBillingName(currentBooking.billingDetails.billingName || '');
        setBillingAddress(currentBooking.billingDetails.billingAddress || '');
        setBillingGST(currentBooking.billingDetails.gstNumber || '');
      }

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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pageData.currentBooking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Unable to load booking</h2>
        <p className="text-gray-600 text-center mb-6">{error?.message || 'Booking not found'}</p>
        <div className="flex gap-2">
          <Button onClick={handleRetry}>Retry</Button>
          <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  // Extract data for easier access
  const {
    currentBooking: booking,
    eventTypes,
    employees,
    inventoryCatalog,
    inventoryItems: bookingInventoryItems,
    ticketCategories: availableTicketCategories,
    hall,
    servicesCategories: availableServiceCategories,
    services: servicesList,
    tickets: ticketsList,
    communication: communicationsList,
    billingSettings
  } = pageData;

  const availableInventoryItems = Array.isArray(inventoryCatalog) ? inventoryCatalog : (inventoryCatalog ? [inventoryCatalog] : []);
  const availableServiceItem = Array.isArray(pageData.servicesCategories) ? pageData.servicesCategories : [];
  const ticketsArray = Array.isArray(ticketsList) ? ticketsList : (ticketsList ? [ticketsList] : []);
  const servicesArray = Array.isArray(servicesList) ? servicesList : (servicesList ? [servicesList] : []);
  const bookingInventoryArray = Array.isArray(bookingInventoryItems) ? bookingInventoryItems : (bookingInventoryItems ? [bookingInventoryItems] : []);
  const masterFeatures = hall?.features || [];

  const bookingSafe: any = booking || {};
  const bookingGuestCount = Number(bookingSafe.guestCount) || 0;
  const bookingEventDateIso = bookingSafe.eventDate && !isNaN(Date.parse(bookingSafe.eventDate))
    ? new Date(bookingSafe.eventDate).toISOString().split('T')[0]
    : '';

  // Calculate totals
  const safeBookingTotal = baseAmount;
  const featuresTotal = features.reduce(
    (sum, f) => sum + Number(f.price || 0) * Number(f.quantity || 0),
    0
  );
  const servicesTotal = servicesArray.filter(s => !s.directPay).reduce((sum, s) => sum + Number(s.price || 0), 0);
  const inventoryTotal = bookingInventoryItems.reduce((sum, item) => 
    sum + (Number(item.charge || 0) * Number(item.quantity || 0)), 0);
  const safeDiscount = Number(discount || 0);
  const totalCharges = safeBookingTotal + featuresTotal + servicesTotal + inventoryTotal - safeDiscount;

  const totalPayments = pageData.payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const gstPercentage = Number(billingSettings?.taxPercentage || 0);
  const taxAmount = Math.round((totalCharges * gstPercentage) / 100);
  const billAmount = totalCharges + taxAmount;
  const balanceAmount = billAmount - totalPayments;

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
        price: Number(newFeature.price || 0),
        organizationId: pageData.currentBooking?.organizationId,
        bookingId: pageData.currentBooking?.id
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
        price: newFeature.price,
        bookingId: pageData.currentBooking?.id
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

        const createdService = await servicesService.addService(serviceData);

        setPageData(prev => ({
          ...prev,
          services: [...prev.services, createdService]
        }));

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

        const updatedService = await servicesService.updateSettingsService(editingItem.id, updatedServiceData);

        setPageData(prev => ({
          ...prev,
          services: prev.services.map(service =>
            service.id === updatedService.id ? updatedService : service
          )
        }));

        setEditingItem(null);
        setNewService({ name: '', directPay: false });
        setShowServiceDialog(false);
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
        setPageData(prev => ({
          ...prev,
          services: prev.services.filter(service => service.id !== serviceId)
        }));
      } else {
        alert('Failed to delete service. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  // Payment handlers
  const handleAddPayment = async () => {
    try {
      const paymentData: Omit<PaymentsItem, 'id'> = {
        paymentMode: newPayment.mode,
        amount: newPayment.amount,
        personName: newPayment.personName,
        notes: newPayment.notes,
        date: newPayment.date,
        bookingId: bookingId,
        organizationId: pageData.currentBooking?.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const createdPayment = await paymentService.create(paymentData);

      setPageData(prev => ({
        ...prev,
        payments: [createdPayment, ...prev.payments]
      }));

      setNewPayment({
        date: new Date().toISOString(),
        mode: 'cash',
        amount: 0,
        personName: '',
        notes: ''
      });
      setShowPaymentDialog(false);
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    }
  };

  const handleEditPayment = (payment: PaymentsItem) => {
    setEditingItem(payment);
    setNewPayment({
      date: payment.date,
      mode: payment.paymentMode as any,
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
        paymentMode: newPayment.mode,
        amount: newPayment.amount,
        personName: newPayment.personName,
        notes: newPayment.notes,
        date: newPayment.date,
        bookingId: editingItem.bookingId,
        organizationId: editingItem.organizationId
      });

      setPageData(prev => ({
        ...prev,
        payments: prev.payments.map(payment =>
          payment.id === updatedPayment.id ? updatedPayment : payment
        )
      }));

      setEditingItem(null);
      setNewPayment({
        date: new Date().toISOString(),
        mode: 'cash',
        amount: 0,
        personName: '',
        notes: ''
      });
      setShowPaymentDialog(false);
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
        setPageData(prev => ({
          ...prev,
          payments: prev.payments.filter(payment => payment.id !== paymentId)
        }));
      } else {
        alert('Failed to delete payment. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    }
  }

  const refreshTickets = async () => {
    const bookingIdSafe = pageData.currentBooking?.id || bookingId || '';
    const updatedTickets = await ticketService.getTicketsByBookingId(bookingIdSafe);

    setPageData(prev => ({
      ...prev,
      tickets: Array.isArray(updatedTickets) ? updatedTickets : []
    }));
  };

  // Ticket handlers
  const handleAddTicket = async () => {
    const ticketData: Omit<TicketItem, 'id'> = {
      title: newTicket.title,
      description: newTicket.description,
      category: newTicket.category,
      assignedTo: newTicket.assignedTo,
      priority: newTicket.priority,
      status: newTicket.status,
      bookingId: bookingId || '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await ticketService.createTicket(ticketData);
    await refreshTickets();
    setNewTicket({ title: '', description: '', category: '', assignedTo: '', priority: 'medium', status: 'open' });
    setShowTicketDialog(false);
  };

  const handleEditTicket = (ticket: TicketItem) => {
    setEditingItem(ticket);
    setNewTicket({
      title: ticket.title,
      category: ticket.category,
      description: ticket.description,
      assignedTo: ticket.assignedTo,
      priority: ticket.priority,
      status: ticket.status
    });
    setShowTicketDialog(true);
  };

  const handleDeleteTicket = async (ticketId: string, reason: string) => {
    await ticketService.deleteTicket(ticketId);
    await refreshTickets();
  };

  const handleUpdateTicket = async () => {
    if (editingItem) {
      await ticketService.updateTicket(editingItem.id, {
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        assignedTo: newTicket.assignedTo,
        priority: newTicket.priority,
        status: newTicket.status
      });
      await refreshTickets();
      setEditingItem(null);
      setNewTicket({ title: '', description: '', category: '', assignedTo: '', priority: 'medium', status: 'open' });
      setShowTicketDialog(false);
    }
  };

  // Inventory handlers
  const handleAddInventoryItem = async () => {
    const orgId = pageData.currentBooking?.organizationId || pageData.bookings?.[0]?.organizationId || '';

    await inventoryService.create({
      name: newInventoryItem.name,
      quantity: newInventoryItem.quantity,
      charge: newInventoryItem.charge,
      price: newInventoryItem.charge,
      orgId: orgId,
      BookingId: bookingId,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    } as any);
    await fetchPageData();
    setNewInventoryItem({ name: '', quantity: 1, charge: 0 });
    setShowInventoryDialog(false);
  };

  const handleEditInventory = (item: InventoryItem) => {
    setEditingItem(item);
    setNewInventoryItem({
      name: item.name,
      quantity: item.quantity,
      charge: item.charge || item.price || 0
    });
    setShowEditInventoryDialog(true);
  };

  const handleUpdateInventory = async () => {
    if (editingItem) {
      const updatedInventoryItem = {
        ...editingItem,
        name: newInventoryItem.name,
        quantity: newInventoryItem.quantity,
        charge: newInventoryItem.charge,
        price: newInventoryItem.charge, 
      };
      await inventoryService.update(editingItem.id, updatedInventoryItem);
      await fetchPageData();
      setEditingItem(null);
      setNewInventoryItem({ name: '', quantity: 1, charge:0 });
      setShowEditInventoryDialog(false);
    }
  };

  const handleDeleteInventory = async (itemId: string, reason: string) => {
    await inventoryService.delete(itemId);
    await fetchPageData();
  };

  // Handover image handlers
  const handleAddHandoverImage = async () => {
    if (!selectedHandoverFile) {
      toast({
        title: 'Error',
        description: 'Please choose a file',
        variant: 'destructive',
      });
      return;
    }

    if (!newHandoverImage.category) {
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      });
      return;
    }

    const orgId = pageData.currentBooking?.organizationId;
    if (!orgId) {
      toast({
        title: 'Error',
        description: 'Missing organization id',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedHandoverFile);
      formData.append("category", newHandoverImage.category);
      formData.append("description", newHandoverImage.description || '');
      formData.append("organizationId", orgId);
      formData.append("bookingId", bookingId!);

      await handoverService.uploadImage(bookingId!, formData);

      const images = await handoverService.getImages(bookingId!);
      setHandoverImages(images);

      setSelectedHandoverFile(null);
      setNewHandoverImage({ category: '', description: '' });
      setShowHandoverImageDialog(false);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      console.error('Failed to upload handover image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHandoverImage = async (imageId: string) => {
    if (!bookingId) return;
  
    const confirmDelete = confirm("Are you sure you want to delete this image?");
    if (!confirmDelete) return;
  
    try {
      await handoverService.deleteImage(bookingId, imageId);
  
      setHandoverImages(prev =>
        prev.filter(img => img.id !== imageId)
      );
  
      toast({
        title: "Deleted",
        description: "Handover image deleted successfully",
      });
    } catch (err) {
      console.error("Failed to delete handover image", err);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  // Inventory item selection handler
  const handleInventoryItemSelect = (itemName: string) => {
    const selectedItem = availableInventoryItems.find(item => item.name === itemName);
    if (selectedItem) {
      setNewInventoryItem(prev => ({
        ...prev,
        name: itemName,
        charge: selectedItem.charge || 0
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
        date: newCommunication.date,
        time: selectedDate.toISOString(),
        from_Person: newCommunication.fromPerson,
        to_Person: newCommunication.toPerson,
        communication: newCommunication.detail,
        detail: newCommunication.detail
      };

      await communicationService.createCommunication(communicationData);
      await fetchPageData();

      setNewCommunication({
        date: new Date().toISOString().split('T')[0],
        time: "",
        fromPerson: '',
        toPerson: '',
        detail: '',
        Createdat: ''
      });
      setShowCommunicationDialog(false);
    } catch (err) {
      console.error('[BookingManagement] Failed to create communication', err);
    }
  };

  const handleDeleteCommunication = async (communicationId: string, reason: string) => {
    await communicationService.deleteCommunication(communicationId);
    await fetchPageData();
  };

  const viewInvoicePDF = async () => {
    if (!booking) return;
    await handleSaveBillingInfo();
    navigate(`/admin/mobileinvoice/${booking.id}`);
  };

  // Mobile Header Component
  const MobileHeader = () => (
    <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2"
            onClick={() => navigate('/admin/bookingsmobile')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg">Booking Management</h1>
            <p className="text-xs text-gray-500">{booking?.customerName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={
            booking.status === 'confirmed' ? 'default' :
            booking.status === 'pending' ? 'secondary' :
            booking.status === 'cancelled' ? 'destructive' : 'outline'
          }>
            {booking.status || 'Pending'}
          </Badge>
        </div>
      </div>
    </div>
  );

  // Quick Stats Component for Mobile
  const MobileQuickStats = () => (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <p className="text-sm text-gray-500">Total Due</p>
        <p className="text-xl font-bold text-red-600">₹{balanceAmount.toLocaleString()}</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <p className="text-sm text-gray-500">Paid</p>
        <p className="text-xl font-bold text-green-600">₹{totalPayments.toLocaleString()}</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <p className="text-sm text-gray-500">Bill Amount</p>
        <p className="text-lg font-bold text-blue-600">₹{billAmount.toLocaleString()}</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-3">
        <p className="text-sm text-gray-500">Balance</p>
        <p className={`text-lg font-bold ${balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ₹{Math.abs(balanceAmount).toLocaleString()} {balanceAmount < 0 ? 'Extra' : ''}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Mobile Content Area */}
      <div className="p-4 pb-20">
        {/* Booking Summary Card for Mobile */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Booking Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">{booking.customerName}</p>
                  <p className="text-xs text-gray-500">{booking.customerEmail} • {booking.customerPhone}</p>
                </div>
              </div>

              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">{hall?.name || 'Unknown Hall'}</p>
                  <p className="text-xs text-gray-500">{bookingEventDateIso} • {selectedTimeSlot}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">{bookingGuestCount} guests</p>
                  <p className="text-xs text-gray-500">{booking.eventType}</p>
                </div>
              </div>

              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                <div>
                  <p className="font-medium">₹{safeBookingTotal.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Base Amount</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats for Mobile */}
        <MobileQuickStats />
        

        {/* Horizontal Scrollable Tabs Bar ONLY - No icons, just text */}
        <div className="mb-4">
  <div className="relative">
    <Tabs defaultValue="features" className="w-full">
      {/* ONLY THIS TAB BAR IS SCROLLABLE - WRAP ONLY TabsList */}
      <div className="flex overflow-x-auto scrollbar-hide">
        <TabsList className="flex space-x-1 min-w-max">
          <TabsTrigger value="features" className="px-4 py-2 whitespace-nowrap">
            Features
          </TabsTrigger>
          <TabsTrigger value="services" className="px-4 py-2 whitespace-nowrap">
            Services
          </TabsTrigger>
          <TabsTrigger value="payments" className="px-4 py-2 whitespace-nowrap">
            Payments
          </TabsTrigger>
          <TabsTrigger value="inventory" className="px-4 py-2 whitespace-nowrap">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="tickets" className="px-4 py-2 whitespace-nowrap">
            Tickets
          </TabsTrigger>
          <TabsTrigger value="communication" className="px-4 py-2 whitespace-nowrap">
            Communication
          </TabsTrigger>
        </TabsList>
      </div>

      {/* TAB CONTENT - OUTSIDE THE SCROLLABLE DIV */}
      <div className="mt-4">
        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Features</CardTitle>
                <Button size="sm" onClick={() => setShowFeatureDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {features.map((feature) => (
                  <div key={feature.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{feature.name}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>Qty: {feature.quantity}</span>
                        <span className="mx-2">•</span>
                        <span>₹{feature.price} each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">₹{(feature.price * feature.quantity).toLocaleString()}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditFeature(feature)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => {
                          const reason = prompt('Reason for deletion:');
                          if (reason) handleDeleteFeature(feature.id, reason);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {features.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No features added</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Services</CardTitle>
                <Button size="sm" onClick={() => setShowServiceDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {servicesArray.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{service.name}</span>
                      <Badge variant={service.directPay ? "secondary" : "default"} className="ml-2 text-xs">
                        {service.directPay ? "Direct Pay" : "Include in Bill"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">₹{service.price.toLocaleString()}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditService(service)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => {
                          const reason = prompt('Reason for deletion:');
                          if (reason) handleDeleteService(service.id, reason);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {servicesArray.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No services added</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Payments</CardTitle>
                <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pageData.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{new Date(payment.date).toLocaleDateString()}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>{payment.paymentMode.toUpperCase()}</span>
                        <span className="mx-2">•</span>
                        <span>{payment.personName}</span>
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-green-600">₹{payment.amount.toLocaleString()}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditPayment(payment)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => {
                          const reason = prompt('Reason for deletion:');
                          if (reason) handleDeletePayment(payment.id, reason);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {pageData.payments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No payments recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Inventory</CardTitle>
                <Button size="sm" onClick={() => setShowInventoryDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {bookingInventoryArray.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium text-sm">{item.name}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>Qty: {item.quantity}</span>
                        <span className="mx-2">•</span>
                        <span>₹{item.charge || item.price} each</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">₹{((item.charge || item.price) * item.quantity).toLocaleString()}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditInventory(item)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => {
                          const reason = prompt('Reason for deletion:');
                          if (reason) handleDeleteInventory(item.id, reason);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {bookingInventoryArray.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No inventory items</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Tickets</CardTitle>
                <Button size="sm" onClick={() => setShowTicketDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ticketsArray.map((ticket, idx) => (
                  <div key={ticket?.id || `ticket-${idx}`} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ticket.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={
                            ticket.priority === 'high' ? 'destructive' :
                            ticket.priority === 'medium' ? 'default' : 'outline'
                          } className="text-xs">
                            {ticket.priority}
                          </Badge>
                          <Badge variant={
                            ticket.status === 'open' ? 'default' :
                            ticket.status === 'in-progress' ? 'secondary' :
                            'outline'
                          } className="text-xs">
                            {ticket.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditTicket(ticket)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => {
                            const reason = prompt('Reason for deletion:');
                            if (reason) handleDeleteTicket(ticket.id, reason);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{ticket.description}</p>
                    <div className="text-xs text-gray-500">
                      <span>Category: {ticket.category}</span>
                      <span className="mx-2">•</span>
                      <span>Assigned to: {ticket.assignedTo}</span>
                    </div>
                  </div>
                ))}
                {ticketsArray.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tickets created</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Communication</CardTitle>
                <Button size="sm" onClick={() => setShowCommunicationDialog(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {communicationsList.map((communication) => (
                  <div key={communication.id} className="p-3 bg-gray-50 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {communication.date} at {communication.time}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => {
                          const reason = prompt('Reason for deletion:');
                          if (reason) handleDeleteCommunication(communication.id, reason);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm mb-1">
                      <span className="font-medium text-blue-600">From: </span>
                      <span>{communication.from_Person}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium text-green-600">To: </span>
                      <span>{communication.to_Person}</span>
                    </div>
                    <p className="text-sm text-gray-700">{communication.detail}</p>
                  </div>
                ))}
                {communicationsList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No communication records</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  </div>
</div>

        {/* Charges Breakdown for Mobile */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Charges Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Base Amount:</span>
              <span>₹{safeBookingTotal.toLocaleString()}</span>
            </div>

            {featuresTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Features:</span>
                <span>₹{featuresTotal.toLocaleString()}</span>
              </div>
            )}

            {servicesTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Services:</span>
                <span>₹{servicesTotal.toLocaleString()}</span>
              </div>
            )}

            {inventoryTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Inventory:</span>
                <span>₹{inventoryTotal.toLocaleString()}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Discount:</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}

            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Subtotal:</span>
                <span>₹{totalCharges.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-yellow-700">
                <span>GST ({gstPercentage}%):</span>
                <span>₹{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-green-700 text-base">
                <span>Total Bill:</span>
                <span>₹{billAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Label htmlFor="discount" className="text-sm">Discount Amount</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
              <Label htmlFor="discount-reason" className="mt-2 text-sm">Discount Reason</Label>
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

        {/* Invoice & Billing for Mobile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Invoice Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={invoiceNumber}
                  readOnly
                  className="flex-1"
                />
                <Button size="sm" onClick={() => setInvoiceNumber(generateInvoiceNumber())}>
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm">Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button onClick={viewInvoicePDF} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              View & Generate Invoice PDF
            </Button>
          </CardContent>
        </Card>
      </div>


      {/* All Dialogs - Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Payment Mode</Label>
              <Select value={newPayment.mode} onValueChange={(value: PaymentsItem['paymentMode']) => setNewPayment({ ...newPayment, mode: value })}>
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
                onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Person Name</Label>
              <Input
                value={newPayment.personName}
                onChange={(e) => setNewPayment({ ...newPayment, personName: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
              />
            </div>
            <Button
              onClick={editingItem ? handleUpdatePayment : handleAddPayment}
              className="w-full"
            >
              {editingItem ? 'Update Payment' : 'Add Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Feature' : 'Add Feature'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Feature</Label>
              <Select value={newFeature.name} onValueChange={(value) => {
                const selected = masterFeatures.find(f => f.name === value);
                setNewFeature({
                  ...newFeature,
                  name: value,
                  price: selected?.charge || 0
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feature" />
                </SelectTrigger>
                <SelectContent>
                  {masterFeatures.map(feature => (
                    <SelectItem key={feature.name} value={feature.name}>
                      {feature.name} - ₹{feature.charge}
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
                onChange={(e) => setNewFeature({ ...newFeature, quantity: parseInt(e.target.value) })}
              />
            </div>
            <Button
              onClick={editingItem ? handleUpdateFeature : handleAddFeature}
              className="w-full"
            >
              {editingItem ? 'Update Feature' : 'Add Feature'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service</Label>
              <Select value={newService.name} onValueChange={(value) => setNewService({ ...newService, name: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {availableServiceItem.map(service => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name} - ₹{service.basePrice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="directPay"
                checked={newService.directPay}
                onCheckedChange={(checked) => setNewService({ ...newService, directPay: checked })}
              />
              <Label htmlFor="directPay" className="text-sm">Direct Pay</Label>
            </div>
            <Button onClick={editingItem ? handleUpdateService : handleAddService} className="w-full">
              {editingItem ? 'Update Service' : 'Add Service'}
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
                      {item.name}-₹{item.charge}
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
                      {item.name} - ₹{item.charge}
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
                onChange={(e) => setNewInventoryItem({ ...newInventoryItem, quantity: parseInt(e.target.value) })}
              />
            </div>
            <Button onClick={handleUpdateInventory} className="w-full">
              Update Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Ticket' : 'Add Ticket'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select value={newTicket.assignedTo} onValueChange={(value) => setNewTicket({ ...newTicket, assignedTo: value })}>
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
              <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket category" />
                </SelectTrigger>
                <SelectContent>
                  {availableTicketCategories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={newTicket.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTicket({ ...newTicket, priority: value })}>
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
              <Select value={newTicket.status} onValueChange={(value: 'open' | 'in-progress' | 'completed') => setNewTicket({ ...newTicket, status: value })}>
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

      {/* Communication Dialog */}
      <Dialog open={showCommunicationDialog} onOpenChange={setShowCommunicationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Communication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newCommunication.date}
                onChange={(e) => setNewCommunication({ ...newCommunication, date: e.target.value })}
              />
            </div>
            <div>
              <Label>From</Label>
              <Select
                value={newCommunication.fromPerson}
                onValueChange={(value) => setNewCommunication({ ...newCommunication, fromPerson: value })}
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
                onChange={(e) => setNewCommunication({ ...newCommunication, toPerson: e.target.value })}
              />
            </div>
            <div>
              <Label>Detail</Label>
              <Textarea
                value={newCommunication.detail}
                onChange={(e) => setNewCommunication({ ...newCommunication, detail: e.target.value })}
              />
            </div>
            <Button onClick={handleAddCommunication} className="w-full">
              Add Communication
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
};

export default MobileBookingManagement;