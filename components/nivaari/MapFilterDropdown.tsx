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
    <div className={`${className} relative`}>
      <button className="bg-neutral-800 text-white px-3 py-2 rounded-lg" onClick={() => setOpen((value) => !value)}>
        🗺️
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-900 text-white rounded shadow-lg">
          {OPTIONS.map(([label, key]) => (
            <div
              key={key}
              className={`px-3 py-2 cursor-pointer ${active === key ? 'bg-neutral-700' : ''}`}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
