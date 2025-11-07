"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
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
  User,
  LogOut,
  Sun,
  Moon,
  X,
  Filter,
  Search,
  CheckCircle,
  Edit,
  Settings,
  Archive,
  FileText,
  XCircle,
  Building2,
  Camera,
  Satellite
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Dock from '@/components/Dock';
import DockSearchBar from '@/components/DockSearchBar';

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState<'current' | 'incoming' | 'past'>('current');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [viewedFilter, setViewedFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [markers, setMarkers] = useState<Array<{ id: string; lat: number; lng: number; typeId: string; label: string; description?: string }>>([]);
  const [draft, setDraft] = useState<{ lat: number; lng: number; typeId: string; label: string } | null>(null);
  const [draftDescription, setDraftDescription] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveReports, setArchiveReports] = useState<Array<{ id: string; title: string; type: string; status: 'accepted' | 'rejected'; city?: string; location?: any }>>([]);
  const [archiveFilter, setArchiveFilter] = useState<'accepted' | 'rejected'>('accepted');
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [useSatelliteView, setUseSatelliteView] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [passwordVerificationOpen, setPasswordVerificationOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profilePhoto: ''
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const router = useRouter();
  const { userData, logout } = useAuth();

  // Fetch archive reports (accepted and rejected)
  useEffect(() => {
    const fetchArchiveReports = async () => {
      try {
        const res = await fetch('/api/moderator/archive-reports', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && data.reports) {
          setArchiveReports(data.reports);
        }
      } catch (error) {
        console.error('Failed to fetch archive reports:', error);
      }
    };
    fetchArchiveReports();
  }, []);

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
    setViewedFilter('all');
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

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
    toast.success(`Navigating to ${name.split(',')[0]}`);
  };

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Photo size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditFormData(prev => ({ ...prev, profilePhoto: result }));
        toast.success('Photo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/profile?action=verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      return data.valid;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  const saveProfileChanges = async (password: string) => {
    try {
      const requestData = {
        password: password,
        name: editFormData.name,
        phone: editFormData.phone,
        profilePhoto: editFormData.profilePhoto,
      };
      
      const res = await fetch('/api/admin/profile?action=update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      if (res.ok) {
        toast.success('Changes saved successfully!');
        window.location.reload();
        return true;
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save changes');
        return false;
      }
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('An error occurred while saving changes');
      return false;
    }
  };

  const savePasswordChanges = async () => {
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetch('/api/admin/profile?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (res.ok) {
        toast.success('Password changed successfully!');
        setChangePasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        return true;
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to change password');
        return false;
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('An error occurred while changing password');
      return false;
    }
  };

  const handleEditProfileSubmit = async () => {
    setPasswordVerificationOpen(true);
  };

  const handlePasswordSubmit = async (password: string) => {
    const isValid = await verifyPassword(password);
    if (isValid) {
      const success = await saveProfileChanges(password);
      if (success) {
        setPasswordVerificationOpen(false);
        setProfileEditOpen(false);
      }
    } else {
      toast.error('Incorrect password');
    }
  };

  // Dock items configuration
  const dockItems = [
    { 
      icon: <Building2 className="w-5 h-5" />, 
      label: 'Government Issued', 
      onClick: () => setSidebarOpen(!sidebarOpen) 
    },
    { 
      icon: <Archive className="w-5 h-5" />, 
      label: 'Archive', 
      onClick: () => setShowArchive(!showArchive) 
    },
    { 
      icon: <Search className="w-5 h-5" />, 
      label: 'Search Location', 
      onClick: () => setSearchModalOpen(true) 
    },
    { 
      icon: <Filter className="w-5 h-5" />, 
      label: 'Filters', 
      onClick: () => setFilterOpen(true) 
    },
  ];

  // Filter archive reports based on selected filter
  const filteredArchiveReports = archiveReports.filter(report => {
    if (archiveFilter === 'accepted') return report.status === 'accepted';
    if (archiveFilter === 'rejected') return report.status === 'rejected';
    return true;
  });

  return (
    <div className="fixed inset-0 w-full h-screen bg-black">

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
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,183,255,0.3)] border border-cyan-400/30 ring-1 ring-cyan-400/20">
          {showArchive ? (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Archive className="w-8 h-8 text-cyan-400" />
                  Report Archive
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setArchiveFilter('accepted')}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      archiveFilter === 'accepted'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-[0_0_20px_rgba(0,255,157,0.4)]'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border-2 border-white/10'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Accepted
                  </button>
                  <button
                    onClick={() => setArchiveFilter('rejected')}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                      archiveFilter === 'rejected'
                        ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border-2 border-white/10'
                    }`}
                  >
                    <XCircle className="w-4 h-4 inline mr-2" />
                    Rejected
                  </button>
                </div>
              </div>
              {filteredArchiveReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
                  <p className="text-cyan-300/70 text-lg">
                    No {archiveFilter} reports yet. They will appear here once you moderate them.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredArchiveReports.map((report) => (
                    <div key={report.id} className={`glass-panel bg-black/60 backdrop-blur-xl border-2 rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(0,183,255,0.4)] transition-all duration-300 hover:scale-105 ${
                      report.status === 'accepted' 
                        ? 'border-green-400/30' 
                        : 'border-red-400/30'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-white">{report.title}</h3>
                        {report.status === 'accepted' ? (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-cyan-300 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {report.type}
                        </p>
                        {report.city && <p className="text-sm text-cyan-400/70">{report.city}</p>}
                        {report.location?.address && <p className="text-sm text-cyan-400/70">{report.location.address}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <MapView
              markers={markers}
              onDropPin={onDropPin}
              filters={{ 
                time: viewedFilter !== 'all' ? 'past' : timePeriod, 
                types: selectedReportTypes, 
                viewed: viewedFilter 
              }}
              enableModerationActions={true}
              center={mapCenter}
              zoom={mapZoom}
              useSatelliteView={useSatelliteView}
            />
          )}
        </div>
      </div>

      {/* Blur overlay when modals are open */}
      {filterOpen && (
        <div className="fixed inset-0 z-[65]" style={{ pointerEvents: 'none' }} />
      )}

      {/* Profile Menu - Top Right */}
      <div className="fixed top-5 right-6 z-[70]">
        <div className="relative">
          {/* Profile Button */}
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border-2 border-cyan-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,183,255,0.3)] hover:shadow-[0_0_30px_rgba(0,183,255,0.5)] transition-all duration-300 overflow-hidden hover:scale-110"
          >
            {userData?.profilePhoto ? (
              <img 
                src={userData.profilePhoto} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-cyan-400 font-semibold text-lg">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-3 w-72 glass-panel bg-black/90 backdrop-blur-xl rounded-2xl shadow-[0_0_30px_rgba(0,183,255,0.3)] border border-cyan-400/30 overflow-hidden transform origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
              {/* User Info */}
              <div className="p-5 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 text-white border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl border-2 border-cyan-400/30 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,183,255,0.3)]">
                    {userData?.profilePhoto ? (
                      <img 
                        src={userData.profilePhoto} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-cyan-400 text-xl font-bold">
                        {(userData?.name || 'Moderator').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate text-white">{userData?.name || 'Moderator'}</p>
                    <p className="text-sm text-cyan-300 truncate">{userData?.email || 'moderator@nivaari.com'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setProfileEditOpen(true);
                    setEditFormData({
                      name: userData?.name || '',
                      email: userData?.email || '',
                      phone: (userData as any)?.phone || '',
                      profilePhoto: (userData as any)?.profilePhoto || ''
                    });
                  }}
                  className="mt-3 w-full px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-sm text-cyan-300 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-cyan-400/30 shadow-[0_0_10px_rgba(0,183,255,0.2)] hover:shadow-[0_0_15px_rgba(0,183,255,0.4)]"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-amber-500/20 border border-amber-400/30' : 'bg-cyan-500/20 border border-cyan-400/30'} shadow-[0_0_10px_rgba(0,183,255,0.2)]`}>
                    {darkMode ? (
                      <Sun className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">
                      {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                    </div>
                  </div>
                </button>

                {/* Divider */}
                <div className="border-t border-white/10 my-2 mx-3"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    <LogOut className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-red-400">Logout</div>
                    <div className="text-xs text-red-400/70">Sign out of your account</div>
                  </div>
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

      {/* Filter Popover */}
      {filterOpen && (
        <div
          className="fixed z-[70] pointer-events-none"
          style={{ bottom: '1rem', right: '1rem' }}
        >
          <div className="w-[20rem] max-w-[90vw] rounded-2xl border border-cyan-400/30 glass-panel bg-black/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,183,255,0.3)] ring-1 ring-cyan-400/20 pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <div className="font-bold text-base text-white">Filter Reports</div>
                <div className="text-xs text-cyan-300 mt-0.5">Customize your view</div>
              </div>
              <button 
                onClick={() => setFilterOpen(false)} 
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Report types */}
              <div>
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full shadow-[0_0_10px_rgba(0,183,255,0.5)]"></div>
                  Report Types
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {reportCategories.map((c) => {
                    const Icon = c.icon;
                    const checked = selectedReportTypes.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleReportType(c.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-all duration-200 ${
                          checked
                            ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,183,255,0.3)]'
                            : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-lg border-2 flex items-center justify-center transition-all ${
                          checked 
                            ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(0,183,255,0.5)]' 
                            : 'border-white/30'
                        }`}>
                          {checked && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <Icon className={`w-3 h-3 ${c.color}`} />
                        <span className="text-xs font-medium text-white">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time period */}
              <div>
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full shadow-[0_0_10px_rgba(255,159,252,0.5)]"></div>
                  Time Period
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'current', label: 'Current', color: 'from-cyan-400 to-cyan-600' },
                    { value: 'incoming', label: 'Incoming', color: 'from-purple-400 to-purple-600' },
                    { value: 'past', label: 'Past', color: 'from-pink-400 to-fuchsia-600' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTimePeriod(opt.value as 'current' | 'incoming' | 'past')}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        timePeriod === opt.value
                          ? `bg-gradient-to-br ${opt.color} text-white shadow-[0_0_15px_rgba(0,183,255,0.4)]`
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewed Status */}
              <div>
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(255,200,0,0.5)]"></div>
                  Reviewed Reports
                </div>
                <p className="text-xs text-cyan-300/70 mb-2">Show reports you've already reviewed</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setViewedFilter('all')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      viewedFilter === 'all'
                        ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-[0_0_15px_rgba(0,183,255,0.4)]'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setViewedFilter('accepted')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      viewedFilter === 'accepted'
                        ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-[0_0_15px_rgba(0,255,157,0.4)]'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    Accepted
                  </button>
                  <button
                    onClick={() => setViewedFilter('rejected')}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      viewedFilter === 'rejected'
                        ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {/* Map View Options */}
              <div>
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                  Map View
                </div>
                
                <button
                  onClick={() => setUseSatelliteView(!useSatelliteView)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                    useSatelliteView
                      ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,183,255,0.3)]'
                      : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Satellite className={`w-4 h-4 ${useSatelliteView ? 'text-cyan-400' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-white">Satellite View</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all duration-200 ${
                    useSatelliteView ? 'bg-cyan-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-200 ${
                      useSatelliteView ? 'translate-x-5 mt-0.5' : 'translate-x-0.5 mt-0.5'
                    }`} />
                  </div>
                </button>
              </div>

              {/* Region */}
              <div>
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full shadow-[0_0_10px_rgba(0,255,157,0.5)]"></div>
                  Region
                </div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full p-2.5 rounded-lg border-2 border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent font-medium backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <option value="all" className="bg-black">🌍 All Regions</option>
                  <option value="north" className="bg-black">⬆️ North</option>
                  <option value="south" className="bg-black">⬇️ South</option>
                  <option value="east" className="bg-black">➡️ East</option>
                  <option value="west" className="bg-black">⬅️ West</option>
                  <option value="central" className="bg-black">🎯 Central</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={clearFilters} 
                  className="flex-1 py-2.5 rounded-lg border-2 border-white/20 text-white text-sm hover:bg-white/5 font-semibold transition-all duration-200"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setFilterOpen(false)} 
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 text-white text-sm shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] font-semibold transition-all duration-200"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft Modal for dropped pin - Glassmorphic */}
      {draft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
          <div className="glass-panel bg-black/90 backdrop-blur-xl border-2 border-cyan-400/40 rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.5)] w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white">Add Incident Details</h2>
                <p className="text-sm text-cyan-300/70 mt-1">{draft.label}</p>
              </div>
              <button
                onClick={onCancelDraft}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Location Info */}
              <div className="glass-panel bg-cyan-500/10 border border-cyan-400/30 rounded-xl p-3">
                <div className="text-xs font-semibold text-cyan-300 mb-1">📍 Location Coordinates</div>
                <div className="text-sm text-white font-mono">
                  {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Description</label>
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Describe the incident in detail..."
                  rows={4}
                  className="w-full rounded-xl border-2 border-white/10 bg-white/5 text-white placeholder:text-gray-500 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Upload Image (Optional)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="incident-image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Handle file upload
                        toast.success('Image uploaded successfully!');
                      }
                    }}
                  />
                  <label
                    htmlFor="incident-image"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-cyan-400/40 rounded-xl hover:border-cyan-400/60 hover:bg-white/5 cursor-pointer transition-all group"
                  >
                    <Camera className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm text-cyan-300">Click to upload incident photo</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCancelDraft}
                  className="flex-1 py-3 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onUpdateDraft}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 text-white font-semibold shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] transition-all"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draggable Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 glass-panel bg-black/90 backdrop-blur-xl border-r border-cyan-400/30 shadow-[0_0_40px_rgba(0,183,255,0.4)] z-[80] transition-transform duration-500 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 className="w-7 h-7 text-cyan-400" />
                Report Issues
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-cyan-300/70">Drag and drop issue cards onto the map</p>
          </div>

          {/* Category Cards */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {reportCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => {
                    try {
                      const payload = JSON.stringify({ typeId: category.id, label: category.label });
                      e.dataTransfer.setData('application/x-incident', payload);
                      e.dataTransfer.setData('text/plain', payload);
                      // Set a subtle drag image
                      const el = document.createElement('div');
                      el.style.cssText = 'padding:8px 14px;border-radius:12px;background:rgba(0,0,0,0.9);color:#fff;border:2px solid rgba(0,183,255,0.5);box-shadow:0 0 20px rgba(0,183,255,0.4);font:600 14px system-ui;backdrop-filter:blur(10px)';
                      el.textContent = category.label;
                      document.body.appendChild(el);
                      e.dataTransfer.setDragImage(el, 10, 10);
                      setTimeout(() => document.body.removeChild(el), 0);
                    } catch {}
                  }}
                  className="group relative glass-panel bg-black/60 backdrop-blur-xl border-2 border-cyan-400/30 rounded-2xl p-4 cursor-move hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(0,183,255,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.3)] group-hover:shadow-[0_0_25px_rgba(0,183,255,0.5)] transition-all`}>
                      <Icon className={`w-7 h-7 ${category.color} drop-shadow-lg`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-base mb-1">{category.label}</h3>
                      <p className="text-xs text-cyan-300/60">Drag to map</p>
                    </div>
                  </div>
                  
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dock Component */}
      <Dock 
        items={dockItems}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
        distance={200}
      />

      {/* Dock Search Bar - appears above dock */}
      <AnimatePresence>
        {searchModalOpen && (
          <DockSearchBar
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            onLocationSelect={handleLocationSelect}
          />
        )}
      </AnimatePresence>

      {/* Blur overlay when modals are open */}
      {(profileEditOpen || passwordVerificationOpen || changePasswordOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75]" />
      )}

      {/* Profile Edit Modal */}
      {profileEditOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-lg mx-4 ring-1 ring-cyan-400/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                  Edit Profile
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Update your personal information</p>
              </div>
              <button
                onClick={() => setProfileEditOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(0,183,255,0.4)] border-2 border-cyan-400/30">
                    {editFormData.profilePhoto ? (
                      <img 
                        src={editFormData.profilePhoto} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {(editFormData.name || 'M').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 rounded-full flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(0,183,255,0.5)] border-2 border-black/20"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  {editFormData.profilePhoto && (
                    <button
                      onClick={() => setEditFormData(prev => ({ ...prev, profilePhoto: '' }))}
                      className="absolute -top-1 -right-1 w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-black/20"
                      title="Remove photo"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    Name
                  </label>
                  <input 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500 px-4 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </label>
                  <input 
                    value={editFormData.email} 
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-gray-400 cursor-not-allowed px-4"
                    type="email"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-cyan-400/70 mt-2">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone Number
                  </label>
                  <input 
                    value={editFormData.phone} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500 px-4 focus:outline-none"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Change Password Button */}
              <button
                onClick={() => {
                  setProfileEditOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white border-2 border-white/10 hover:border-cyan-400/50 transition-all font-medium"
              >
                Change Password
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleEditProfileSubmit}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] transition-all font-semibold text-white"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setProfileEditOpen(false)}
                  className="flex-1 h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white bg-transparent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {passwordVerificationOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[90]">
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border-2 border-cyan-400/30 w-full max-w-md mx-4 ring-1 ring-cyan-400/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  Verify Password
                </h2>
                <p className="text-sm text-amber-300 mt-1">Enter your current password to continue</p>
              </div>
              <button
                onClick={() => setPasswordVerificationOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors px-4 focus:outline-none"
                  placeholder="Enter your current password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit(currentPassword);
                      setCurrentPassword('');
                    }
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    handlePasswordSubmit(currentPassword);
                    setCurrentPassword('');
                  }}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all font-semibold text-white"
                >
                  Verify
                </button>
                <button
                  onClick={() => {
                    setPasswordVerificationOpen(false);
                    setCurrentPassword('');
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white bg-transparent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[90]">
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-md mx-4 ring-1 ring-cyan-400/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)]">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  Change Password
                </h2>
                <p className="text-sm text-purple-300 mt-1">Create a new password for your account</p>
              </div>
              <button
                onClick={() => setChangePasswordOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors px-4 focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors px-4 focus:outline-none"
                  placeholder="Enter new password (min. 8 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors px-4 focus:outline-none"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={savePasswordChanges}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all font-semibold text-white"
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white bg-transparent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
