'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, MapControls, Html, Edges } from '@react-three/drei';

export default function GameUI() {
  const [camPos, setCamPos] = useState<[number, number, number]>([0,0,0]);
  const [camZoom, setCamZoom] = useState(1);
  const [date, setDate] = useState(new Date(2021,5,16));
  const [editingDate, setEditingDate] = useState(false);

  // Toggle between 'city' and 'region'
  const [viewLevel, setViewLevel] = useState<'city'|'region'>('city');
  const [currentName, setCurrentName] = useState('Stuckenborstel');

  useEffect(() => {
    setCurrentName(viewLevel === 'city' ? 'Stuckenborstel' : 'Theonia');
  }, [viewLevel]);

  return (
    <main className="relative w-screen h-screen text-white font-sans overflow-hidden select-none">
      
      {/* --- 3D GAME WORLD LAYER --- */}
      <div className={`absolute inset-0 z-0 transition-colors duration-500 ${viewLevel === 'city' ? 'bg-indigo-950' : 'bg-[#0a0a0a]'}`}>
        <Canvas shadows>
          <OrthographicCamera 
            makeDefault 
            position={[50, 50, 50]} 
            zoom={viewLevel === 'city' ? 40 : 25} 
            near={-100} 
            far={500} 
          />
          <MapControls enableRotate={false} /> 

          {viewLevel === 'city' ? (
            <CityScene onCameraMove={setCamPos} onZoom={setCamZoom} />
          ) : (
            <RegionScene />
          )}
        </Canvas>
      </div>

      {/* --- UI OVERLAY LAYER --- */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {viewLevel === 'city' ? (
          <CityUI 
            currentName={currentName}
            date={date}
            setDate={setDate}
            editingDate={editingDate}
            setEditingDate={setEditingDate}
            setViewLevel={setViewLevel}
            camPos={camPos}
            camZoom={camZoom}
          />
        ) : (
          <RegionUI 
            currentName={currentName} 
            setViewLevel={setViewLevel} 
          />
        )}
      </div>
    </main>
  );
}

/* =========================================
   3D SCENES
========================================= */

function CityScene({ onCameraMove, onZoom }: { onCameraMove: (pos: [number,number,number]) => void, onZoom: (z: number) => void }) {
  useFrame(({ camera }) => {
    onCameraMove([camera.position.x, camera.position.y, camera.position.z]);
    onZoom(camera.zoom);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>

      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
        <planeGeometry args={[100, 4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      <Building position={[-5, 1, -5]} color="#fca5a5" scale={[3, 2, 3]} /> 
      <Building position={[4, 3, 4]} color="#93c5fd" scale={[2, 6, 2]} /> 
      <Building position={[5, 1.5, -3]} color="#fde047" scale={[2, 3, 2]} /> 
      <Building position={[-4, 1, 6]} color="#ffffff" scale={[2, 2, 2]} /> 
    </>
  );
}

function RegionScene() {
  const tiles = [];
  for(let x = -2; x <= 1; x++) {
    for(let z = -2; z <= 1; z++) {
      tiles.push({ 
        id: `${x}-${z}`, 
        x: x * 10 + 5, 
        z: z * 10 + 5, 
        locked: !(x === 0 && z === 0) 
      });
    }
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[20, 30, 10]} intensity={1} castShadow />

      <group position={[0, 0, 0]}>
        {tiles.map((tile) => (
          <RegionTile key={tile.id} position={[tile.x, 0, tile.z]} locked={tile.locked} isCenter={!tile.locked} />
        ))}
      </group>
    </>
  );
}

function RegionTile({ position, locked, isCenter }: { position: [number, number, number], locked: boolean, isCenter: boolean }) {
  return (
    <group position={position}>
      <mesh receiveShadow castShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[10, 1, 10]} />
        <meshStandardMaterial color={isCenter ? "#3b5e2b" : "#456b33"} />
        <Edges scale={1} threshold={15} color="#1a2e12" />
      </mesh>
      
      <mesh receiveShadow position={[0, -1.5, 0]}>
        <boxGeometry args={[10, 1, 10]} />
        <meshStandardMaterial color="#4a3b2c" />
        <Edges scale={1} threshold={15} color="#2b2219" />
      </mesh>

      {locked && (
        <Html position={[0, 0.5, 0]} center transform sprite>
          <div className="text-2xl drop-shadow-lg opacity-90">🔒</div>
        </Html>
      )}

      {isCenter && (
        <group position={[0, 0, 0]}>
          <Building position={[-1, 0.5, -1]} color="#ccc" scale={[1, 1, 1]} />
          <Building position={[1, 0.25, 1]} color="#fca5a5" scale={[1, 0.5, 1]} />
          <Building position={[-0.5, 0.75, 1.5]} color="#93c5fd" scale={[0.8, 1.5, 0.8]} />
        </group>
      )}
    </group>
  );
}

function Building({ position, color, scale }: { position: [number, number, number], color: string, scale: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={scale} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/* =========================================
   UI OVERLAYS
========================================= */

// --- FULL CITY UI ---
function CityUI({ currentName, date, setDate, editingDate, setEditingDate, setViewLevel, camPos, camZoom }: any) {
  const prevDay = () => setDate((d: Date) => new Date(d.getTime() - 24*60*60*1000));
  const nextDay = () => setDate((d: Date) => new Date(d.getTime() + 24*60*60*1000));
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(new Date(e.target.value));
    setEditingDate(false);
  };

  const viewportStyle = useMemo(() => {
    const sizeX = 100, sizeZ = 100, mapW = 32, mapH = 24, baseZoom = 40;
    const xPerc = (camPos[0] + sizeX/2) / sizeX;
    const zPerc = (camPos[2] + sizeZ/2) / sizeZ;
    const w = 12 * (baseZoom / camZoom);
    const h = 9 * (baseZoom / camZoom);
    return {
      left: `${xPerc * mapW}px`,
      top: `${zPerc * mapH}px`,
      width: `${w}px`,
      height: `${h}px`,
    };
  }, [camPos, camZoom]);

  return (
    <>
      {/* TOP LEFT: City Info */}
      <div className="absolute top-2 left-20 flex items-center gap-2 pointer-events-auto shadow-lg">
        <div className="bg-[#004b87] border-2 border-[#0066cc] rounded-md px-4 py-1 flex items-center gap-4">
          <span className="font-bold tracking-wide">{currentName}</span>
          <div className="flex items-center gap-1 text-sm font-semibold">
            <span>👥</span><span>7,525</span>
          </div>
        </div>
        <div className="bg-[#004b87] border-2 border-[#0066cc] rounded-md px-3 py-1 flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center text-black text-xs">😃</div>
          <span className="text-green-400 font-bold">79%-</span>
        </div>
      </div>

      {/* TOP RIGHT: Level & Build Tools */}
      <div className="absolute top-2 right-4 flex items-start gap-4 pointer-events-auto">
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="flex gap-2">
            <button className="text-2xl hover:scale-110 transition-transform cursor-pointer">🔨</button>
            <button className="text-2xl hover:scale-110 transition-transform cursor-pointer">⬇️</button>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 rounded-full border-4 border-gray-600 bg-gray-900 flex items-center justify-center shadow-lg">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="26" stroke="#eab308" strokeWidth="4" fill="none" strokeDasharray="163" strokeDashoffset="40" />
            </svg>
            <span className="text-2xl font-bold">8</span>
          </div>
          <span className="text-xs font-semibold mt-1 drop-shadow-md">Large Town</span>
        </div>
      </div>

      {/* LEFT SIDEBAR: Tools */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 w-14 pointer-events-auto">
        <SidebarButton icon="🔨" active />
        <SidebarButton icon="🚜" />
        <SidebarButton icon="🔍" />
        <SidebarButton icon="🚧" />
        <SidebarButton icon="📊" />
        <SidebarButton icon="🗺️" onClick={() => setViewLevel('region')} />
        
        <div className="absolute top-[calc(100vh-8rem)] flex flex-col gap-1">
          <SidebarButton icon="🌍" />
          <SidebarButton icon="⚙️" />
        </div>
      </div>

      {/* RIGHT SIDEBAR: Action Bubbles */}
      <div className="absolute top-1/3 right-4 flex flex-col gap-4 pointer-events-auto">
        <BubbleButton icon="🎁" highlight />
        <BubbleButton icon="🧍" />
        <BubbleButton icon="🏛️" star />
      </div>

      {/* BOTTOM LEFT: Time Controls */}
      <div className="absolute bottom-2 left-20 pointer-events-auto">
        <div className="bg-[#004b87] border-2 border-[#0066cc] rounded-md flex items-center overflow-hidden h-10 shadow-lg">
          <div className="px-3 bg-white/10 h-full flex items-center border-r border-[#0066cc]">🕐</div>
          
          <button onClick={prevDay} className="px-2 hover:bg-white/20 h-full flex items-center text-white cursor-pointer">◀</button>
          {editingDate ? (
             <input type="date" className="px-2 text-black" value={date.toISOString().substring(0,10)} onChange={handleDateChange} onBlur={() => setEditingDate(false)} autoFocus />
          ) : (
            <span onClick={() => setEditingDate(true)} className="px-2 font-bold tracking-wide border-r border-[#0066cc] cursor-pointer">
              {date.toLocaleDateString('en-GB')}
            </span>
          )}
          <button onClick={nextDay} className="px-2 border-r border-[#0066cc] hover:bg-white/20 h-full flex items-center text-white cursor-pointer">▶</button>

          <button className="px-3 hover:bg-white/20 h-full flex items-center text-yellow-400 cursor-pointer">⏸</button>
          <button className="px-3 hover:bg-white/20 h-full flex items-center bg-white/10 text-green-400 cursor-pointer">▶</button>
          <button className="px-3 hover:bg-white/20 h-full flex items-center text-cyan-400 cursor-pointer">▶▶</button>
          <button className="px-3 hover:bg-white/20 h-full flex items-center text-cyan-400 cursor-pointer">⏭</button>
        </div>
      </div>
      
      {/* BOTTOM RIGHT: Currency & Minimap */}
      <div className="absolute bottom-2 right-2 flex items-end gap-3 pointer-events-auto">
        
        <div className="flex gap-2 mb-1 shadow-lg">
          <div className="bg-[#004b87] border-2 border-[#0066cc] rounded-md px-3 py-1.5 flex items-center gap-2">
            <span>💎</span>
            <span className="font-bold text-blue-200">+180</span>
          </div>
          <div className="bg-[#004b87] border-2 border-[#0066cc] rounded-md px-3 py-1.5 flex items-center gap-2">
            <span>🪙</span>
            <span className="font-bold text-yellow-300">163K<span className="text-xs">₮</span></span>
            <span className="font-bold text-green-400 text-sm">+11.5K<span className="text-xs text-green-400">₮</span></span>
          </div>
        </div>

        <div className="w-32 h-24 bg-[#5a6e5a] border-4 border-gray-400 rounded-md relative shadow-lg overflow-hidden">
          <div className="absolute top-1 left-1 w-6 h-6" style={{ background: '#ffffff' }}></div>
          <div className="absolute top-1 right-1 w-6 h-6" style={{ background: '#93c5fd' }}></div>
          <div className="absolute bottom-1 left-1 w-6 h-6" style={{ background: '#fde047' }}></div>
          <div className="absolute bottom-1 right-1 w-6 h-6" style={{ background: '#a0522d' }}></div>
          <div className="absolute w-8 h-6 border border-white bg-white/20 shadow-[0_0_0_999px_rgba(0,0,0,0.3)]" style={viewportStyle}></div>
        </div>
      </div>
    </>
  );
}

// --- REGION UI ---
function RegionUI({ currentName, setViewLevel }: any) {
  return (
    <>
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto">
        <div className="flex bg-white rounded-md shadow-lg border-2 border-[#0066cc] overflow-hidden text-black font-bold text-sm">
          <button className="px-3 py-2 flex items-center gap-2 hover:bg-gray-100 border-r border-gray-300">
            <span className="text-green-500 text-lg leading-none">+</span> New region
          </button>
          <button className="px-3 py-2 flex items-center gap-2 hover:bg-gray-100 border-r border-gray-300">
            👥 Online regions
          </button>
          <button className="px-3 py-2 flex items-center gap-2 hover:bg-gray-100 bg-gray-200">
            📚 Single Cities
          </button>
        </div>
        <button className="bg-[#004b87] border-2 border-[#0066cc] rounded-md px-3 py-1.5 flex items-center gap-2 w-max shadow-md hover:bg-blue-800 transition-colors">
          👤 Account
        </button>
      </div>

      <div className="absolute bottom-4 left-4 flex items-end gap-2 pointer-events-auto">
        <div className="flex flex-col gap-2">
          <SidebarButton icon="☰" onClick={() => setViewLevel('city')} />
          <SidebarButton icon="⚙️" />
        </div>
        <div className="bg-[#004b87] border-2 border-[#0066cc] rounded-md px-4 py-2 shadow-lg min-w-[250px]">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {currentName} <span className="text-yellow-400 text-sm">✏️</span>
          </h1>
          <div className="text-sm mt-1 text-gray-200 flex items-center gap-4">
            <span>Region 2/4</span>
            <span>Inhabitants: 7,523</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto shadow-lg">
        <button className="bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] border-2 border-blue-200 w-14 h-12 rounded-md flex items-center justify-center text-3xl hover:scale-105 transition-transform cursor-pointer text-white">←</button>
        <button className="bg-gradient-to-b from-[#4fc3f7] to-[#0288d1] border-2 border-blue-200 w-14 h-12 rounded-md flex items-center justify-center text-3xl hover:scale-105 transition-transform cursor-pointer text-white">→</button>
      </div>
    </>
  );
}

/* =========================================
   REUSABLE BUTTONS
========================================= */

function SidebarButton({ icon, active = false, onClick }: { icon: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`
      w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl shadow-md transition-transform hover:scale-105 cursor-pointer
      ${active ? 'bg-blue-400 border-white shadow-[inset_0_0_10px_rgba(255,255,255,0.5)]' : 'bg-gradient-to-b from-[#1e88e5] to-[#1565c0] border-blue-300'}
    `}>
      {icon}
    </button>
  );
}

function BubbleButton({ icon, highlight = false, star = false }: { icon: string; highlight?: boolean; star?: boolean }) {
  return (
    <button className="relative w-12 h-12 rounded-full border-2 border-white bg-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer">
      {icon}
      {highlight && <span className="absolute inset-0 rounded-full border-2 border-pink-500 animate-pulse"></span>}
      {star && <span className="absolute -bottom-2 -right-2 text-yellow-400 text-xl drop-shadow-md">⭐</span>}
    </button>
  );
}