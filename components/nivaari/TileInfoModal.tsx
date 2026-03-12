'use client';

import { useNivaariStore, type Tile } from '@/lib/nivaariStore';

function EmergencySection({ tile }: { tile: Tile }) {
  const reportEmergency = useNivaariStore((state) => state.reportEmergency);

  if (!tile.data?.hasEmergency) {
    return (
      <div className="mt-4 flex justify-center gap-2 flex-wrap">
        {[
          { label: '🚑 Medical', type: 'medical' as const, color: '#ef4444' },
          { label: '🚒 Fire', type: 'fire' as const, color: '#f97316' },
          { label: '🚓 Police', type: 'police' as const, color: '#3b82f6' },
        ].map(({ label, type, color }) => (
          <button
            key={type}
            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:opacity-80 active:scale-95"
            style={{ background: color + '33', border: `1px solid ${color}66` }}
            onClick={() => reportEmergency(tile.id, type)}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 text-xs text-red-300 text-center py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
      ⚠️ Emergency reported: {tile.data.emergencyType}
    </div>
  );
}

interface TileInfoModalProps {
  tile: Tile | null;
  onVote: (type: 'upvote' | 'downvote') => void;
  editMode: boolean;
  user: { reputation: number };
  onEditStart?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onReportDisaster?: () => void;
}

export default function TileInfoModal({
  tile,
  onVote,
  editMode,
  user,
  onEditStart,
  onSaveEdit,
  onCancelEdit,
  onReportDisaster,
}: TileInfoModalProps) {
  if (!tile) return null;

  const confidence = tile.data?.confidence ?? 0;
  const confColor = confidence > 75 ? '#22c55e' : confidence > 40 ? '#eab308' : '#ef4444';

  const typeIcons: Record<string, string> = {
    road: '🛣️', building: '🏢', hospital: '🏥', nature: '🌳', police: '🚓', industrial: '🏭',
  };

  return (
    <div
      className={`absolute left-0 right-0 bottom-0 pointer-events-auto transform transition-all duration-300 ${tile ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ maxWidth: '420px', margin: '0 auto' }}
    >
      <div
        className="rounded-t-2xl overflow-hidden"
        style={{
          background: 'rgba(8,13,26,0.95)',
          border: '1px solid rgba(0,212,255,0.18)',
          borderBottom: 'none',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.06)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div className="px-5 pb-5 pt-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span>{typeIcons[tile.type] ?? '📍'}</span>
              <span className="capitalize">{tile.type}</span>
            </h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: confColor + '22', color: confColor, border: `1px solid ${confColor}44` }}
            >
              {confidence}% Verified
            </span>
          </div>

          <p className="text-xs text-white/50 mb-4">
            {tile.data?.category ? `Category: ${tile.data.category}` : ''}{tile.data?.zone ? ` · Zone: ${tile.data.zone}` : ''}
          </p>

          {/* Vote buttons */}
          <div className="flex gap-2 mb-3">
            <button
              className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-80 active:scale-95"
              style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
              onClick={() => onVote('upvote')}
            >
              👍 Correct
            </button>
            <button
              className="flex-1 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-80 active:scale-95"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
              onClick={() => onVote('downvote')}
            >
              👎 Incorrect
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            {!editMode && !tile.isVerified && (
              <button
                className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:opacity-80"
                style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)' }}
                onClick={onEditStart}
              >
                ✏️ Edit Shape
              </button>
            )}
            {!editMode && (
              <button
                className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:opacity-80"
                style={{ background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={onReportDisaster}
              >
                ⚠️ Report Disaster
              </button>
            )}
            {editMode && (
              <>
                <button
                  className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:opacity-80"
                  style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}
                  onClick={onSaveEdit}
                >
                  ✓ Save Correction
                </button>
                <button
                  className="flex-1 py-1.5 text-xs font-semibold text-white rounded-lg transition-all duration-200 hover:opacity-80"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                  onClick={onCancelEdit}
                >
                  ✕ Cancel
                </button>
              </>
            )}
          </div>

          <EmergencySection tile={tile} />
        </div>
      </div>
    </div>
  );
}
