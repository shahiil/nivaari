'use client';

import { useState, type ReactNode } from 'react';
import { useNivaariStore, type ActiveTool } from '@/lib/nivaariStore';
import type { UserIdentity } from '@/lib/nivaari/domain';
import dynamic from 'next/dynamic';
import {
  Bot,
  Building2,
  ChevronDown,
  Clock3,
  Compass,
  Globe,
  Hammer,
  LocateFixed,
  MapPinned,
  Menu,
  Pause,
  Play,
  Search,
  Settings2,
  ShieldAlert,
  SkipForward,
  Tractor,
  Trees,
  UserRound,
} from 'lucide-react';
import MapFilterDropdown from '@/components/nivaari/MapFilterDropdown';
import TileInfoModal from '@/components/nivaari/TileInfoModal';
import TravelModeButton from '@/components/nivaari/TravelModeButton';

const CityStatsDashboard = dynamic(() => import('@/components/CityStatsDashboard'), { ssr: false });
const NivaariAIWindow = dynamic(() => import('@/components/nivaari/NivaariAIWindow'), { ssr: false });

interface TheoUIOverlayProps {
  chatOpen: boolean;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  statsOpen: boolean;
  setStatsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  disasterMode: boolean;
  setDisasterMode: React.Dispatch<React.SetStateAction<boolean>>;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingPositions: React.Dispatch<React.SetStateAction<Set<string>>>;
  editingPositions: Set<string>;
  routeLabel?: string;
  user: UserIdentity;
}

const BUILD_TOOLS: Array<{ tool: ActiveTool; label: string; icon: ReactNode; tone: string }> = [
  { tool: 'road', label: 'Road', icon: <MapPinned className="h-5 w-5" />, tone: 'from-slate-100 via-slate-200 to-slate-400 text-slate-900' },
  { tool: 'building', label: 'Zones', icon: <Building2 className="h-5 w-5" />, tone: 'from-cyan-200 via-cyan-300 to-cyan-500 text-slate-950' },
  { tool: 'industrial', label: 'Industry', icon: <Tractor className="h-5 w-5" />, tone: 'from-amber-200 via-amber-300 to-amber-500 text-slate-950' },
  { tool: 'hospital', label: 'Services', icon: <ShieldAlert className="h-5 w-5" />, tone: 'from-emerald-200 via-emerald-300 to-emerald-500 text-slate-950' },
  { tool: 'police', label: 'Police', icon: <Search className="h-5 w-5" />, tone: 'from-indigo-200 via-indigo-300 to-indigo-500 text-slate-950' },
  { tool: 'nature', label: 'Nature', icon: <Trees className="h-5 w-5" />, tone: 'from-lime-200 via-lime-300 to-lime-500 text-slate-950' },
];

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
}: TheoUIOverlayProps) {
  const viewMode = useNivaariStore((s) => s.viewMode);
  const currentSector = useNivaariStore((s) => s.currentSector);
  const isLoadingSector = useNivaariStore((s) => s.isLoadingSector);
  const activeTool = useNivaariStore((s) => s.activeTool);
  const setActiveTool = (tool: ActiveTool) => useNivaariStore.setState({ activeTool: tool });
  const activeFilter = useNivaariStore((s) => s.activeFilter);
  const setActiveFilter = useNivaariStore((s) => s.setActiveFilter);
  const currentCountry = useNivaariStore((s) => s.currentCountry);
  const currentState = useNivaariStore((s) => s.currentState);
  const setLocationHierarchy = useNivaariStore((s) => s.setLocationHierarchy);
  const setViewMode = useNivaariStore((s) => s.setViewMode);
  const selectedTile = useNivaariStore((s) => s.selectedTile);
  const voteTile = useNivaariStore((s) => s.voteTile);
  const isTravelModeActive = useNivaariStore((s) => s.isTravelModeActive);
  const travelType = useNivaariStore((s) => s.travelType);
  const activateTravelMode = useNivaariStore((s) => s.activateTravelMode);
  const deactivateTravelMode = useNivaariStore((s) => s.deactivateTravelMode);

  const [buildMenuOpen, setBuildMenuOpen] = useState(false);

  const dateStr = '16/01/40';
  const locationLabel = [currentCountry, currentState].filter(Boolean).join(' / ');

  const handleToolSelect = (tool: ActiveTool) => {
    setActiveTool(tool);
    setBuildMenuOpen(false);
  };

  const iconButtonClass =
    'theo-glass-icon-btn inline-flex items-center justify-center gap-2 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 active:scale-95';

  if (viewMode !== 'city') {
    return (
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 pointer-events-auto">
          <button className="theo-btn" onClick={() => { setLocationHierarchy(null, null); setViewMode('world'); }}>
            ✚ New region
          </button>
          <button className="theo-btn" onClick={() => setViewMode('country')}>
            👥 Online regions
          </button>
          <button className="theo-btn" onClick={() => setViewMode('city')}>
            🌆 Single Cities
          </button>
        </div>

        <div className="absolute left-3 top-20 pointer-events-auto theo-panel px-4 py-3 max-w-sm">
          <div className="theo-panel-title">Atlas View</div>
          <div className="theo-panel-copy">
            {locationLabel || 'Pick a block to drill down from world to city view.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none font-sans">
      {/* TOP LEFT */}
      <div className="absolute top-2 left-2 flex flex-col gap-2 pointer-events-auto items-start">
        <div className="flex gap-2">
           <button className={`${iconButtonClass} theo-glass-icon-btn--wide`}>
             <UserRound className="h-4 w-4" />
             <span className="text-xs font-semibold tracking-wide">Account</span>
           </button>
        </div>
        {routeLabel && <div className="theo-route-label">{routeLabel}</div>}
      </div>

      <div className="absolute bottom-16 left-2 pointer-events-auto flex flex-col gap-2">
         <div className="flex gap-2 items-end">
            <button className={`${iconButtonClass} theo-glass-icon-btn--square`} title="Menu">
              <Menu className="h-4 w-4" />
            </button>
            <button className={`${iconButtonClass} theo-glass-icon-btn--square`} title="Settings" onClick={() => setStatsOpen(!statsOpen)}>
              <Settings2 className="h-4 w-4" />
            </button>
            
            <div className="theo-city-info flex flex-col justify-center min-w-[200px]">
               <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">Nivaari City /</span>
                  {isLoadingSector && <Clock3 className="h-3.5 w-3.5 animate-[theo-float_2.4s_ease-in-out_infinite] text-cyan-200" />}
               </div>
               <div className="text-sm">
                  Sector {currentSector[0]},{currentSector[1]} Rep: {user?.reputation}★
               </div>
              {locationLabel && <div className="text-xs text-white/80">{locationLabel}</div>}
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
           ><Hammer className="h-5 w-5" /></button>
           <button 
             className={`theo-tool`} 
             onClick={() => { setActiveTool('inspect'); setBuildMenuOpen(false); }}
             title="Remove (Currently Maps to Inspect/Edit)"
           ><Search className="h-5 w-5" /></button>
           <button 
             className={`theo-tool ${activeTool === 'inspect' && !buildMenuOpen ? 'active' : ''}`} 
             onClick={() => { setActiveTool('inspect'); setBuildMenuOpen(false); }}
             title="Inspect"
           ><Compass className="h-5 w-5" /></button>
           <button 
             className={`theo-tool ${disasterMode ? 'active' : ''}`} 
             onClick={() => setDisasterMode(!disasterMode)}
             title="Emergencies"
           ><ShieldAlert className="h-5 w-5" /></button>
           <button 
             className="theo-tool" 
             onClick={() => window.nivaariLocate?.()}
             title="Locate Me"
           ><LocateFixed className="h-5 w-5" /></button>
           <div className="theo-travel-slot">
             <TravelModeButton
               active={isTravelModeActive}
               type={travelType}
               onStart={activateTravelMode}
               onStop={deactivateTravelMode}
               className="theo-travel-menu"
             />
           </div>
           <button 
             className={`theo-tool ${chatOpen ? 'active' : ''}`} 
             onClick={() => setChatOpen(!chatOpen)}
             title="AI Chat"
           ><Bot className="h-5 w-5" /></button>
        </div>
      </div>

      {/* BUILD MENU MODAL (TOP-ALIGNED) */}
      {buildMenuOpen && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-full max-w-2xl pointer-events-auto flex justify-center">
            <div className="theo-window w-full">
               <div className="flex flex-wrap gap-2 p-2 border-b border-gray-300 bg-gray-100 items-center">
                  <button className="theo-btn h-8" onClick={() => setBuildMenuOpen(false)}><ChevronDown className="h-3.5 w-3.5 rotate-90" /></button>
                  <span className="font-bold text-gray-700 ml-2">All &gt; Build</span>
               </div>
               <div className="p-4 flex flex-wrap gap-4 min-h-[120px] bg-white">
                  {BUILD_TOOLS.map(({ tool, label, icon, tone }) => (
                    <button
                      key={tool}
                      className={`theo-menu-item ${activeTool === tool ? 'active' : ''}`}
                      onClick={() => handleToolSelect(tool)}
                    >
                      <span className={`theo-menu-icon ${tone}`}>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
               </div>
            </div>
        </div>
      )}

      {/* DISASTER / EMERGENCY MENU */}
      {disasterMode && (
          <div className="absolute top-24 left-16 z-30 flex items-center justify-center pointer-events-auto">
            <div className="theo-window w-64">
              <div className="theo-menu-title text-lg">Emergencies</div>
              <div className="p-4 flex flex-col gap-2">
                <button
                  className="theo-btn justify-center text-red-600 border-red-400"
                  onClick={() => { if (selectedTile) { useNivaariStore.getState().reportMajorDisaster(selectedTile.id, 'manmade'); setDisasterMode(false); } }}
                >
                  <Building2 className="h-4 w-4" />
                  Request Dispatch (Man-Made)
                </button>
                <button
                  className="theo-btn justify-center text-blue-600 border-blue-400"
                  onClick={() => { if (selectedTile) { useNivaariStore.getState().reportMajorDisaster(selectedTile.id, 'natural'); setDisasterMode(false); } }}
                >
                  <Globe className="h-4 w-4" />
                  Dispatch Rescue (Natural)
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
            <Clock3 className="h-5 w-5" />
               <span className="font-bold">{dateStr}</span>
            </div>
          <div className="flex items-center gap-1 ml-2 font-bold cursor-pointer text-green-300">
            <Pause className="h-4 w-4" />
            <Play className="h-4 w-4" />
            <SkipForward className="h-4 w-4" />
            </div>
         </div>
      </div>

      {/* MAP VIEW MINIMAP AREA (Placeholder) */}
      <div className="absolute bottom-12 right-2 pointer-events-auto">
         <div className="theo-glass-minimap w-24 h-24 flex items-center justify-center p-2 mb-2 shadow-lg">
             <div className="w-full h-full border border-green-500 rounded-sm relative">
                 <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white -translate-x-1/2 -translate-y-1/2 bg-white/20"></div>
             </div>
         </div>
        <div className="flex flex-col gap-1 items-end absolute right-0 bottom-[120px] theo-filter-slot">
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