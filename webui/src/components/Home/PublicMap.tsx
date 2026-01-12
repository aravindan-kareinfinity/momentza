// components/Home/PublicMap.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { hallService } from '@/services/ServiceFactory'; // Add this import
import { useNavigate } from 'react-router-dom';


// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapConfig {
  width?: string;
  height?: string;
  mapType?: 'interactive' | 'static' | 'directions';
  zoomLevel?: number;
  showMarkers?: boolean;
  showDirections?: boolean;
  title?: string;
  description?: string;
  tileProvider?: 'openstreetmap' | 'cartodb' | 'esri' | 'mapbox';
  showAllHalls?: boolean;
  organizationId?: string;
}

interface Hall {
  id: string;
  name: string;
  location: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  capacity: number;
  rateCard?: {
    morningRate: number;
    eveningRate: number;
    fullDayRate: number;
  };
  isActive: boolean;
  organizationId?: string;
  features?: Array<{
    name: string;
    charge: number;
  }>;
  gallery?: string[];
}

interface PublicMapProps {
  organization?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    contactNumber?: string;
    email?: string;
  };
  config?: MapConfig;
}

// Component to handle map view changes
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

export function PublicMap({ organization, config }: PublicMapProps) {
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch halls data from API
  const fetchHalls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the hallService to fetch real data
      let hallsData;
      
      if (config?.showAllHalls) {
        // Fetch all halls (you might need to adjust this based on your API)
        hallsData = await hallService.getAllHalls();
      } else if (config?.organizationId) {
        // Fetch halls for specific organization
        // You might need to create a method like getHallsByOrganizationId
        hallsData = await hallService.getAllHalls();
        // Filter by organizationId
        hallsData = hallsData.filter((hall: Hall) => hall.organizationId === config.organizationId);
      } else if (organization?.id) {
        // Use organization id from props
        hallsData = await hallService.getAllHalls();
        hallsData = hallsData.filter((hall: Hall) => hall.organizationId === organization.id);
      } else {
        // Fetch all active halls
        hallsData = await hallService.getAllHalls();
      }
      
      console.log('Fetched halls data:', hallsData); // Debug log
      
      // Filter to only include halls with valid coordinates
      const hallsWithCoordinates = hallsData.filter((hall: Hall) => {
        // Check if coordinates exist and are valid numbers
        const hasCoordinates = hall.coordinates && 
          typeof hall.coordinates.lat === 'number' && 
          typeof hall.coordinates.lng === 'number' &&
          !isNaN(hall.coordinates.lat) && 
          !isNaN(hall.coordinates.lng);
        
        if (!hasCoordinates && hall.coordinates) {
          console.warn(`Hall ${hall.name} has invalid coordinates:`, hall.coordinates);
        }
        
        return hasCoordinates;
      });
      
      console.log('Halls with valid coordinates:', hallsWithCoordinates); // Debug log
      
      setHalls(hallsWithCoordinates);
      
      if (hallsWithCoordinates.length === 0 && hallsData.length > 0) {
        setError('Halls found but no valid coordinates available for mapping.');
      }
      
    } catch (error: any) {
      console.error('Failed to fetch halls:', error);
      setError(error.message || 'Failed to load hall data. Please try again later.');
      setHalls([]);
    } finally {
      setLoading(false);
    }
  }, [config?.showAllHalls, config?.organizationId, organization?.id]);

  // Fetch halls on component mount
  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  // Default center - fallback to India coordinates
  const defaultCenter: [number, number] = [ 11.747642143633337, 79.76294606159624 ];
  
  // Determine center based on available data
  const getCenter = (): [number, number] => {
    if (selectedHall?.coordinates) {
      return [selectedHall.coordinates.lat, selectedHall.coordinates.lng];
    }
    
    // If we have halls, calculate center of all halls
    // if (halls.length > 0) {
    //   const avgLat = halls.reduce((sum, hall) => sum + hall.coordinates!.lat, 0) / halls.length;
    //   const avgLng = halls.reduce((sum, hall) => sum + hall.coordinates!.lng, 0) / halls.length;
    //   return [avgLat, avgLng];
    // }
    
    // Fallback to organization location
    if (organization?.latitude && organization?.longitude) {
      return [organization.latitude, organization.longitude];
    }
    
    return defaultCenter;
  };

  const center = getCenter();
  const zoom = config?.zoomLevel || (halls.length > 1 ? 12 : 15);
  const mapHeight = config?.height ? `${config.height}px` : '500px';
  const tileProvider = config?.tileProvider || 'openstreetmap';

  const getTileLayer = () => {
    switch (tileProvider) {
      case 'cartodb':
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      case 'esri':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      case 'mapbox':
        return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_TOKEN || ''}`;
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getAttribution = () => {
    switch (tileProvider) {
      case 'cartodb':
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
      case 'esri':
        return 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012';
      case 'mapbox':
        return '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    }
  };

  // Custom marker icons
  const getMarkerIcon = (isSelected: boolean = false) => {
    const iconSize: [number, number] = isSelected ? [40, 40] : [32, 32];
    const iconAnchor: [number, number] = isSelected ? [20, 40] : [16, 32];
    const popupAnchor: [number, number] = [0, -32];

    if (isSelected) {
      return L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        iconSize,
        iconAnchor,
        popupAnchor,
      });
    }

    return L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      iconSize,
      iconAnchor,
      popupAnchor,
    });
  };

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsGettingLocation(false);
      },
      (error) => {
        alert("Unable to retrieve your location: " + error.message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Get directions URL for a hall
  const getDirectionsUrl = useCallback((hall: Hall) => {
    if (!hall.coordinates) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${hall.coordinates.lat},${hall.coordinates.lng}`;
  }, []);

  // Handle hall selection
  const handleHallSelect = useCallback((hall: Hall) => {
    setSelectedHall(prev => prev?.id === hall.id ? null : hall);
  }, []);

  // Retry fetching data
  const handleRetry = useCallback(() => {
    fetchHalls();
  }, [fetchHalls]);

  if (!isClient) {
    return (
      <div 
        className="bg-gray-200 rounded-lg animate-pulse"
        style={{ height: mapHeight }}
      />
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        {config?.title && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {config.title}
            </h2>
            {config.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {config.description}
              </p>
            )}
          </div>
        )}
        <Card className="p-8 text-center">
          <CardContent>
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Failed to Load Map Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRetry}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {config?.title && (
          <div className="text-center">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            {config.description && (
              <Skeleton className="h-4 w-96 mx-auto" />
            )}
          </div>
        )}
        <Skeleton className="w-full" style={{ height: mapHeight }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {(config?.title || config?.description) && (
        <div className="text-center">
          {config.title && (
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              {config.title}
            </h2>
          )}
          {config.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">
              {config.description}
            </p>
          )}
        </div>
      )}

      {/* Map Container */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="relative" style={{ height: mapHeight }}>
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              className="rounded-lg"
            >
              <MapViewUpdater center={center} zoom={zoom} />
              
              {/* Tile Layer */}
              <TileLayer
                attribution={getAttribution()}
                url={getTileLayer()}
              />

              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={L.divIcon({
                    html: `
                      <div style="
                        width: 40px;
                        height: 40px;
                        background: #3B82F6;
                        border: 3px solid white;
                        border-radius: 50%;
                        box-shadow: 0 0 10px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      ">
                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="8"/>
                        </svg>
                      </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -32],
                    className: 'user-location-marker'
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold mb-1">Your Location</h3>
                      <p className="text-sm">You are here</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Hall Markers */}
              {halls.map((hall) => (
                <Marker
                  key={hall.id}
                  position={[hall.coordinates!.lat, hall.coordinates!.lng]}
                  icon={getMarkerIcon(selectedHall?.id === hall.id)}
                  eventHandlers={{
                    click: () => handleHallSelect(hall)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-bold text-lg mb-1">{hall.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{hall.address}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Location:</span> {hall.location}
                        </div>
                        <div>
                          <span className="font-medium">Capacity:</span> {hall.capacity} people
                        </div>
                        {hall.rateCard && (
                          <div>
                            <span className="font-medium">Rates:</span> 
                            <div className="mt-1 space-y-1">
                              <div>Morning: ₹{hall.rateCard.morningRate.toLocaleString()}</div>
                              <div>Evening: ₹{hall.rateCard.eveningRate.toLocaleString()}</div>
                              <div>Full Day: ₹{hall.rateCard.fullDayRate.toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                        {userLocation && (
                          <div className="font-medium text-blue-600">
                            Distance: {calculateDistance(
                              userLocation[0], userLocation[1],
                              hall.coordinates!.lat, hall.coordinates!.lng
                            ).toFixed(1)} km away
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            window.open(getDirectionsUrl(hall), '_blank');
                          }}
                        >
                          Get Directions
                        </Button>
                        <Button 
                  variant="outline" 
                  onClick={() => navigate(`/hall/${hall.id}`)}
                  className="flex-1"
                >
                  View Details
                </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Location Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button
                onClick={getUserLocation}
                disabled={isGettingLocation}
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm"
              >
                {isGettingLocation ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Finding...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    My Location
                  </span>
                )}
              </Button>
            </div>

            {/* Zoom Controls
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
              <button
                onClick={() => {
                  const map = document.querySelector('.leaflet-container') as any;
                  if (map?.__leaflet__?.setZoom) {
                    map.__leaflet__.setZoom(zoom + 1);
                  }
                }}
                className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-lg font-bold">+</span>
              </button>
              <button
                onClick={() => {
                  const map = document.querySelector('.leaflet-container') as any;
                  if (map?.__leaflet__?.setZoom) {
                    map.__leaflet__.setZoom(zoom - 1);
                  }
                }}
                className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-lg font-bold">−</span>
              </button>
            </div> */}

            {/* Selected Hall Info */}
            {selectedHall && (
              <div className="absolute top-20 left-4 z-[1000] max-w-xs">
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{selectedHall.name}</h3>
                      <Badge variant={selectedHall.isActive ? "default" : "secondary"}>
                        {selectedHall.isActive ? 'Available' : 'Booked'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {selectedHall.address}
                    </p>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Location:</span>
                        <span>{selectedHall.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Capacity:</span>
                        <span>{selectedHall.capacity} people</span>
                      </div>
                      {selectedHall.rateCard && (
                        <div className="flex justify-between">
                          <span className="font-medium">Morning Rate:</span>
                          <span>₹{selectedHall.rateCard.morningRate.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {userLocation && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-1.864-3.496M9 20l6-11m-6 11l6.136-1.504M9 20L15 9m0 0l6.136 1.504M15 9l-6-11m6 11l-1.864 3.496M15 9l-6 11" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Distance:</p>
                            <p className="text-lg font-bold text-blue-600">
                              {calculateDistance(
                                userLocation[0], userLocation[1],
                                selectedHall.coordinates!.lat, selectedHall.coordinates!.lng
                              ).toFixed(1)} km
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => {
                        window.open(getDirectionsUrl(selectedHall), '_blank');
                      }}
                    >
                      Get Directions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Halls Count Badge */}
            <div className="absolute bottom-4 left-4 z-[1000]">
              <Badge variant="secondary" className="px-3 py-1 bg-white/90 backdrop-blur-sm">
                🏢 {halls.length} {halls.length === 1 ? 'Hall' : 'Halls'} Available
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Halls List */}
      {halls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Available Halls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {halls.map((hall) => (
              <Card 
                key={hall.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${selectedHall?.id === hall.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleHallSelect(hall)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{hall.name}</h4>
                    <Badge variant={hall.isActive ? "default" : "secondary"}>
                      {hall.isActive ? 'Available' : 'Booked'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{hall.address}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">📍</span>
                        <span>{hall.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">👥</span>
                        <span>{hall.capacity} people</span>
                      </div>
                    </div>
                    
                    {hall.rateCard && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">🌅</span>
                          <span>₹{hall.rateCard.morningRate.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">🌇</span>
                          <span>₹{hall.rateCard.eveningRate.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {userLocation && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Distance:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {calculateDistance(
                            userLocation[0], userLocation[1],
                            hall.coordinates!.lat, hall.coordinates!.lng
                          ).toFixed(1)} km
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Halls Message */}
      {halls.length === 0 && !loading && (
        <Card className="text-center p-8">
          <CardContent>
            <h3 className="text-xl font-bold mb-2">No Halls Found</h3>
            <p className="text-gray-600">
              No halls are currently available for display. 
              {organization?.name && ` Check back later for halls from ${organization.name}.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* How to Use Guide */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to Use This Map:
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Click on hall markers to see detailed information</li>
          <li>• Click "My Location" to see your current position</li>
          <li>• Click "Get Directions" on any hall for navigation</li>
          <li>• Use zoom controls (+/-) to adjust the map view</li>
          <li>• Click on hall cards below to highlight them on the map</li>
        </ul>
      </div>
    </div>
  );
}