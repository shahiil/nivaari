import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

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

type MapMarker = { id: string; lat: number; lng: number; typeId: string; label: string; description?: string; source?: 'current'|'past'|'incoming' };

interface MapViewProps {
  onDropPin?: (pin: DroppedPin) => void;
  markers?: MapMarker[];
  filters?: { time: 'current'|'incoming'|'past'; types: string[] };
  enableModerationActions?: boolean;
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

export default function MapView({ onDropPin, markers = [], filters = { time: 'current', types: [] }, enableModerationActions = false }: MapViewProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  const [remotePins, setRemotePins] = useState<MapMarker[]>([]);
  const fetchIdRef = useRef(0);

  const mergePins = useMemo(() => {
    // Avoid duplicate ids if any
    const map = new Map<string, MapMarker>();
    for (const p of remotePins) map.set(p.id, p);
    for (const p of markers) map.set(p.id, p);
    return Array.from(map.values());
  }, [remotePins, markers]);

  return (
    <MapContainer 
      center={[19.0760, 72.8777] as [number, number]} 
      zoom={13} 
      style={{ height: "100%", width: "100%" }}
    >
      <AutoResize />
  <Html5DropTarget onDropPin={onDropPin} />
  <ViewportFetchPins onPins={(pins) => setRemotePins(pins)} filters={filters} enableModerationActions={enableModerationActions} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mergePins.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng] as [number, number]}
          pathOptions={{ color: colorForType(m.typeId), fillColor: colorForType(m.typeId), fillOpacity: 0.7 }}
          radius={10}
        >
              <Popup>
                <MarkerPopupContent marker={m} enableModerationActions={enableModerationActions} afterAction={() => { try { window.dispatchEvent(new CustomEvent('map:refetch')); } catch {} }} />
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
function ViewportFetchPins({ onPins, filters, enableModerationActions }: { onPins: (pins: MapMarker[]) => void; filters: { time: 'current'|'incoming'|'past'; types: string[] }; enableModerationActions?: boolean }) {
  const map = useMap();
  const abortRef = useRef<AbortController | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const sseSnapshotRef = useRef<any | null>(null);

  const fetchPins = async () => {
    if (!map) return;
    const b = map.getBounds();
    const bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].join(',');
    try {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const params = new URLSearchParams();
      params.set('bbox', bbox);
      params.set('time', filters.time);
      if (filters.types?.length) params.set('types', filters.types.join(','));
      const res = await fetch(`/api/reports-map?${params.toString()}`, { cache: 'no-store', signal: ac.signal });
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        const pins: MapMarker[] = data.items.map((p: any) => ({
          id: p.id,
          label: p.label,
          typeId: p.typeId,
          description: p.description,
          lat: p.location?.lat,
          lng: p.location?.lng,
          source: p.source,
        })).filter((p: any) => typeof p.lat === 'number' && typeof p.lng === 'number');
        onPins(pins);
      }
    } catch (e) {
      // ignore aborts
    }
  };

  useEffect(() => {
    // initial fetch after slight delay to ensure layout
    const t = setTimeout(fetchPins, 150);
    return () => clearTimeout(t);
  }, [filters.time, JSON.stringify(filters.types)]);

  useMapEvents({
    moveend: fetchPins,
    zoomend: fetchPins,
  });

  useEffect(() => {
    const handler = () => fetchPins();
    window.addEventListener('map:refetch' as any, handler);
    return () => window.removeEventListener('map:refetch' as any, handler);
  }, [filters.time, JSON.stringify(filters.types)]);

  // SSE live updates for incoming reports on moderator
  useEffect(() => {
    // Only when incoming and in moderation context
    if (!(enableModerationActions && filters.time === 'incoming')) {
      // ensure closed
      sseRef.current?.close();
      sseRef.current = null;
      sseSnapshotRef.current = null;
      return;
    }

    // Open SSE
    const es = new EventSource('/api/moderator/reports/stream');
    sseRef.current = es;

    const recomputeFromSnapshot = () => {
      const snap = sseSnapshotRef.current;
      if (!snap || !map) return;
      const b = map.getBounds();
      const within = (lat?: number, lng?: number) =>
        typeof lat === 'number' && typeof lng === 'number' && lat >= b.getSouth() && lat <= b.getNorth() && lng >= b.getWest() && lng <= b.getEast();

      const typesSet = new Set(filters.types);
      const items = Array.isArray(snap.unreviewed) ? snap.unreviewed : [];
      const pins: MapMarker[] = items
        .map((r: any) => ({
          ...r,
          _normType: normalizeType(r.type),
        }))
        .filter((r: any) => (!typesSet.size || typesSet.has(r._normType)))
        .map((r: any) => ({
          id: r.id,
          label: r.title,
          typeId: r._normType,
          description: r.description,
          lat: r.location?.lat,
          lng: r.location?.lng,
          source: 'incoming' as const,
        }))
        .filter((p: any) => within(p.lat, p.lng));
      onPins(pins);
    };

    es.addEventListener('snapshot', (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data);
        sseSnapshotRef.current = data;
        recomputeFromSnapshot();
      } catch {}
    });
    es.addEventListener('error', () => {
      // no-op; server sends periodic snapshots
    });

    // Also recompute on map move/zoom and filter changes
    const onMove = () => recomputeFromSnapshot();
    map.on('moveend', onMove);
    map.on('zoomend', onMove);

    // initial baseline fetch (in case snapshot takes time)
    void fetchPins();

    return () => {
      try { es.close(); } catch {}
      sseRef.current = null;
      sseSnapshotRef.current = null;
      map.off('moveend', onMove);
      map.off('zoomend', onMove);
    };
  }, [enableModerationActions, filters.time, JSON.stringify(filters.types), map]);

  return null;
}

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

function MarkerPopupContent({ marker, enableModerationActions, afterAction }: { marker: MapMarker; enableModerationActions: boolean; afterAction?: () => void }) {
  const [busy, setBusy] = useState(false);
  const approve = async () => {
    if (!enableModerationActions || marker.source !== 'incoming') return;
    setBusy(true);
    try {
      await fetch('/api/moderator/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: marker.id, decision: 'approved' }),
      });
      afterAction?.();
    } finally {
      setBusy(false);
    }
  };
  const reject = async () => {
    if (!enableModerationActions || marker.source !== 'incoming') return;
    setBusy(true);
    try {
      await fetch('/api/moderator/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: marker.id, decision: 'rejected' }),
      });
      afterAction?.();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <div className="font-semibold">{marker.label}</div>
      {marker.description ? <div className="text-sm opacity-90 whitespace-pre-wrap">{marker.description}</div> : null}
      <div className="text-xs opacity-60">{marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}</div>
      {enableModerationActions && marker.source === 'incoming' ? (
        <div className="pt-1 flex gap-2">
          <button onClick={approve} disabled={busy} className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm disabled:opacity-60">Accept</button>
          <button onClick={reject} disabled={busy} className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm disabled:opacity-60">Reject</button>
        </div>
      ) : null}
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