import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MapPin, Search, Navigation, Check, Globe, X, AlertCircle, Map, Target, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onLocationSelect: (location: {
    address: string;
    location: string;
    coordinates?: { lat: number; lng: number };
    placeId?: string;
  }) => void;
  initialAddress?: string;
  initialLocation?: string;
  buttonText?: string;
}

export function LocationPicker({ 
  onLocationSelect, 
  initialAddress = '', 
  initialLocation = '',
  buttonText = "Select Location" 
}: LocationPickerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(initialAddress);
  const [location, setLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('search');
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [isValidCoords, setIsValidCoords] = useState<boolean>(false);
  const [isVerifyingCoords, setIsVerifyingCoords] = useState<boolean>(false);

  // Validate coordinates format
  const validateCoordinates = (lat: string, lng: string): boolean => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) return false;
    if (latNum < -90 || latNum > 90) return false;
    if (lngNum < -180 || lngNum > 180) return false;
    
    return true;
  };

  // Handle manual coordinate entry
  const handleManualCoordinates = async () => {
    if (!validateCoordinates(manualLat, manualLng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude (-90 to 90) and longitude (-180 to 180)",
        variant: "destructive"
      });
      return;
    }

    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    setIsVerifyingCoords(true);
    
    try {
      // Try to get address from coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.display_name) {
          setAddress(data.display_name);
          
          // Extract city/town name
          const cityName = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.state || 
                          data.address?.country ||
                          `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          
          setLocation(cityName);
          setSelectedPlace({
            lat: lat,
            lng: lng,
            display_name: data.display_name,
            address: data.address || {}
          });
          
          toast({
            title: "Location Found",
            description: "Address retrieved from coordinates successfully!",
          });
        } else {
          // If no address found, use coordinates as display
          const coordAddress = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
          setAddress(coordAddress);
          setLocation(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setSelectedPlace({
            lat: lat,
            lng: lng,
            display_name: coordAddress,
            address: {}
          });
          
          toast({
            title: "Coordinates Saved",
            description: "Coordinates saved successfully. You can edit the address if needed.",
          });
        }
      }
    } catch (error) {
      console.error('Error verifying coordinates:', error);
      
      // Even if reverse geocoding fails, save the coordinates
      const coordAddress = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
      setAddress(coordAddress);
      setLocation(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      setSelectedPlace({
        lat: lat,
        lng: lng,
        display_name: coordAddress,
        address: {}
      });
      
      toast({
        title: "Coordinates Saved",
        description: "Coordinates saved. Address lookup failed, but you can edit it manually.",
      });
    } finally {
      setIsVerifyingCoords(false);
    }
  };

  // Update coordinate validation
  useEffect(() => {
    setIsValidCoords(validateCoordinates(manualLat, manualLng));
  }, [manualLat, manualLng]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location detection. Please enter coordinates manually.",
        variant: "destructive"
      });
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Set manual coordinates
          setManualLat(latitude.toString());
          setManualLng(longitude.toString());
          
          // Switch to manual tab
          setActiveTab('manual');
          
          // Try to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.display_name) {
              setAddress(data.display_name);
              
              const cityName = data.address?.city || 
                              data.address?.town || 
                              data.address?.village || 
                              data.address?.state || 
                              `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
              
              setLocation(cityName);
              setSelectedPlace({
                lat: latitude,
                lng: longitude,
                display_name: data.display_name,
                address: data.address || {}
              });
            } else {
              const coordAddress = `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`;
              setAddress(coordAddress);
              setLocation(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
              setSelectedPlace({
                lat: latitude,
                lng: longitude,
                display_name: coordAddress,
                address: {}
              });
            }
          }
          
          toast({
            title: "Location Detected",
            description: "Your current coordinates have been filled in automatically.",
          });
        } catch (error) {
          console.error('Error processing location:', error);
          toast({
            title: "Partial Success",
            description: "Got coordinates but couldn't get address details.",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "Location Error",
          description: "Could not get your location. Please enter coordinates manually.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        toast({
          title: "No Results",
          description: "No locations found. Try searching with different terms or enter coordinates manually.",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to search locations. Please try coordinates entry instead.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (place: any) => {
    const addr = place.display_name;
    const loc = place.address.city || place.address.town || place.address.village || 
                place.address.state || place.address.country || 'Selected Location';
    
    setAddress(addr);
    setLocation(loc);
    setSelectedPlace(place);
    setSearchResults([]);
    setSearchQuery('');
    
    // Also set coordinates if available
    if (place.lat && place.lon) {
      setManualLat(place.lat);
      setManualLng(place.lon);
    }
  };

  const handleConfirm = () => {
    if (!address.trim() || !location.trim()) {
      toast({
        title: "Incomplete Information",
        description: "Please provide both location name and address",
        variant: "destructive"
      });
      return;
    }

    // Always use manual coordinates if entered, otherwise use selected place
    let coordinates;
    if (isValidCoords) {
      coordinates = {
        lat: parseFloat(manualLat),
        lng: parseFloat(manualLng)
      };
    } else if (selectedPlace) {
      coordinates = {
        lat: parseFloat(selectedPlace.lat),
        lng: parseFloat(selectedPlace.lon)
      };
    }

    onLocationSelect({
      address,
      location,
      coordinates,
      placeId: selectedPlace?.place_id
    });
    
    setOpen(false);
    toast({
      title: "Location Saved",
      description: "Location information has been saved successfully",
    });
  };

  const resetLocation = () => {
    setAddress('');
    setLocation('');
    setSelectedPlace(null);
    setSearchQuery('');
    setSearchResults([]);
    setManualLat('');
    setManualLng('');
    setIsValidCoords(false);
  };

  // Example coordinates for popular Indian cities
  const exampleCoordinates = [
    { name: "Mumbai", lat: "19.0760", lng: "72.8777" },
    { name: "Delhi", lat: "28.7041", lng: "77.1025" },
    { name: "Bangalore", lat: "12.9716", lng: "77.5946" },
    { name: "Chennai", lat: "13.0827", lng: "80.2707" },
    { name: "Kolkata", lat: "22.5726", lng: "88.3639" },
    { name: "Hyderabad", lat: "17.3850", lng: "78.4867" },
    { name: "Pune", lat: "18.5204", lng: "73.8567" },
  ];

  const setExampleCoordinates = (example: { name: string; lat: string; lng: string }) => {
    setManualLat(example.lat);
    setManualLng(example.lng);
    setActiveTab('manual');
    toast({
      title: "Example Loaded",
      description: `${example.name} coordinates loaded. Click "Verify Coordinates" to get address.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <MapPin className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Set Hall Location
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Globe className="h-4 w-4 mr-2" />
              Coordinates
            </TabsTrigger>
            {/* <TabsTrigger value="current">
              <Navigation className="h-4 w-4 mr-2" />
              Current
            </TabsTrigger> */}
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Search by Address or Place Name</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search city, landmark, address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                  />
                  <Button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label className="text-sm">Search Results:</Label>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                      {searchResults.map((place, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleSelectResult(place)}
                        >
                          <p className="font-medium text-sm">{place.display_name}</p>
                          <p className="text-xs text-gray-500">
                            {place.address?.city || place.address?.town || place.address?.village || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Coordinates: {parseFloat(place.lat).toFixed(4)}, {parseFloat(place.lon).toFixed(4)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Coordinates Tab */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4" />
                    Enter Coordinates Manually
                  </Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm">
                        Latitude *
                        <span className="text-gray-500 ml-1">(-90 to 90)</span>
                      </Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        placeholder="e.g., 19.0760"
                        className={isValidCoords && manualLat ? 'border-green-500' : ''}
                      />
                      <p className="text-xs text-gray-500">
                        Example: 19.0760 (Mumbai)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm">
                        Longitude *
                        <span className="text-gray-500 ml-1">(-180 to 180)</span>
                      </Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        placeholder="e.g., 72.8777"
                        className={isValidCoords && manualLng ? 'border-green-500' : ''}
                      />
                      <p className="text-xs text-gray-500">
                        Example: 72.8777 (Mumbai)
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={handleManualCoordinates}
                      disabled={!isValidCoords || isVerifyingCoords}
                      className="w-full"
                      variant="default"
                    >
                      {isVerifyingCoords ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying Coordinates...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Verify Coordinates & Get Address
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick Examples */}
                <div>
                  <Label className="text-sm mb-2">Quick Examples (Indian Cities):</Label>
                  <div className="flex flex-wrap gap-2">
                    {exampleCoordinates.map((example, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setExampleCoordinates(example)}
                        className="text-xs"
                      >
                        {example.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Coordinate Validation Status */}
                {manualLat && manualLng && (
                  <div className={`p-3 rounded-lg border ${
                    isValidCoords ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isValidCoords ? (
                        <>
                          <Check className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">Valid Coordinates</p>
                            <p className="text-sm text-green-700">
                              Latitude: {manualLat}, Longitude: {manualLng}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-800">Invalid Coordinates</p>
                            <p className="text-sm text-red-700">
                              Please enter valid latitude (-90 to 90) and longitude (-180 to 180)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Current Location Tab */}
          <TabsContent value="current" className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Use Your Current Location
                  </Label>
                  <Button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full"
                    variant="default"
                    size="lg"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Detecting Your Location...
                      </>
                    ) : (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Get My Current Location
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500">
                    This will use your device's GPS to detect your exact location and fill in the coordinates.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-800">
                        Location Permission Required
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Your browser will ask for location permission</li>
                        <li>• Enable location/GPS on your device for best results</li>
                        <li>• If this fails, use the Coordinates tab to enter manually</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs> 
          

        {/* Location Details Section */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Location Details</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetLocation}
                className="h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div>
              <Label htmlFor="location-name" className="text-sm">
                City/Location Name *
              </Label>
              <Input
                id="location-name"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Mumbai, Delhi City Center, Bangalore"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="address-input" className="text-sm">
                Full Address *
              </Label>
              <Textarea
                id="address-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete address for visitors..."
                rows={3}
                className="mt-1"
                required
              />
            </div>

            {/* Selected Location Preview */}
            {(selectedPlace || (manualLat && manualLng)) && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Location Ready ✓</p>
                    {address && (
                      <p className="text-sm text-green-700 mt-1">{address}</p>
                    )}
                    <div className="text-xs text-green-600 mt-2 grid grid-cols-2 gap-2">
                      {manualLat && manualLng ? (
                        <>
                          <div>
                            <span className="font-medium">Latitude:</span> {manualLat}
                          </div>
                          <div>
                            <span className="font-medium">Longitude:</span> {manualLng}
                          </div>
                        </>
                      ) : selectedPlace?.lat && selectedPlace?.lon ? (
                        <>
                          <div>
                            <span className="font-medium">Latitude:</span> {parseFloat(selectedPlace.lat).toFixed(6)}
                          </div>
                          <div>
                            <span className="font-medium">Longitude:</span> {parseFloat(selectedPlace.lon).toFixed(6)}
                          </div>
                        </>
                      ) : null}
                    </div>
                    {location && (
                      <p className="text-xs text-green-600 mt-1">
                        Location: {location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded space-y-1">
          <p className="font-medium">📍 Location Entry Options:</p>
          <ul className="space-y-1">
            <li>• <strong>Search:</strong> Find by city, landmark, or address</li>
            <li>• <strong>Coordinates:</strong> Enter exact latitude & longitude</li>
            <li>• <strong>Current:</strong> Use your device's GPS location</li>
            <li>• <strong>Pro tip:</strong> Use Google Maps to get exact coordinates of any location</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-gray-500">
            {selectedPlace || (manualLat && manualLng) ? "✓ Location data complete" : "Enter location details"}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!address.trim() || !location.trim()}
              className="min-w-[120px]"
            >
              <Check className="h-4 w-4 mr-2" />
              Save Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}