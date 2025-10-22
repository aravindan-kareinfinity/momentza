import { useState, useEffect } from 'react';
import { Organization } from '../types';
import { organizationService } from '../services/ServiceFactory';

interface UseOrganizationReturn {
  organization: Organization | null;
  loading: boolean;
  error: Error | null;
  showErrorDialog: boolean;
  refresh: () => Promise<void>;
  closeErrorDialog: () => void;
}

export function useOrganization(): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Function to fetch organization data
  const fetchOrganization = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useOrganization] Fetching organization data...');
      const org = await organizationService.getCurrentOrganization();
      setOrganization(org);
      setShowErrorDialog(false);
      console.log('[useOrganization] Organization data fetched successfully:', org);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
      console.error('[useOrganization] Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle retry
  const handleRetry = async () => {
    await fetchOrganization(true);
  };

  // Function to close error dialog
  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Effect to fetch organization data on mount
  useEffect(() => {
    fetchOrganization();
  }, []); // Empty dependency array means this runs only once when the component mounts

  return {
    organization,
    loading,
    error,
    showErrorDialog,
    refresh: handleRetry,
    closeErrorDialog: handleCloseErrorDialog
  };
} 