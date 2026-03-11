'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef, memo, useCallback, type ElementRef } from 'react';
import { useThree, useFrame, Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Edges, BakeShadows, Text } from '@react-three/drei';
import { useNivaariStore, Tile } from '@/lib/nivaariStore';
import { useTravelMode } from '@/hooks/useTravelMode';
import { useTileRealtime } from '@/hooks/useTileRealtime';
import * as THREE from 'three';
import AuthModal from '@/components/nivaari/AuthModal';
import DragPreview from '@/components/nivaari/DragPreview';
import MapFilterDropdown from '@/components/nivaari/MapFilterDropdown';
import TileInfoModal from '@/components/nivaari/TileInfoModal';
import TravelModeButton from '@/components/nivaari/TravelModeButton';
import type { ActiveFilter, ViewMode } from '@/lib/nivaariStore';
import { getAtlasBlocks, type AtlasBlock } from '@/lib/nivaari/atlas-data';

const CityStatsDashboard = dynamic(() => import('@/components/CityStatsDashboard'), { ssr: false });
const TutorialOverlay = dynamic(() => import('@/components/TutorialOverlay'), { ssr: false });
const NivaariAIWindow = dynamic(() => import('@/components/nivaari/NivaariAIWindow'), { ssr: false });

interface NivaariExperienceProps {
  initialStatsOpen?: boolean;
  initialFilter?: ActiveFilter;
  routeLabel?: string;
}

type GroundPointerEvent = ThreeEvent<PointerEvent>;

declare global {
  interface Window {
    nivaariLocate?: () => Promise<void>;
  }
}

// helper component to handle camera movement, sector detection, and locate-me command
function CameraDriver({
  dragStart,
  editMode,
}: { dragStart: [number, number] | null; editMode?: boolean }) {
  const controls = useRef<ElementRef<typeof MapControls> | null>(null);
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
    window.nivaariLocate = async () => {
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
    touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN }}
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
          position={[tile.x + 0.5, 0.03, tile.z + 0.5]}
          receiveShadow
        >
          <boxGeometry args={[1, 0.06, 1]} />
          <meshStandardMaterial color={color} />
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
  const centerX = tile.x + w / 2;
  const centerZ = tile.z + d / 2;
  return (
    <group key={tile.id} position={[centerX, 0, centerZ]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[Math.max(0.2, w - 0.2), height, Math.max(0.2, d - 0.2)]} />
        <meshStandardMaterial color={baseColor} />
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

function AtlasCanvas({
  viewMode,
  currentCountry,
  currentState,
  onSelect,
}: {
  viewMode: Exclude<ViewMode, 'city'>;
  currentCountry: string | null;
  currentState: string | null;
  onSelect: (block: AtlasBlock) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const blocks = getAtlasBlocks(viewMode, currentCountry, currentState);
  const zoom = viewMode === 'world' ? 7 : viewMode === 'country' ? 11 : 15;

  return (
    <Canvas shadows dpr={[1, 1.5]} className="absolute inset-0 z-0 touch-action-none">
      <OrthographicCamera makeDefault position={[100, 100, 100]} zoom={zoom} near={-200} far={500} />
      <MapControls enableRotate={false} maxZoom={30} minZoom={4} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[50, 80, 20]} intensity={1.4} castShadow />
      <mesh position={[0, -2, 0]} receiveShadow>
        <boxGeometry args={[160, 2, 160]} />
        <meshStandardMaterial color={viewMode === 'world' ? '#102857' : '#1b2d21'} />
      </mesh>
      {blocks.map((block) => (
        <group key={block.id} position={[block.x, 0, block.z]}>
          <mesh
            receiveShadow
            castShadow
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(block.id);
            }}
            onPointerOut={() => setHovered(null)}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(block);
            }}
          >
            <boxGeometry args={[12, 1.2, 12]} />
            <meshStandardMaterial color={hovered === block.id ? '#fde047' : block.color} />
          </mesh>
          {block.hasCity && (
            <mesh position={[0, 2.4, 0]} castShadow>
              <boxGeometry args={[3.5, 3.5, 3.5]} />
              <meshStandardMaterial color="#dbeafe" />
            </mesh>
          )}
          <Text
            position={[0, 2.2, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1.8}
            color={hovered === block.id ? '#ffffff' : '#dbeafe'}
            anchorX="center"
            anchorY="middle"
            maxWidth={14}
          >
            {block.id}
          </Text>
        </group>
      ))}
    </Canvas>
  );
}

export default function NivaariExperience({
  initialStatsOpen = false,
  initialFilter = 'default',
  routeLabel,
}: NivaariExperienceProps) {
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
  const viewMode = useNivaariStore((s) => s.viewMode);
  const currentCountry = useNivaariStore((s) => s.currentCountry);
  const currentState = useNivaariStore((s) => s.currentState);
  const setViewMode = useNivaariStore((s) => s.setViewMode);
  const setLocationHierarchy = useNivaariStore((s) => s.setLocationHierarchy);
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

  const [statsOpen, setStatsOpen] = useState(initialStatsOpen);
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

  useEffect(() => {
    useNivaariStore.setState({ activeFilter: initialFilter });
  }, [initialFilter]);

  const recordRecentUpdate = useCallback((tileId: string) => {
    setRecentUpdates((prev) => ({ ...prev, [tileId]: Date.now() }));
  }, []);

  useTileRealtime(recordRecentUpdate);

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

  const handlePointerMove = (e: GroundPointerEvent) => {
    e.stopPropagation();
    const { x, z } = e.point;
    const hx = Math.floor(x);
    const hz = Math.floor(z);
    setHoverPos([hx, hz]);
    if (dragStart && (activeTool === 'building' || activeTool === 'hospital')) {
      setDragCurrent(hx, hz);
    }
  };

  const handleClick = (e: GroundPointerEvent) => {
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

  const handleAtlasSelect = useCallback((block: AtlasBlock) => {
    if (viewMode === 'world') {
      setLocationHierarchy(block.id, null);
      setViewMode('country');
      return;
    }
    if (viewMode === 'country') {
      setLocationHierarchy(currentCountry, block.id);
      setViewMode('state');
      return;
    }
    setLocationHierarchy(currentCountry, currentState, [0, 0]);
    setViewMode('city');
  }, [currentCountry, currentState, setLocationHierarchy, setViewMode, viewMode]);

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
        {viewMode === 'city' ? (
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
            const ev = e.nativeEvent;
            setPointerDownPos([ev.clientX, ev.clientY]);
            setPointerDownTime(Date.now());
            if (activeTool==='building' || activeTool==='hospital'){
              const {x,z}=e.point; setDragStart(Math.floor(x),Math.floor(z));
            }
          }}
          onPointerUp={(e)=>{
            const ev = e.nativeEvent;
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
        ) : (
          <AtlasCanvas
            viewMode={viewMode}
            currentCountry={currentCountry}
            currentState={currentState}
            onSelect={handleAtlasSelect}
          />
        )}

      {/* 2D UI overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* top-left sector panel */}
        <div className="absolute top-4 left-4 pointer-events-auto bg-slate-800 bg-opacity-75 text-white p-3 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] rounded-lg shadow-lg">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.15em] text-slate-300">
            <button className={`rounded px-2 py-1 ${viewMode === 'world' ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`} onClick={() => { setLocationHierarchy(null, null); setViewMode('world'); }}>
              World
            </button>
            {currentCountry && (
              <button className={`rounded px-2 py-1 ${viewMode === 'country' ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`} onClick={() => setViewMode('country')}>
                {currentCountry}
              </button>
            )}
            {currentState && (
              <button className={`rounded px-2 py-1 ${viewMode === 'state' ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`} onClick={() => setViewMode('state')}>
                {currentState}
              </button>
            )}
            <button className={`rounded px-2 py-1 ${viewMode === 'city' ? 'bg-cyan-600 text-white' : 'bg-slate-700'}`} onClick={() => setViewMode('city')}>
              City
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="font-bold">
              {viewMode === 'city'
                ? `Sector: ${currentSector[0]}${currentSector[0] >= 0 ? 'N' : 'S'} - ${Math.abs(currentSector[1])}${currentSector[1] >= 0 ? 'E' : 'W'}`
                : `Viewing ${viewMode}`}
              {isLoadingSector && <span className="ml-1 animate-spin">⏳</span>}
            </div>
            {routeLabel && (
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-cyan-200">
                {routeLabel}
              </span>
            )}
            <button
              className="text-xl"
              onClick={() => setStatsOpen((o) => !o)}
              title="Sector Statistics"
            >📊</button>
          </div>
          <div className="text-xs">
            Citizen: {user.socialId || '—'} | Rep: {user.reputation} ⭐️
            {currentCountry ? ` | Country: ${currentCountry}` : ''}
            {currentState ? ` | State: ${currentState}` : ''}
          </div>
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
          onClick={() => window.nivaariLocate?.()}
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
        {viewMode === 'city' && <CityStatsDashboard open={statsOpen} onClose={() => setStatsOpen(false)} />}

        {/* main toolbar (left sidebar on wide screens / bottom dock) */}
        {viewMode === 'city' && (
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
        )}

        {/* Tile info modal component (only in inspect mode) */}
        {viewMode === 'city' && activeTool === 'inspect' && (
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
