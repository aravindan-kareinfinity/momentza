import { Organization, User, Hall, Booking, Review, CarouselItem, HallFeature, Microsite } from '../types';

// Additional interfaces for services
export interface MasterDataItem {
  id: string;
  name: string;
  type: string;
  value?: string;
  charge?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  hsnCode: string;
  taxPercentage: number;
  basePrice: number;
  isActive: boolean;
}

export interface Services{
  id:string;
  name:string;
  directPay:boolean;
  price:number;
  bookingId?: string;
  //organizationId?:string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes: string;
}
//new
export interface PaymentsItem{
  id: string;
  date: string;
  paymentMode :'cash'| 'card' | 'upi' | 'bank transfer';
  amount:number;
  personName:string;
  notes:string;
  bookingId?: string,
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in-progress' | 'completed';
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  bookingId: string;
  date: string;
  time: string;
  fromPerson: string;
  toPerson: string;
  detail: string;
  createdAt: string;
}

export interface BillingSettings {
  companyName: string;
  gstNumber: string;
  address: string;
  taxPercentage: number;
  hsnNumber: string;
  bankAccount: string;
  ifscNumber: string;
  bankName: string;
}

export interface CustomerClick {
  id: string;
  customerId: string;
  hallId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  eventType: string;
  guestCount: number;
  message: string;
  timestamp: string;
  rating?: number;
  createdAt: string;
  boyName?: string;
  girlName?: string;
}

export interface GalleryImage {
  id: string;
  organizationId: string;
  url: string;
  title: string;
  category: string;
  uploadedAt: string;
}

export interface MonthlyData {
  month: string;
  bookings: number;
  revenue: number;
}

export interface StatusData {
  name: string;
  value: number;
  color: string;
}

export interface HallUtilization {
  name: string;
  bookings: number;
  revenue: number;
}

export interface GrowthMetrics {
  monthlyGrowth: number;
  customerRetention: number;
  averageBookingValue: number;
}

export interface CustomerInsights {
  totalCustomers: number;
  repeatCustomers: number;
  customerSatisfaction: number;
}

export const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Royal Weddings',
    contactPerson: 'John Smith',
    contactNo: '+1-234-567-8900',
    address:'wertyui',
    about:'qwertydfgh',
    defaultDomain: 'royalweddings.com',
    customDomain: 'www.royalweddings.com',
    logo: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=100&q=80',
    theme: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#F3F4F6'
    }
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@royalweddings.com',
    organizationId: '1',
    accessibleHalls: ['1', '2', '3'],
    role: 'admin'
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@royalweddings.com',
    organizationId: '1',
    accessibleHalls: ['1', '2'],
    role: 'manager'
  }
];

export const mockHalls: Hall[] = [
  {
    id: '1',
    organizationId: '1',
    name: 'Grand Ballroom',
    capacity: 500,
    location: 'Downtown',
    address: '123 Main Street, Downtown, City 12345',
    features: [
      { name: 'Air Conditioning', charge: 5000 },
      { name: 'Sound System', charge: 3000 },
      { name: 'Lighting', charge: 2000 },
      { name: 'Catering', charge: 10000 },
      { name: 'Photography', charge: 8000 }
    ],
    rateCard: {
      morningRate: 25000,
      eveningRate: 35000,
      fullDayRate: 50000
    },
    gallery: [
      'photo-1519225421980-715cb0215aed',
      'photo-1464366400600-7168b8af9bc3',
      'photo-1478146896981-b80fe463b330'
    ],
    isActive: true
  },
  {
    id: '2',
    organizationId: '1',
    name: 'Royal Gardens',
    capacity: 300,
    location: 'Uptown',
    address: '456 Garden Lane, Uptown, City 12345',
    features: [
      { name: 'Garden View', charge: 4000 },
      { name: 'Sound System', charge: 3000 },
      { name: 'Decoration', charge: 6000 },
      { name: 'Catering', charge: 8000 }
    ],
    rateCard: {
      morningRate: 20000,
      eveningRate: 30000,
      fullDayRate: 45000
    },
    gallery: [
      'photo-1519167758481-83f29c55eae4',
      'photo-1517457373958-b7bdd4587205',
      'photo-1522413452208-996ff3f04122'
    ],
    isActive: true
  },
  {
    id: '3',
    organizationId: '1',
    name: 'Crystal Palace',
    capacity: 800,
    location: 'City Center',
    address: '789 Palace Road, City Center, City 12345',
    features: [
      { name: 'Crystal Chandeliers', charge: 8000 },
      { name: 'Premium Sound', charge: 5000 },
      { name: 'Stage Setup', charge: 7000 },
      { name: 'Luxury Catering', charge: 15000 }
    ],
    rateCard: {
      morningRate: 40000,
      eveningRate: 60000,
      fullDayRate: 90000
    },
    gallery: [
      'photo-1465495976277-4387d4b0e4a6',
      'photo-1469371670807-013ccf25f16a',
      'photo-1515934751635-c81c6bc9a2d8'
    ],
    isActive: true
  }
];

export const mockBookings: Booking[] = [
  {
    id: '1',
    organizationId: '1',
    hallId: '1',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah@email.com',
    customerPhone: '+1-555-0123',
    eventDate: '2024-07-15',
    eventType: 'Wedding',
    timeSlot: 'evening',
    guestCount: 250,
    totalAmount: 45000,
    status: 'confirmed',
    createdAt: '2024-06-15T10:00:00Z'
  },
  {
    id: '2',
    organizationId: '1',
    hallId: '2',
    customerName: 'Mike Davis',
    customerEmail: 'mike@email.com',
    customerPhone: '+1-555-0456',
    eventDate: '2024-08-20',
    eventType: 'Anniversary',
    timeSlot: 'fullday',
    guestCount: 150,
    totalAmount: 35000,
    status: 'pending',
    createdAt: '2024-06-20T14:30:00Z'
  },
  {
    id: '3',
    organizationId: '1',
    hallId: '3',
    customerName: 'Jennifer Wilson',
    customerEmail: 'jennifer@email.com',
    customerPhone: '+1-555-0789',
    eventDate: '2024-06-25',
    eventType: 'Wedding',
    timeSlot: 'evening',
    guestCount: 400,
    totalAmount: 75000,
    status: 'active',
    createdAt: '2024-05-25T09:15:00Z'
  },
  {
    id: '4',
    organizationId: '1',
    hallId: '1',
    customerName: 'Robert Chen',
    customerEmail: 'robert@email.com',
    customerPhone: '+1-555-0321',
    eventDate: '2024-09-10',
    eventType: 'Corporate Event',
    timeSlot: 'fullday',
    guestCount: 200,
    totalAmount: 40000,
    status: 'confirmed',
    createdAt: '2024-06-10T16:45:00Z'
  },
  {
    id: '5',
    organizationId: '1',
    hallId: '2',
    customerName: 'Lisa Rodriguez',
    customerEmail: 'lisa@email.com',
    customerPhone: '+1-555-0654',
    eventDate: '2024-07-05',
    eventType: 'Birthday Party',
    timeSlot: 'evening',
    guestCount: 100,
    totalAmount: 25000,
    status: 'cancelled',
    createdAt: '2024-06-05T11:20:00Z'
  },
  {
    id: '6',
    organizationId: '1',
    hallId: '3',
    customerName: 'David Thompson',
    customerEmail: 'david@email.com',
    customerPhone: '+1-555-0987',
    eventDate: '2024-08-15',
    eventType: 'Wedding',
    timeSlot: 'fullday',
    guestCount: 300,
    totalAmount: 60000,
    status: 'pending',
    createdAt: '2024-06-18T13:30:00Z'
  },
  {
    id: '7',
    organizationId: '1',
    hallId: '1',
    customerName: 'Amanda Foster',
    customerEmail: 'amanda@email.com',
    customerPhone: '+1-555-0124',
    eventDate: '2024-07-30',
    eventType: 'Anniversary',
    timeSlot: 'evening',
    guestCount: 120,
    totalAmount: 30000,
    status: 'confirmed',
    createdAt: '2024-06-12T10:00:00Z'
  },
  {
    id: '8',
    organizationId: '1',
    hallId: '2',
    customerName: 'Michael Brown',
    customerEmail: 'michael@email.com',
    customerPhone: '+1-555-0457',
    eventDate: '2024-09-25',
    eventType: 'Corporate Conference',
    timeSlot: 'fullday',
    guestCount: 250,
    totalAmount: 50000,
    status: 'pending',
    createdAt: '2024-06-22T15:45:00Z'
  }
];

export const mockReviews: Review[] = [
  {
    id: '1',
    organizationId: '1',
    hallId: '1',
    customerName: 'Emma Wilson',
    rating: 5,
    comment: 'Absolutely stunning venue! The staff was incredibly helpful and the facilities were top-notch. Our wedding day was perfect thanks to the amazing team.',
    date: '2024-06-10',
    isEnabled: true
  },
  {
    id: '2',
    organizationId: '1',
    hallId: '2',
    customerName: 'David Chen',
    rating: 4,
    comment: 'Beautiful garden setting and excellent service. Perfect for our wedding celebration. The outdoor ceremony was magical.',
    date: '2024-06-05',
    isEnabled: true
  },
  {
    id: '3',
    organizationId: '1',
    customerName: 'Lisa Rodriguez',
    rating: 5,
    comment: 'Royal Weddings exceeded all our expectations. Highly recommend! The attention to detail was incredible.',
    date: '2024-05-28',
    isEnabled: true
  },
  {
    id: '4',
    organizationId: '1',
    hallId: '1',
    customerName: 'Michael Thompson',
    rating: 5,
    comment: 'Outstanding service from start to finish. The venue is breathtaking and the staff went above and beyond.',
    date: '2024-05-20',
    isEnabled: true
  },
  {
    id: '5',
    organizationId: '1',
    hallId: '2',
    customerName: 'Sarah Johnson',
    rating: 4,
    comment: 'Great experience overall. The garden venue was perfect for our spring wedding. Highly satisfied!',
    date: '2024-05-15',
    isEnabled: false
  },
  {
    id: '6',
    organizationId: '1',
    customerName: 'Robert Kim',
    rating: 5,
    comment: 'Exceptional venue and service. Our guests were amazed by the beautiful setting and professional staff.',
    date: '2024-05-10',
    isEnabled: true
  }
];

export const mockCarouselItems: CarouselItem[] = [
  {
    id: '1',
    organizationId: '1',
    imageUrl: 'photo-1519225421980-715cb0215aed',
    title: 'Your Dream Wedding Awaits',
    description: 'Create unforgettable memories in our stunning venues',
    orderPosition: 1,
    isActive: true
  },
  {
    id: '2',
    organizationId: '1',
    imageUrl: 'photo-1464366400600-7168b8af9bc3',
    title: 'Elegant Celebrations',
    description: 'Experience luxury and sophistication at its finest',
    orderPosition: 2,
    isActive: true
  }
];

export const mockMicrosite: Microsite = {
  id: '1',
  organizationId: '1',
  components: [
    { id: '1', type: 'carousel', order: 1, isActive: true },
    { id: '2', type: 'halls', order: 2, isActive: true },
    { id: '3', type: 'reviews', order: 3, isActive: true }
  ]
};

// Master Data Items
export const mockEventTypes: MasterDataItem[] = [
  { id: '1', name: 'Wedding', type: 'EventTypes' },
  { id: '2', name: 'Birthday Party', type: 'EventTypes' },
  { id: '3', name: 'Corporate Event', type: 'EventTypes' },
  { id: '4', name: 'Conference', type: 'EventTypes' }
];

export const mockImageCategories: MasterDataItem[] = [
  { id: '1', name: 'Exterior', type: 'ImageCategories' },
  { id: '2', name: 'Interior', type: 'ImageCategories' },
  { id: '3', name: 'Dining Area', type: 'ImageCategories' },
  { id: '4', name: 'Stage', type: 'ImageCategories' },
  { id: '5', name: 'Decoration', type: 'ImageCategories' },
  { id: '6', name: 'Garden', type: 'ImageCategories' }
];

export const mockEmployees: MasterDataItem[] = [
  { id: '1', name: 'John Smith', type: 'Employees' },
  { id: '2', name: 'Sarah Johnson', type: 'Employees' },
  { id: '3', name: 'Mike Wilson', type: 'Employees' }
];

export const mockInventoryItems: MasterDataItem[] = [
  { id: '1', name: 'Chair', type: 'InventoryItems', charge: 50 },
  { id: '2', name: 'Table', type: 'InventoryItems', charge: 100 },
  { id: '3', name: 'Sound System', type: 'InventoryItems', charge: 500 },
  { id: '4', name: 'Projector', type: 'InventoryItems', charge: 300 }
];

export const mockTicketCategories: MasterDataItem[] = [
  { id: '1', name: 'Maintenance', type: 'TicketCategories' },
  { id: '2', name: 'Cleaning', type: 'TicketCategories' },
  { id: '3', name: 'Setup', type: 'TicketCategories' },
  { id: '4', name: 'Technical', type: 'TicketCategories' },
  { id: '5', name: 'Customer Service', type: 'TicketCategories' }
];

// Services
export const mockServices: ServiceItem[] = [
  { id: '1', name: 'Decoration Service', hsnCode: '998711', taxPercentage: 18, basePrice: 5000 ,isActive:true},
  { id: '2', name: 'Catering Service', hsnCode: '996331', taxPercentage: 5, basePrice: 800 ,isActive:true},
  { id: '3', name: 'Photography Service', hsnCode: '998212', taxPercentage: 18, basePrice: 15000,isActive:true },
  { id: '4', name: 'DJ Service', hsnCode: '998213', taxPercentage: 18, basePrice: 8000,isActive:true},
  { id: '5', name: 'Security Service', hsnCode: '997122', taxPercentage: 18, basePrice: 2000,isActive:true},
];

// Inventory Items (for booking management)
export const mockBookingInventoryItems: InventoryItem[] = [
  { id: 'item-1', name: 'Chairs', quantity: 100, price: 10, notes: 'Standard chairs' },
  { id: 'item-2', name: 'Tables', quantity: 20, price: 50, notes: 'Round tables' },
];

// Tickets
export const mockTickets: TicketItem[] = [
  {
    id: 'ticket-1',
    title: 'Sound System Issue',
    description: 'Need to fix microphone',
    category: 'Technical',
    status: 'open',
    assignedTo: 'Tech Team',
    priority: 'high',
    bookingId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

//payment
// export const mockPayment: PaymentItem[]=[
//   {
 
//  //   id:'345678789',

//   }
// ]

// Communications
export const mockCommunications: Communication[] = [
  {
    id: '1',
    bookingId: '1',
    date: '2024-01-15',
    time: '10:30 AM',
    fromPerson: 'John Smith',
    toPerson: 'Sarah Johnson',
    detail: 'Discussed catering requirements and confirmed menu selection',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    bookingId: '1',
    date: '2024-01-16',
    time: '2:15 PM',
    fromPerson: 'Sarah Johnson',
    toPerson: 'John Smith',
    detail: 'Updated guest count to 120 people and requested additional tables',
    createdAt: '2024-01-16T14:15:00Z'
  }
];

// Billing Settings
export const mockBillingSettings: BillingSettings = {
  companyName: 'Royal Wedding Halls',
  gstNumber: '27AAAPL1234C1Z5',
  address: '123 Main Street, City, State - 123456',
  taxPercentage: 18,
  hsnNumber: '997111',
  bankAccount: '1234567890',
  ifscNumber: 'ICIC0001234',
  bankName: 'ICICI Bank'
};

// Customer Clicks
export const mockCustomerClicks: CustomerClick[] = [
  {
    id: '1',
    customerId: '1',
    hallId: '1',
    customerName: 'Alice Brown',
    customerEmail: 'alice@email.com',
    customerPhone: '+1-555-0123',
    eventDate: '2024-09-15',
    eventType: 'Wedding',
    guestCount: 200,
    message: 'Interested in booking for our wedding ceremony',
    timestamp: '2024-06-01T09:00:00Z',
    rating: 5,
    createdAt: '2024-06-01T09:00:00Z',
    boyName: 'John Brown',
    girlName: 'Alice Brown'
  },
  {
    id: '2',
    customerId: '2',
    hallId: '2',
    customerName: 'Bob Wilson',
    customerEmail: 'bob@email.com',
    customerPhone: '+1-555-0456',
    eventDate: '2024-10-20',
    eventType: 'Corporate Event',
    guestCount: 150,
    message: 'Looking for venue for annual company dinner',
    timestamp: '2024-06-02T14:30:00Z',
    rating: 4,
    createdAt: '2024-06-02T14:30:00Z'
  },
  {
    id: '3',
    customerId: '3',
    hallId: '1',
    customerName: 'Carol Davis',
    customerEmail: 'carol@email.com',
    customerPhone: '+1-555-0789',
    eventDate: '2024-11-10',
    eventType: 'Birthday Party',
    guestCount: 80,
    message: 'Planning a milestone birthday celebration',
    timestamp: '2024-06-03T11:15:00Z',
    rating: 5,
    createdAt: '2024-06-03T11:15:00Z'
  },
  {
    id: '4',
    customerId: '4',
    hallId: '3',
    customerName: 'David Miller',
    customerEmail: 'david@email.com',
    customerPhone: '+1-555-0321',
    eventDate: '2024-12-05',
    eventType: 'Wedding',
    guestCount: 300,
    message: 'Looking for a grand venue for our wedding',
    timestamp: '2024-06-04T16:45:00Z',
    rating: 4,
    createdAt: '2024-06-04T16:45:00Z',
    boyName: 'David Miller',
    girlName: 'Sarah Johnson'
  },
  {
    id: '5',
    customerId: '5',
    hallId: '2',
    customerName: 'Eva Johnson',
    customerEmail: 'eva@email.com',
    customerPhone: '+1-555-0654',
    eventDate: '2024-08-25',
    eventType: 'Anniversary',
    guestCount: 120,
    message: 'Celebrating our 25th anniversary',
    timestamp: '2024-06-05T10:20:00Z',
    rating: 5,
    createdAt: '2024-06-05T10:20:00Z'
  },
  {
    id: '6',
    customerId: '1',
    hallId: '1',
    customerName: 'Alice Brown',
    customerEmail: 'alice@email.com',
    customerPhone: '+1-555-0123',
    eventDate: '2024-09-20',
    eventType: 'Wedding Reception',
    guestCount: 200,
    message: 'Following up on our previous inquiry',
    timestamp: new Date().toISOString(),
    rating: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: '7',
    customerId: '6',
    hallId: '3',
    customerName: 'Frank Smith',
    customerEmail: 'frank@email.com',
    customerPhone: '+1-555-0987',
    eventDate: '2024-10-15',
    eventType: 'Corporate Conference',
    guestCount: 500,
    message: 'Annual tech conference with 500 attendees',
    timestamp: new Date().toISOString(),
    rating: 4,
    createdAt: new Date().toISOString()
  }
];

// Gallery Images
export const mockGalleryImages: GalleryImage[] = [
  {
    id: '1',
    organizationId: '1',
    url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    title: 'Wedding Hall Interior',
    category: 'Interior',
    uploadedAt: '2024-06-01'
  },
  {
    id: '2',
    organizationId: '1',
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    title: 'Elegant Decoration',
    category: 'Decoration',
    uploadedAt: '2024-06-02'
  },
  {
    id: '3',
    organizationId: '1',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
    title: 'Garden Area',
    category: 'Exterior',
    uploadedAt: '2024-06-03'
  }
];

// Statistics Data
export const mockMonthlyData: MonthlyData[] = [
  { month: 'Jan', bookings: 12, revenue: 240000 },
  { month: 'Feb', bookings: 15, revenue: 300000 },
  { month: 'Mar', bookings: 18, revenue: 360000 },
  { month: 'Apr', bookings: 22, revenue: 440000 },
  { month: 'May', bookings: 20, revenue: 400000 },
  { month: 'Jun', bookings: 25, revenue: 500000 },
];

export const mockGrowthMetrics: GrowthMetrics = {
  monthlyGrowth: 25,
  customerRetention: 78,
  averageBookingValue: 45000
};

export const mockCustomerInsights: CustomerInsights = {
  totalCustomers: 112,
  repeatCustomers: 32,
  customerSatisfaction: 4.5
};

export const mockServicesService: Services={
   id:'2345',
   name:'Raja',
   directPay:false,
   price:10000,

}
