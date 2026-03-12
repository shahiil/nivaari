import { useEffect, useRef } from 'react';
import { useNivaariStore, SectorStats } from '@/lib/nivaariStore';
import { gridSchema } from '@/lib/nivaari/schemas';

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
        const parsed = gridSchema.parse(JSON.parse(reader.result as string));
        useNivaariStore.setState({ grid: parsed });
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
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(8, 13, 26, 0.9)',
          border: '1px solid rgba(0,212,255,0.18)',
          boxShadow: '0 0 60px rgba(0,212,255,0.1), 0 24px 48px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Top accent */}
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, #7c3aed, transparent)' }} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                Sector Status
              </h2>
              <span
                className="inline-block mt-0.5 text-2xl font-black"
                style={{ color: healthGrade === 'A' ? '#22c55e' : healthGrade === 'B' ? '#00d4ff' : healthGrade === 'C' ? '#eab308' : '#ef4444' }}
              >
                Grade {healthGrade}
              </span>
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {[
              { label: 'Citizen Satisfaction', value: satisfactionPct, color: '#22c55e', trackColor: 'rgba(34,197,94,0.15)' },
              { label: 'Infrastructure Health', value: infraPct, color: '#00d4ff', trackColor: 'rgba(0,212,255,0.12)' },
              { label: 'Service Coverage', value: servicePct, color: '#a78bfa', trackColor: 'rgba(167,139,250,0.12)' },
            ].map(({ label, value, color, trackColor }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/60">{label}</span>
                  <span className="font-semibold" style={{ color }}>{value}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: trackColor, border: `1px solid ${color}22` }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Emergencies */}
          <div className="mt-5 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Active Emergencies</h3>
            {stats.emergencies.length === 0 ? (
              <p className="text-xs text-emerald-400/80">✓ No active emergencies</p>
            ) : (
              <ul className="space-y-1">
                {stats.emergencies.map((e) => (
                  <li key={e.id} className="text-xs text-red-300 flex items-center gap-1">
                    <span className="text-red-500">⚠</span> [{e.x},{e.z}] {e.type}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            {[
              { label: 'Export', onClick: exportData, accent: '#374151' },
              { label: 'Import', onClick: () => fileInputRef.current?.click(), accent: '#374151' },
              {
                label: 'Share',
                onClick: () => {
                  if (navigator.share) {
                    navigator.share({ title: 'My Nivaari Sector', text: 'Check out my city on Nivaari!', url: window.location.href }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard');
                  }
                  try { track('City Shared'); } catch {}
                },
                accent: '#1d4ed8',
              },
            ].map(({ label, onClick, accent }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex-1 py-2 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:opacity-80"
                style={{ background: accent }}
              >
                {label}
              </button>
            ))}
          </div>
          <input type="file" accept="application/json" className="hidden" ref={fileInputRef} onChange={importData} />
        </div>
      </div>
    </div>
  );
}
