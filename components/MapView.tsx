import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { ImageIcon } from "lucide-react";

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

type DroppedPin = { lat: number; lng: number; typeId: string; label: string };

type MapMarker = { 
  id: string; 
  lat: number; 
  lng: number; 
  typeId: string; 
  label: string; 
  description?: string; 
  imageUrl?: string;
};

interface MapViewProps {
  onDropPin?: (pin: DroppedPin) => void;
  markers?: MapMarker[];
  reports?: { id?: string; title?: string; type?: string; location?: { lat?: number; lng?: number } }[];
  center?: [number, number];
  zoom?: number;
  useSatelliteView?: boolean;
}

const colorForType = (typeId: string) => {
  switch (typeId) {
    case 'danger':
      return '#dc2626'; // red-600
    case 'potholes':
      return '#ea580c'; // orange-600
    case 'traffic':
      return '#ca8a04'; // yellow-600
    case 'garbage':
      return '#16a34a'; // green-600
    case 'streetlight':
      return '#2563eb'; // blue-600
    case 'water':
      return '#0891b2'; // cyan-600
    case 'trees':
      return '#059669'; // emerald-600
    default:
      return '#4b5563'; // gray-600
  }
};


export default function MapView({ onDropPin, markers = [], reports = [], center, zoom, useSatelliteView = false }: MapViewProps) {
  useEffect(() => {
    fixLeafletIcon();
    
    // Add custom styles for Leaflet popup to remove white padding/background
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-popup-content-wrapper {
        background: transparent !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
      }
      .leaflet-popup-tip {
        background: rgba(31, 41, 55, 0.6) !important;
        backdrop-filter: blur(8px) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const mergePins = useMemo(() => {
    // Avoid duplicate ids if any
    const map = new Map<string, MapMarker>();
    for (const p of markers) map.set(p.id, p);
    // include reports passed from callers by converting to MapMarker shape
    for (const r of (reports || [])) {
      const lat = r.location?.lat;
      const lng = r.location?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const id = r.id ?? `${lat}-${lng}-${String(r.title ?? '')}`;
        map.set(id, {
          id,
          lat,
          lng,
          typeId: normalizeType(String(r.type || 'other')),
          label: r.title || 'Report',
        });
      }
    }
    return Array.from(map.values());
  }, [markers, reports]);

  return (
    <MapContainer 
      center={center || [19.0760, 72.8777] as [number, number]} 
      zoom={zoom || 13} 
      style={{ height: "100%", width: "100%" }}
    >
      <AutoResize />
      <MapController center={center} zoom={zoom} />
      <Html5DropTarget onDropPin={onDropPin} />
      
      {/* Conditional Tile Layer - Standard or Satellite */}
      {useSatelliteView ? (
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}
      
      {mergePins.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng] as [number, number]}
          pathOptions={{ color: colorForType(m.typeId), fillColor: colorForType(m.typeId), fillOpacity: 0.7 }}
          radius={10}
        >
              <Popup>
                <MarkerPopupContent marker={m} />
              </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

function AutoResize() {
  const map = useMap();
  useEffect(() => {
    const invalidate = () => {
      try { map.invalidateSize(); } catch {}
    };
    // call a few times after mount to settle layout
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);
    const t3 = setTimeout(invalidate, 1000);
    window.addEventListener('resize', invalidate);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', invalidate);
    };
  }, [map]);
  return null;
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  
  return null;
}
// removed remote pin fetching and SSE; markers are now passed directly via props

function normalizeType(input: string): string {
  const s = String(input || '').trim().toLowerCase();
  const map: Record<string, string> = {
    danger: 'danger',
    potholes: 'potholes',
    traffic: 'traffic',
    garbage: 'garbage',
    streetlight: 'streetlight',
    water: 'water',
    trees: 'trees',
    other: 'other',
    'road damage': 'potholes',
    'water supply': 'water',
    electricity: 'streetlight',
    healthcare: 'other',
    flooding: 'water',
  };
  return map[s] || 'other';
}

function MarkerPopupContent({ marker }: { marker: MapMarker }) {
  const [showImagePreview, setShowImagePreview] = useState(false);

  return (
    <div className="relative min-w-[280px] max-w-[320px] bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 shadow-lg">
      {/* Image Preview Icon */}
      {marker.imageUrl && (
        <div 
          className="absolute top-3 right-3 z-10"
          onMouseEnter={() => setShowImagePreview(true)}
          onMouseLeave={() => setShowImagePreview(false)}
        >
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all hover:scale-110 shadow-md">
            <ImageIcon className="w-4 h-4 text-white/80" />
          </div>

          {showImagePreview && (
            <div className="absolute top-full right-0 mt-2 animate-in fade-in slide-in-from-top-2 duration-300 z-20">
              <div className="w-48 h-36 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-black/90">
                <img 
                  src={marker.imageUrl} 
                  alt="Report preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        <div className="font-bold text-lg text-white pr-10">{marker.label}</div>
        {marker.description && (
          <div className="text-sm text-gray-200/90 whitespace-pre-wrap leading-relaxed">
            {marker.description}
          </div>
        )}
        <div className="text-xs text-gray-400 font-mono pt-1 border-t border-white/10">
          📍 {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
        </div>
          </div>
    </div>
  );
}

function Html5DropTarget({ onDropPin }: { onDropPin?: (pin: DroppedPin) => void }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const onDragOver = (e: DragEvent) => {
      // allow drop
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!onDropPin) return;
      try {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const latlng = map.containerPointToLatLng(L.point(x, y));
        const raw = e.dataTransfer?.getData('application/x-incident') || e.dataTransfer?.getData('text/plain');
        const payload = raw ? JSON.parse(raw) : null;
        if (payload && payload.typeId && payload.label) {
          onDropPin({ lat: latlng.lat, lng: latlng.lng, typeId: payload.typeId, label: payload.label });
        }
      } catch (err) {
        // ignore
      }
    };

    container.addEventListener('dragover', onDragOver);
    container.addEventListener('drop', onDrop);
    return () => {
      container.removeEventListener('dragover', onDragOver);
      container.removeEventListener('drop', onDrop);
    };
  }, [map, onDropPin]);
  return null;
}