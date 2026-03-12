'use client';

import { useState } from 'react';
import { useNivaariStore } from '@/lib/nivaariStore';
import dynamic from 'next/dynamic';
import MapFilterDropdown from '@/components/nivaari/MapFilterDropdown';
import TileInfoModal from '@/components/nivaari/TileInfoModal';
import TravelModeButton from '@/components/nivaari/TravelModeButton';

const CityStatsDashboard = dynamic(() => import('@/components/CityStatsDashboard'), { ssr: false });
const NivaariAIWindow = dynamic(() => import('@/components/nivaari/NivaariAIWindow'), { ssr: false });

export default function TheoUIOverlay({
  chatOpen,
  setChatOpen,
  statsOpen,
  setStatsOpen,
  disasterMode,
  setDisasterMode,
  editMode,
  setEditMode,
  setEditingPositions,
  editingPositions,
  routeLabel,
  user,
}: any) {
  const viewMode = useNivaariStore((s) => s.viewMode);
  const currentSector = useNivaariStore((s) => s.currentSector);
  const isLoadingSector = useNivaariStore((s) => s.isLoadingSector);
  const activeTool = useNivaariStore((s) => s.activeTool);
  const setActiveTool = (tool: any) => useNivaariStore.setState({ activeTool: tool });
  const activeFilter = useNivaariStore((s) => s.activeFilter);
  const setActiveFilter = useNivaariStore((s) => s.setActiveFilter);
  const currentCountry = useNivaariStore((s) => s.currentCountry);
  const currentState = useNivaariStore((s) => s.currentState);
  const setLocationHierarchy = useNivaariStore((s) => s.setLocationHierarchy);
  const setViewMode = useNivaariStore((s) => s.setViewMode);
  const selectedTile = useNivaariStore((s) => s.selectedTile);
  const voteTile = useNivaariStore((s) => s.voteTile);

  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All > Zones');

  // Helper date for the UI
  const dateStr = '16/01/40';

  if (viewMode !== 'city') {
    return (
       <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-2 left-2 flex gap-2 pointer-events-auto">
             <button className="theo-btn bg-white" onClick={() => { setLocationHierarchy(null, null); setViewMode('world'); }}>
               ✚ New region
             </button>
             <button className="theo-btn bg-white">
               👥 Online regions
             </button>
             <button className="theo-btn bg-white">
               🌆 Single Cities
             </button>
          </div>
       </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none font-sans">
      {/* TOP LEFT */}
      <div className="absolute top-2 left-2 flex flex-col gap-2 pointer-events-auto items-start">
        <div className="flex gap-2">
           <button className="theo-btn" onClick={() => { setLocationHierarchy(null, null); setViewMode('world'); }}>
             ✚ World
           </button>
           <button className="theo-btn">
             👤 Account
           </button>
        </div>
      </div>

      <div className="absolute bottom-16 left-2 pointer-events-auto flex flex-col gap-2">
         <div className="flex gap-2 items-end">
            <button className="theo-btn theo-btn-blue text-2xl h-10 w-10 flex items-center justify-center p-0" title="Menu">☰</button>
            <button className="theo-btn theo-btn-blue text-2xl h-10 w-10 flex items-center justify-center p-0" title="Settings" onClick={() => setStatsOpen(!statsOpen)}>⚙️</button>
            
            <div className="theo-city-info flex flex-col justify-center min-w-[200px]">
               <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">Nivaari City /</span>
                  {isLoadingSector && <span className="text-xs text-yellow-300">⏳</span>}
               </div>
               <div className="text-sm">
                  Sector {currentSector[0]},{currentSector[1]} Rep: {user?.reputation}★
               </div>
            </div>
         </div>
      </div>

      {/* LEFT TOOLBAR */}
      <div className="absolute left-2 top-24 pointer-events-auto">
        <div className="theo-toolbar">
           <button 
             className={`theo-tool ${buildMenuOpen || ['road','building','hospital','nature','police','industrial'].includes(activeTool) ? 'active' : ''}`} 
             onClick={() => { setBuildMenuOpen(!buildMenuOpen); }}
             title="Build"
           >🔨</button>
           <button 
             className={`theo-tool`} 
             onClick={() => { setActiveTool('inspect'); setBuildMenuOpen(false); }}
             title="Remove (Currently Maps to Inspect/Edit)"
           >🚜</button>
           <button 
             className={`theo-tool ${activeTool === 'inspect' && !buildMenuOpen ? 'active' : ''}`} 
             onClick={() => { setActiveTool('inspect'); setBuildMenuOpen(false); }}
             title="Inspect"
           >🔍</button>
           <button 
             className={`theo-tool ${disasterMode ? 'active' : ''}`} 
             onClick={() => setDisasterMode(!disasterMode)}
             title="Emergencies"
           >🦺</button>
           <button 
             className="theo-tool" 
             onClick={() => window.nivaariLocate?.()}
             title="Locate Me"
           >🎯</button>
           <button 
             className={`theo-tool ${useNivaariStore(s=>s.isTravelModeActive) ? 'active' : ''}`} 
             onClick={() => {
                 const store = useNivaariStore.getState();
                 if(store.isTravelModeActive) store.deactivateTravelMode();
                 else store.activateTravelMode('car');
             }}
             title="Travel Mode"
           >🚗</button>
           <button 
             className={`theo-tool ${chatOpen ? 'active' : ''}`} 
             onClick={() => setChatOpen(!chatOpen)}
             title="AI Chat"
           >🤖</button>
        </div>
      </div>

      {/* BUILD MENU MODAL (TOP-ALIGNED) */}
      {buildMenuOpen && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full max-w-2xl pointer-events-auto flex justify-center">
            <div className="theo-window w-full">
               <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 bg-gray-100 items-center">
                  <button className="theo-btn h-8" onClick={() => setBuildMenuOpen(false)}>⬅</button>
                  <span className="font-bold text-gray-700 ml-2">{activeTab}</span>
               </div>
               <div className="p-4 flex flex-wrap gap-4 min-h-[120px] bg-white">
                  <button 
                    className={`theo-menu-item ${activeTool === 'road' ? 'active' : ''}`}
                    onClick={() => setActiveTool('road')}
                  >
                     <span className="text-3xl">🛣️</span>
                     <span>Road</span>
                  </button>
                  <button 
                    className={`theo-menu-item ${activeTool === 'building' ? 'active' : ''}`}
                    onClick={() => setActiveTool('building')}
                  >
                     <span className="text-3xl">🏢</span>
                     <span>Zones</span>
                  </button>
                  <button 
                    className={`theo-menu-item ${activeTool === 'industrial' ? 'active' : ''}`}
                    onClick={() => setActiveTool('industrial')}
                  >
                     <span className="text-3xl">🏭</span>
                     <span>Industrial</span>
                  </button>
                  <button 
                    className={`theo-menu-item ${activeTool === 'hospital' ? 'active' : ''}`}
                    onClick={() => setActiveTool('hospital')}
                  >
                     <span className="text-3xl">🏥</span>
                     <span>Services</span>
                  </button>
                  <button 
                    className={`theo-menu-item ${activeTool === 'police' ? 'active' : ''}`}
                    onClick={() => setActiveTool('police')}
                  >
                     <span className="text-3xl">🚓</span>
                     <span>Police</span>
                  </button>
                  <button 
                    className={`theo-menu-item ${activeTool === 'nature' ? 'active' : ''}`}
                    onClick={() => setActiveTool('nature')}
                  >
                     <span className="text-3xl">🌳</span>
                     <span>Nature</span>
                  </button>
               </div>
            </div>
        </div>
      )}

      {/* DISASTER / EMERGENCY MENU */}
      {disasterMode && (
          <div className="absolute top-24 left-16 z-30 flex items-center justify-center pointer-events-auto">
            <div className="theo-window w-64">
              <div className="theo-header text-lg">Emergencies</div>
              <div className="p-4 flex flex-col gap-2">
                <button
                  className="theo-btn justify-center text-red-600 border-red-400"
                  onClick={() => { if (selectedTile) { useNivaariStore.getState().reportMajorDisaster(selectedTile.id, 'manmade'); setDisasterMode(false); } }}
                >
                  🏗️ Request Dispatch (Man-Made)
                </button>
                <button
                  className="theo-btn justify-center text-blue-600 border-blue-400"
                  onClick={() => { if (selectedTile) { useNivaariStore.getState().reportMajorDisaster(selectedTile.id, 'natural'); setDisasterMode(false); } }}
                >
                  🌊 Dispatch Rescue (Natural)
                </button>
                <button
                  className="theo-btn justify-center mt-2"
                  onClick={() => setDisasterMode(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
      )}

      {/* BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto theo-bottom-bar shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-xl">🕒</span>
               <span className="font-bold">{dateStr}</span>
            </div>
            <div className="flex items-center gap-1 text-green-400 text-lg ml-2 font-bold cursor-pointer">
               ⏸ ▷ ⏭
            </div>
         </div>
         <div className="flex items-center gap-6 mr-16">
            <div className="flex items-center gap-2 font-bold text-blue-300">
               <span className="text-xl">💎</span> +{user?.reputation || 0}
            </div>
            <div className="flex items-center gap-2 font-bold text-yellow-400">
               <span className="text-xl">🟡</span> ∞
            </div>
         </div>
      </div>

      {/* MAP VIEW MINIMAP AREA (Placeholder) */}
      <div className="absolute bottom-12 right-2 pointer-events-auto">
         <div className="w-24 h-24 bg-gray-800 border-2 border-gray-400 rounded opacity-80 flex items-center justify-center p-2 mb-2 shadow-lg">
             <div className="w-full h-full border border-green-500 rounded-sm relative">
                 <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white -translate-x-1/2 -translate-y-1/2 bg-white/20"></div>
             </div>
         </div>
         <div className="flex flex-col gap-1 items-end absolute right-0 bottom-[120px]">
            <MapFilterDropdown active={activeFilter} onChange={setActiveFilter} />
         </div>
      </div>

      {/* OVERLAYS */}
      {chatOpen && <NivaariAIWindow />}
      {viewMode === 'city' && <CityStatsDashboard open={statsOpen} onClose={() => setStatsOpen(false)} />}
      
      {/* TILE INFO MODAL */}
      {viewMode === 'city' && activeTool === 'inspect' && selectedTile && !disasterMode && (
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
                Object.entries(useNivaariStore.getState().grid).forEach(([k,v]) => {
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
            onReportDisaster={() => setDisasterMode(true)}
          />
      )}

    </div>
  );
}