// Import types from existing files
import { 
  Booking, Hall, User, Review, Organization, CarouselItem, PaymentsItem 
} from '../../types';
import { 
  MasterDataItem, ServiceItem, InventoryItem, TicketItem, 
  Communication, BillingSettings, CustomerClick, GalleryImage, 
  StatusData, HallUtilization, MonthlyData, 
  GrowthMetrics, CustomerInsights 
} from '../mockData';

// Base interfaces for all services
export interface IDataService<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// Specific service interfaces
export interface IBookingService extends IDataService<Booking> {
  getBookingsByOrganization(organizationId: string): Promise<Booking[]>;
  getBookingsByHall(hallId: string, organizationId: string): Promise<Booking[]>;
  getActiveBookings(organizationId: string): Promise<Booking[]>;
  searchBookings(searchRequest: { organizationId: string; hallId?: string; status?: string; eventType?: string; customerName?: string; customerEmail?: string; searchTerm?: string; eventDateFrom?: string; eventDateTo?: string; isActive?: boolean; timeSlot?: string; guestCountMin?: number; guestCountMax?: number; totalAmountMin?: number; totalAmountMax?: number; createdDateFrom?: string; createdDateTo?: string; lastContactDateFrom?: string; lastContactDateTo?: string; sortBy?: string; sortOrder?: string; page?: number; pageSize?: number }): Promise<Booking[]>;
  updateBookingStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking>;
  toggleBookingActive(id: string, isActive: boolean): Promise<Booking>;
  recordHandOver(id: string, handOverDetails: any): Promise<Booking>;
  updateBookingCommunication(id: string, lastContactDate: string, customerResponse: string): Promise<Booking>;
  getBookingStatistics(organizationId: string): Promise<any>;
  createBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking>;
}

export interface IHallService extends IDataService<Hall> {
  getAllHalls(): Promise<Hall[]>;
  getHallsByOrganization(organizationId: string): Promise<Hall[]>;
  getAccessibleHalls(organizationId: string, accessibleHallIds: string[]): Promise<Hall[]>;
  getHallById(id: string): Promise<Hall | null>;
  getAvailableTimeSlots(hallId: string, date: string | Date): Promise<Array<{value: string, label: string, price: number}>>;
  createHall(hall: Omit<Hall, 'id'>): Promise<Hall>;
  updateHall(id: string, updates: Partial<Hall>): Promise<Hall>;
  deleteHall(id: string): Promise<boolean>;
}

export interface IUserService extends IDataService<User> {
  getUsersByOrganization(organizationId: string): Promise<User[]>;
}

export interface IReviewService extends IDataService<Review> {
  getReviewsByOrganization(organizationId: string): Promise<Review[]>;
  getReviewsByHall(hallId: string): Promise<Review[]>;
  getAverageRating(organizationId: string): Promise<number>;
  updateWithCurrentData(id: string, currentReview: Review, data: Partial<Review>): Promise<Review>;
}

export interface IOrganizationService extends IDataService<Organization> {
  getCurrentOrganization(organizationId?: string): Promise<Organization>;
  updateOrganization(id: string, data: Partial<Organization>): Promise<Organization>;
}

export interface ISettingsService {
  getEventTypes(): Promise<MasterDataItem[]>;
  addEventType(name: string): Promise<MasterDataItem>;
  updateEventType(id: string, name: string): Promise<MasterDataItem>;
  deleteEventType(id: string): Promise<boolean>;
  
  getImageCategories(): Promise<MasterDataItem[]>;
  addImageCategory(name: string): Promise<MasterDataItem>;
  updateImageCategory(id: string, name: string): Promise<MasterDataItem>;
  deleteImageCategory(id: string): Promise<boolean>;
  
  getEmployees(): Promise<MasterDataItem[]>;
  addEmployee(name: string): Promise<MasterDataItem>;
  updateEmployee(id: string, name: string): Promise<MasterDataItem>;
  deleteEmployee(id: string): Promise<boolean>;
  
  getInventoryItems(): Promise<MasterDataItem[]>;
  addInventoryItem(name: string, charge: number): Promise<MasterDataItem>;
  updateInventoryItem(id: string, name: string, charge: number): Promise<MasterDataItem>;
  deleteInventoryItem(id: string): Promise<boolean>;
  
  getTicketCategories(): Promise<MasterDataItem[]>;
  addTicketCategory(name: string): Promise<MasterDataItem>;
  updateTicketCategory(id: string, name: string): Promise<MasterDataItem>;
  deleteTicketCategory(id: string): Promise<boolean>;
  
  getMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories'): Promise<MasterDataItem[]>;
  addMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', name: string, charge?: number): Promise<MasterDataItem>;
  deleteMasterData(type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories', id: string): Promise<boolean>;
}

export interface IServicesService extends IDataService<ServiceItem> {
  getAllServices(): Promise<ServiceItem[]>;
  createService(service: Omit<ServiceItem, 'id'>): Promise<ServiceItem>;
  updateService(id: string, updates: Partial<ServiceItem>): Promise<ServiceItem>;
  deleteService(id: string): Promise<boolean>;
}

export interface IInventoryService extends IDataService<InventoryItem> {
  getAllInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemById(id: string): Promise<InventoryItem | null>;
  getInventoryItemByName(name: string): Promise<InventoryItem | null>;
  createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: string): Promise<boolean>;
  getInventoryByBookingId(bookingId: string): Promise<InventoryItem[]>;
}

export interface ITicketService extends IDataService<TicketItem> {
  getTicketsByBookingId(bookingId: string): Promise<TicketItem[]>;
  updateTicketStatus(id: string, status: 'open' | 'in-progress' | 'completed'): Promise<TicketItem>;
  createTicket(data: Omit<TicketItem, 'id'>): Promise<TicketItem>;
  updateTicket(id: string, data: Partial<TicketItem>): Promise<TicketItem>;
  deleteTicket(id: string): Promise<boolean>;
}

export interface ICommunicationService extends IDataService<Communication> {
  getCommunicationsByBookingId(bookingId: string): Promise<Communication[]>;
  createCommunication(data: Omit<Communication, 'id'>): Promise<Communication>;
  updateCommunication(id: string, data: Partial<Communication>): Promise<Communication>;
  deleteCommunication(id: string): Promise<boolean>;
}

export interface IBillingService {
  getBillingSettings(): Promise<BillingSettings>;
  updateBillingSettings(settings: Partial<BillingSettings>): Promise<BillingSettings>;
}

export interface CustomerClickUploadRequest {
  id?: string;
  customerId?: string;
  eventDate?: string;
  eventType?: string;
  message?: string;
  hallId?: string;
  boyName?: string;
  girlName?: string;
  imageBase64?: string;
}

export interface ICustomerClicksService extends IDataService<CustomerClick> {
  getCustomerClicksByHallId(hallId: string): Promise<CustomerClick[]>;
  getCustomerClicksStats(): Promise<any>;
  createCustomerClick(data: CustomerClickUploadRequest): Promise<CustomerClick>;
}

export interface IGalleryService extends IDataService<GalleryImage> {
  getImagesByOrganization(organizationId: string): Promise<GalleryImage[]>;
  getImagesByCategory(organizationId: string, category: string): Promise<GalleryImage[]>;
  uploadImage(file: File, organizationId: string, title: string, category: string): Promise<GalleryImage>;
  createImage(image: Omit<GalleryImage, 'id' | 'uploadedAt'>): Promise<GalleryImage>;
  deleteImage(id: string): Promise<boolean>;
  getImageUrl(id: string): string;
}

export interface ICarouselService extends IDataService<CarouselItem> {
  getCarouselItems(organizationId: string): Promise<CarouselItem[]>;
  getActiveCarouselItems(organizationId: string): Promise<CarouselItem[]>;
  reorderItems(organizationId: string, itemIds: string[]): Promise<void>;
  moveItemUp(id: string, organizationId: string): Promise<boolean>;
  moveItemDown(id: string, organizationId: string): Promise<boolean>;
  toggleItemStatus(id: string): Promise<CarouselItem>;
}

export interface IAuthService {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
  
  // Synchronous methods for backward compatibility
  loginSync?(email: string, password: string): User;
  logoutSync?(): void;
  getCurrentUserSync?(): User | null;
  isAuthenticatedSync?(): boolean;
}

export interface IStatisticsService {
  getBasicStatistics(organizationId: string): Promise<any>;
  getLeadMetrics(organizationId: string): Promise<any>;
  getStatusDistribution(organizationId: string): Promise<StatusData[]>;
  getHallUtilization(organizationId: string): Promise<HallUtilization[]>;
  getMonthlyData(): Promise<MonthlyData[]>;
  getGrowthMetrics(organizationId: string): Promise<GrowthMetrics>;
  getCustomerInsights(organizationId: string): Promise<CustomerInsights>;
  getChartConfig(): Promise<any>;
  getAllStatistics(organizationId: string): Promise<any>;
}

export interface MicrositeComponent {
  id: string;
  type: string;
  orderPosition: number;
  isActive: boolean;
  config?: any;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMicrositeService {
  getComponents(organizationId: string): Promise<MicrositeComponent[]>;
  createComponent(component: Omit<MicrositeComponent, 'id' | 'createdAt' | 'updatedAt'>): Promise<MicrositeComponent>;
  updateComponent(id: string, component: Partial<MicrositeComponent>): Promise<MicrositeComponent>;
  deleteComponent(id: string): Promise<boolean>;
  reorderComponents(organizationId: string, componentIds: string[]): Promise<void>;
  toggleComponent(id: string, isActive: boolean): Promise<MicrositeComponent>;
} 


//
export interface IPaymentService extends IDataService<PaymentsItem>{
  getPaymentsByBookingId(bookingId: string): Promise<PaymentsItem[]>;
}