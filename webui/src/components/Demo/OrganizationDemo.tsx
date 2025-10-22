import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/hooks/useOrganization';
import { ServerErrorDialog } from '@/components/ui/ServerErrorDialog';
import { RefreshCw, Building, Users, Phone, Mail } from 'lucide-react';

export function OrganizationDemo() {
  const {
    organization,
    loading,
    error,
    showErrorDialog,
    refresh,
    closeErrorDialog
  } = useOrganization();

  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Organization Service Demo</span>
            <Badge variant={loading ? "secondary" : "default"}>
              {loading ? "Loading..." : "Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Organization</span>
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive font-medium">Error:</p>
              <p className="text-sm text-destructive/80">{error.message}</p>
            </div>
          )}

          {organization && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Organization Details</span>
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {organization.name}</p>
                    <p><strong>ID:</strong> {organization.id}</p>
                    <p><strong>Domain:</strong> {organization.defaultDomain}</p>
                    {organization.customDomain && (
                      <p><strong>Custom Domain:</strong> {organization.customDomain}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center space-x-2">
                      <Phone className="h-3 w-3" />
                      <span>{organization.contactNo}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span>{organization.contactPerson}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This organization data is cached for 5 minutes. 
                  Multiple components calling the organization service will use the same cached data 
                  instead of making separate API calls.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Server Error Dialog */}
      <ServerErrorDialog
        isOpen={showErrorDialog}
        onClose={closeErrorDialog}
        onRetry={refresh}
        isLoading={loading}
        title="Organization Service Error"
        message={error?.message || 'Unable to load organization data. Please try again.'}
      />
    </div>
  );
} 