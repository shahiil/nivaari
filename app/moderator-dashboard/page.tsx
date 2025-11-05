"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { 
  AlertTriangle, 
  Construction, 
  Car, 
  Trash2, 
  Lightbulb, 
  Droplets, 
  Trees,
  MapPin,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const reportCategories = [
  { id: 'danger', label: 'Danger', icon: AlertTriangle, color: 'text-red-600' },
  { id: 'potholes', label: 'Potholes', icon: Construction, color: 'text-orange-600' },
  { id: 'traffic', label: 'Traffic', icon: Car, color: 'text-yellow-600' },
  { id: 'garbage', label: 'Garbage', icon: Trash2, color: 'text-green-600' },
  { id: 'streetlight', label: 'Street Light', icon: Lightbulb, color: 'text-blue-600' },
  { id: 'water', label: 'Water Issue', icon: Droplets, color: 'text-cyan-600' },
  { id: 'trees', label: 'Trees/Parks', icon: Trees, color: 'text-emerald-600' },
  { id: 'other', label: 'Other', icon: MapPin, color: 'text-gray-600' },
];

export default function ModeratorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState<'current' | 'incoming' | 'past'>('current');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [markers, setMarkers] = useState<Array<{ id: string; lat: number; lng: number; typeId: string; label: string; description?: string }>>([]);
  const [draft, setDraft] = useState<{ lat: number; lng: number; typeId: string; label: string } | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const router = useRouter();
  const { userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleReportType = (typeId: string) => {
    setSelectedReportTypes((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const clearFilters = () => {
    setSelectedReportTypes([]);
    setTimePeriod('current');
    setSelectedRegion('all');
  };

  const onDropPin = (pin: { lat: number; lng: number; typeId: string; label: string }) => {
    setDraft(pin);
    setDraftDescription('');
  };

  const onCancelDraft = () => {
    setDraft(null);
    setDraftDescription('');
  };

  const onUpdateDraft = async () => {
    if (!draft) return;
    // Persist to map-pins; on success, use id returned; fallback to local id.
    let newId: string | null = null;
    try {
      const res = await fetch('/api/map-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: draft.label,
          typeId: draft.typeId,
          description: draftDescription || `${draft.label} reported via map drag-and-drop`,
          location: { lat: draft.lat, lng: draft.lng },
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) newId = data.id as string;
    } catch {}

    const id = newId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newMarker = { id, lat: draft.lat, lng: draft.lng, typeId: draft.typeId, label: draft.label, description: draftDescription };
    setMarkers((prev) => [...prev, newMarker]);
    onCancelDraft();
  };

  return (
    <div className="fixed inset-0 w-full h-screen">
      {/* Map - Fixed Size */}
      <div 
        className="fixed inset-0 z-[50]"
        style={{ 
          paddingTop: '1rem',
          paddingRight: '1rem',
          paddingBottom: '1rem',
          paddingLeft: '1rem'
        }}
      >
        <div className="w-full h-full rounded-lg overflow-hidden shadow-xl border border-gray-300 dark:border-gray-700">
          <MapView
            markers={markers}
            onDropPin={onDropPin}
            filters={{ time: timePeriod, types: selectedReportTypes }}
            enableModerationActions={true}
          />
        </div>
      </div>

      {/* Collapsible Sidebar - Glassmorphism Overlay */}
      <aside
        className={`fixed left-4 top-4 bottom-4 bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-2xl z-[60] transition-all duration-300 rounded-xl ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all hover:bg-white/40 dark:hover:bg-gray-800/40"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-5 h-5 text-white dark:text-gray-200" />
          ) : (
            <ChevronRight className="w-5 h-5 text-white dark:text-gray-200" />
          )}
        </button>

        {/* Sidebar Content */}
        <div className="p-4 space-y-4 overflow-y-auto h-full">
          <div className="mb-8">
            {sidebarOpen && (
              <h2 className="text-lg font-bold text-white dark:text-gray-100 mb-2 drop-shadow-lg">
                Report Categories
              </h2>
            )}
          </div>

          {/* Category Icons */}
          <div className="space-y-2">
            {reportCategories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                  draggable
                  onDragStart={(e) => {
                    try {
                      const payload = JSON.stringify({ typeId: category.id, label: category.label });
                      e.dataTransfer.setData('application/x-incident', payload);
                      e.dataTransfer.setData('text/plain', payload);
                      // Set a subtle drag image if possible
                      const el = document.createElement('div');
                      el.style.cssText = 'padding:6px 10px;border-radius:8px;background:#ffffffcc;color:#111;border:1px solid #e5e7eb;box-shadow:0 2px 6px rgba(0,0,0,0.2);font:500 12px system-ui';
                      el.textContent = category.label;
                      document.body.appendChild(el);
                      e.dataTransfer.setDragImage(el, 10, 10);
                      setTimeout(() => document.body.removeChild(el), 0);
                    } catch {}
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'bg-white/30 dark:bg-blue-900/40 shadow-md backdrop-blur-sm border border-white/30'
                      : 'hover:bg-white/20 dark:hover:bg-gray-800/30 backdrop-blur-sm'
                  }`}
                  title={!sidebarOpen ? category.label : ''}
                >
                  <Icon className={`w-6 h-6 ${category.color} flex-shrink-0 drop-shadow-lg`} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium text-white dark:text-gray-200 text-left drop-shadow-md">
                      {category.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Profile Menu - Top Right */}
      <div className="fixed top-4 right-4 z-[60]">
        <div className="relative">
          {/* Profile Button */}
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <User className="w-6 h-6 text-white" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* User Info */}
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{userData?.name || 'Moderator'}</p>
                    <p className="text-xs opacity-90">{userData?.email || 'moderator@nivaari.com'}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close profile menu when clicking outside */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setProfileMenuOpen(false)}
        />
      )}

      {/* Filter Button - Bottom Right (circular, map icon) */}
      <button
        onClick={() => setFilterOpen((v) => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all z-[60] hover:scale-110"
        aria-label="Open filters"
      >
        <MapIcon className="w-6 h-6 text-white" />
      </button>

      {/* Click-away (transparent) to close popover - no blur, no dim */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-[65] bg-transparent"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* Filter Popover anchored above-left of the button */}
      {filterOpen && (
        <div
          className="fixed z-[70]"
          style={{ bottom: '6rem', right: '1.5rem' }}
        >
          <div className="w-[22rem] max-w-[90vw] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Filter Reports</div>
              <button onClick={() => setFilterOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Report types */}
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Types</div>
                <div className="grid grid-cols-2 gap-2">
                  {reportCategories.map((c) => {
                    const Icon = c.icon;
                    const checked = selectedReportTypes.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleReportType(c.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left ${
                          checked
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-sm border ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`} />
                        <Icon className={`w-4 h-4 ${c.color}`} />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time period */}
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Time</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'current', label: 'Current' },
                    { value: 'incoming', label: 'Incoming' },
                    { value: 'past', label: 'Past' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTimePeriod(opt.value as 'current' | 'incoming' | 'past')}
                      className={`py-2 px-3 rounded-lg text-sm font-medium ${
                        timePeriod === opt.value
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region */}
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Region</div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Regions</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                  <option value="central">Central</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={clearFilters} className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Clear</button>
                <button onClick={() => setFilterOpen(false)} className="flex-1 py-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow hover:shadow-lg">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Modal for dropped pin */}
      <Modal isOpen={!!draft} onClose={onCancelDraft} title="Add incident details">
        {draft && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div className="font-medium">{draft.label}</div>
              <div className="opacity-70">Location: {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="Describe the incident..."
                rows={4}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onCancelDraft} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700">Cancel</button>
              <button onClick={onUpdateDraft} className="px-4 py-2 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 text-white">Update</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
