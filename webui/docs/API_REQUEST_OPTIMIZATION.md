# API Request Optimization Solution

## Problem: `net::ERR_INSUFFICIENT_RESOURCES`

The application was experiencing excessive API calls causing `net::ERR_INSUFFICIENT_RESOURCES` errors due to:

1. **Multiple concurrent requests** from different components
2. **Infinite loops** in React components using the old `useService` pattern
3. **Lack of request deduplication**
4. **Excessive re-renders** triggering new API calls

## Root Cause Identified and Fixed

### The Problem: `useService` Hook Infinite Loops

The main cause of recursive API calls was the `useService` hook implementation:

```typescript
// ❌ PROBLEMATIC - This caused infinite loops
useEffect(() => {
  if (immediate) {
    execute();
  }
}, [immediate, execute]); // execute function was recreated on every render
```

Components using this pattern would:
1. Call `useService(() => hallService.getAllHalls())`
2. The `execute` function would be recreated on every render
3. This would trigger the `useEffect` to run again
4. Creating an infinite loop of API calls

### Solution: Migrated to New Pattern

All components have been updated to use the new pattern:

```typescript
// ✅ CORRECT - No infinite loops
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    const result = await service.getData();
    setData(result);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, []); // Empty dependency array - runs only once
```

## Solution Implemented

### 1. RequestManager Singleton

**File**: `src/services/RequestManager.ts`

Prevents duplicate API calls by:
- Tracking pending requests with unique keys
- Reusing existing promises for identical requests
- Automatic cleanup of expired requests
- Request timeout management

```typescript
// Example usage
const result = await requestManager.executeRequest(
  'GET',
  '/api/halls',
  () => apiClient.get('/api/halls')
);
```

### 2. Updated ApiClient

**File**: `src/services/http/ApiClient.ts`

All API methods now use RequestManager:
- `get()`, `post()`, `put()`, `patch()`, `delete()`, `upload()`
- Automatic request deduplication
- Consistent error handling

### 3. Component Pattern Updates

All components now use the consistent pattern:

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    const result = await service.getData();
    setData(result);
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, []); // Empty dependency array
```

### 4. Updated Components

✅ **Completed Updates:**
- `TopNavigation.tsx`
- `PublicHomeCarousel.tsx`
- `Statistics.tsx`
- `Settings.tsx`
- `Sidebar.tsx`
- `HomeCarousel.tsx`
- `Footer.tsx`
- `PublicFooter.tsx`
- `ReviewsSection.tsx`
- `PublicReviewsSection.tsx`
- `HallsSection.tsx`
- `CustomerClicksSection.tsx`
- `AddBookingDialog.tsx` ⭐ **FIXED**
- `BookingDetailDialog.tsx` ⭐ **FIXED**
- `HomeCarousel.tsx` ⭐ **FIXED**
- `HallBookingCalendar.tsx` ⭐ **FIXED**
- `HallDetailCalendar.tsx` ⭐ **FIXED**

### 5. Request Monitor

**File**: `src/components/Debug/RequestMonitor.tsx`

Debug component to monitor active API requests:
- Shows pending request count
- Alerts when too many requests are active
- Helps identify problematic components

## Benefits

### 1. **Prevents Resource Exhaustion**
- No more `ERR_INSUFFICIENT_RESOURCES` errors
- No more recursive API calls to `/api/halls`
- Controlled concurrent request limits
- Automatic request cleanup

### 2. **Improved Performance**
- Reduced server load
- Faster response times
- Better user experience

### 3. **Better Error Handling**
- Consistent error dialogs
- Retry functionality
- Graceful degradation

### 4. **Developer Experience**
- Request monitoring tools
- Clear logging
- Easy debugging

## Usage

### Adding Request Monitor (Development)

```tsx
import { RequestMonitor } from '@/components/Debug/RequestMonitor';

function App() {
  return (
    <>
      {/* Your app content */}
      <RequestMonitor />
    </>
  );
}
```

### Monitoring Requests

Check browser console for RequestManager logs:
```
[RequestManager] Creating new request for: GET:/api/halls
[RequestManager] Reusing existing request for: GET:/api/halls
```

## Best Practices

### 1. **Component Pattern**
Always use the established pattern:
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData();
}, []); // Empty dependency array
```

### 2. **Error Handling**
Always include error dialogs:
```typescript
<ServerErrorDialog
  isOpen={showErrorDialog}
  onClose={handleCloseErrorDialog}
  onRetry={handleRetry}
  isLoading={loading}
/>
```

### 3. **Loading States**
Provide skeleton loading states for better UX.

### 4. **Request Deduplication**
Let RequestManager handle duplicate requests automatically.

### 5. **Avoid useService Hook**
❌ **DON'T USE** the old `useService` pattern:
```typescript
// This causes infinite loops
const { data } = useService(() => hallService.getAllHalls());
```

✅ **USE** the new pattern instead:
```typescript
const [halls, setHalls] = useState([]);
useEffect(() => {
  hallService.getAllHalls().then(setHalls);
}, []);
```

## Testing

### 1. **Load Testing**
- Open multiple components simultaneously
- Monitor RequestMonitor component
- Check browser network tab

### 2. **Error Scenarios**
- Disconnect network
- Test retry functionality
- Verify error dialogs

### 3. **Performance**
- Monitor request count
- Check response times
- Verify no infinite loops

## Troubleshooting

### High Request Count
1. Check RequestMonitor component
2. Look for components using old `useService` pattern
3. Verify useEffect dependency arrays
4. Check for infinite loops

### Still Getting ERR_INSUFFICIENT_RESOURCES
1. Ensure all components use new pattern
2. Check for remaining `useService` usage
3. Verify RequestManager is working
4. Monitor network tab for duplicate requests

### Recursive API Calls
1. Check browser console for repeated requests
2. Look for components using `useService` hook
3. Verify useEffect dependency arrays are empty `[]`
4. Check for state updates in render cycle

## Migration Checklist

- [x] Update all components to use `useState` + `useEffect` pattern
- [x] Remove `useService` imports where not needed
- [x] Add `ServerErrorDialog` to all components
- [x] Test RequestMonitor in development
- [x] Verify no infinite loops
- [x] Check network tab for duplicate requests
- [x] Fix recursive `/api/halls` calls ⭐ **COMPLETED** 