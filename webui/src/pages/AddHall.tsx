import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2, MapPin } from 'lucide-react';
import { hallService, galleryService, authService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { HallFeature } from '@/types';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';
import { LocationPicker } from '@/components/Home/LocationPicker';

const AddHall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [diningCapacity, setDiningCapacity] = useState('');
  const [parkingCapacity, setParkingCapacity] = useState('');
  const [foodType, setFoodType] = useState<'veg' | 'non-veg' | 'both'>('both');
  const [freeRooms, setFreeRooms] = useState('');
  const [rentedAcRooms, setRentedAcRooms] = useState('');
  const [rentedNonAcRooms, setRentedNonAcRooms] = useState('');
  const [acRoomRate, setAcRoomRate] = useState(''); // Add AC room rate
  const [nonAcRoomRate, setNonAcRoomRate] = useState(''); // Add Non-AC room rate
  const [hasGenerator, setHasGenerator] = useState(false);
  const [hasAirConditioning, setHasAirConditioning] = useState(false);
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');

  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [features, setFeatures] = useState<HallFeature[]>([]);
  const [morningRate, setMorningRate] = useState('');
  const [eveningRate, setEveningRate] = useState('');
  const [fullDayRate, setFullDayRate] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: '', charge: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);

  // Fetch user and gallery data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);

        if (user?.organizationId) {
          const images = await galleryService.getImagesByOrganization(user.organizationId);
          setGalleryImages(Array.isArray(images) ? images : []);
        }
      } catch (error) {
        console.error('Failed to fetch user or gallery data:', error);
      }
    };
    fetchData();
  }, []);

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setRules(prev => [...prev, newRule.trim()]);
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFeature = () => {
    if (newFeature.name && newFeature.charge) {
      setFeatures([...features, { name: newFeature.name, charge: parseInt(newFeature.charge) }]);
      setNewFeature({ name: '', charge: '' });
    }
  };

  const getImageIdentifier = (image: any) => {
    return image.url || image.id;
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleImageToggle = (imageUrl: string) => {
    setSelectedImages(prev =>
      prev.includes(imageUrl)
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const handleLocationSelect = (locationData: {
    address: string;
    location: string;
    coordinates?: { lat: number; lng: number };
  }) => {
    setAddress(locationData.address);
    setLocation(locationData.location);
    if (locationData.coordinates) {
      setCoordinates(locationData.coordinates);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    setLoading(true);

    try {
      const newHall = {
        organizationId: currentUser.organizationId,
        name,
        location,
        address,
        amenities: {
          foodType,
          capacity: {
            hall: parseInt(capacity),
            dining: parseInt(diningCapacity),
            parking: parseInt(parkingCapacity),
          },
          rooms: {
            free: parseInt(freeRooms),
            rentedAc: parseInt(rentedAcRooms),
            rentedNonAc: parseInt(rentedNonAcRooms),
            acRoomRate: parseInt(acRoomRate) || 0,
            nonAcRoomRate: parseInt(nonAcRoomRate) || 0
          },
          facilities: {
            generator: hasGenerator,
            airConditioning: hasAirConditioning,
          },
          rules,
        },
        coordinates: coordinates,
        features,
        rateCard: {
          morningRate: parseInt(morningRate),
          eveningRate: parseInt(eveningRate),
          fullDayRate: parseInt(fullDayRate),
        },
        gallery: selectedImages,
        isActive,
      };

      await hallService.createHall(newHall);

      toast({
        title: 'Success',
        description: 'Hall created successfully!',
      });

      navigate('/admin/halls');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create hall',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/halls')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Halls
        </Button>
        <h1 className="text-2xl font-bold">Add New Hall</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hall Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Hall Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diningcapacity">Dining Capacity</Label>
                <Input
                  id="diningcapacity"
                  type="number"
                  value={diningCapacity}
                  onChange={(e) => setDiningCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parkingcapacity">Parking Capacity</Label>
                <Input
                  id="parkingcapacity"
                  type="number"
                  value={parkingCapacity}
                  onChange={(e) => setParkingCapacity(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Replace Location Field with LocationPicker */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Hall Location</Label>
                {coordinates && (
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    Coordinates: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                {/* Location Picker Button */}
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialAddress={address}
                  initialLocation={location}
                  buttonText="Select Location on Map"
                />

                {/* Display Selected Location */}
                {location && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-800">Selected Location:</p>
                    <p className="text-sm text-blue-700">{location}</p>
                    {address && (
                      <p className="text-xs text-blue-600 mt-1">{address}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* food availability */}
        <Card>
          <CardHeader>
            <CardTitle>Food Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="foodType"
                  value="veg"
                  checked={foodType === 'veg'}
                  onChange={() => setFoodType('veg')}
                />
                <span>Veg Only</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="foodType"
                  value="non-veg"
                  checked={foodType === 'non-veg'}
                  onChange={() => setFoodType('non-veg')}
                />
                <span>Non-Veg Only</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="foodType"
                  value="both"
                  checked={foodType === 'both'}
                  onChange={() => setFoodType('both')}
                />
                <span>Veg & Non-Veg</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Room availability */}
        <Card>
          <CardHeader>
            <CardTitle>Room Availability</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Room Counts with Rates */}
            <div className="grid grid-cols-2 gap-4">
              {/* Free Rooms - No Rate Field */}
              <div className="space-y-2">
                <Label htmlFor="freeRooms">Free Rooms</Label>
                <Input
                  id="freeRooms"
                  type="number"
                  min={0}
                  value={freeRooms}
                  onChange={(e) => setFreeRooms(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Empty column for alignment */}
              <div></div>

              {/* Rented AC Rooms with Rate */}
              <div className="space-y-2">
                <Label htmlFor="rentedAcRooms">Rented AC Rooms</Label>
                <div className="flex gap-2">
                  <Input
                    id="rentedAcRooms"
                    type="number"
                    min={0}
                    value={rentedAcRooms}
                    onChange={(e) => setRentedAcRooms(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <div className="w-32">
                    <Input
                      type="number"
                      min={0}
                      value={acRoomRate}
                      onChange={(e) => setAcRoomRate(e.target.value)}
                      placeholder="Rate"
                      disabled={!rentedAcRooms || parseInt(rentedAcRooms) === 0}
                    />
                    <p className="text-xs text-gray-500 mt-1">₹ per room</p>
                  </div>
                </div>
              </div>

              {/* Rented Non-AC Rooms with Rate */}
              <div className="space-y-2">
                <Label htmlFor="rentedNonAcRooms">Rented Non-AC Rooms</Label>
                <div className="flex gap-2">
                  <Input
                    id="rentedNonAcRooms"
                    type="number"
                    min={0}
                    value={rentedNonAcRooms}
                    onChange={(e) => setRentedNonAcRooms(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <div className="w-32">
                    <Input
                      type="number"
                      min={0}
                      value={nonAcRoomRate}
                      onChange={(e) => setNonAcRoomRate(e.target.value)}
                      placeholder="Rate"
                      disabled={!rentedNonAcRooms || parseInt(rentedNonAcRooms) === 0}
                    />
                    <p className="text-xs text-gray-500 mt-1">₹ per room</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* generator and air conditioner facility */}
        <Card>
          <CardHeader>
            <CardTitle>Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={hasGenerator}
                  onCheckedChange={setHasGenerator}
                />
                <Label>Generator Available</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  checked={hasAirConditioning}
                  onCheckedChange={setHasAirConditioning}
                />
                <Label>Air Conditioned</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rules/Terms and conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Hall Rules</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a rule (e.g. No alcohol allowed)"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
              />
              <Button type="button" onClick={handleAddRule}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {rules.length === 0 && (
                <p className="text-sm text-gray-500">No rules added</p>
              )}

              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm">{rule}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveRule(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Feature name"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
              />
              <Input
                placeholder="Additional charge (₹)"
                type="number"
                value={newFeature.charge}
                onChange={(e) => setNewFeature({ ...newFeature, charge: e.target.value })}
              />
              <Button type="button" onClick={handleAddFeature}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{feature.name} - ₹{feature.charge}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="morningRate">Morning Rate (₹)</Label>
                <Input
                  id="morningRate"
                  type="number"
                  value={morningRate}
                  onChange={(e) => setMorningRate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eveningRate">Evening Rate (₹)</Label>
                <Input
                  id="eveningRate"
                  type="number"
                  value={eveningRate}
                  onChange={(e) => setEveningRate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDayRate">Full Day Rate (₹)</Label>
                <Input
                  id="fullDayRate"
                  type="number"
                  value={fullDayRate}
                  onChange={(e) => setFullDayRate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gallery Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${selectedImages.includes(getImageIdentifier(image))
                    ? 'border-black-500 bg-green-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => handleImageToggle(getImageIdentifier(image))}
                >
                  <img
                    src={image.url ? `${image.url}?auto=format&fit=crop&w=200&q=80` : galleryService.getImageUrl(image.id)}
                    alt={image.title}
                    className={`w-full h-24 object-cover transition-all duration-200 ${selectedImages.includes(getImageIdentifier(image))
                      ? 'brightness-110 saturate-110'
                      : ''
                      }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  {selectedImages.includes(getImageIdentifier(image)) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Badge>
                        Selected
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                    {image.title}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/halls')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Hall'}
          </Button>
        </div>
      </form>
    </AnimatedPage>
  );
};

export default AddHall;