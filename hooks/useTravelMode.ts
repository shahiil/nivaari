import { useEffect } from 'react';
import { useNivaariStore } from '@/lib/nivaariStore';
import { toast } from 'react-hot-toast';

// simplistic throttling
let lastSync = 0;
const THROTTLE_MS = 2000;

export function useTravelMode() {
  const isActive = useNivaariStore((s) => s.isTravelModeActive);
  const syncGpsToGrid = useNivaariStore((s) => s.syncGpsToGrid);

  useEffect(() => {
    if (!isActive) return;
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSync < THROTTLE_MS) return;
        lastSync = now;
        const { latitude, longitude } = pos.coords;
        syncGpsToGrid(latitude, longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Location access required for Travel Mode');
        } else {
          toast.error('Location error: ' + err.message);
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [isActive, syncGpsToGrid]);
}
