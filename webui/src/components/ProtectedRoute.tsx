import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '@/services/ServiceFactory';
import { shouldUseMockData } from '@/config/environment';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        let authenticated: boolean;
        
        if (shouldUseMockData() && authService.isAuthenticatedSync) {
          // Use synchronous method in mock mode for better performance
          authenticated = authService.isAuthenticatedSync();
        } else {
          // Use async method for API mode
          authenticated = await authService.isAuthenticated();
        }
        
        setIsAuthenticated(authenticated);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
