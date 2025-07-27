import React from 'react';

interface IframeMapViewProps {
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  height?: string;
  width?: string;
  className?: string;
}

/**
 * A simple map component that uses an iframe to display OpenStreetMap
 * This is an alternative to using Leaflet directly when there are compatibility issues
 */
export default function IframeMapView({
  center = [19.0760, 72.8777], // Mumbai by default
  zoom = 13,
  height = '100%',
  width = '100%',
  className = '',
}: IframeMapViewProps) {
  const [lat, lng] = center;
  
  // Create the OpenStreetMap iframe URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.1}%2C${lat-0.1}%2C${lng+0.1}%2C${lat+0.1}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className={`map-container ${className}`} style={{ height, width }}>
      <iframe
        title="OpenStreetMap"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        style={{ border: '1px solid #ccc', borderRadius: '4px' }}
      />
    </div>
  );
}