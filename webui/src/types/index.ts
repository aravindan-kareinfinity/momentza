export interface Organization {
  id: string;
  name: string;
  contactPerson: string;
  contactNo: string;
  address: string;
  about?: string;
  defaultDomain: string;
  customDomain?: string;
  logo?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  accessibleHalls: string[];
  role: 'admin' | 'manager';
}

export interface HallFeature {
  name: string;
  charge: number;
}

export interface HallAmenities {
  foodType: 'veg' | 'non-veg' | 'both';

  capacity: {
    hall: number;
    dining: number;
    parking: number;
  };

  rooms: {
    free: number;
    rentedAc: number;
    rentedNonAc: number;
    acRoomRate: number;
    nonAcRoomRate: number;
  };

  facilities: {
    generator: boolean;
    airConditioning: boolean;
  };

  rules: string[];
}

export interface Hall {
  id: string;
  organizationId: string;
  name: string;
  // capacity: number;
  location: string;
  address: string;
  amenities: HallAmenities;
  coordinates: { lat: number, lng: number },
  features: HallFeature[];
  roomRate: number;

  rateCard: {
    morningRate: number;
    eveningRate: number;
    fullDayRate: number;
  };
  gallery: string[];
  isActive: boolean;
}

// In your types.ts or Booking type definition
export interface Booking {
  id: string;
  organizationId: string;
  hallId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  village: string;
  eventStartDate: string;
  eventEndDate: string;
  handoverStartDate: string;
  eventDate: string;
  eventType: string;
  timeSlot: string;
  guestCount: number;
  totalAmount: number;
  status: string;
  isActive: boolean;
  customerResponse: string;
  lastContactDate: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  notes: string;
  roomsRequired: boolean;
  roomsCount: number;
  roomDetails: {
    charges: {
      acRoomCharges: number;
      nonAcRoomCharges: number;
      totalRoomCharges: number;
    };
    roomsCount: {
      free: number;
      rentedAc: number;
      rentedNonAc: number;
    };
  };
  hallName?: string; // Optional, may come from join
}

export interface Review {
  id: string;
  organizationId: string;
  hallId?: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
  isEnabled?: boolean;
}

export interface CarouselItem {
  id: string;
  organizationId: string;
  imageUrl: string;
  title: string;
  description: string;
  orderPosition: number;
  isActive: boolean;
}

export interface MicrositeComponent {
  id: string;
  type: 'carousel' | 'halls' | 'reviews' | 'search' | 'image' | 'text';
  order: number;
  isActive: boolean;
  config?: any;
}

export interface Microsite {
  id: string;
  organizationId: string;
  components: MicrositeComponent[];
}

export interface Ticket {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  status: 'received' | 'assigned' | 'completed';
  assignedTo?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingActivity {
  id: string;
  bookingId: string;
  type: 'ticket' | 'service' | 'handover' | 'inventory';
  description: string;
  createdAt: string;
  data?: any;
}

export interface InventoryItem {
  id: string;
  bookingId: string;
  itemName: string;
  quantity: number;
  isReturned: boolean;
  handedOverAt: string;
  returnedAt?: string;
}

export interface Handover {
  advanceAmount: number;
  ebReading: number;
  handOverDate: string;
  personName: string;
}

export interface HandOverImage {
  id: string;
  bookingId: string;
  organizationId: string;
  category: string;
  description?: string;
  url?: string;
  uploadedAt: string;
  createdAt: string;
}

export interface Inventoryitem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  organizationid: string;
  createdat: string;
  updatedat: string;
  notes: string;
}

export interface PaymentsItem {
  id: string;
  date: string;
  paymentMode: 'cash' | 'card' | 'upi' | 'bank transfer';
  amount: number;
  personName: string;
  notes: string;
  bookingId?: string,
  organizationId: string,
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  bookingId?: string;
}
