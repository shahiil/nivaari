import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

interface Alert {
  id: number;
  lat: number;
  lng: number;
  type: string;
  status: string;
}

interface AlertsMapProps {
  alerts: Alert[];
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

// Get color based on alert status
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'red':
      return '#FF4136';
    case 'orange':
      return '#FF851B';
    case 'yellow':
      return '#FFDC00';
    case 'green':
      return '#2ECC40';
    default:
      return '#0074D9';
  }
};

export default function AlertsMap({ alerts }: AlertsMapProps) {
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
        
        {alerts.map(alert => (
          <CircleMarker
            key={alert.id}
            center={[alert.lat, alert.lng] as [number, number]}
            pathOptions={{ 
              color: getStatusColor(alert.status),
              fillColor: getStatusColor(alert.status),
              fillOpacity: 0.7,
              radius: 15
            }}
          >
            <Popup>
              <div className="font-medium">{alert.type}</div>
              <div className="text-xs text-gray-500">
                Status: <span className="font-medium" style={{ color: getStatusColor(alert.status) }}>
                  {alert.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Location: {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}