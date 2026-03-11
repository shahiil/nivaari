'use client';

import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Edges } from '@react-three/drei';
import { create } from 'zustand';

// --- NIVAARI DATA TYPES ---
type NivaariData = { category: string; zone: string; confidence: number; upvotes: number; downvotes: number; services: string[]; };
type Tile = { id: string; x: number; z: number; type: 'empty' | 'road' | 'house' | 'hospital'; data?: NivaariData; };
type ViewMode = 'world' | 'country' | 'state' | 'city';

interface GameState {
  viewMode: ViewMode;
  location: { world: string | null; country: string | null; state: string | null; city: string | null };
  grid: Record<string, Tile>;
  buildTool: 'cursor' | 'road' | 'house' | 'hospital';
  selectedTile: Tile | null;
  heatmapConfidence: boolean;
  
  navigate: (level: ViewMode, id: string) => void;
  navigateUp: (level: ViewMode) => void;
  toggleHeatmap: () => void;
  setBuildTool: (tool: 'cursor' | 'road' | 'house' | 'hospital') => void;
  selectTile: (x: number, z: number) => void;
  placeTile: (x: number, z: number) => void;
  voteTile: (id: string, type: 'up' | 'down') => void;
}

// --- ZUSTAND STORE ---
const useStore = create<GameState>((set) => ({
  viewMode: 'world', 
  location: { world: 'Earth', country: null, state: null, city: null },
  grid: {}, 
  buildTool: 'cursor',
  selectedTile: null,
  heatmapConfidence: false,
  
  navigate: (level, id) => set((s) => {
    const loc = { ...s.location };
    let nextMode: ViewMode = 'world';
    if (level === 'world') { loc.country = id; nextMode = 'country'; }
    if (level === 'country') { loc.state = id; nextMode = 'state'; }
    if (level === 'state') { loc.city = id; nextMode = 'city'; }
    return { location: loc, viewMode: nextMode, selectedTile: null };
  }),

  navigateUp: (level) => set((s) => {
    const loc = { ...s.location };
    if (level === 'world') { loc.country = null; loc.state = null; loc.city = null; }
    if (level === 'country') { loc.state = null; loc.city = null; }
    if (level === 'state') { loc.city = null; }
    return { location: loc, viewMode: level, selectedTile: null };
  }),
  
  toggleHeatmap: () => set((s) => ({ heatmapConfidence: !s.heatmapConfidence })),
  setBuildTool: (tool) => set({ buildTool: tool, selectedTile: null }),
  selectTile: (x, z) => set((state) => ({ selectedTile: state.grid[`${x},${z}`] || null })),

  placeTile: (x, z) => set((state) => {
    if (state.buildTool === 'cursor') return state;
    const key = `${x},${z}`;
    const baseData: NivaariData = {
      category: state.buildTool === 'hospital' ? 'health' : 'residential',
      zone: state.buildTool === 'hospital' ? 'public' : 'private',
      confidence: 50, upvotes: 1, downvotes: 0,
      services: state.buildTool === 'hospital' ? ['Emergency', 'Ambulance'] : ['Water', 'Power']
    };
    return { grid: { ...state.grid, [key]: { id: key, x, z, type: state.buildTool, data: state.buildTool !== 'road' ? baseData : undefined } } };
  }),

  voteTile: (id, type) => set((state) => {
    const tile = state.grid[id];
    if (!tile || !tile.data) return state;
    const newData = { ...tile.data };
    newData[type === 'up' ? 'upvotes' : 'downvotes'] += 1;
    newData.confidence = Math.round((newData.upvotes / (newData.upvotes + newData.downvotes)) * 100);
    const updatedTile = { ...tile, data: newData };
    return { grid: { ...state.grid, [id]: updatedTile }, selectedTile: state.selectedTile?.id === id ? updatedTile : state.selectedTile };
  })
}));

// --- SHARED RETRO UI STYLES ---
const retroBox = "bg-[#005c99] border-t-[3px] border-l-[3px] border-white/90 border-b-[4px] border-r-[4px] border-[#002b4d] text-white pixel-font shadow-md";
const retroBoxPressed = "bg-[#003d66] border-t-[4px] border-l-[4px] border-[#001122] border-b-[2px] border-r-[2px] border-white/50 text-white pixel-font shadow-sm";
const retroPanel = "bg-[#004d80] border-[4px] border-[#002b4d] outline outline-2 outline-white text-white pixel-font shadow-xl";

// --- MAIN ROUTER COMPONENT ---
export default function NivaariApp() {
  const { viewMode, location, navigateUp } = useStore();

  return (
    <main className="relative w-screen h-screen bg-black text-white overflow-hidden select-none">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        .pixel-font { font-family: 'VT323', monospace; letter-spacing: 0.5px; }
      `}} />

      {/* Retro Breadcrumb Navigation Bar */}
      <div className="absolute top-2 left-2 z-20 flex gap-1 pointer-events-auto">
        <button onClick={() => navigateUp('world')} className={`${retroBox} px-3 py-1 text-xl hover:text-yellow-300`}>
          🌍 World
        </button>
        {location.country && (
          <button onClick={() => navigateUp('country')} className={`${retroBox} px-3 py-1 text-xl hover:text-yellow-300`}>
            ▶ {location.country}
          </button>
        )}
        {location.state && (
          <button onClick={() => navigateUp('state')} className={`${retroBox} px-3 py-1 text-xl hover:text-yellow-300`}>
            ▶ {location.state}
          </button>
        )}
        {location.city && (
          <div className={`${retroBox} px-3 py-1 text-xl text-yellow-300`}>
            ▶ {location.city}
          </div>
        )}
      </div>

      {viewMode === 'city' ? <CityCanvas /> : <AtlasCanvas viewMode={viewMode} />}
    </main>
  );
}

// ==========================================
// 1. DYNAMIC ATLAS VIEW (World / Country / State)
// ==========================================
function AtlasCanvas({ viewMode }: { viewMode: ViewMode }) {
  const { location, navigate } = useStore();
  const [hovered, setHovered] = useState<string | null>(null);

  // Generate different grid sizes and labels based on the zoom level
  const atlasData = useMemo(() => {
    const data = [];
    if (viewMode === 'world') {
      // Mock Continents/Countries
      data.push({ id: 'North America', x: -20, z: -20, color: '#365e32' });
      data.push({ id: 'USA', x: -20, z: -5, color: '#4a7a42' });
      data.push({ id: 'Brazil', x: -10, z: 20, color: '#2d6a4f' });
      data.push({ id: 'Europe', x: 5, z: -20, color: '#365e32' });
      data.push({ id: 'India', x: 20, z: 0, color: '#b45309' }); // Distinct color for India
      data.push({ id: 'Japan', x: 40, z: -5, color: '#365e32' });
    } else if (viewMode === 'country') {
      // Mock States inside a country
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          const names = ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Punjab', 'Kerala', 'Tamil Nadu', 'Assam', 'Goa'];
          data.push({ id: names[(x+1)*3 + (z+1)] || `Region ${x},${z}`, x: x * 15, z: z * 15, color: '#4a7a42' });
        }
      }
    } else if (viewMode === 'state') {
      // Mock Sectors inside a state
      for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
          data.push({ id: `Sector ${x+3}-${z+3}`, x: x * 10, z: z * 10, color: '#365e32', hasCity: x===0 && z===0 });
        }
      }
    }
    return data;
  }, [viewMode]);

  return (
    <>
      <div className="absolute inset-0 z-0 bg-[#050510]">
        <Canvas shadows>
          <OrthographicCamera makeDefault position={[100, 100, 100]} zoom={viewMode === 'world' ? 6 : viewMode === 'country' ? 10 : 15} near={-200} far={500} />
          <MapControls enableRotate={false} maxZoom={30} minZoom={2} /> 
          <ambientLight intensity={0.8} />
          <directionalLight position={[50, 80, 20]} intensity={1.5} castShadow />
          
          <group>
            {/* Ocean / Base Layer */}
            <mesh position={[0, -2, 0]} receiveShadow>
              <boxGeometry args={[150, 2, 150]} />
              <meshStandardMaterial color={viewMode === 'world' ? "#1e3a8a" : "#2d2218"} />
            </mesh>

            {atlasData.map((block) => (
              <group key={block.id} position={[block.x, 0, block.z]}>
                <mesh 
                  onPointerOver={(e) => { e.stopPropagation(); setHovered(block.id); }}
                  onPointerOut={() => setHovered(null)}
                  onClick={(e) => { e.stopPropagation(); navigate(viewMode, block.id); }}
                  receiveShadow
                >
                  <boxGeometry args={[viewMode === 'world' ? 14 : viewMode === 'country' ? 14 : 9, 1, viewMode === 'world' ? 14 : viewMode === 'country' ? 14 : 9]} />
                  <meshStandardMaterial color={hovered === block.id ? '#ffff00' : block.color} />
                  
                  {/* Mock mini cities if looking at a state level */}
                  {(block as any).hasCity && (
                     <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[4, 4, 4]}/><meshStandardMaterial color="#aaaaaa"/></mesh>
                  )}
                </mesh>
              </group>
            ))}
          </group>
        </Canvas>
      </div>

      {/* Hover Info Overlay */}
      {hovered && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className={`${retroPanel} px-6 py-3 text-3xl animate-in slide-in-from-bottom-2`}>
            {hovered} <span className="text-xl text-yellow-300 ml-2">(Click to Enter)</span>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// 2. CITY VIEW (3D Builder Grid)
// ==========================================
function CityCanvas() {
  const { buildTool, setBuildTool, selectedTile, toggleHeatmap, grid, voteTile } = useStore();

  return (
    <>
      <div className="absolute inset-0 z-0 bg-[#0a0a1a]">
        <Canvas shadows>
          <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={40} near={-100} far={500} />
          <MapControls enableRotate={false} enabled={buildTool === 'cursor'} /> 
          <ambientLight intensity={0.7} />
          <directionalLight position={[20, 30, 10]} intensity={1.5} castShadow />
          <CityScene />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Right Stats/Tools */}
        <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto">
          <div className={`${retroBox} px-3 py-1 flex items-center text-xl`}>
            <span className="mr-2">👥</span> {Object.keys(grid).length * 12}
          </div>
          <button onClick={toggleHeatmap} className={`${retroBox} w-10 h-10 flex items-center justify-center text-xl active:scale-95`}>
            📊
          </button>
        </div>

        {/* Left Vertical Tool Palette */}
        <div className="absolute top-16 left-2 flex flex-col gap-1 pointer-events-auto">
          <ToolButton icon="🔍" active={buildTool === 'cursor'} onClick={() => setBuildTool('cursor')} />
          <ToolButton icon="🚜" active={false} onClick={() => console.log('Bulldoze')} />
          <div className="h-2" />
          <ToolButton icon="🛣️" active={buildTool === 'road'} onClick={() => setBuildTool('road')} />
          <ToolButton icon="🏠" active={buildTool === 'house'} onClick={() => setBuildTool('house')} />
          <ToolButton icon="🏥" active={buildTool === 'hospital'} onClick={() => setBuildTool('hospital')} />
        </div>

        {/* Center: Inspect Panel */}
        {selectedTile && selectedTile.data && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-sm">
            <div className={`${retroPanel} p-4 animate-in slide-in-from-bottom-4`}>
              <div className="flex justify-between border-b-2 border-[#002b4d] pb-2">
                <div>
                  <h2 className="text-3xl uppercase text-yellow-300">{selectedTile.type}</h2>
                  <p className="text-lg text-blue-200">{selectedTile.data.category}</p>
                </div>
                <div className={`text-xl ${selectedTile.data.confidence > 75 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {selectedTile.data.confidence}% Ver.
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => voteTile(selectedTile.id, 'up')} className={`${retroBox} flex-1 py-2 text-xl active:translate-y-1`}>👍 {selectedTile.data.upvotes}</button>
                <button onClick={() => voteTile(selectedTile.id, 'down')} className={`${retroBox} flex-1 py-2 text-xl active:translate-y-1`}>👎 {selectedTile.data.downvotes}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function CityScene() {
  const { placeTile, selectTile, buildTool, grid, selectedTile } = useStore();
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);

  const handlePointerMove = (e: any) => { e.stopPropagation(); setHoverPos([Math.floor(e.point.x) + 0.5, Math.floor(e.point.z) + 0.5]); };
  const handleClick = (e: any) => { e.stopPropagation(); const x = Math.floor(e.point.x) + 0.5; const z = Math.floor(e.point.z) + 0.5; if (buildTool === 'cursor') selectTile(x, z); else placeTile(x, z); };

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerMove={handlePointerMove} onPointerOut={() => setHoverPos(null)} onClick={handleClick} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#365e32" /> 
      </mesh>
      <gridHelper args={[100, 100, '#4a7a42', '#4a7a42']} position={[0, 0.01, 0]} />

      {hoverPos && (
        <mesh position={[hoverPos[0], 0.02, hoverPos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={buildTool === 'cursor' ? "#ffffff" : "#ffff00"} opacity={0.5} transparent />
        </mesh>
      )}

      {selectedTile && (
        <mesh position={[selectedTile.x, 0.03, selectedTile.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ffff00" opacity={0.6} transparent />
          <Edges color="#ffffff" />
        </mesh>
      )}

      {Object.values(grid).map((tile) => (
        <mesh key={tile.id} position={[tile.x, tile.type === 'hospital' ? 0.75 : 0.5, tile.z]} castShadow>
          {tile.type === 'road' ? <planeGeometry args={[1, 1]} /> : <boxGeometry args={[0.8, tile.type === 'hospital' ? 1.5 : 1, 0.8]} />}
          <meshStandardMaterial color={tile.type === 'road' ? "#555" : tile.type === 'hospital' ? "#cc0000" : "#ccc"} />
          {tile.type !== 'road' && <Edges color="#000" />}
        </mesh>
      ))}
    </>
  );
}

function ToolButton({ icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-[50px] h-[50px] flex items-center justify-center transition-none text-white pixel-font shadow-sm ${active ? retroBoxPressed : retroBox}`}>
      <span className="text-2xl leading-none">{icon}</span>
    </button>
  );
}