import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Organization } from '@/types';
import { LogIn } from 'lucide-react';
import { galleryService } from '@/services/ServiceFactory';

interface TopNavigationProps {
  organization: Organization;
}

export function TopNavigation({ organization }: TopNavigationProps) {
  const navigate = useNavigate();

  // Debug log to see organization data
  console.log('TopNavigation organization:', organization);
  console.log('Organization logo:', organization?.logo);

  // Function to get proper logo URL
  const getLogoUrl = (logo: string | undefined): string => {
    if (!logo) {
      return '/placeholder.svg';
    }

    // If it's already a full URL, use it directly
    if (logo.startsWith('http')) {
      return logo;
    }
    
    // If it's a photo ID, construct Unsplash URL
    if (logo.startsWith('photo-')) {
      return `https://images.unsplash.com/${logo}?auto=format&fit=crop&w=100&q=80`;
    }
    
    // If it's a gallery image ID, try to resolve it
    try {
      const resolvedUrl = galleryService.getImageUrl(logo);
      console.log('Resolved logo URL:', resolvedUrl); // Debug log
      return resolvedUrl || '/placeholder.svg';
    } catch (error) {
      console.warn('Failed to resolve logo URL:', error);
      return '/placeholder.svg';
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (!organization) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center h-16 pl-2 pr-2">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Organization</h1>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogin}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="flex justify-between items-center h-16 pl-2 pr-2">
        <div className="flex items-center">
          <img
            src={getLogoUrl(organization?.logo)}
            alt={organization?.name || 'Organization Logo'}
            className="h-8 w-8 mr-3 ml-0 object-cover rounded border border-gray-200"
            onError={(e) => {
              console.error('Logo failed to load:', e.target.src);
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
            onLoad={() => {
              console.log('Logo loaded successfully:', organization?.logo);
            }}
          />
          <h1 className="text-xl font-bold text-gray-900">{organization?.name}</h1>
        </div>
        {/* <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogin}
            className="flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </div> */}
      </div>
    </nav>
  );
}
