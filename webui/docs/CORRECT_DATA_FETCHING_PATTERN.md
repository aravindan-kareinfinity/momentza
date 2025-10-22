# Correct Data Fetching Pattern

## Overview

This document outlines the **correct pattern** for data fetching in the application, which should be followed to avoid performance issues, infinite loops, and browser hangs.

## ❌ WRONG Pattern (What We Had Before)

### Problems with the Old Pattern:
1. **Components making API calls during rendering** - This causes multiple unnecessary requests
2. **Infinite loops** - Components re-render, triggering more API calls, causing more re-renders
3. **Browser hangs** - When server is unavailable, recursive calls can freeze the browser
4. **Poor performance** - Multiple components fetching the same data independently
5. **Race conditions** - Components competing for the same resources

### Example of Wrong Pattern:
```tsx
// ❌ WRONG - Component making API calls during render
export function PublicHallsSection() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This runs on every component mount/re-render
    const fetchHalls = async () => {
      const data = await hallService.getAllHalls(); // API call during render
      setHalls(data);
    };
    fetchHalls();
  }, []);

  return <div>{/* render halls */}</div>;
}
```

## ✅ CORRECT Pattern (What We Should Use)

### Core Principles:
1. **Page-level data fetching** - Only fetch data once when the page initializes
2. **Local context/state** - Store data at page level and pass down to components
3. **Event-driven API calls** - Only make service calls in response to user actions (clicks, etc.)
4. **Single source of truth** - One place to manage loading, error, and data states

### Example of Correct Pattern:

#### 1. Page Level (Data Fetching)
```tsx
// ✅ CORRECT - Page fetches all data once
const PublicHome = () => {
  const [pageData, setPageData] = useState({
    organization: null,
    halls: [],
    carouselItems: [],
    // ... all data needed by child components
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data once when page initializes
  const fetchPageData = async () => {
    try {
      setLoading(true);
      
      // Fetch organization first (needed for other calls)
      const organization = await organizationService.getCurrentOrganization();
      
      // Fetch all data in parallel
      const [halls, carouselItems, reviews] = await Promise.all([
        hallService.getAllHalls(),
        carouselService.getCarouselItems(organization.id),
        reviewService.getReviewsByOrganization(organization.id)
      ]);

      setPageData({ organization, halls, carouselItems, reviews });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []); // Only run once when page mounts

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorComponent />;

  return (
    <div>
      <TopNavigation organization={pageData.organization} />
      <PublicHallsSection halls={pageData.halls} />
      <PublicReviewsSection 
        organization={pageData.organization}
        reviews={pageData.reviews}
      />
    </div>
  );
};
```

#### 2. Component Level (Pure Rendering)
```tsx
// ✅ CORRECT - Component receives data as props
interface PublicHallsSectionProps {
  halls: any[];
}

export function PublicHallsSection({ halls }: PublicHallsSectionProps) {
  // No API calls, no useEffect, no state management
  // Just pure rendering based on props
  
  if (!halls || halls.length === 0) {
    return null;
  }

  return (
    <section>
      {halls.map(hall => (
        <HallCard key={hall.id} hall={hall} />
      ))}
    </section>
  );
}
```

#### 3. Event-Driven API Calls
```tsx
// ✅ CORRECT - API calls only in response to user actions
export function BookingForm() {
  const handleSubmit = async (formData) => {
    try {
      // This is the ONLY place we make API calls
      await bookingService.createBooking(formData);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Benefits of Correct Pattern

### 1. **Performance**
- Single API call per data type per page load
- No duplicate requests
- Faster page rendering

### 2. **Reliability**
- No infinite loops
- No browser hangs
- Predictable behavior

### 3. **Maintainability**
- Clear separation of concerns
- Easy to debug
- Centralized error handling

### 4. **User Experience**
- Faster loading times
- Better error handling
- Consistent loading states

## Implementation Guidelines

### 1. Page Structure
```tsx
const SomePage = () => {
  // 1. Page-level state for ALL data
  const [pageData, setPageData] = useState({...});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Single data fetching function
  const fetchPageData = async () => {
    // Fetch all required data
  };

  // 3. Fetch once on mount
  useEffect(() => {
    fetchPageData();
  }, []);

  // 4. Handle loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorComponent />;

  // 5. Pass data to components
  return (
    <div>
      <ComponentA data={pageData.dataA} />
      <ComponentB data={pageData.dataB} />
    </div>
  );
};
```

### 2. Component Structure
```tsx
interface ComponentProps {
  data: any;
  onAction?: (data) => void; // For event-driven actions
}

export function SomeComponent({ data, onAction }: ComponentProps) {
  // Pure rendering - no API calls
  // Event handlers can call onAction for user interactions
  
  const handleClick = () => {
    onAction?.(data);
  };

  return <div onClick={handleClick}>{/* render data */}</div>;
}
```

### 3. Event-Driven Actions
```tsx
// Only make API calls in response to user actions
const handleUserAction = async () => {
  try {
    const result = await someService.someAction();
    // Update local state or trigger page refresh
  } catch (error) {
    // Handle error
  }
};
```

## Migration Checklist

When refactoring existing components:

- [ ] Move all API calls from components to page level
- [ ] Convert components to accept data as props
- [ ] Remove useEffect hooks that make API calls
- [ ] Remove loading/error state from components
- [ ] Add proper TypeScript interfaces for props
- [ ] Test that data flows correctly from page to components
- [ ] Verify that user actions still work correctly
- [ ] Ensure error handling is centralized at page level

## Common Anti-Patterns to Avoid

1. **❌ API calls in useEffect with empty dependency array**
2. **❌ Components managing their own loading states**
3. **❌ Multiple components fetching the same data**
4. **❌ API calls during render**
5. **❌ Complex state management in components**

## Summary

The correct pattern ensures:
- **One API call per data type per page load**
- **Components are pure rendering functions**
- **API calls only happen in response to user actions**
- **Centralized error and loading state management**
- **Better performance and reliability**

This pattern should be followed for all new development and used as the standard for refactoring existing code. 