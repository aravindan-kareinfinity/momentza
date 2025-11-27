export interface Organization {
  id: string;
  name: string;
  contactPerson: string;
  contactNo: string;
  address:string;
  about?:string;
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

export interface Hall {
  id: string;
  organizationId: string;
  name: string;
  capacity: number;
  location: string;
  address: string;
  features: HallFeature[];
  rateCard: {
    morningRate: number;
    eveningRate: number;
    fullDayRate: number;
  };
  gallery: string[];
  isActive: boolean;
}

export interface Booking {
  id: string;
  organizationId: string;
  hallId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  eventType: string;
  timeSlot: 'morning' | 'evening' | 'fullday';
  guestCount: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'active' | 'completed';
  createdAt: string;
  selectedFeatures?: string[];
  lastContactDate?: string;
  customerResponse?: string;
  isActive?: boolean;
  handOverDetails?: {
    personName: string;
    ebReading: number;
    advanceAmount: number;
    handOverDate: string;
  };
  billingDetails?: {
    billingName: string;
    billingAddress: string;
    gstNumber: string;
  };
}

export interface Review {
  id: string;
  organizationId: string;
  hallId?: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
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

export interface HandoverImage {
  id: string;
  bookingId: string;
  organizationId: string;
  category: string;
  description?: string;
  url: string;
  uploadedAt: string;
  createdAt: string;
}

export interface Inventoryitem{
  id:string;
  name:string;
  description:string;
  quantity:number;
  unit:string;
  price:number;
  organizationid:string;
  createdat:string;
  updatedat:string;
  notes:string;
}

export interface FeatureItem {
  id: string;
  name: string;
  quantity: number;      
  price: number;         
  createdAt: string;     
  updatedAt: string;     
  organizationId: string;
}
