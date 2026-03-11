'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import type Konva from 'konva';
import { generateCuratedTiles, getColorForCategory, NivaariTile, TileCategory } from '@/lib/tile-engine';

interface CanvasTileMapProps {
  onTileSelect?: (tile: NivaariTile | null) => void;
  activeFilters?: TileCategory[];
  selectedTileId?: string | null;
}

const TILE_SIZE = 60;
const PADDING = 3;
// Category emoji icons shown on each tile
const CATEGORY_ICON: Record<string, string> = {
  residential: '🏘',
  commercial: '🏢',
  environment: '🌿',
  health: '🏥',
  transportation: '🚦',
  emergency: '🚨',
  infrastructure: '⚡',
  services: '🛎',
  'water-body': '💧',
  disaster: '⚠',
  forest: '🌲',
  social: '👥',
  civic: '🏛',
  industrial: '🏭',
  agriculture: '🌾',
};

// Curated tiles are generated once — no need to regenerate on filter change
const CURATED_TILES = generateCuratedTiles();

export default function CanvasTileMap({ onTileSelect, activeFilters = [], selectedTileId }: CanvasTileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tiles, setTiles] = useState<NivaariTile[]>(CURATED_TILES);
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);

  const activeTileId = selectedTileId ?? localSelectedId;

  useEffect(() => {
    const resize = () => {
      const node = containerRef.current;
      if (!node) return;
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      setDimensions({ width: w, height: h });
      // Center the tile grid
      const gridWidth = 16 * TILE_SIZE;
      const gridHeight = 12 * TILE_SIZE;
      setStagePosition({
        x: w / 2 - (gridWidth * scale) / 2,
        y: h / 2 - (gridHeight * scale) / 2,
      });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [scale]);

  const visibleTiles = useMemo(() => {
    if (activeFilters.length === 0) return tiles;
    return tiles.filter((t) => activeFilters.includes(t.category));
  }, [activeFilters, tiles]);

  const hiddenTileIds = useMemo(() => {
    if (activeFilters.length === 0) return new Set<string>();
    const visible = new Set(visibleTiles.map((t) => t.id));
    return new Set(tiles.filter((t) => !visible.has(t.id)).map((t) => t.id));
  }, [activeFilters, tiles, visibleTiles]);

  const handleTileClick = useCallback(
    (tile: NivaariTile) => {
      if (isDragging.current) return;
      const newId = localSelectedId === tile.id ? null : tile.id;
      setLocalSelectedId(newId);
      onTileSelect?.(newId ? tile : null);
    },
    [localSelectedId, onTileSelect]
  );

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = event.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const oldScale = stage.scaleX();
    const mousePoint = {
      x: pointer.x / oldScale - stage.x() / oldScale,
      y: pointer.y / oldScale - stage.y() / oldScale,
    };
    const nextScale = event.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    if (nextScale < 0.4 || nextScale > 3) return;
    setScale(nextScale);
    setStagePosition({
      x: -(mousePoint.x - pointer.x / nextScale) * nextScale,
      y: -(mousePoint.y - pointer.y / nextScale) * nextScale,
    });
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden" style={{ background: 'transparent' }}>
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable
        onWheel={handleWheel}
        x={stagePosition.x}
        y={stagePosition.y}
        scaleX={scale}
        scaleY={scale}
        className="cursor-grab active:cursor-grabbing"
        onDragStart={() => { isDragging.current = true; }}
        onDragEnd={(e) => {
          setStagePosition({ x: e.target.x(), y: e.target.y() });
          setTimeout(() => { isDragging.current = false; }, 50);
        }}
      >
        <Layer>
          {tiles.map((tile) => {
            const x = tile.x * TILE_SIZE;
            const y = tile.y * TILE_SIZE;
            const w = tile.width * TILE_SIZE - PADDING;
            const h = tile.height * TILE_SIZE - PADDING;
            const isSelected = tile.id === activeTileId;
            const isHidden = hiddenTileIds.has(tile.id);
            const opacity = isHidden ? 0.12 : isSelected ? 0.88 : 0.58;
            const icon = CATEGORY_ICON[tile.category] || '📍';

            return (
              <Group
                key={tile.id}
                x={x}
                y={y}
                onClick={() => handleTileClick(tile)}
                onTap={() => handleTileClick(tile)}
              >
                <Rect
                  width={w}
                  height={h}
                  fill={tile.color}
                  opacity={opacity}
                  cornerRadius={tile.width > 1 || tile.height > 1 ? 14 : 10}
                  stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.22)'}
                  strokeWidth={isSelected ? 2.5 / scale : 1 / scale}
                  shadowColor="black"
                  shadowBlur={isSelected ? 18 : 6}
                  shadowOpacity={isSelected ? 0.5 : 0.2}
                />
                {/* Icon — always shown */}
                <Text
                  text={icon}
                  x={4}
                  y={h / 2 - 12}
                  fontSize={Math.min(22, (w - 8))}
                  width={w - 8}
                  align="center"
                  opacity={isHidden ? 0.3 : 0.9}
                />
                {/* Category label — only when scale > 0.75 and tile is large enough */}
                {scale > 0.75 && w > 40 && (
                  <Text
                    text={tile.category.replace('-', ' ').toUpperCase().slice(0, 7)}
                    fill="rgba(255,255,255,0.80)"
                    fontSize={Math.min(9, 9 / scale * scale)}
                    fontFamily="monospace"
                    x={4}
                    y={h - 15}
                    width={w - 8}
                    align="center"
                    opacity={isHidden ? 0.2 : 0.8}
                  />
                )}
                {/* Selected ring glow */}
                {isSelected && (
                  <Rect
                    width={w}
                    height={h}
                    fill="rgba(255,255,255,0.06)"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={1.5 / scale}
                    cornerRadius={tile.width > 1 || tile.height > 1 ? 14 : 10}
                    dash={[6, 4]}
                  />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
