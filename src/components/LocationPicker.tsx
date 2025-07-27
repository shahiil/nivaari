import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

interface LocationPickerProps {
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  initialPosition?: [number, number];
}

// Fix for default marker icons in Leaflet with React
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

function LocationMarker({ onLocationSelect }: { onLocationSelect: (coords: { lat: number; lng: number }) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function LocationPicker({ onLocationSelect, initialPosition = [19.0760, 72.8777] }: LocationPickerProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  return (
    <div className="w-full h-[300px] rounded-md overflow-hidden">
      <MapContainer 
        center={initialPosition as [number, number]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}