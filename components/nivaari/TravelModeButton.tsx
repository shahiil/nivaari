'use client';

import { useState } from 'react';
import { CarFront, ChevronDown, Footprints, TrainFront, Compass, X } from 'lucide-react';
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
    <div className={`${className ?? ''} relative`.trim()}>
      <button
        className="theo-glass-icon-btn theo-glass-icon-btn--wide h-10 px-3 text-xs font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
        style={{
          background: active ? 'rgba(34,197,94,0.16)' : 'rgba(8,13,26,0.6)',
          border: active ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(18px) saturate(160%)',
          boxShadow: active ? '0 0 18px rgba(34,197,94,0.18)' : '0 10px 30px rgba(0,0,0,0.18)',
        }}
        onClick={() => setOpen((value) => !value)}
      >
        <Compass className="h-4 w-4" />
        <span className="capitalize">{type ?? 'Travel'}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="theo-glass-menu absolute right-0 mt-2 w-44 rounded-2xl overflow-hidden z-10"
        >
          {!active ? (
            <>
              {[
                { label: 'Walking', type: 'walk' as TravelType, icon: Footprints },
                { label: 'Car', type: 'car' as TravelType, icon: CarFront },
                { label: 'Train', type: 'train' as TravelType, icon: TrainFront },
              ].map(({ label, type: t, icon: Icon }) => (
                <div
                  key={t}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs text-white/80 cursor-pointer hover:bg-white/08 hover:text-white transition-all duration-200"
                  onClick={() => { onStart(t); setOpen(false); }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-red-300 cursor-pointer hover:text-red-200 transition-colors" onClick={() => { onStop(); setOpen(false); }}>
              <X className="h-4 w-4" />
              Stop Tracking
            </div>
          )}
        </div>
      )}
    </div>
  );
}
