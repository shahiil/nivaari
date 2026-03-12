'use client';

import { useState } from 'react';
import type { ActiveFilter } from '@/lib/nivaariStore';

const OPTIONS: Array<[string, ActiveFilter]> = [
  ['🌍 Default View', 'default'],
  ['✅ Verification Heatmap', 'confidence'],
  ['🏢 Zoning Map', 'zone'],
];

export default function MapFilterDropdown({
  active,
  onChange,
  className,
}: {
  active: ActiveFilter;
  onChange: (filter: ActiveFilter) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`${className ?? ''} relative`.trim()}>
      <button
        className="w-9 h-9 flex items-center justify-center rounded-xl text-sm transition-all duration-200 hover:opacity-80"
        style={{ background: open ? 'rgba(0,212,255,0.15)' : 'rgba(8,13,26,0.85)', border: open ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}
        onClick={() => setOpen((value) => !value)}
        title="Map Filter"
      >
        🗺️
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-10"
          style={{ background: 'rgba(8,13,26,0.95)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        >
          {OPTIONS.map(([label, key]) => (
            <div
              key={key}
              className="px-4 py-2.5 text-xs cursor-pointer transition-colors duration-150"
              style={{
                color: active === key ? '#00d4ff' : 'rgba(255,255,255,0.75)',
                background: active === key ? 'rgba(0,212,255,0.08)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontWeight: active === key ? 600 : 400,
              }}
              onClick={() => { onChange(key); setOpen(false); }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
