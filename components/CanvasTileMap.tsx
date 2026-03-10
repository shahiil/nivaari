'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text, Group, Circle, Line } from 'react-konva';
import { generateDummyTiles, NivaariTile, getColorForCategory, TileCategory } from '@/lib/tile-engine';
import { MapPin, ArrowUp, ArrowDown, Activity, Navigation } from 'lucide-react';
import { Button } from './ui/button';

interface CanvasTileMapProps {
  onTileSelect?: (tile: NivaariTile) => void;
}

const TILE_SIZE = 80;
const PADDING = 2;

export default function CanvasTileMap({ onTileSelect }: CanvasTileMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tiles, setTiles] = useState<NivaariTile[]>([]);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selectedTile, setSelectedTile] = useState<NivaariTile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Travel Mode State
  const [isTravelMode, setIsTravelMode] = useState(false);
  const [travelModeType, setTravelModeType] = useState<'train' | 'bus' | 'car'>('car');
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [travelPath, setTravelPath] = useState<{x: number, y: number}[]>([]);

  // Reset states when new tile selected
  useEffect(() => {
    setEditMode(false);
    setHasVoted(false);
  }, [selectedTile]);

  const handleUpvote = () => {
    if (selectedTile && !hasVoted) {
      setSelectedTile({ ...selectedTile, upvotes: selectedTile.upvotes + 1 });
      setHasVoted(true);
    }
  };

  const handleDownvote = () => {
    if (selectedTile && !hasVoted) {
      setSelectedTile({ ...selectedTile, downvotes: selectedTile.downvotes + 1 });
      setHasVoted(true);
    }
  };

  useEffect(() => {
    // Generate an initial chunk of dummy tiles around center (0,0)
    setTiles(generateDummyTiles(0, 0, 15));

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
        
        // Center the initial view
        setStagePosition({
          x: containerRef.current.offsetWidth / 2,
          y: containerRef.current.offsetHeight / 2
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simulate Travel Movement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTravelMode) {
      interval = setInterval(() => {
        setCurrentPosition(prev => {
          // move randomly
          const moveX = Math.random() > 0.5 ? 1 : 0;
          const moveY = moveX === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          
          const newPos = { x: prev.x + moveX, y: prev.y + moveY };
          
          // Update the tile at this position to become a "transportation" tile
          setTiles(currentTiles => {
            return currentTiles.map(t => {
              if (t.x === newPos.x && t.y === newPos.y && t.category !== 'transportation') {
                return { ...t, category: 'transportation' as TileCategory, color: getColorForCategory('transportation') };
              }
              return t;
            });
          });

          setTravelPath(pt => [...pt, newPos]);

          // Centering camera softly on user
          setStagePosition(sp => ({
            x: dimensions.width / 2 - (newPos.x * TILE_SIZE * scale),
            y: dimensions.height / 2 - (newPos.y * TILE_SIZE * scale)
          }));

          return newPos;
        });
      }, 1000); // Move every 1s
    }
    return () => clearInterval(interval);
  }, [isTravelMode, dimensions.width, dimensions.height, scale]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();

    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    // Limits
    if (newScale < 0.2 || newScale > 4) return;

    setScale(newScale);
    if (!isTravelMode) { // Only allow manual pan if not traveling
      setStagePosition({
        x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
        y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
      });
    }
  };

  const handleTileClick = (tile: NivaariTile) => {
    setSelectedTile(tile);
    if (onTileSelect) onTileSelect(tile);
  };

  // Convert travel path points to lines
  const points = travelPath.length > 0 ? travelPath.flatMap(p => [
    p.x * TILE_SIZE + TILE_SIZE / 2, 
    p.y * TILE_SIZE + TILE_SIZE / 2
  ]) : [];

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Map Canvas Layer */}
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable={!isTravelMode}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={stagePosition.x}
        y={stagePosition.y}
        className={`bg-gray-950 ${isTravelMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <Layer>
          {tiles.map((tile) => {
            const isSelected = selectedTile?.id === tile.id;
            const px = tile.x * TILE_SIZE;
            const py = tile.y * TILE_SIZE;
            const pWidth = tile.width * TILE_SIZE - PADDING;
            const pHeight = tile.height * TILE_SIZE - PADDING;

            return (
              <Group
                key={tile.id}
                x={px}
                y={py}
                onClick={() => handleTileClick(tile)}
                onTap={() => handleTileClick(tile)}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container && !isTravelMode) container.style.cursor = 'pointer';
                  e.target.opacity(0.8);
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container && !isTravelMode) container.style.cursor = 'grab';
                  e.target.opacity(1);
                }}
              >
                <Rect
                  width={pWidth}
                  height={pHeight}
                  fill={tile.color}
                  cornerRadius={8}
                  stroke={isSelected ? '#22d3ee' : '#ffffff20'}
                  strokeWidth={isSelected ? 3 / scale : 1 / scale}
                  shadowColor="black"
                  shadowBlur={isSelected ? 10 : 2}
                  shadowOpacity={0.3}
                  shadowOffset={{ x: 2, y: 2 }}
                />
                
                {/* Tile Label */}
                {scale > 0.6 && (
                  <Text
                    text={tile.category.substring(0, 3).toUpperCase()}
                    fill="#ffffff80"
                    fontSize={12}
                    fontFamily="monospace"
                    x={PADDING * 2}
                    y={PADDING * 2}
                  />
                )}
                
                {isSelected && (
                  <Rect width={pWidth} height={pHeight} fill="#22d3ee20" cornerRadius={8} />
                )}
              </Group>
            );
          })}
          
          {/* Active Travel Path */}
          {points.length > 2 && (
            <Line
              points={points}
              stroke="#eab308"
              strokeWidth={8 / scale}
              lineCap="round"
              lineJoin="round"
              shadowColor="#eab308"
              shadowBlur={10}
              shadowOpacity={0.8}
            />
          )}

          {/* Current Position Marker */}
          {(isTravelMode || points.length > 0) && (
            <Group 
              x={currentPosition.x * TILE_SIZE + TILE_SIZE / 2} 
              y={currentPosition.y * TILE_SIZE + TILE_SIZE / 2}
            >
              <Circle radius={16 / scale} fill="#22d3ee" shadowColor="#22d3ee" shadowBlur={15} />
              <Circle radius={8 / scale} fill="#ffffff" />
            </Group>
          )}

        </Layer>
      </Stage>

      {/* Floating Info Modal Overlay (HTML) */}
      {selectedTile && !isTravelMode && (
        <div className="absolute right-6 top-6 w-80 bg-gray-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/30 p-5 shadow-[0_0_30px_rgba(0,183,255,0.2)] animate-in slide-in-from-right-8 z-10 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                {selectedTile.name}
              </h3>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1 uppercase font-mono tracking-widest text-[10px]">
                <MapPin className="w-3 h-3 text-cyan-500" />
                Category: {selectedTile.category}
              </p>
            </div>
            <button 
              onClick={() => setSelectedTile(null)}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          </div>
          
          <div className="bg-black/40 rounded-xl p-3 mb-4 text-sm text-gray-300 leading-relaxed border border-white/5">
            {selectedTile.description}
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 bg-white/5 rounded-lg p-3 flex flex-col items-center border border-green-500/20">
              <span className="text-green-400 font-bold text-lg">{selectedTile.upvotes}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Approvals</span>
            </div>
            <div className="flex-1 bg-white/5 rounded-lg p-3 flex flex-col items-center border border-red-500/20">
              <span className="text-red-400 font-bold text-lg">{selectedTile.downvotes}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Disputes</span>
            </div>
          </div>

          {!editMode ? (
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => setEditMode(true)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Suggest Info Update
              </Button>
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpvote}
                  variant="outline" 
                  className={`flex-1 border-gray-700 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/50 ${hasVoted ? 'opacity-50 cursor-not-allowed' : 'text-gray-300'}`}
                  disabled={hasVoted}
                >
                  <ArrowUp className="w-4 h-4 mr-2" /> Verify
                </Button>
                <Button 
                  onClick={handleDownvote}
                  variant="outline" 
                  className={`flex-1 border-gray-700 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 ${hasVoted ? 'opacity-50 cursor-not-allowed' : 'text-gray-300'}`}
                  disabled={hasVoted}
                >
                  <ArrowDown className="w-4 h-4 mr-2" /> Dispute
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
              <textarea 
                placeholder="What info is incorrect? (e.g. Dimensions, category...)" 
                className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const el = document.querySelector('textarea');
                    if (el && el.value.trim()) {
                      alert('Suggestion submitted for moderator review.');
                      setEditMode(false);
                      el.value = '';
                    }
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Submit
                </Button>
                <Button 
                  onClick={() => setEditMode(false)}
                  variant="outline" 
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Travel Tracker Overlay */}
      {isTravelMode && (
         <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-yellow-500/20 border-2 border-yellow-500/50 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.3)]">
           <Activity className="w-5 h-5 text-yellow-400" />
           <span className="text-yellow-400 font-bold uppercase tracking-widest text-sm">Active Travel Monitoring</span>
         </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute left-6 bottom-6 flex flex-col gap-2 pointer-events-none">
        
        {/* Travel Toggle */}
        <div className="pointer-events-auto">
          <Button 
            onClick={() => {
              setIsTravelMode(!isTravelMode)
              if (!isTravelMode) {
                setTravelPath([{x: currentPosition.x, y: currentPosition.y}])
                setSelectedTile(null)
                setScale(1.5) // zoom in!
              }
            }}
            className={`rounded-full px-6 py-6 font-bold shadow-xl flex items-center gap-2 transition-all ${isTravelMode ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'}`}
          >
            <Navigation className="w-5 h-5" /> 
            {isTravelMode ? 'STOP TRAVEL' : 'START TRAVEL'}
          </Button>

          {/* Mode Selector */}
          {isTravelMode && (
            <div className="mt-2 flex gap-2 w-full animate-in slide-in-from-left-4">
              {['train', 'bus', 'car'].map(m => (
                <button 
                  key={m}
                  onClick={() => setTravelModeType(m as any)}
                  className={`flex-1 py-1 rounded border text-xs uppercase font-bold transition-all ${travelModeType === m ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-black/80 border-cyan-900 text-cyan-500 hover:bg-cyan-900'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 mt-4 bg-black/60 backdrop-blur-md rounded-full text-xs text-cyan-400 font-mono border border-cyan-500/20 w-fit">
          POS: {Math.round(-stagePosition.x / scale)}, {Math.round(-stagePosition.y / scale)} | Z: {scale.toFixed(2)}x
        </div>
      </div>
      
    </div>
  );
}
