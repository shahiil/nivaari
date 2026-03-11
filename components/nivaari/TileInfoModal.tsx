'use client';

import { useNivaariStore, type Tile } from '@/lib/nivaariStore';

function EmergencySection({ tile }: { tile: Tile }) {
  const reportEmergency = useNivaariStore((state) => state.reportEmergency);

  if (!tile.data?.hasEmergency) {
    return (
      <div className="mt-4 flex justify-center space-x-2">
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => reportEmergency(tile.id, 'medical')}>🚑 Medical</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => reportEmergency(tile.id, 'fire')}>🚒 Fire</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => reportEmergency(tile.id, 'police')}>🚓 Police</button>
      </div>
    );
  }

  return <div className="mt-2 text-red-700 text-center">⚠️ Emergency reported: {tile.data.emergencyType}</div>;
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
  const colorClass = confidence > 75 ? 'bg-green-500' : 'bg-yellow-400';

  return (
    <div
      className={`absolute left-0 right-0 bottom-0 pointer-events-auto bg-white/95 text-black p-6 shadow-xl transform transition-transform duration-300 ${tile ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ maxWidth: '400px', margin: '0 auto' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold capitalize">{tile.type}</h2>
        <span className={`px-2 py-1 rounded text-white text-sm ${colorClass}`}>{confidence}% Verified</span>
      </div>
      <p className="text-sm">
        Category: {tile.data?.category || 'Unspecified'} | Zone: {tile.data?.zone || 'Unknown'}
      </p>
      <div className="mt-6 flex justify-around">
        <button className="px-6 py-2 bg-green-500 text-white rounded-lg text-lg" onClick={() => onVote('upvote')}>👍 Correct</button>
        <button className="px-6 py-2 bg-red-500 text-white rounded-lg text-lg" onClick={() => onVote('downvote')}>👎 Incorrect</button>
      </div>
      <div className="mt-4 flex justify-center space-x-2">
        {!editMode && !tile.isVerified && (user.reputation > 500 || !tile.isVerified) && (
          <button className="px-4 py-2 bg-yellow-400 rounded" onClick={onEditStart}>
            ✏️ Edit Shape
          </button>
        )}
        {!editMode && (
          <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={onReportDisaster}>
            ⚠️ Report Major Disaster
          </button>
        )}
        {editMode && (
          <>
            <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={onSaveEdit}>Save Correction</button>
            <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={onCancelEdit}>Cancel</button>
          </>
        )}
      </div>
      <EmergencySection tile={tile} />
    </div>
  );
}
