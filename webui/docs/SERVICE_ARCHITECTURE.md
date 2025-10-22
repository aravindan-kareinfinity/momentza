# Service Architecture Implementation

This document outlines the implementation of a scalable service architecture that supports both mock data and real API integration.

## Overview

The architecture provides:
- **Service Layer Abstraction**: Common interfaces for all services
- **Environment-Based Service Selection**: Switch between mock and API services
- **HTTP Client Abstraction**: Centralized API communication
- **Error Handling & Loading States**: Comprehensive error management
- **Caching & Retry Logic**: Built-in performance optimizations

## Architecture Components

### 1. Service Layer Abstraction

**Location**: `src/services/interfaces/IDataService.ts`

Defines common interfaces for all services:

```typescript
// Base interface for all data services
export interface IDataService<T> {
  getAll?(): Promise<T[]> | T[];
  getById?(id: string): Promise<T | null> | T | null;
  create?(data: Omit<T, 'id'>): Promise<T> | T;
  update?(id: string, data: Partial<T>): Promise<T> | T;
  delete?(id: string): Promise<boolean> | boolean;
}

// Specific service interfaces
export interface IBookingService {
  getBookingsByOrganization(organizationId: string): Booking[] | Promise<Booking[]>;
  updateBookingStatus(id: string, status: Booking['status'], reason?: string): Booking | Promise<Booking>;
  // ... other methods
}
```

### 2. HTTP Client Abstraction

**Location**: `src/services/http/ApiClient.ts`

Centralized HTTP client with:
- Automatic authentication token handling
- Error parsing and custom error classes
- Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- File upload support

```typescript
export class ApiClient {
  async get<T>(endpoint: string): Promise<T> { /* ... */ }
  async post<T>(endpoint: string, data: any): Promise<T> { /* ... */ }
  async put<T>(endpoint: string, data: any): Promise<T> { /* ... */ }
  async delete<T>(endpoint: string): Promise<T> { /* ... */ }
  async upload<T>(endpoint: string, formData: FormData): Promise<T> { /* ... */ }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: any
  ) { /* ... */ }
}
```

### 3. Environment Configuration

**Location**: `src/config/environment.ts`

Environment-based configuration management:

```typescript
export interface EnvironmentConfig {
  useMockData: boolean;
  apiBaseUrl: string;
  environment: string;
  debug: boolean;
}

export const config = getEnvironmentConfig();
export const shouldUseMockData = (): boolean => config.useMockData;
```

### 4. Service Factory

**Location**: `src/services/ServiceFactory.ts`

Factory pattern for creating service instances:

```typescript
export class ServiceFactory {
  static createBookingService() {
    if (shouldUseMockData()) {
      return mockBookingService;
    } else {
      return new ApiBookingService();
    }
  }
  
  // ... other service factories
}

// Export service instances
export const bookingService = ServiceFactory.createBookingService();
export const settingsService = ServiceFactory.createSettingsService();
// ... other services
```

### 5. API Service Implementations

**Location**: `src/services/api/`

Real API implementations of services:

```typescript
// Example: ApiBookingService.ts
export class ApiBookingService implements IBookingService {
  async searchBookings(searchRequest: BookingSearchRequest): Promise<Booking[]> {
    return apiClient.post<Booking[]>('/api/bookings/search', searchRequest);
  }
  
  async getBookingsByOrganization(organizationId: string): Promise<Booking[]> {
    // Use the new searchBookings method with just organizationId
    return this.searchBookings({ organizationId });
  }
  
  async getActiveBookings(organizationId: string): Promise<Booking[]> {
    // Use the new searchBookings method with organizationId and isActive filter
    return this.searchBookings({ organizationId, isActive: true });
  }
  
  async updateBookingStatus(id: string, status: Booking['status'], reason?: string): Promise<Booking> {
    return apiClient.patch<Booking>(`/api/bookings/${id}/status`, { status, reason });
  }
  
  // ... other methods
}
```

### 6. Custom Hooks for Service Management

**Location**: `src/hooks/useService.ts`

React hooks for service integration:

```typescript
// Hook for data fetching with caching and retry logic
export function useService<T>(
  serviceCall: () => Promise<T>,
  options: ServiceOptions = {}
): ServiceState<T> & {
  execute: () => Promise<T | null>;
  refresh: () => Promise<T | null>;
  clearError: () => void;
}

// Hook for mutations (create, update, delete)
export function useServiceMutation<T, R>(
  serviceCall: (data: T) => Promise<R>
): {
  execute: (data: T) => Promise<R | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  updateService: (id: string, data: Partial<T>) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): {
  execute: (id: string, data: Partial<T>, optimisticData?: T) => Promise<T | null>;
  loading: boolean;
  error: string | null;
}
```

## Usage Examples

### Basic Service Usage

```typescript
import { bookingService, settingsService } from '../services/ServiceFactory';

// Direct service usage
const bookings = await bookingService.getBookingsByOrganization('org1');
const activeBookings = await bookingService.getActiveBookings('org1');

// Get bookings for a specific hall (requires organizationId)
const hall = await hallService.getHallById('hall1');
const hallBookings = await bookingService.getBookingsByHall('hall1', hall.organizationId);

// Advanced search with multiple filters
const searchResults = await bookingService.searchBookings({
  organizationId: 'org1',
  status: 'confirmed',
  eventDateFrom: '2024-01-01',
  eventDateTo: '2024-12-31',
  isActive: true,
  sortBy: 'eventDate',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20
});

// Search with hall filter
const hallSearchResults = await bookingService.searchBookings({
  organizationId: 'org1',
  hallId: 'hall1',
  status: 'confirmed'
});

const eventTypes = await settingsService.getEventTypes();
```

### Using Service Hooks

```typescript
import { useService, useServiceMutation } from '../hooks/useService';
import { bookingService } from '../services/ServiceFactory';

const MyComponent = () => {
  // Data fetching with loading and error states
  const {
    data: bookings,
    loading: bookingsLoading,
    error: bookingsError,
    refresh: refreshBookings
  } = useService(() => bookingService.getBookingsByOrganization('org1'), {
    cacheTime: 2 * 60 * 1000 // 2 minutes
  });

  // Mutation with loading and error states
  const updateBookingMutation = useServiceMutation(
    (data: { id: string; status: string }) => 
      bookingService.updateBookingStatus(data.id, data.status as any)
  );

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    const result = await updateBookingMutation.execute({ 
      id: bookingId, 
      status: newStatus 
    });
    if (result) {
      refreshBookings(); // Refresh data after successful update
    }
  };

  // Error handling
  if (bookingsError) {
    return <div>Error: {bookingsError}</div>;
  }

  // Loading state
  if (bookingsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {bookings?.map(booking => (
        <div key={booking.id}>
          {booking.customerName}
          <button 
            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
            disabled={updateBookingMutation.loading}
          >
            {updateBookingMutation.loading ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      ))}
      
      {updateBookingMutation.error && (
        <div>Error: {updateBookingMutation.error}</div>
      )}
    </div>
  );
};
```

## Environment Configuration

### Development Environment
```bash
# .env.development
REACT_APP_USE_MOCK_DATA=true
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

### Production Environment
```bash
# .env.production
REACT_APP_USE_MOCK_DATA=false
REACT_APP_API_BASE_URL=http://localhost:5212
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

## Migration Strategy

### Phase 1: Mock Data (Current)
- All services use mock data
- Environment variable `REACT_APP_USE_MOCK_DATA=true`
- Focus on UI/UX development

### Phase 2: API Integration (In Progress)
- Implement API service classes
- Add environment-based switching
- Test with real API endpoints

### Phase 3: Full API Integration
- Set `REACT_APP_USE_MOCK_DATA=false`
- Remove mock data dependencies
- Production deployment

## Benefits

1. **Seamless Transition**: Easy switch between mock and real data
2. **Type Safety**: Full TypeScript support with interfaces
3. **Error Handling**: Comprehensive error management with retry logic
4. **Performance**: Built-in caching and loading states
5. **Maintainability**: Clear separation of concerns
6. **Testing**: Easy to mock services for testing
7. **Scalability**: Easy to add new services and endpoints

## Best Practices

1. **Always use the ServiceFactory** to get service instances
2. **Use service hooks** for React components
3. **Handle loading and error states** in UI
4. **Implement proper error boundaries** for API errors
5. **Use TypeScript interfaces** for type safety
6. **Cache data appropriately** using the cacheTime option
7. **Implement retry logic** for network failures
8. **Use optimistic updates** for better UX

## Future Enhancements

1. **Request/Response Interceptors**: Add logging, authentication refresh
2. **Offline Support**: Cache data for offline usage
3. **Real-time Updates**: WebSocket integration
4. **Advanced Caching**: Redis-like caching strategy
5. **Service Workers**: Background sync and caching
6. **GraphQL Integration**: Replace REST with GraphQL
7. **Microservices**: Split services into microservices 