'use client';

import type { Tile } from '@/lib/nivaariStore';
import { isAreaOccupied } from '@/lib/nivaari/tile-logic';

export default function DragPreview({
  start,
  current,
  grid,
}: {
  start: [number, number];
  current: [number, number];
  grid: Record<string, Tile>;
}) {
  const minX = Math.min(start[0], current[0]);
  const maxX = Math.max(start[0], current[0]);
  const minZ = Math.min(start[1], current[1]);
  const maxZ = Math.max(start[1], current[1]);
  const width = maxX - minX + 1;
  const depth = maxZ - minZ + 1;
  const color = isAreaOccupied(grid, minX, minZ, maxX, maxZ) ? 'red' : 'blue';

  return (
    <mesh position={[minX + width / 2, 0.01, minZ + depth / 2]}>
      <boxGeometry args={[width, 0.1, depth]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}
