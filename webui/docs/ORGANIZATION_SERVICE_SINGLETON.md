# Organization Service Singleton Pattern

## Overview

The organization service has been refactored to use a singleton pattern with caching and error handling. This prevents multiple API calls from different components and provides a better user experience when server errors occur.

## Key Features

### 1. Singleton Pattern
- Only one instance of the organization service exists across the entire application
- Prevents multiple simultaneous API calls for the same data
- Shared state across all components

### 2. Caching
- Organization data is cached for 5 minutes
- Subsequent calls within the cache duration return cached data instantly
- Automatic cache invalidation after 5 minutes

### 3. Error Handling
- Graceful error handling with user-friendly dialogs
- Retry functionality for failed requests
- Error state management

### 4. Loading States
- Prevents duplicate requests while one is in progress
- Components wait for the current request to complete

## Usage

### Basic Usage with Hook

```tsx
import { useOrganization } from '@/hooks/useOrganization';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

function MyComponent() {
  const {
    organization,
    loading,
    error,
    showErrorDialog,
    refresh,
    closeErrorDialog
  } = useOrganization();

  return (
    <>
      <div>
        {loading && <p>Loading...</p>}
        {organization && <p>Organization: {organization.name}</p>}
        <button onClick={refresh}>Refresh</button>
      </div>
      
      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={closeErrorDialog}
        onRetry={refresh}
        isLoading={loading}
        title="Organization Service Error"
        message={error?.message || 'Unable to load organization data.'}
      />
    </>
  );
}
```

### Direct Service Usage

```tsx
import { organizationService } from '@/services/ServiceFactory';

// Get current organization (uses cache if available)
const org = await organizationService.getCurrentOrganization();

// Force refresh (clears cache and fetches fresh data)
const freshOrg = await organizationService.refreshOrganization();

// Get cached organization without API call
const cachedOrg = organizationService.getCachedOrganization();

// Check for errors
const lastError = organizationService.getLastError();
```

## Implementation Details

### Mock Service (`src/services/mock/organizationService.ts`)

- Implements singleton pattern with `getInstance()`
- 5-minute cache duration
- Simulates network delays and occasional errors
- Thread-safe request handling

### API Service (`src/services/api/ApiOrganizationService.ts`)

- Same singleton pattern as mock service
- Real API calls with caching
- Error handling for network issues
- Cache invalidation on updates

### Custom Hook (`src/hooks/useOrganization.ts`)

- React-friendly interface
- Automatic error dialog management
- Loading state management
- Retry functionality

### Error Dialog (`src/components/ui/ServerErrorDialog.tsx`)

- User-friendly error display
- Retry button with loading state
- Customizable title and message
- Accessible design

## Benefits

1. **Performance**: Eliminates duplicate API calls
2. **User Experience**: Better error handling with retry options
3. **Consistency**: Same data across all components
4. **Reliability**: Graceful handling of network issues
5. **Maintainability**: Centralized organization data management

## Migration Guide

### From Old Pattern

**Before:**
```tsx
const { data: organization, loading, error } = useService(() => 
  organizationService.getCurrentOrganization()
);
```

**After:**
```tsx
const { organization, loading, error, showErrorDialog, refresh, closeErrorDialog } = useOrganization();
```

### Adding Error Dialog

**Before:**
```tsx
if (error) {
  return <div>Error: {error.message}</div>;
}
```

**After:**
```tsx
<ServerErrorDialog
  isOpen={showErrorDialog}
  onClose={closeErrorDialog}
  onRetry={refresh}
  isLoading={loading}
  title="Organization Service Error"
  message={error?.message || 'Unable to load organization data.'}
/>
```

## Testing

The mock service includes a 10% chance of throwing errors to test error handling:

```tsx
// In mock service
if (Math.random() < 0.1) {
  throw new Error('Server not available. Please try again later.');
}
```

This allows you to test the error dialog and retry functionality during development.

## Cache Management

- Cache duration: 5 minutes
- Automatic invalidation
- Manual refresh available
- Cache updates on organization updates

## Error Scenarios

1. **Network Error**: Shows retry dialog
2. **Server Error**: Shows retry dialog
3. **Cache Expired**: Automatically fetches fresh data
4. **Multiple Requests**: Queues requests to prevent duplicates 