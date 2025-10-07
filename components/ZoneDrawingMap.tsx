import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

interface ZoneDrawingMapProps {
  selectedZoneColor: string;
}

interface Zone {
  id: string;
  position: L.LatLng;
  color: string;
  radius: number;
}

// Fix for default marker icons in Leaflet with React
const fixLeafletIcon = () => {
  // @ts-expect-error - Leaflet icon prototype manipulation for React compatibility
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

function MapClickHandler({ selectedZoneColor, setZones }: { selectedZoneColor: string, setZones: React.Dispatch<React.SetStateAction<Zone[]>> }) {
  const map = useMapEvents({
    click: (e) => {
      const newZone: Zone = {
        id: Date.now().toString(),
        position: e.latlng,
        color: selectedZoneColor,
        radius: 50
      };
      setZones(prev => [...prev, newZone]);
    }
  });
  return null;
}

function ZoneDrawer({ selectedZoneColor }: ZoneDrawingMapProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <div className="w-full h-[500px] rounded-md overflow-hidden">
      <MapContainer 
        center={[19.0760, 72.8777] as [number, number]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler selectedZoneColor={selectedZoneColor} setZones={setZones} />
        
        {zones.map(zone => (
          <CircleMarker
            key={zone.id}
            center={[zone.position.lat, zone.position.lng] as [number, number]}
            radius={20}
            pathOptions={{ 
              color: zone.color
            }}
          >
            <Popup>
              {zone.color.charAt(0).toUpperCase() + zone.color.slice(1)} Zone
              <br />
              Lat: {zone.position.lat.toFixed(4)}, Lng: {zone.position.lng.toFixed(4)}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default ZoneDrawer;