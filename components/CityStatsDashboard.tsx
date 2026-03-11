import { useEffect, useRef } from 'react';
import { useNivaariStore, SectorStats } from '@/lib/nivaariStore';

function gradeFromHealth(health: number) {
  if (health >= 90) return 'A';
  if (health >= 75) return 'B';
  if (health >= 50) return 'C';
  if (health >= 25) return 'D';
  return 'F';
}

import { track } from '@/utils/analytics';

export default function CityStatsDashboard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const stats = useNivaariStore((s) => s.calculateSectorStats());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const grid = useNivaariStore.getState().grid;
    const json = JSON.stringify(grid, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nivaari_sector_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        if (typeof obj === 'object' && obj !== null) {
          useNivaariStore.setState({ grid: obj });
        }
      } catch (err) {
        console.error('import failed', err);
      }
    };
    reader.readAsText(file);
  };

  if (!open) return null;

  const healthGrade = gradeFromHealth(stats.infrastructureHealth);
  const satisfactionPct = Math.round(stats.avgConfidence);
  const infraPct = Math.round(stats.infrastructureHealth);
  const servicePct =
    stats.totalCoverage > 0
      ? Math.round((stats.publicCount / stats.totalCoverage) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-xl max-w-md w-full space-y-4 relative">
        <button
          className="absolute top-2 right-2 text-xl"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold">Sector Status: {healthGrade}</h2>
        <div>
          <div className="text-sm mb-1">Citizen Satisfaction</div>
          <div className="w-full bg-gray-300 h-4 rounded-full">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{ width: `${satisfactionPct}%` }}
            />
          </div>
          <div className="text-xs mt-1">{satisfactionPct}%</div>
        </div>
        <div>
          <div className="text-sm mb-1">Infrastructure Health</div>
          <div className="w-full bg-gray-300 h-4 rounded-full">
            <div
              className="bg-blue-500 h-4 rounded-full"
              style={{ width: `${infraPct}%` }}
            />
          </div>
          <div className="text-xs mt-1">{infraPct}%</div>
        </div>
        <div>
          <div className="text-sm mb-1">Service Coverage (public)</div>
          <div className="w-full bg-gray-300 h-4 rounded-full">
            <div
              className="bg-indigo-500 h-4 rounded-full"
              style={{ width: `${servicePct}%` }}
            />
          </div>
          <div className="text-xs mt-1">{servicePct}%</div>
        </div>
        <div>
          <h3 className="font-semibold">Active Emergencies</h3>
          <ul className="list-disc pl-5 text-sm">
            {stats.emergencies.length === 0 && <li>None</li>}
            {stats.emergencies.map((e) => (
              <li key={e.id}>
                [{e.x},{e.z}] {e.type}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap justify-between pt-4 gap-2">
          <button
            className="px-4 py-2 bg-gray-800 text-white rounded"
            onClick={exportData}
          >
            Export Map Data
          </button>
          <button
            className="px-4 py-2 bg-gray-800 text-white rounded"
            onClick={() => fileInputRef.current?.click()}
          >
            Import Map Data
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'My Nivaari Sector',
                  text: 'Check out my city on Nivaari!',
                  url: window.location.href,
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard');
              }
              try { track('City Shared'); } catch {}
            }}
          >
            Share City
          </button>
          <input
            type="file"
            accept="application/json"
            className="hidden"
            ref={fileInputRef}
            onChange={importData}
          />
        </div>
      </div>
    </div>
  );
}
