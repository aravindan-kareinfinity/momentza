import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { organizationService } from '@/services/ServiceFactory';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { Building, Phone, Mail, MapPin, Clock, Star, Users, Calendar } from 'lucide-react';
import { Organization } from '@/types';

export function Footer() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const fetchOrganization = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useOrganization] Fetching organization data...');
      const org = await organizationService.getCurrentOrganization();
      setOrganization(org);
      setShowErrorDialog(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []); // Empty dependency array means this runs only once when the component mounts

  const handleRetry = async () => {
    await fetchOrganization(true);
  };

  const handleCloseErrorDialog = () => {
    setShowErrorDialog(false);
  };

  // Loading state
  if (loading) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 bg-gray-700 rounded w-full"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Error state
  if (error || !organization) {
    return (
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p>&copy; 2024 Wedding Hall Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <>
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <h3 className="text-xl font-bold mb-4">{organization.name}</h3>
              <p className="text-gray-300 mb-4">
                Creating unforgettable moments for your special day with our beautiful wedding halls and exceptional service.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#halls" className="text-gray-300 hover:text-white transition-colors">Our Halls</a></li>
                <li><a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#gallery" className="text-gray-300 hover:text-white transition-colors">Gallery</a></li>
                <li><a href="#reviews" className="text-gray-300 hover:text-white transition-colors">Reviews</a></li>
                <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Our Services</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-300">
                  <Building className="h-4 w-4 mr-2" />
                  Wedding Halls
                </li>
                <li className="flex items-center text-gray-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  Event Planning
                </li>
                <li className="flex items-center text-gray-300">
                  <Users className="h-4 w-4 mr-2" />
                  Catering Services
                </li>
                <li className="flex items-center text-gray-300">
                  <Star className="h-4 w-4 mr-2" />
                  Premium Amenities
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{organization.contactNo}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{organization.contactPerson}@example.com</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>123 Wedding Street, City</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Mon-Sat: 9AM-6PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              &copy; 2024 {organization.name}. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </footer>

      {/* Server Error Dialog */}
      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetry}
        isLoading={loading}
        title="Organization Service Error"
        message={error?.message || 'Unable to load organization data. Please try again.'}
      />
    </>
  );
}
