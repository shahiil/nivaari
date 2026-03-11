'use client';

import { useState } from 'react';
import type { TravelType } from '@/lib/nivaariStore';

export default function TravelModeButton({
  active,
  type,
  onStart,
  onStop,
  className,
}: {
  active: boolean;
  type: TravelType | null;
  onStart: (type: TravelType) => void;
  onStop: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${className} relative`}>
      <button className={`px-3 py-2 rounded-lg ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-800'} text-white`} onClick={() => setOpen((value) => !value)}>
        {type ? `🧭 ${type}` : '🧭'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-neutral-900 text-white rounded shadow-lg">
          {!active ? (
            <>
              <div className="px-3 py-2 cursor-pointer" onClick={() => { onStart('walk'); setOpen(false); }}>🚶 Walking</div>
              <div className="px-3 py-2 cursor-pointer" onClick={() => { onStart('car'); setOpen(false); }}>🚗 Car</div>
              <div className="px-3 py-2 cursor-pointer" onClick={() => { onStart('train'); setOpen(false); }}>🚆 Train</div>
            </>
          ) : (
            <div className="px-3 py-2 cursor-pointer" onClick={() => { onStop(); setOpen(false); }}>
              Stop Tracking
            </div>
          )}
        </div>
      )}
    </div>
  );
}
