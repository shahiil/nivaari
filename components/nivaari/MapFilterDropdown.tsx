'use client';

import { useState } from 'react';
import { BadgeCheck, Building2, ChevronDown, Globe, Map } from 'lucide-react';
import type { ActiveFilter } from '@/lib/nivaariStore';

const OPTIONS: Array<[string, ActiveFilter]> = [
  ['Default View', 'default'],
  ['Verification Heatmap', 'confidence'],
  ['Zoning Map', 'zone'],
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
        className="theo-glass-icon-btn theo-glass-icon-btn--square h-11 w-11 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
        style={{ background: open ? 'rgba(0,212,255,0.14)' : 'rgba(8,13,26,0.6)', border: open ? '1px solid rgba(0,212,255,0.28)' : '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(18px) saturate(160%)' }}
        onClick={() => setOpen((value) => !value)}
        title="Map Filter"
      >
        <Map className="h-5 w-5" strokeWidth={1.9} />
      </button>
      {open && (
        <div
          className="theo-glass-menu absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-10"
        >
          {OPTIONS.map(([label, key]) => {
            const Icon = key === 'confidence' ? BadgeCheck : key === 'zone' ? Building2 : Globe;

            return (
            <div
              key={key}
              className="flex items-center gap-2 px-4 py-2.5 text-xs cursor-pointer transition-all duration-200"
              style={{
                color: active === key ? '#00d4ff' : 'rgba(255,255,255,0.75)',
                background: active === key ? 'rgba(0,212,255,0.08)' : 'transparent',
                fontWeight: active === key ? 600 : 400,
              }}
              onClick={() => { onChange(key); setOpen(false); }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
