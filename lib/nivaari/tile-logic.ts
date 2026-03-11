import { TILE_CATEGORY_MAP, type ActiveTool, type NivaariData, type SectorStats, type Tile, type TileType } from '@/lib/nivaari/domain';

function createTileData(type: TileType): NivaariData {
  return {
    category: TILE_CATEGORY_MAP[type] || '',
    zone: type === 'hospital' || type === 'police' ? 'public' : '',
    confidence: 100,
    upvotes: 0,
    downvotes: 0,
  };
}

export function createTileFromTool({
  x,
  z,
  tool,
  creator,
  width,
  depth,
}: {
  x: number;
  z: number;
  tool: Exclude<ActiveTool, 'inspect'>;
  creator?: string | null;
  width?: number;
  depth?: number;
}): Tile {
  return {
    id: `${x},${z}`,
    x,
    z,
    width,
    depth,
    type: tool,
    creator: creator ?? null,
    data: createTileData(tool),
  };
}

export function applyVoteToTile(tile: Tile, type: 'upvote' | 'downvote'): Tile {
  if (!tile.data) return tile;

  const nextData: NivaariData = {
    ...tile.data,
    upvotes: tile.data.upvotes + (type === 'upvote' ? 1 : 0),
    downvotes: tile.data.downvotes + (type === 'downvote' ? 1 : 0),
  };
  const total = nextData.upvotes + nextData.downvotes;
  nextData.confidence = total > 0 ? Math.round((nextData.upvotes / total) * 100) : 0;

  return {
    ...tile,
    data: nextData,
    isVerified: tile.isVerified || nextData.upvotes - nextData.downvotes >= 10,
  };
}

export function reshapeTile(oldTile: Tile, newPositions: string[]): Tile {
  const xs = newPositions.map((p) => Number.parseInt(p.split(',')[0], 10));
  const zs = newPositions.map((p) => Number.parseInt(p.split(',')[1], 10));
  const minX = Math.min(...xs);
  const minZ = Math.min(...zs);

  return {
    ...oldTile,
    id: `${minX},${minZ}`,
    x: minX,
    z: minZ,
    width: Math.max(...xs) - minX + 1,
    depth: Math.max(...zs) - minZ + 1,
  };
}

export function isAreaOccupied(grid: Record<string, Tile>, minX: number, minZ: number, maxX: number, maxZ: number) {
  for (let xi = minX; xi <= maxX; xi += 1) {
    for (let zi = minZ; zi <= maxZ; zi += 1) {
      if (grid[`${xi},${zi}`]) {
        return true;
      }
    }
  }
  return false;
}

export function calculateSectorStatsFromGrid(grid: Record<string, Tile>): SectorStats {
  const tiles = Object.values(grid);
  const totalCoverage = tiles.length;
  let confSum = 0;
  let confCount = 0;
  let emergencyCount = 0;
  let publicCount = 0;
  let privateCount = 0;
  const emergencies: SectorStats['emergencies'] = [];

  tiles.forEach((tile) => {
    if (!tile.data) return;

    if (tile.data.category === 'residential') {
      confSum += tile.data.confidence;
      confCount += 1;
    }

    if (tile.data.zone === 'public') publicCount += 1;
    if (tile.data.zone === 'private') privateCount += 1;

    if (tile.data.hasEmergency) {
      emergencyCount += 1;
      emergencies.push({
        id: tile.id,
        type: tile.data.emergencyType || 'unknown',
        x: tile.x,
        z: tile.z,
      });
    }
  });

  return {
    avgConfidence: confCount > 0 ? confSum / confCount : 0,
    infrastructureHealth: totalCoverage > 0 ? ((totalCoverage - emergencyCount) / totalCoverage) * 100 : 100,
    totalCoverage,
    publicCount,
    privateCount,
    emergencies,
  };
}
