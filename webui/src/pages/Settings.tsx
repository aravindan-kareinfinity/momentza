import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, Settings as SettingsIcon, Building, Users, CreditCard, Package, Tag, FileText } from 'lucide-react';
import { authService, billingService, servicesService, settingsService, organizationService, galleryService } from '@/services/ServiceFactory';
import { useServiceMutation } from '@/hooks/useService';
import { useOrganization } from '@/hooks/useOrganization';
import { BillingSettings, ServiceItem, MasterDataItem } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  
  // Get current user and organization using service hooks
  const {
    organization,
    loading: orgLoading,
    error: orgError,
    refresh: refreshOrganization
  } = useOrganization();

  // State for all data
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [billingData, setBillingData] = useState<BillingSettings | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [eventTypes, setEventTypes] = useState<MasterDataItem[]>([]);
  const [imageCategories, setImageCategories] = useState<MasterDataItem[]>([]);
  const [employees, setEmployees] = useState<MasterDataItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<MasterDataItem[]>([]);
  const [ticketCategories, setTicketCategories] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current user
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        
        // Fetch all data in parallel
        const [
          billingSettings,
          servicesData,
          eventTypesData,
          imageCategoriesData,
          employeesData,
          inventoryItemsData,
          ticketCategoriesData
        ] = await Promise.all([
          billingService.getBillingSettings(),
          servicesService.getAllServices(),
          settingsService.getEventTypes(),
          settingsService.getImageCategories(),
          settingsService.getEmployees(),
          settingsService.getInventoryItems(),
          settingsService.getTicketCategories()
        ]);
        setBillingData(billingSettings);
        setServices(Array.isArray(servicesData) ? servicesData : []);
        setEventTypes(Array.isArray(eventTypesData) ? eventTypesData : []);
        setImageCategories(Array.isArray(imageCategoriesData) ? imageCategoriesData : []);
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
        setInventoryItems(Array.isArray(inventoryItemsData) ? inventoryItemsData : []);
        setTicketCategories(Array.isArray(ticketCategoriesData) ? ticketCategoriesData : []);
      } catch (err) {
        console.error('Failed to load settings data:', err);
        setError('Failed to load settings data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Local state for form data
  const [organizationData, setOrganizationData] = useState({
    name: 'dhinesh',
    contactPerson: 'Raja',
    contactNo: '9865741237',
    address: 'cuddalore Dist',
    about: 'Mandabam.Com',
    defaultDomain: 'www.local.com',
    customDomain: 'www.local.com'
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [billingFormData, setBillingFormData] = useState<BillingSettings>({
    companyName: '',
    gstNumber: '',
    address: '',
    taxPercentage: 18,
    hsnNumber: '',
    bankAccount: '',
    ifscNumber: '',
    bankName: ''
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (organization) {
      console.log('Organization data loaded:', organization);
      console.log('Organization logo:', organization.logo);
      
      setOrganizationData({
        name: organization.name,
        contactPerson: organization.contactPerson,
        contactNo: organization.contactNo,
        address: organization.address, // Not available in Organization type
        about: organization.about, // Not available in Organization type
        defaultDomain: organization.defaultDomain,
        customDomain: organization.customDomain || ''
      });
      
      // Set logo preview if organization has a logo
      if (organization.logo) {
        console.log('Setting logo preview for:', organization.logo);
        // If it's a full URL, use it directly
        if (organization.logo.startsWith('http')) {
          console.log('Using logo as direct URL:', organization.logo);
          setLogoPreview(organization.logo);
        } else {
          // If it's a gallery image ID, get the image URL
          try {
            const logoUrl = galleryService.getImageUrl(organization.logo);
            console.log('Generated logo URL:', logoUrl);
            setLogoPreview(logoUrl);
          } catch (error) {
            console.warn('Failed to get logo URL:', error);
            setLogoPreview(organization.logo); // Fallback to ID
          }
        }
      } else {
        console.log('No logo found in organization data');
        setLogoPreview(null);
      }
    }
  }, [organization]);

  useEffect(() => {
    if (billingData) {
      setBillingFormData(billingData);
    }
  }, [billingData]);

  // Mutation hooks
  const updateOrganizationMutation = useServiceMutation(
    (data: any) => Promise.resolve(organizationService.updateOrganization(organization?.id || '', data))
  );

  const updateBillingMutation = useServiceMutation(
    (data: BillingSettings) => Promise.resolve(billingService.updateBillingSettings(data))
  );

  const createServiceMutation = useServiceMutation(
    (data: Omit<ServiceItem, 'id'>) => Promise.resolve(servicesService.createService(data))
  );

  const updateServiceMutation = useServiceMutation(
    (data: { id: string; service: Omit<ServiceItem, 'id'> }) => 
      Promise.resolve(servicesService.updateService(data.id, data.service))
  );

  const updateServiceStatusMutation = useServiceMutation(
    (data: { id: string; updates: Partial<ServiceItem> }) => 
      Promise.resolve(servicesService.updateService(data.id, data.updates))
  );

  const deleteServiceMutation = useServiceMutation(
    (id: string) => Promise.resolve(servicesService.deleteService(id))
  );

  const addMasterDataMutation = useServiceMutation(
    (data: { type: string; name: string; charge?: number }) => 
      Promise.resolve(settingsService.addMasterData(data.type as any, data.name, data.charge || 0))
  );

  const deleteMasterDataMutation = useServiceMutation(
    (data: { type: string; id: string }) => 
      Promise.resolve(settingsService.deleteMasterData(data.type as any, data.id))
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [currentMasterType, setCurrentMasterType] = useState<'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories'>('eventTypes');
  const [newItem, setNewItem] = useState({ name: '', charge: 0 });
  const [newService, setNewService] = useState<Omit<ServiceItem, 'id'>>({
    name: '',
    hsnCode: '',
    taxPercentage: 18,
    basePrice: 0,
    isActive: true
  });
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !organization) return;
    
    try {
      setUploadingLogo(true);
      const uploadedImage = await galleryService.uploadImage(
        logoFile, 
        organization.id, 
        `${organization.name} Logo`, 
        'Logo'
      );
      
      console.log('Uploaded image:', uploadedImage);
      console.log('Updating organization with logo ID:', uploadedImage.id);
      
      // Update organization with the new logo ID - include all required fields
      const updateData = {
        name: organization.name,
        contactPerson: organization.contactPerson,
        contactNo: organization.contactNo,
        defaultDomain: organization.defaultDomain,
        customDomain: organization.customDomain,
        logo: uploadedImage.id,
        theme: organization.theme
      };
      
      console.log('Sending update data:', updateData);
      const res = await updateOrganizationMutation.execute(updateData as any);
      if (!res) {
        toast({ title: 'Error', description: 'Failed to update organization with logo', variant: 'destructive' });
      } else {
        await refreshOrganization();
        toast({ title: 'Success', description: 'Logo uploaded successfully' });
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!organization?.id) {
      toast({ title: 'Error', description: 'No organization available to update', variant: 'destructive' });
      return;
    }

    try {
      // Include logo in the update if it exists
      const updateData = {
        ...organizationData,
        logo: organization.logo // Include current logo
      };

      console.log('Sending organization update:', updateData);
      const res = await updateOrganizationMutation.execute(updateData as any);
      if (!res) {
        toast({ title: 'Error', description: 'Failed to save organization', variant: 'destructive' });
        return;
      }

      // Refresh and update UI
      await refreshOrganization();
      // Reflect saved data in local form state
      setOrganizationData(prev => ({ ...prev, name: res.name || prev.name, contactPerson: res.contactPerson || prev.contactPerson, contactNo: res.contactNo || prev.contactNo, defaultDomain: res.defaultDomain || prev.defaultDomain, customDomain: res.customDomain || prev.customDomain }));

      toast({ title: 'Success', description: 'Organization updated successfully' });
      console.log('Organization updated:', res);
    } catch (err) {
      console.error('Error saving organization:', err);
      toast({ title: 'Error', description: 'Failed to save organization', variant: 'destructive' });
    }
  };

  const handleSaveBilling = async () => {
    await updateBillingMutation.execute(billingFormData);
    // Refresh billing data
    try {
      const updatedBilling = await billingService.getBillingSettings();
      setBillingData(updatedBilling);
    } catch (err) {
      console.error('Failed to refresh billing data:', err);
    }
    console.log('Billing settings updated:', billingFormData);
  };

  const handleAddService = async () => {
    if (!organization?.id) {
      toast({ title: 'Error', description: 'No organization available', variant: 'destructive' });
      return;
    }
    try {
      if (editingService) {
        // Update with full entity
        const updatedService = {
          ...editingService,
          ...newService,
          organizationId: organization.id
        };
        await updateServiceMutation.execute({
          id: editingService.id,
          service: updatedService
        });
        toast({ title: 'Success', description: 'Service updated successfully' });
        setEditingService(null);
      } else {
        const serviceToCreate = {
          ...newService,
          organizationId: organization.id,
          isActive: newService.isActive ?? true
        };
        await createServiceMutation.execute(serviceToCreate);
        toast({ title: 'Success', description: 'Service added successfully' });
      }
      // Refresh services data
      try {
        const updatedServices = await servicesService.getAllServices();
        setServices(updatedServices || []);
        console.log('Refreshed services:', updatedServices);
      } catch (err) {
        console.error('Failed to refresh services data:', err);
        toast({ title: 'Warning', description: 'Service saved but failed to refresh list', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Failed to save service:', err);
      toast({ title: 'Error', description: 'Failed to save service', variant: 'destructive' });
    }
    setNewService({ name: '', hsnCode: '', taxPercentage: 18, basePrice: 0, isActive: true });
    setShowServiceDialog(false);
  };

  const handleToggleServiceStatus = async (id: string, isActive: boolean) => {
    try {
      await updateServiceStatusMutation.execute({
        id,
        updates: { isActive }
      });
      toast({ title: 'Success', description: `Service ${isActive ? 'activated' : 'deactivated'} successfully` });
      // Refresh services data
      const updatedServices = await servicesService.getAllServices();
      setServices(updatedServices || []);
    } catch (err) {
      console.error('Failed to update service status:', err);
      toast({ title: 'Error', description: 'Failed to update service status', variant: 'destructive' });
    }
  };

  const handleEditService = (service: ServiceItem) => {
    setNewService({
      name: service.name,
      hsnCode: service.hsnCode,
      taxPercentage: service.taxPercentage,
      basePrice: service.basePrice,
      isActive: service.isActive ?? true
    });
    setEditingService(service);
    setShowServiceDialog(true);
  };

  const handleDeleteService = async (id: string) => {
    await deleteServiceMutation.execute(id);
    // Refresh services data
    try {
      const updatedServices = await servicesService.getAllServices();
      setServices(updatedServices || []);
    } catch (err) {
      console.error('Failed to refresh services data:', err);
    }
  };

  const handleAddItem = async () => {
    await addMasterDataMutation.execute({
      type: currentMasterType,
      name: newItem.name,
      charge: newItem.charge
    });
    
    // Refresh the specific master data
    try {
      const refreshData = async () => {
        switch (currentMasterType) {
          case 'eventTypes':
            const eventTypesData = await settingsService.getEventTypes();
            setEventTypes(eventTypesData || []);
            break;
          case 'imageCategories':
            const imageCategoriesData = await settingsService.getImageCategories();
            setImageCategories(imageCategoriesData || []);
            break;
          case 'employees':
            const employeesData = await settingsService.getEmployees();
            setEmployees(employeesData || []);
            break;
          case 'inventoryItems':
            const inventoryItemsData = await settingsService.getInventoryItems();
            setInventoryItems(inventoryItemsData || []);
            break;
          case 'ticketCategories':
            const ticketCategoriesData = await settingsService.getTicketCategories();
            setTicketCategories(ticketCategoriesData || []);
            break;
        }
      };
      await refreshData();
    } catch (err) {
      console.error('Failed to refresh master data:', err);
    }
    
    setNewItem({ name: '', charge: 0 });
    setShowAddDialog(false);
  };

  const handleDeleteItem = async (id: string, type: string) => {
    await deleteMasterDataMutation.execute({ type, id });
    
    // Refresh the specific master data
    try {
      const refreshData = async () => {
        switch (type) {
          case 'eventTypes':
            const eventTypesData = await settingsService.getEventTypes();
            setEventTypes(eventTypesData || []);
            break;
          case 'imageCategories':
            const imageCategoriesData = await settingsService.getImageCategories();
            setImageCategories(imageCategoriesData || []);
            break;
          case 'employees':
            const employeesData = await settingsService.getEmployees();
            setEmployees(employeesData || []);
            break;
          case 'inventoryItems':
            const inventoryItemsData = await settingsService.getInventoryItems();
            setInventoryItems(inventoryItemsData || []);
            break;
          case 'ticketCategories':
            const ticketCategoriesData = await settingsService.getTicketCategories();
            setTicketCategories(ticketCategoriesData || []);
            break;
        }
      };
      await refreshData();
    } catch (err) {
      console.error('Failed to refresh master data:', err);
    }
  };

  const openAddDialog = (type: 'eventTypes' | 'imageCategories' | 'employees' | 'inventoryItems' | 'ticketCategories') => {
    setCurrentMasterType(type);
    setShowAddDialog(true);
  };

  const openAddServiceDialog = () => {
    setEditingService(null);
    setNewService({ name: '', hsnCode: '', taxPercentage: 18, basePrice: 0, isActive: true });
    setShowServiceDialog(true);
  };

  // Ensure arrays are always arrays
  const safeServices = Array.isArray(services) ? services : [];
  const safeEventTypes = Array.isArray(eventTypes) ? eventTypes : [];
  const safeImageCategories = Array.isArray(imageCategories) ? imageCategories : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeInventoryItems = Array.isArray(inventoryItems) ? inventoryItems : [];
  const safeTicketCategories = Array.isArray(ticketCategories) ? ticketCategories : [];

  // Loading state
  if (orgLoading || loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (orgError || error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading settings
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{String(orgError || error || 'An error occurred')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const MasterDataCard = ({ title, items, type }: { title: string, items: MasterDataItem[], type: string }) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button size="sm" onClick={() => openAddDialog(type as any)}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <span className="font-medium">{item.name}</span>
                {item.charge && <span className="text-sm text-gray-600 ml-2">₹{item.charge}</span>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteItem(item.id, type)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage organization settings and master data</p>
      </div>

      <Tabs defaultValue="organization" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="eventTypes">Event Types</TabsTrigger>
          <TabsTrigger value="imageCategories">Image Categories</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="ticketCategories">Ticket Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={organizationData.name}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={organizationData.contactPerson}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contactNo">Contact Number</Label>
                  <Input
                    id="contactNo"
                    value={organizationData.contactNo}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, contactNo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={organizationData.address}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  value={organizationData.about}
                  onChange={(e) => setOrganizationData(prev => ({ ...prev, about: e.target.value }))}
                  placeholder="Tell us about your organization"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultDomain">Default Domain</Label>
                  <Input
                    id="defaultDomain"
                    value={organizationData.defaultDomain}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, defaultDomain: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input
                    id="customDomain"
                    value={organizationData.customDomain}
                    onChange={(e) => setOrganizationData(prev => ({ ...prev, customDomain: e.target.value }))}
                    placeholder="yourdomain.com"
                  />
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-4">
                <Label>Organization Logo</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-16 w-16 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          console.error('Logo preview failed to load:', logoPreview);
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                        onLoad={() => {
                          console.log('Logo preview loaded successfully:', logoPreview);
                        }}
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                        <Building className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a logo for your organization (PNG, JPG, GIF up to 5MB)
                    </p>
                  </div>
                  {logoFile && (
                    <Button
                      onClick={handleUploadLogo}
                      disabled={uploadingLogo}
                      size="sm"
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </Button>
                  )}
                </div>
              </div>

              <Button onClick={handleSaveOrganization} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Organization Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={billingFormData.companyName}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={billingFormData.gstNumber}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, gstNumber: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="billingAddress">Address</Label>
                  <Textarea
                    id="billingAddress"
                    value={billingFormData.address}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="taxPercentage">Tax Percentage</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    value={billingFormData.taxPercentage}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, taxPercentage: parseFloat(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hsnNumber">HSN Number</Label>
                  <Input
                    id="hsnNumber"
                    value={billingFormData.hsnNumber}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, hsnNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bankAccount">Bank Account</Label>
                  <Input
                    id="bankAccount"
                    value={billingFormData.bankAccount}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ifscNumber">IFSC Number</Label>
                  <Input
                    id="ifscNumber"
                    value={billingFormData.ifscNumber}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, ifscNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={billingFormData.bankName}
                    onChange={(e) => setBillingFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleSaveBilling} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Billing Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Services Management</CardTitle>
                <Button onClick={openAddServiceDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {safeServices?.map((service) => (
                  <div key={service.id} className="flex justify-between items-center p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{service.name}</div>
                        
                      </div>
                      <div className="text-sm text-gray-600">
                        HSN: {service.hsnCode} | Tax: {service.taxPercentage}% | Price: ₹{service.basePrice}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventTypes" className="space-y-4">
          <MasterDataCard title="Event Types" items={safeEventTypes || []} type="eventTypes" />
        </TabsContent>

        <TabsContent value="imageCategories" className="space-y-4">
          <MasterDataCard title="Image Categories" items={safeImageCategories || []} type="imageCategories" />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <MasterDataCard title="Employees" items={safeEmployees || []} type="employees" />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <MasterDataCard title="Inventory Items" items={safeInventoryItems || []} type="inventoryItems" />
        </TabsContent>

        <TabsContent value="ticketCategories" className="space-y-4">
          <MasterDataCard title="Ticket Categories" items={safeTicketCategories || []} type="ticketCategories" />
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <div />
          </DialogHeader>
          <DialogDescription>
            Create a new master data item. This will be available in the related dropdowns.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemName">Name</Label>
              <Input
                id="itemName"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
              />
            </div>
            {currentMasterType === 'inventoryItems' && (
              <div>
                <Label htmlFor="itemCharge">Rental Charge</Label>
                <Input
                  id="itemCharge"
                  type="number"
                  value={newItem.charge}
                  onChange={(e) => setNewItem(prev => ({ ...prev, charge: parseInt(e.target.value) }))}
                  placeholder="Enter rental charge"
                />
              </div>
            )}
            <Button onClick={handleAddItem} className="w-full">
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <div />
          </DialogHeader>
          <DialogDescription>
            Provide details for the service. These values are used for billing and invoices.
          </DialogDescription>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                value={newService.name}
                onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter service name"
              />
            </div>
            <div>
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                value={newService.hsnCode}
                onChange={(e) => setNewService(prev => ({ ...prev, hsnCode: e.target.value }))}
                placeholder="Enter HSN code"
              />
            </div>
            <div>
              <Label htmlFor="taxPercentage">Tax Percentage</Label>
              <Input
                id="taxPercentage"
                type="number"
                value={newService.taxPercentage}
                onChange={(e) => setNewService(prev => ({ ...prev, taxPercentage: parseFloat(e.target.value) }))}
                placeholder="Enter tax percentage"
              />
            </div>
            <div>
              <Label htmlFor="basePrice">Base Price</Label>
              <Input
                id="basePrice"
                type="number"
                value={newService.basePrice}
                onChange={(e) => setNewService(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                placeholder="Enter base price"
              />
            </div>
            
            <Button onClick={handleAddService} className="w-full">
              {editingService ? 'Update Service' : 'Add Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
