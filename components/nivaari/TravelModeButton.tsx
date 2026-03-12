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
    <div className={`${className ?? ''} relative`.trim()}>
      <button
        className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:opacity-80"
        style={{
          background: active ? 'rgba(34,197,94,0.25)' : 'rgba(8,13,26,0.85)',
          border: active ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(16px)',
          boxShadow: active ? '0 0 10px rgba(34,197,94,0.2)' : 'none',
        }}
        onClick={() => setOpen((value) => !value)}
      >
        {type ? `🧭 ${type}` : '🧭'}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-40 rounded-xl overflow-hidden z-10"
          style={{ background: 'rgba(8,13,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        >
          {!active ? (
            <>
              {[{ label: '🚶 Walking', type: 'walk' as TravelType }, { label: '🚗 Car', type: 'car' as TravelType }, { label: '🚆 Train', type: 'train' as TravelType }].map(({ label, type: t }) => (
                <div
                  key={t}
                  className="px-4 py-2.5 text-xs text-white/80 cursor-pointer hover:bg-white/05 hover:text-white transition-colors duration-150"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => { onStart(t); setOpen(false); }}
                >
                  {label}
                </div>
              ))}
            </>
          ) : (
            <div className="px-4 py-2.5 text-xs text-red-300 cursor-pointer hover:text-red-200" onClick={() => { onStop(); setOpen(false); }}>
              ✕ Stop Tracking
            </div>
          )}
        </div>
      )}
    </div>
  );
}
