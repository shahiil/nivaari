'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Edges, BakeShadows } from '@react-three/drei';
import { animated } from '@react-spring/three';
import { useNivaariStore, Tile } from '@/lib/nivaariStore';
import { useTravelMode } from '@/hooks/useTravelMode';
import * as THREE from 'three';
import CityStatsDashboard from '@/components/CityStatsDashboard';
import TutorialOverlay from '@/components/TutorialOverlay';
import { supabase } from '@/lib/supabaseClient';

// helper component to handle camera movement, sector detection, and locate-me command
function CameraDriver({
  dragStart,
  editMode,
}: { dragStart: [number, number] | null; editMode?: boolean }) {
  const controls = useRef<any>(null);
  const { camera } = useThree();
  const fetchSector = useNivaariStore((s) => s.fetchSector);
  const setSector = useNivaariStore((s) => s.setSector);
  const [pendingLocate, setPendingLocate] = useState<[number, number] | null>(null);

  useFrame(() => {
    // check for pending locate command
    if (pendingLocate) {
      const [gx, gz] = pendingLocate;
      camera.position.set(gx, 50, gz);
      controls.current?.target.set(gx, 0, gz);
      setPendingLocate(null);
      // also load sector
      const sx = Math.floor(gx / 50);
      const sz = Math.floor(gz / 50);
      fetchSector(sx, sz);
    }

    // sector boundary detection
    const sx = Math.floor(camera.position.x / 50);
    const sz = Math.floor(camera.position.z / 50);
    const curr = useNivaariStore.getState().currentSector;
    if (sx !== curr[0] || sz !== curr[1]) {
      setSector(sx, sz);
      fetchSector(sx, sz);
    }
  });

  // expose locate callback via global window for simplicity
  useEffect(() => {
    (window as any).nivaariLocate = async () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const metersPerDeg = 111320;
        const x = Math.floor(lon * metersPerDeg * Math.cos(lat * (Math.PI / 180)));
        const z = Math.floor(lat * metersPerDeg);
        setPendingLocate([x, z]);
      });
    };
  }, []);

  return <MapControls
    ref={controls}
    enableRotate={false}
    enablePan={!dragStart && !editMode}
    enableDamping
    dampingFactor={0.05}
    minZoom={10}
    maxZoom={100}
    touches={{ ONE: 'pan', TWO: 'dolly' } as any}
  />;
}

// memoized tile renderer to avoid rerenders when props unchanged
const MapTile = memo(function MapTile({
  tile,
  active,
  activeFilter,
  glow,
}: {
  tile: Tile;
  active: boolean;
  activeFilter: string;
  glow: boolean;
}) {
  // reuse logic previously inline
  let baseColor = '#4B5563';
  if (glow) baseColor = '#0ff';
  if (activeFilter === 'confidence' && tile.data) {
    const c = tile.data.confidence;
    if (c > 75) baseColor = '#22c55e';
    else if (c >= 40) baseColor = '#eab308';
    else baseColor = '#ef4444';
  } else if (activeFilter === 'zone' && tile.data) {
    baseColor = tile.data.zone === 'public' ? '#3B82F6' : '#a855f7';
  } else {
    // default colors/types
    if (tile.type === 'road') baseColor = '#4B5563';
    if (tile.type === 'building') baseColor = '#EF4444';
    if (tile.type === 'hospital') baseColor = '#3B82F6';
    if (tile.type === 'nature') baseColor = 'green';
    if (tile.type === 'police') baseColor = '#3B82F6';
    if (tile.type === 'industrial') baseColor = '#4B5563';
  }

  if (tile.type === 'road') {
    const color = activeFilter === 'default' ? '#4B5563' : 'rgba(75,85,99,0.4)';
    return (
      <group key={tile.id}>
        <mesh
          position={[tile.x + 0.5, 0.025, tile.z + 0.5]}
          receiveShadow
        >
          <planeGeometry args={[1, 1]} />
          <animated.meshStandardMaterial color={color as any} />
          {active && <Edges color="yellow" />}
        </mesh>
        {tile.data?.hasEmergency && (
          <EmergencyBeacon position={[tile.x + 0.5, 0.3, tile.z + 0.5]} />
        )}
      </group>
    );
  }

  if (tile.type === 'nature') {
    return (
      <group key={tile.id} position={[tile.x + 0.5, 0, tile.z + 0.5]}> 
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        {/* simple trees */}
        {[[-0.2, -0.2], [0.2, -0.2], [0, 0.2]].map((pos, i) => (
          <mesh key={i} position={[pos[0], 0.1, pos[1]]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color="#15803d" />
          </mesh>
        ))}
      </group>
    );
  }

  // building-like structures
  const w = tile.width ?? 1;
  const d = tile.depth ?? 1;
  const height = tile.type === 'hospital' ? 1.5 : 1;
  const centerX = tile.x + w / 2 - 0.5;
  const centerZ = tile.z + d / 2 - 0.5;
  return (
    <group key={tile.id} position={[centerX, 0, centerZ]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[Math.max(0.2, w - 0.2), height, Math.max(0.2, d - 0.2)]} />
        <animated.meshStandardMaterial color={baseColor as any} />
        {active && <Edges color="yellow" />}
      </mesh>
      {tile.type === 'hospital' && (
        <group position={[0, height / 2, Math.max(w, d) * 0.4]}> 
          <mesh>
            <boxGeometry args={[0.2, 0.8, 0.02]} />
            <meshStandardMaterial color="white" />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.2, 0.8, 0.02]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      )}
      {tile.type === 'police' && (
        <mesh position={[0, height + 0.1, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.01]} />
          <meshStandardMaterial color="white" />
        </mesh>
      )}
      {tile.type === 'industrial' && (
        <mesh position={[Math.max(w, d) * 0.4, height / 2, 0]}> 
          <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      )}
      {tile.data?.hasEmergency && (
        <EmergencyBeacon position={[0, height + 0.6, 0]} />
      )}
      {tile.isVerified && (
        <mesh position={[0, height + 0.8, 0]}> 
          <coneGeometry args={[0.2, 0.3, 6]} />
          <meshStandardMaterial color="gold" emissive="yellow" />
        </mesh>
      )}
      {tile.disaster && <DisasterAOE tile={tile} />}
    </group>
  );
});


// disaster area-of-effect ring
function DisasterAOE({ tile }: { tile: Tile }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.3 + Math.sin(t * 2) * 0.1;
    }
  });
  const color = tile.disaster?.category === 'natural' ? 'blue' : 'orange';
  return (
    <mesh ref={ref} position={[tile.x + 0.5, 0.01, tile.z + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[10, 64]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

// a simple animated beacon mesh used to mark emergencies
function EmergencyBeacon({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1 + Math.sin(t * 6) * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[0.2, 0.2, 0.5, 16]} />
      <meshStandardMaterial color="red" emissive="red" emissiveIntensity={1} transparent opacity={0.7} />
    </mesh>
  );
}

export default function HomePage() {
  const grid = useNivaariStore((s) => s.grid);
  const activeTool = useNivaariStore((s) => s.activeTool);
  const selectedTile = useNivaariStore((s) => s.selectedTile);
  const placeTile = useNivaariStore((s) => s.placeTile);
  const selectTile = useNivaariStore((s) => s.selectTile);
  const voteTile = useNivaariStore((s) => s.voteTile);

  const user = useNivaariStore((s) => s.user);
  const generateIdentity = useNivaariStore((s) => s.generateIdentity);
  const login = useNivaariStore((s) => s.login);
  const activeFilter = useNivaariStore((s) => s.activeFilter);
  const setActiveFilter = useNivaariStore((s) => s.setActiveFilter);
  const currentSector = useNivaariStore((s) => s.currentSector);
  const isLoadingSector = useNivaariStore((s) => s.isLoadingSector);
  const dragStart = useNivaariStore((s) => s.dragStart);
  const dragCurrent = useNivaariStore((s) => s.dragCurrent);
  const setDragStart = useNivaariStore((s) => s.setDragStart);
  const setDragCurrent = useNivaariStore((s) => s.setDragCurrent);
  const commitDrag = useNivaariStore((s) => s.commitDrag);

  // helper to determine if a tile is currently highlighted/selected
  const isActive = (tile: Tile) => selectedTile?.id === tile.id;

  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const [authMode, setAuthMode] = useState<'create' | 'recover'>('create');
  const [savedCheckbox, setSavedCheckbox] = useState(false);
  const [recoverId, setRecoverId] = useState('');
  const [recoverKey, setRecoverKey] = useState('');
  const [authComplete, setAuthComplete] = useState(user.isAuthenticated);

  const [statsOpen, setStatsOpen] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<Record<string, number>>({});
  const hasCompletedTutorial = useNivaariStore((s) => s.hasCompletedTutorial);
  const completeTutorial = useNivaariStore((s) => s.completeTutorial);
  const [editMode, setEditMode] = useState(false);
  const [editingPositions, setEditingPositions] = useState<Set<string>>(new Set());
  const [disasterMode, setDisasterMode] = useState(false);
  const [disasterTarget, setDisasterTarget] = useState<string | null>(null);
  const [pointerDownPos, setPointerDownPos] = useState<[number, number] | null>(null);
  const [pointerDownTime, setPointerDownTime] = useState<number>(0);

  const isTravelModeActive = useNivaariStore((s) => s.isTravelModeActive);
  const travelType = useNivaariStore((s) => s.travelType);
  const activateTravelMode = useNivaariStore((s) => s.activateTravelMode);
  const deactivateTravelMode = useNivaariStore((s) => s.deactivateTravelMode);

  useTravelMode();

  // on mount: load world from Supabase and subscribe to changes
  useEffect(() => {
    // initially load sector 0,0
    const sectorX = 0;
    const sectorZ = 0;
    useNivaariStore.getState().fetchSector(sectorX, sectorZ);

    if (!supabase) return;
    const handleRealtime = (payload: any) => {
      const r = payload.new;
      const tile: Tile = {
        id: r.id,
        x: r.x,
        z: r.z,
        type: r.type,
        width: r.width || undefined,
        depth: r.depth || undefined,
        data: r.data,
      };
      const current = useNivaariStore.getState().grid[tile.id];
      if (!current || JSON.stringify(current) !== JSON.stringify(tile)) {
        useNivaariStore.setState((state) => ({ grid: { ...state.grid, [tile.id]: tile } }));
        setRecentUpdates((prev) => ({ ...prev, [tile.id]: Date.now() }));
      }
    };

    const channel = supabase
      .channel('tiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tiles' }, handleRealtime)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tiles' }, handleRealtime)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // purge old glow entries periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRecentUpdates((prev) => {
        const out: typeof prev = {};
        for (const k in prev) if (now - prev[k] < 3000) out[k] = prev[k];
        return out;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePointerMove = (e: import('@react-three/fiber').ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const { x, z } = e.point;
    const hx = Math.floor(x);
    const hz = Math.floor(z);
    setHoverPos([hx, hz]);
    if (dragStart && (activeTool === 'building' || activeTool === 'hospital')) {
      setDragCurrent(hx, hz);
    }
  };

  const handleClick = (e: import('@react-three/fiber').ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const { x, z } = e.point;
    const hx = Math.floor(x);
    const hz = Math.floor(z);
    const id = `${hx},${hz}`;
    if (editMode && selectedTile) {
      setEditingPositions((prev) => {
        const s = new Set(prev);
        if (s.has(id)) s.delete(id);
        else s.add(id);
        return s;
      });
      return;
    }
    if (disasterMode && selectedTile) {
      setDisasterTarget(id);
      return;
    }
    if (activeTool === 'inspect') {
      selectTile(hx, hz);
    } else {
      // single tile placement still available when not dragging
      placeTile(hx, hz);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative touch-action-none">
      {/* authentication overlay */}
      {!authComplete && <AuthModal
        mode={authMode}
        setMode={setAuthMode}
        generateIdentity={generateIdentity}
        login={login}
        user={user}
        savedCheckbox={savedCheckbox}
        setSavedCheckbox={setSavedCheckbox}
        recoverId={recoverId}
        setRecoverId={setRecoverId}
        recoverKey={recoverKey}
        setRecoverKey={setRecoverKey}
        onComplete={() => setAuthComplete(true)}
      />}

      {authComplete && (
        <>
          {!hasCompletedTutorial && <TutorialOverlay onFinish={completeTutorial} />}
        <Canvas shadows dpr={[1,1.5]} frameloop="demand" className="absolute inset-0 z-0 touch-action-none">
        <BakeShadows />
        <OrthographicCamera makeDefault position={[50, 50, 50]} zoom={50} />
        <CameraDriver dragStart={dragStart} editMode={editMode} />
        <ambientLight intensity={0.5} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1}
        />

        {/* ground plane */}
        <mesh
          rotation-x={-Math.PI / 2}
          receiveShadow
          onPointerMove={handlePointerMove}
          onPointerDown={(e)=>{
            const ev = ((e as any).event || (e as any).domEvent) as PointerEvent;
            setPointerDownPos([ev.clientX, ev.clientY]);
            setPointerDownTime(Date.now());
            if (activeTool==='building' || activeTool==='hospital'){
              const {x,z}=e.point; setDragStart(Math.floor(x),Math.floor(z));
            }
          }}
          onPointerUp={(e)=>{
            const ev = ((e as any).event || (e as any).domEvent) as PointerEvent;
            const now = Date.now();
            const dt = now - pointerDownTime;
            const moved = pointerDownPos ? Math.hypot(ev.clientX - pointerDownPos[0], ev.clientY - pointerDownPos[1]) : 0;
            if (moved < 10 && dt < 250) {
              if (dragStart){ commitDrag(); }
              handleClick(e);
            }
            setPointerDownPos(null);
          }}
          onClick={(e)=>{/* handled in pointerUp */}}
        >
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>

        <gridHelper args={[100, 100, 'white', 'gray']} position={[0, 0.01, 0]} />

        {/* hover cursor */}
        {hoverPos && (
          <mesh position={[hoverPos[0] + 0.5, 0.01, hoverPos[1] + 0.5]}>
            <boxGeometry args={[1, 0.1, 1]} />
            <meshStandardMaterial color="yellow" transparent opacity={0.5} />
          </mesh>
        )}
        {/* drag preview */}
        {dragStart && dragCurrent && <DragPreview start={dragStart} current={dragCurrent} grid={grid} />}

        {/* rendered tiles */}
        {Object.values(grid).map((tile: Tile) => {
          const active = isActive(tile);
          const glow = recentUpdates[tile.id] && Date.now() - recentUpdates[tile.id] < 3000;
          return (
            <MapTile
              key={tile.id}
              tile={tile}
              active={active}
              activeFilter={activeFilter}
              glow={!!glow}
            />
          );
        })}
        {/* editable footprint overlay */}
        {editMode && Array.from(editingPositions).map((id) => {
          const [xStr,zStr]=id.split(',');
          const x=Number(xStr); const z=Number(zStr);
          return (
            <mesh key={id} position={[x+0.5,0.05,z+0.5]}>
              <boxGeometry args={[1,0.1,1]} />
              <meshStandardMaterial color="cyan" transparent opacity={0.5} />
            </mesh>
          );
        })}
      </Canvas>

      {/* 2D UI overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* top-left sector panel */}
        <div className="absolute top-4 left-4 pointer-events-auto bg-slate-800 bg-opacity-75 text-white p-3 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="font-bold">
              Sector: {currentSector[0]}{currentSector[0] >= 0 ? 'N' : 'S'} - {Math.abs(currentSector[1])}{currentSector[1] >= 0 ? 'E' : 'W'}
              {isLoadingSector && <span className="ml-1 animate-spin">⏳</span>}
            </div>
            <button
              className="text-xl"
              onClick={() => setStatsOpen((o) => !o)}
              title="Sector Statistics"
            >📊</button>
          </div>
          <div className="text-xs">Citizen: {user.socialId || '—'} | Rep: {user.reputation} ⭐️</div>
          <div className="text-sm">Active Contributors: 1,240</div>
        </div>

        {/* travel mode button */}
        <TravelModeButton
          active={isTravelModeActive}
          type={travelType}
          onStart={(t) => activateTravelMode(t)}
          onStop={() => deactivateTravelMode()}
          className="absolute top-4 right-32"
        />
        {/* locate me button */}
        <button
          className="absolute top-4 right-20 pointer-events-auto bg-slate-700 px-2 py-1 rounded text-white"
          title="Locate Me"
          onClick={() => (window as any).nivaariLocate?.()}
        >🎯</button>
        {/* AI assistant toggle button */}
        <button
          className="absolute top-4 right-24 pointer-events-auto bg-indigo-600 px-3 py-2 rounded-lg text-white shadow-lg"
          onClick={() => setChatOpen((o) => !o)}
        >
          🤖 AI Assistant
        </button>
        
        {/* map filter dropdown trigger */}
        <MapFilterDropdown
          active={activeFilter}
          onChange={setActiveFilter}
          className="absolute top-4 right-4"
        />

        {chatOpen && <NivaariAIWindow />}        
        {/* disaster category modal */}
        {disasterMode && selectedTile && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-white p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-bold">Disaster Type</h3>
              <div className="flex gap-4">
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded"
                  onClick={() => {
                    useNivaariStore.getState().reportMajorDisaster(selectedTile.id, 'manmade');
                    setDisasterMode(false);
                  }}
                >
                  Man-Made
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  onClick={() => {
                    useNivaariStore.getState().reportMajorDisaster(selectedTile.id, 'natural');
                    setDisasterMode(false);
                  }}
                >
                  Natural
                </button>
              </div>
              <button
                className="mt-2 px-4 py-2 bg-gray-300 rounded"
                onClick={() => setDisasterMode(false)}
              >Cancel</button>
            </div>
          </div>
        )}

        {/* legend for filter */}
        {activeFilter !== 'default' && (
          <div className="absolute bottom-4 left-4 pointer-events-none text-xs text-white">
            {activeFilter === 'confidence' && (
              <div className="flex items-center space-x-1">
                <span>Low</span>
                <div className="h-2 w-20 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"></div>
                <span>High</span>
              </div>
            )}
            {activeFilter === 'zone' && (
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">Public</span>
                <span className="text-purple-400">Private</span>
              </div>
            )}
          </div>
        )}
        {/* stats dashboard overlay */}
        <CityStatsDashboard open={statsOpen} onClose={() => setStatsOpen(false)} />

        {/* main toolbar (left sidebar on wide screens / bottom dock) */}
        <div className="absolute bottom-0 w-full flex justify-center gap-4 p-4 pb-[env(safe-area-inset-bottom)] pointer-events-auto bg-white/10 backdrop-blur-md">
          {(['inspect', 'road', 'building', 'hospital', 'nature', 'police', 'industrial'] as const).map(
            (tool) => {
              const icons: Record<typeof tool, string> = {
                inspect: '🔍',
                road: '🛣️',
                building: '🏢',
                hospital: '🏥',
                nature: '🌳',
                police: '🚓',
                industrial: '🏭',
              };
              return (
                <button
                  key={tool}
                  className={`w-12 h-12 rounded text-white flex flex-col items-center justify-center ${
                    activeTool === tool
                      ? 'bg-cyan-500 border-2 border-yellow-300'
                      : 'bg-gray-700'
                  }`}
                  onClick={() =>
                    useNivaariStore.setState({ activeTool: tool })
                  }
                >
                  <span className="text-xl">{icons[tool]}</span>
                  <span className="text-xs mt-1">
                    {tool.charAt(0).toUpperCase() + tool.slice(1)}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* Tile info modal component (only in inspect mode) */}
        {activeTool === 'inspect' && (
          <TileInfoModal
            tile={selectedTile}
            onVote={(type) => {
              if (selectedTile) voteTile(selectedTile.id, type);
            }}
            editMode={editMode}
            user={user}
            onEditStart={() => {
              if (selectedTile) {
                const newSet = new Set<string>();
                Object.entries(grid).forEach(([k,v]) => {
                  if (v === selectedTile) newSet.add(k);
                });
                setEditingPositions(newSet);
                setEditMode(true);
              }
            }}
            onSaveEdit={() => {
              if (selectedTile) {
                useNivaariStore.getState().updateTileShape(selectedTile.id, Array.from(editingPositions));
                setEditMode(false);
                setEditingPositions(new Set());
              }
            }}
            onCancelEdit={() => {
              setEditMode(false);
              setEditingPositions(new Set());
            }}
            onReportDisaster={() => { setDisasterMode(true); }}
          />
        )}
      </div>
      </>
      )}
    </div>
  );
}

//------------------------------------------------------------------------------
// Tile info modal slides up from bottom when there is a selected tile
function TileInfoModal({
  tile,
  onVote,
  editMode,
  user,
  onEditStart,
  onSaveEdit,
  onCancelEdit,
  onReportDisaster,
}: {
  tile: Tile | null;
  onVote: (type: 'upvote' | 'downvote') => void;
  editMode: boolean;
  user: { reputation: number };
  onEditStart?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onReportDisaster?: () => void;
}) {
  if (!tile) return null;

  const confidence = tile.data?.confidence ?? 0;
  const colorClass = confidence > 75 ? 'bg-green-500' : 'bg-yellow-400';

  return (
    <div
      className={`absolute left-0 right-0 bottom-0 pointer-events-auto bg-white/95 text-black p-6 shadow-xl transform transition-transform duration-300 ${
        tile ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ maxWidth: '400px', margin: '0 auto' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold capitalize">{tile.type}</h2>
        <span
          className={`px-2 py-1 rounded text-white text-sm ${colorClass}`}
        >
          {confidence}% Verified
        </span>
      </div>
      <p className="text-sm">
        Category: {tile.data?.category || 'Unspecified'} | Zone: {tile.data?.zone || 'Unknown'}
      </p>
      <div className="mt-6 flex justify-around">
        <button
          className="px-6 py-2 bg-green-500 text-white rounded-lg text-lg"
          onClick={() => onVote('upvote')}
        >
          👍 Correct
        </button>
        <button
          className="px-6 py-2 bg-red-500 text-white rounded-lg text-lg"
          onClick={() => onVote('downvote')}
        >
          👎 Incorrect
        </button>
      </div>
      <div className="mt-4 flex justify-center space-x-2">
        {!editMode && !tile.isVerified && (user.reputation > 500 || !tile.isVerified) && (
          <button
            className="px-4 py-2 bg-yellow-400 rounded"
            onClick={() => onEditStart && onEditStart()}
          >
            ✏️ Edit Shape
          </button>
        )}
        {!editMode && (
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded"
            onClick={() => onReportDisaster && onReportDisaster()}
          >
            ⚠️ Report Major Disaster
          </button>
        )}
        {editMode && (
          <>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={() => onSaveEdit && onSaveEdit()}
            >
              Save Correction
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={() => onCancelEdit && onCancelEdit()}
            >
              Cancel
            </button>
          </>
        )}
      </div>
      <EmergencySection tile={tile} />
    </div>
  );
}

// additional component to handle emergency reporting UI inside tile modal
function EmergencySection({ tile }: { tile: Tile }) {
  const reportEmergency = useNivaariStore((s) => s.reportEmergency);
  if (!tile) return null;
  return (
    <>
      {!tile.data?.hasEmergency && (
        <div className="mt-4 flex justify-center space-x-2">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => reportEmergency(tile.id, 'medical')}
          >
            🚑 Medical
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => reportEmergency(tile.id, 'fire')}
          >
            🚒 Fire
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => reportEmergency(tile.id, 'police')}
          >
            🚓 Police
          </button>
        </div>
      )}
      {tile.data?.hasEmergency && (
        <div className="mt-2 text-red-700 text-center">
          ⚠️ Emergency reported: {tile.data.emergencyType}
        </div>
      )}
    </>
  );
}

// AI chat window floating component
function NivaariAIWindow() {
  const chatHistory = useNivaariStore((s) => s.chatHistory);
  const sendMessage = useNivaariStore((s) => s.sendMessage);
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const t = input.trim();
    if (!t) return;
    sendMessage(t);
    setInput('');
  };

  return (
    <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-slate-900 border border-blue-500/50 rounded-lg flex flex-col pointer-events-auto">
      <div className="px-3 py-2 bg-slate-800 text-white font-bold">AI Assistant</div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-2 rounded ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white flex items-center'}`}>
              {msg.role === 'ai' && <span className="mr-1">🤖</span>}
              <pre className="whitespace-pre-wrap">{msg.text}</pre>
            </div>
          </div>
        ))}
      </div>
      <div className="flex p-2">
        <input
          className="flex-1 bg-slate-800 text-white p-1 rounded-l"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          className="bg-blue-500 text-white px-3 rounded-r"
          onClick={handleSubmit}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Authentication modal shown when no user is authenticated
function AuthModal({
  mode,
  setMode,
  generateIdentity,
  login,
  user,
  savedCheckbox,
  setSavedCheckbox,
  recoverId,
  setRecoverId,
  recoverKey,
  setRecoverKey,
  onComplete,
}: {
  mode: 'create' | 'recover';
  setMode: (m: 'create' | 'recover') => void;
  generateIdentity: () => void;
  login: (id: string, key: string) => boolean;
  user: { socialId: string | null; recoveryKey: string | null; isAuthenticated: boolean };
  savedCheckbox: boolean;
  setSavedCheckbox: (b: boolean) => void;
  recoverId: string;
  setRecoverId: (s: string) => void;
  recoverKey: string;
  setRecoverKey: (s: string) => void;
  onComplete: () => void;
}) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGenerate = () => {
    generateIdentity();
    setShowCredentials(true);
  };

  const handleLogin = () => {
    const ok = login(recoverId.trim(), recoverKey.trim());
    if (!ok) {
      setLoginError('Invalid ID or recovery key');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">
          Welcome to NIVAARI - Decentralized Mapping
        </h2>
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 ${mode === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('create')}
          >
            Create Identity
          </button>
          <button
            className={`flex-1 py-2 ${mode === 'recover' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setMode('recover')}
          >
            Recover Account
          </button>
        </div>
        {mode === 'create' ? (
          <div>
            {!showCredentials ? (
              <>
                <p className="mb-4">
                  NIVAARI requires no email, phone, or KYC. Click below to generate
                  a secure identity and recovery key.
                </p>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={handleGenerate}
                >
                  Generate Secure ID
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div>
                  <div className="font-bold">Social ID:</div>
                  <pre className="bg-gray-100 p-2 rounded">{user.socialId}</pre>
                </div>
                <div>
                  <div className="font-bold">Recovery Key:</div>
                  <pre className="bg-gray-100 p-2 rounded break-words">{user.recoveryKey}</pre>
                </div>
                <label className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    checked={savedCheckbox}
                    onChange={(e) => setSavedCheckbox(e.target.checked)}
                    className="mr-2"
                  />
                  I have saved my Recovery Key
                </label>
                <button
                  className={`w-full mt-4 px-4 py-2 rounded ${
                    savedCheckbox ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!savedCheckbox}
                  onClick={() => { if (savedCheckbox) onComplete(); }}
                >
                  Enter Map
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <input
                placeholder="Social ID"
                value={recoverId}
                onChange={(e) => setRecoverId(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <div>
              <input
                placeholder="Recovery Key"
                value={recoverKey}
                onChange={(e) => setRecoverKey(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            {loginError && <div className="text-red-500">{loginError}</div>}
            <button
              className="w-full bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => { handleLogin(); onComplete(); }}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// drag preview box
function DragPreview({
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
  // check overlap
  let overlap = false;
  for (let xi = minX; xi <= maxX; xi++) {
    for (let zi = minZ; zi <= maxZ; zi++) {
      if (grid[`${xi},${zi}`]) overlap = true;
    }
  }
  const color = overlap ? 'red' : 'blue';
  return (
    <mesh position={[minX + width/2, 0.01, minZ + depth/2]}>
      <boxGeometry args={[width, 0.1, depth]} />
      <meshStandardMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

// travel mode button + menu
function TravelModeButton({
  active,
  type,
  onStart,
  onStop,
  className,
}: {
  active: boolean;
  type: 'walk' | 'car' | 'train' | null;
  onStart: (t: 'walk' | 'car' | 'train') => void;
  onStop: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${className} relative`}>
      <button
        className={`px-3 py-2 rounded-lg ${active ? 'bg-green-500 animate-pulse' : 'bg-gray-800'} text-white`}
        onClick={() => setOpen((o) => !o)}
      >
        🧭
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-neutral-900 text-white rounded shadow-lg">
          {!active ? (
            <>
              <div className="px-3 py-2 cursor-pointer" onClick={() => { onStart('walk'); setOpen(false); }}>
                🚶 Walking
              </div>
              <div className="px-3 py-2 cursor-pointer" onClick={() => { onStart('car'); setOpen(false); }}>
                🚗 Car
              </div>
              <div className="px-3 py-2 cursor-pointer" onClick={() => { onStart('train'); setOpen(false); }}>
                🚆 Train
              </div>
            </>
          ) : (
            <div className="px-3 py-2 cursor-pointer" onClick={() => { onStop(); setOpen(false); }}>
              Stop Tracking
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// dropdown for selecting map filter
function MapFilterDropdown({
  active,
  onChange,
  className,
}: {
  active: 'default' | 'confidence' | 'zone';
  onChange: (f: 'default' | 'confidence' | 'zone') => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<[string, 'default' | 'confidence' | 'zone']> = [
    ['🌍 Default View', 'default'],
    ['✅ Verification Heatmap', 'confidence'],
    ['🏢 Zoning Map', 'zone'],
  ];
  return (
    <div className={`${className} relative`}>
      <button
        className="bg-neutral-800 text-white px-3 py-2 rounded-lg"
        onClick={() => setOpen((o) => !o)}
      >
        🗺️
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-900 text-white rounded shadow-lg">
          {options.map(([label, key]) => (
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