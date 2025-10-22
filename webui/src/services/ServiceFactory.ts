import { shouldUseMockData } from '../config/environment';

// Import existing services from mock folder
import { bookingService as mockBookingService } from './mock/bookingService';
import { hallService as mockHallService } from './mock/hallService';
import { userService as mockUserService } from './mock/userService';
import { reviewService as mockReviewService } from './mock/reviewService';
import { organizationService as mockOrganizationService } from './mock/organizationService';
import { settingsService as mockSettingsService } from './mock/settingsService';
import { servicesService as mockServicesService } from './mock/servicesService';
import { inventoryService as mockInventoryService } from './mock/inventoryService';
import { ticketService as mockTicketService } from './mock/ticketService';
import { communicationService as mockCommunicationService } from './mock/communicationService';
import { billingService as mockBillingService } from './mock/billingService';
import { customerClicksService as mockCustomerClicksService } from './mock/customerClicksService';
import { galleryService as mockGalleryService } from './mock/galleryService';
import { carouselService as mockCarouselService } from './mock/carouselService';
import { authService as mockAuthService } from './mock/authService';
import { statisticsService as mockStatisticsService } from './mock/statisticsService';
import { micrositeService as mockMicrositeService } from './mock/micrositeService';

// Import API services
import { ApiBookingService } from './api/ApiBookingService';
import { ApiHallService } from './api/ApiHallService';
import { ApiUserService } from './api/ApiUserService';
import { ApiReviewService } from './api/ApiReviewService';
import { ApiOrganizationService } from './api/ApiOrganizationService';
import { ApiSettingsService } from './api/ApiSettingsService';
import { ApiServicesService } from './api/ApiServicesService';
import { ApiInventoryService } from './api/ApiInventoryService';
import { ApiTicketService } from './api/ApiTicketService';
import { ApiCommunicationService } from './api/ApiCommunicationService';
import { ApiBillingService } from './api/ApiBillingService';
import { ApiCustomerClicksService } from './api/ApiCustomerClicksService';
import { ApiGalleryService } from './api/ApiGalleryService';
import { ApiCarouselService } from './api/ApiCarouselService';
import { ApiStatisticsService } from './api/ApiStatisticsService';
import { ApiAuthService } from './api/ApiAuthService';
import { ApiMicrositeService } from './api/ApiMicrositeService';

export class ServiceFactory {
  static createBookingService() {
    if (shouldUseMockData()) {
      return mockBookingService;
    } else {
      return new ApiBookingService();
    }
  }

  static createHallService() {
    if (shouldUseMockData()) {
      return mockHallService;
    } else {
      return new ApiHallService();
    }
  }

  static createUserService() {
    if (shouldUseMockData()) {
      return mockUserService;
    } else {
      return new ApiUserService();
    }
  }

  static createReviewService() {
    if (shouldUseMockData()) {
      return mockReviewService;
    } else {
      return new ApiReviewService();
    }
  }

  static createOrganizationService() {
    if (shouldUseMockData()) {
      return mockOrganizationService;
    } else {
      return ApiOrganizationService.getInstance();
    }
  }

  static createSettingsService() {
    if (shouldUseMockData()) {
      return mockSettingsService;
    } else {
      return new ApiSettingsService();
    }
  }

  static createServicesService() {
    if (shouldUseMockData()) {
      return mockServicesService;
    } else {
      return new ApiServicesService();
    }
  }

  static createInventoryService() {
    if (shouldUseMockData()) {
      return mockInventoryService;
    } else {
      return new ApiInventoryService();
    }
  }

  static createTicketService() {
    if (shouldUseMockData()) {
      return mockTicketService;
    } else {
      return new ApiTicketService();
    }
  }

  static createCommunicationService() {
    if (shouldUseMockData()) {
      return mockCommunicationService;
    } else {
      return new ApiCommunicationService();
    }
  }

  static createBillingService() {
    if (shouldUseMockData()) {
      return mockBillingService;
    } else {
      return new ApiBillingService();
    }
  }

  static createCustomerClicksService() {
    if (shouldUseMockData()) {
      return mockCustomerClicksService;
    } else {
      return new ApiCustomerClicksService();
    }
  }

  static createGalleryService() {
    if (shouldUseMockData()) {
      return mockGalleryService;
    } else {
      return new ApiGalleryService();
    }
  }

  static createCarouselService() {
    if (shouldUseMockData()) {
      return mockCarouselService;
    } else {
      return new ApiCarouselService();
    }
  }

  static createAuthService() {
    if (shouldUseMockData()) {
      return mockAuthService;
    } else {
      return new ApiAuthService();
    }
  }

  static createStatisticsService() {
    if (shouldUseMockData()) {
      return mockStatisticsService;
    } else {
      return new ApiStatisticsService();
    }
  }

  static createMicrositeService() {
    if (shouldUseMockData()) {
      return mockMicrositeService;
    } else {
      return new ApiMicrositeService();
    }
  }
}

// Export service instances for easy access
export const bookingService = ServiceFactory.createBookingService();
export const hallService = ServiceFactory.createHallService();
export const userService = ServiceFactory.createUserService();
export const reviewService = ServiceFactory.createReviewService();
export const organizationService = ServiceFactory.createOrganizationService();
export const settingsService = ServiceFactory.createSettingsService();
export const servicesService = ServiceFactory.createServicesService();
export const inventoryService = ServiceFactory.createInventoryService();
export const ticketService = ServiceFactory.createTicketService();
export const communicationService = ServiceFactory.createCommunicationService();
export const billingService = ServiceFactory.createBillingService();
export const customerClicksService = ServiceFactory.createCustomerClicksService();
export const galleryService = ServiceFactory.createGalleryService();
export const carouselService = ServiceFactory.createCarouselService();
export const authService = ServiceFactory.createAuthService();
export const statisticsService = ServiceFactory.createStatisticsService();
export const micrositeService = ServiceFactory.createMicrositeService(); 