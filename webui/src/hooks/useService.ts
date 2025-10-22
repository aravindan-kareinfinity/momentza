import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../services/http/ApiClient';

export interface ServiceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface ServiceOptions {
  immediate?: boolean;
  cacheTime?: number; // milliseconds
  retryCount?: number;
  retryDelay?: number; // milliseconds
}

export function useService<T>(
  serviceCall: () => Promise<T>,
  options: ServiceOptions = {}
): ServiceState<T> & {
  execute: () => Promise<T | null>;
  refresh: () => Promise<T | null>;
  clearError: () => void;
} {
  const {
    immediate = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<ServiceState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const executeWithRetry = useCallback(async (): Promise<T | null> => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await serviceCall();
        
        setState({
          data: result,
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on 4xx errors (client errors)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          break;
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    // All retries failed
    const errorMessage = lastError instanceof ApiError 
      ? lastError.message 
      : lastError?.message || 'An error occurred';
    
    setState(prev => ({
      ...prev,
      loading: false,
      error: errorMessage
    }));
    
    return null;
  }, [serviceCall, retryCount, retryDelay]);

  const execute = useCallback(async (): Promise<T | null> => {
    // Check cache first
    if (state.data && state.lastUpdated) {
      const timeSinceUpdate = Date.now() - state.lastUpdated.getTime();
      if (timeSinceUpdate < cacheTime) {
        return state.data;
      }
    }
    
    return executeWithRetry();
  }, [state.data, state.lastUpdated, cacheTime, executeWithRetry]);

  const refresh = useCallback(async (): Promise<T | null> => {
    return executeWithRetry();
  }, [executeWithRetry]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    refresh,
    clearError
  };
}

// Hook for mutations (create, update, delete operations)
export function useServiceMutation<T, R>(
  serviceCall: (data: T) => Promise<R>
): {
  execute: (data: T) => Promise<R | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (data: T): Promise<R | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await serviceCall(data);
      
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : (err as Error)?.message || 'An error occurred';
      
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [serviceCall]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    clearError
  };
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
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (
    id: string, 
    data: Partial<T>, 
    optimisticData?: T
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // If optimistic data is provided, call onSuccess immediately
      if (optimisticData && onSuccess) {
        onSuccess(optimisticData);
      }
      
      const result = await updateService(id, data);
      
      setLoading(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : (err as Error)?.message || 'An error occurred';
      
      setError(errorMessage);
      setLoading(false);
      
      if (onError) {
        onError(errorMessage);
      }
      
      return null;
    }
  }, [updateService, onSuccess, onError]);

  return {
    execute,
    loading,
    error
  };
} 