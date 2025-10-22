# Migration Guide: Organization Service Singleton Pattern

## Quick Migration Steps

### 1. Update Imports

**Before:**
```tsx
import { organizationService } from '@/services/ServiceFactory';
import { useService } from '@/hooks/useService';
```

**After:**
```tsx
import { useOrganization } from '@/hooks/useOrganization';
```

### 2. Update Hook Usage

**Before:**
```tsx
const {
  data: organization,
  loading: orgLoading,
  error: orgError
} = useService(() => organizationService.getCurrentOrganization());
```

**After:**
```tsx
const {
  organization,
  loading: orgLoading,
  error: orgError
} = useOrganization();
```

### 3. Add Error Dialog (Optional)

If you want to show the server error dialog:

```tsx
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';

const {
  organization,
  loading: orgLoading,
  error: orgError,
  showErrorDialog,
  refresh,
  closeErrorDialog
} = useOrganization();

// Add to your JSX:
<ServerErrorDialog
  isOpen={showErrorDialog}
  onClose={closeErrorDialog}
  onRetry={refresh}
  isLoading={orgLoading}
  title="Organization Service Error"
  message={orgError?.message || 'Unable to load organization data.'}
/>
```

## Components to Update

The following components still need to be migrated:

1. `src/components/Home/ReviewsSection.tsx`
2. `src/components/Home/PublicReviewsSection.tsx`
3. `src/components/Home/PublicFooter.tsx`
4. `src/components/Home/HallsSection.tsx`
5. `src/components/Home/Footer.tsx`

## Benefits After Migration

1. **No more infinite loops** - The singleton pattern prevents multiple API calls
2. **Better performance** - Cached data is shared across components
3. **Improved error handling** - User-friendly error dialogs with retry functionality
4. **Consistent data** - Same organization data across all components

## Testing

After migration, test that:
1. Components load without infinite loops
2. Organization data is displayed correctly
3. Error dialogs appear when server is unavailable
4. Retry functionality works
5. Multiple components share the same cached data 