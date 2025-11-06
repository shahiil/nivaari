'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Filter,
  User,
  LogOut,
  Sun,
  Moon,
  UserPlus,
  Mail,
  AlertTriangle, 
  Construction, 
  Car, 
  Trash2, 
  Lightbulb, 
  Droplets, 
  Trees,
  MapPin,
  Users,
  MapPinIcon,
  ChevronDown,
  ChevronRight,
  Camera,
  Edit,
  Eye,
  EyeOff,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  Home,
  Settings,
  BarChart3,
  MessageSquare,
  Search,
  Satellite
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Dock from '@/components/Dock';
import DockSearchBar from '@/components/DockSearchBar';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });
const LocationSelectionMap = dynamic(() => import('@/components/LocationSelectionMap'), { ssr: false });

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

export default function AdminDashboard() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [invites, setInvites] = useState<{ link: string; expiresAt: string }[]>([]);
  const [moderators, setModerators] = useState<
    { id?: string; userId: string; name: string; email: string; status: 'online' | 'offline'; createdAt?: string; approvedCount: number; rejectedCount: number; assignedLocation?: { lat: number; lng: number } }[]
  >([]);
  const [unviewedCount, setUnviewedCount] = useState<number>(0);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [addModeratorOpen, setAddModeratorOpen] = useState(false);
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedReportTypes, setSelectedReportTypes] = useState<string[]>([]);
  const [timePeriod, setTimePeriod] = useState<'current' | 'incoming' | 'past'>('current');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showModeratorLocations, setShowModeratorLocations] = useState(false);
  const [useSatelliteView, setUseSatelliteView] = useState(false);
  const [currentModeratorsOpen, setCurrentModeratorsOpen] = useState(false);
  const [locationSelectionOpen, setLocationSelectionOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [expandedModerator, setExpandedModerator] = useState<string | null>(null);
  const [editingModeratorId, setEditingModeratorId] = useState<string | null>(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [passwordVerificationOpen, setPasswordVerificationOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState({
    verificationPassword: false,
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const router = useRouter();
  const { userData, logout, refresh } = useAuth();
  
  const [editFormData, setEditFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: '',
    profilePhoto: ''
  });

  // Live moderators list + backlog via SSE
  useEffect(() => {
    const es = new EventSource('/api/admin/moderators/stream');
    es.addEventListener('snapshot', (evt: MessageEvent) => {
      const data = JSON.parse(evt.data);
      setModerators(data.moderators || []);
      setUnviewedCount(data.backlog?.unviewedCount || 0);
    });
    es.addEventListener('error', () => {});
    return () => es.close();
  }, []);

  const createInvite = async (type: 'email' | 'sms') => {
    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        email, 
        phone,
        assignedLocation: selectedLocation 
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setInvites((cur) => [{ link: data.link, expiresAt: data.expiresAt }, ...cur]);
      setEmail('');
      setPhone('');
      setSelectedLocation(null);
      setAddModeratorOpen(false);
      toast.success(type === 'email' ? 'Email sent successfully!' : 'SMS sent successfully!');
    } else {
      toast.error('Failed to send invitation');
    }
  };

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

  const openAddModerator = () => {
    setPlusMenuOpen(false);
    setAddModeratorOpen(true);
  };

  const openInvitations = () => {
    setPlusMenuOpen(false);
    setInvitationsOpen(true);
  };

  const openCurrentModerators = () => {
    setPlusMenuOpen(false);
    setCurrentModeratorsOpen(true);
  };

  const updateModeratorLocation = async (moderatorId: string, location: {lat: number, lng: number}) => {
    try {
      const res = await fetch('/api/admin/moderators/location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId, location }),
      });
      
      if (res.ok) {
        toast.success('Moderator location updated successfully!');
        setLocationSelectionOpen(false);
      } else {
        toast.error('Failed to update moderator location');
      }
    } catch (error) {
      console.error('Error updating moderator location:', error);
      toast.error('Failed to update moderator location');
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      console.log('Sending profile update data:', requestData);
      
      const res = await fetch('/api/admin/profile?action=update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      if (res.ok) {
        toast.success('Changes saved successfully!');
        // Refresh user data from AuthContext
        await refreshUserData();
        return true;
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to save changes');
        return false;
      }
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('Failed to save changes');
      return false;
    }
  };

  const refreshUserData = async () => {
    try {
      // Use AuthContext refresh method to update user data
      await refresh();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/profile?action=change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (res.ok) {
        toast.success('Password changed successfully!');
        return true;
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to change password');
        return false;
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error('Failed to change password');
      return false;
    }
  };

  // Dock items configuration
  const dockItems = [
    { 
      icon: <UserPlus className="w-5 h-5" />, 
      label: 'Add Moderator', 
      onClick: () => openAddModerator() 
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      label: 'Moderators', 
      onClick: () => openCurrentModerators() 
    },
    { 
      icon: <Mail className="w-5 h-5" />, 
      label: 'Invitations', 
      onClick: () => openInvitations() 
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
    { 
      icon: <BarChart3 className="w-5 h-5" />, 
      label: 'Analytics', 
      onClick: () => setAnalyticsOpen(true) 
    },
  ];

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
    toast.success(`Navigating to ${name.split(',')[0]}`);
  };

  // Calculate stats
  const totalModerators = moderators.length;
  const onlineModerators = moderators.filter(m => m.status === 'online').length;
  const totalApproved = moderators.reduce((sum, m) => sum + m.approvedCount, 0);
  const totalRejected = moderators.reduce((sum, m) => sum + m.rejectedCount, 0);
  const totalProcessed = totalApproved + totalRejected;

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
          <MapView
            filters={{ time: timePeriod, types: selectedReportTypes }}
            enableModerationActions={false}
            showModerators={showModeratorLocations}
            moderators={moderators}
            center={mapCenter}
            zoom={mapZoom}
            useSatelliteView={useSatelliteView}
          />
        </div>
      </div>

      {/* Blur overlay when modals are open (but not search bar) */}
      {(addModeratorOpen || invitationsOpen || currentModeratorsOpen || locationSelectionOpen || profileEditOpen || passwordVerificationOpen || changePasswordOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[75]" />
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
                        {(userData?.name || 'Admin').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate text-white">{userData?.name || 'Admin'}</p>
                    <p className="text-sm text-cyan-300 truncate">{userData?.email || 'admin@nivaari.com'}</p>
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
          className="fixed inset-0 z-[65] bg-transparent"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {filterOpen && (
        <div
          className="fixed z-[70]"
          style={{ bottom: '1rem', right: '1rem' }}
        >
          <div className="w-[20rem] max-w-[90vw] rounded-2xl border border-cyan-400/30 glass-panel bg-black/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,183,255,0.3)] ring-1 ring-cyan-400/20">
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

              {/* Toggle Moderators */}
              <div>
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(255,200,0,0.5)]"></div>
                  Display Options
                </div>
                
                {/* Show Moderators Toggle */}
                <button
                  onClick={() => setShowModeratorLocations(!showModeratorLocations)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                    showModeratorLocations
                      ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,183,255,0.3)]'
                      : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className={`w-4 h-4 ${showModeratorLocations ? 'text-cyan-400' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-white">Show Moderators</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-all duration-200 ${
                    showModeratorLocations ? 'bg-cyan-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-200 ${
                      showModeratorLocations ? 'translate-x-5 mt-0.5' : 'translate-x-0.5 mt-0.5'
                    }`} />
                  </div>
                </button>

                {/* Satellite View Toggle */}
                <button
                  onClick={() => setUseSatelliteView(!useSatelliteView)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 mt-2 ${
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

      {/* Add Moderator Modal */}
      {addModeratorOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-lg mx-4 ring-1 ring-cyan-400/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  Add New Moderator
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Invite a new moderator to the team</p>
              </div>
              <button
                onClick={() => setAddModeratorOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Email Address
                  </label>
                  <Input 
                    placeholder="moderator@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone Number
                  </label>
                  <Input 
                    placeholder="+1234567890" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500"
                  />
                </div>

                {/* Location Selection */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-cyan-400" />
                    Assigned Location
                  </label>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocationSelectionOpen(true)}
                      className="w-full h-12 rounded-xl border-2 border-dashed border-cyan-400/50 hover:border-cyan-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 transition-all text-white"
                    >
                      <MapPinIcon className="w-5 h-5 text-cyan-400" />
                      {selectedLocation ? 'Change Location' : 'Select Location on Map'}
                    </Button>
                    {selectedLocation && (
                      <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/30 shadow-[0_0_10px_rgba(0,183,255,0.2)]">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-white">
                            📍 Location Selected
                          </div>
                          <button
                            onClick={() => setSelectedLocation(null)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="text-xs text-cyan-300 mt-1 font-mono">
                          Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => createInvite('email')} 
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] transition-all font-semibold border-0 text-white"
                  disabled={!email}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => createInvite('sms')}
                  className="flex-1 h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white"
                  disabled={!phone}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Send SMS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitations Modal */}
      {invitationsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setInvitationsOpen(false)}
          />
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-2xl mx-4 max-h-[85vh] ring-1 ring-cyan-400/20 flex flex-col relative">
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  Invitations Sent
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Track all sent invitations • {invites.length} total</p>
              </div>
              <button
                onClick={() => setInvitationsOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {invites.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,183,255,0.3)]">
                      <Mail className="w-10 h-10 text-cyan-400" />
                    </div>
                    <p className="text-lg font-semibold text-white">No invitations sent yet</p>
                    <p className="text-sm text-cyan-300 mt-1">Your sent invitations will appear here</p>
                  </div>
                ) : (
                  invites.map((invite, idx) => (
                    <div key={idx} className="rounded-2xl border-2 border-cyan-400/30 p-5 glass-panel bg-black/40 backdrop-blur-xl hover:shadow-[0_0_20px_rgba(0,183,255,0.3)] transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_10px_rgba(0,183,255,0.3)]">
                              <Mail className="w-4 h-4 text-cyan-400" />
                            </div>
                            <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 rounded-full">
                              Invitation #{idx + 1}
                            </span>
                          </div>
                          <div className="text-sm font-mono text-white bg-black/60 p-3 rounded-lg mb-2 break-all border border-cyan-400/20">
                            {invite.link}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-cyan-300">
                            <Clock className="w-4 h-4" />
                            <span>Expires: {new Date(invite.expiresAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(invite.link);
                            toast.success('Link copied to clipboard!');
                          }}
                          className="flex-shrink-0 p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/30 hover:bg-cyan-500/30 hover:shadow-[0_0_15px_rgba(0,183,255,0.4)] transition-all group"
                          title="Copy link"
                        >
                          <svg className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Modal */}
      {locationSelectionOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[90]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setLocationSelectionOpen(false);
              setEditingModeratorId(null);
            }}
          />
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-2xl mx-4 ring-1 ring-cyan-400/20 relative">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <MapPinIcon className="w-5 h-5 text-white" />
                  </div>
                  {editingModeratorId ? 'Update Moderator Location' : 'Select Moderator Location'}
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Double-click on the map to select a location</p>
              </div>
              <button
                onClick={() => {
                  setLocationSelectionOpen(false);
                  setEditingModeratorId(null);
                }}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="w-full h-[400px] rounded-2xl overflow-hidden border-2 border-cyan-400/30 shadow-[0_0_20px_rgba(0,183,255,0.3)]">
                <LocationSelectionMap
                  onLocationSelect={(location) => {
                    if (editingModeratorId) {
                      // Update existing moderator location
                      updateModeratorLocation(editingModeratorId, location);
                      setEditingModeratorId(null);
                    } else {
                      // Set location for new moderator invite
                      setSelectedLocation(location);
                      setLocationSelectionOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Moderators Modal */}
      {currentModeratorsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCurrentModeratorsOpen(false)}
          />
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-3xl mx-4 max-h-[85vh] ring-1 ring-cyan-400/20 flex flex-col relative">
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Current Moderators
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Manage your moderation team • {moderators.length} total</p>
              </div>
              <button
                onClick={() => setCurrentModeratorsOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {moderators.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-400/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,183,255,0.3)]">
                      <Users className="w-10 h-10 text-cyan-400" />
                    </div>
                    <p className="text-lg font-semibold text-white">No moderators yet</p>
                    <p className="text-sm text-cyan-300 mt-1">Add your first moderator to get started</p>
                  </div>
                ) : (
                  moderators.map((moderator) => (
                    <div key={moderator.userId} className="border-2 border-cyan-400/30 rounded-2xl overflow-hidden hover:shadow-[0_0_20px_rgba(0,183,255,0.3)] transition-all duration-200">
                      {/* Moderator Summary */}
                      <div 
                        className="p-5 glass-panel bg-black/40 backdrop-blur-xl cursor-pointer hover:bg-black/50 transition-all flex items-center justify-between"
                        onClick={() => setExpandedModerator(expandedModerator === moderator.userId ? null : moderator.userId)}
                      >
                        <div className="flex-1 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                            {moderator.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-white">{moderator.name}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                                moderator.status === 'online' 
                                  ? 'bg-green-500/20 border-green-400/40 text-green-300 shadow-[0_0_10px_rgba(0,255,157,0.3)]' 
                                  : 'bg-gray-500/20 border-gray-400/40 text-gray-300'
                              }`}>
                                {moderator.status === 'online' ? '🟢 Online' : '⚪ Offline'}
                              </span>
                            </div>
                            <div className="text-sm text-cyan-300 space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {moderator.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4" />
                                {moderator.assignedLocation 
                                  ? `${moderator.assignedLocation.lat.toFixed(4)}, ${moderator.assignedLocation.lng.toFixed(4)}`
                                  : 'No location assigned'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {expandedModerator === moderator.userId ? (
                            <ChevronDown className="w-6 h-6 text-cyan-400" />
                          ) : (
                            <ChevronRight className="w-6 h-6 text-cyan-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedModerator === moderator.userId && (
                        <div className="p-5 border-t-2 border-white/10 bg-black/60">
                          <div className="grid grid-cols-3 gap-4 mb-5">
                            <div className="text-center p-4 glass-panel bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border-2 border-green-400/40 shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                              <div className="text-3xl font-bold text-green-400">{moderator.approvedCount}</div>
                              <div className="text-xs text-green-300 font-medium mt-1">✓ Approved</div>
                            </div>
                            <div className="text-center p-4 glass-panel bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl border-2 border-red-400/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                              <div className="text-3xl font-bold text-red-400">{moderator.rejectedCount}</div>
                              <div className="text-xs text-red-300 font-medium mt-1">✗ Rejected</div>
                            </div>
                            <div className="text-center p-4 glass-panel bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border-2 border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                              <div className="text-3xl font-bold text-purple-400">{moderator.approvedCount + moderator.rejectedCount}</div>
                              <div className="text-xs text-purple-300 font-medium mt-1">Σ Total</div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingModeratorId(moderator.userId);
                              setLocationSelectionOpen(true);
                            }}
                            className="w-full h-11 rounded-xl border-2 border-cyan-400/40 bg-cyan-500/20 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,183,255,0.3)] flex items-center justify-center gap-2 font-semibold text-cyan-300 transition-all"
                          >
                            <MapPinIcon className="w-5 h-5" />
                            {moderator.assignedLocation ? 'Update Location' : 'Assign Location'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {profileEditOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h2>
              <button
                onClick={() => setProfileEditOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {editFormData.profilePhoto ? (
                      <img 
                        src={editFormData.profilePhoto} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-bold">
                        {(editFormData.name || 'A').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  {editFormData.profilePhoto && (
                    <button
                      onClick={() => setEditFormData(prev => ({ ...prev, profilePhoto: '' }))}
                      className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                  <Input 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <Input 
                    value={editFormData.email} 
                    className="w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    type="email"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <Input 
                    value={editFormData.phone} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Change Password Button */}
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
              >
                Change Password
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => setPasswordVerificationOpen(true)}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setProfileEditOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {passwordVerificationOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[90]">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border ${formErrors.verificationPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} w-full max-w-sm mx-4`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Verify Password</h2>
              <button
                onClick={() => {
                  setPasswordVerificationOpen(false);
                  setVerificationPassword('');
                  setFormErrors(prev => ({ ...prev, verificationPassword: false }));
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please enter your current password to save changes
              </p>
              
              <div>
                <Input 
                  type="password"
                  placeholder="Enter your password"
                  value={verificationPassword}
                  onChange={(e) => {
                    setVerificationPassword(e.target.value);
                    setFormErrors(prev => ({ ...prev, verificationPassword: false }));
                  }}
                  className={`w-full ${formErrors.verificationPassword ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={async () => {
                    const isValid = await verifyPassword(verificationPassword);
                    if (isValid) {
                      const success = await saveProfileChanges(verificationPassword);
                      if (success) {
                        setPasswordVerificationOpen(false);
                        setProfileEditOpen(false);
                        setVerificationPassword('');
                        setFormErrors(prev => ({ ...prev, verificationPassword: false }));
                      }
                    } else {
                      toast.error('Incorrect password');
                      setFormErrors(prev => ({ ...prev, verificationPassword: true }));
                      setPasswordVerificationOpen(false);
                      setVerificationPassword('');
                    }
                  }}
                  className="flex-1"
                  disabled={!verificationPassword}
                >
                  Confirm
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPasswordVerificationOpen(false);
                    setVerificationPassword('');
                    setFormErrors(prev => ({ ...prev, verificationPassword: false }));
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[90]">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border ${formErrors.currentPassword || formErrors.newPassword || formErrors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} w-full max-w-sm mx-4`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
              <button
                onClick={() => {
                  setChangePasswordOpen(false);
                  setPasswordVerified(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setFormErrors(prev => ({ ...prev, currentPassword: false, newPassword: false, confirmPassword: false }));
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Password Phase */}
              {!passwordVerified ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter your current password to continue
                  </p>
                  
                  <div>
                    <Input 
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setFormErrors(prev => ({ ...prev, currentPassword: false }));
                      }}
                      className={`w-full ${formErrors.currentPassword ? 'border-red-500' : ''}`}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={async () => {
                        const isValid = await verifyPassword(currentPassword);
                        if (isValid) {
                          setPasswordVerified(true);
                          setFormErrors(prev => ({ ...prev, currentPassword: false }));
                        } else {
                          toast.error('Wrong password');
                          setFormErrors(prev => ({ ...prev, currentPassword: true }));
                        }
                      }}
                      className="flex-1"
                      disabled={!currentPassword}
                    >
                      Verify
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setChangePasswordOpen(false);
                        setPasswordVerified(false);
                        setCurrentPassword('');
                        setFormErrors(prev => ({ ...prev, currentPassword: false }));
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* New Password Phase */
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter your new password
                  </p>
                  
                  <div>
                    <Input 
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setFormErrors(prev => ({ ...prev, newPassword: false, confirmPassword: false }));
                      }}
                      className={`w-full ${formErrors.newPassword ? 'border-red-500' : ''}`}
                    />
                  </div>

                  <div>
                    <Input 
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFormErrors(prev => ({ ...prev, confirmPassword: false }));
                      }}
                      className={`w-full ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setPasswordVerified(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setFormErrors(prev => ({ ...prev, newPassword: false, confirmPassword: false }));
                      }}
                      className="flex-none px-3"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={async () => {
                        if (newPassword !== confirmPassword) {
                          toast.error('Different password');
                          setFormErrors(prev => ({ ...prev, newPassword: true, confirmPassword: true }));
                        } else if (newPassword.length < 8) {
                          toast.error('Password must be at least 8 characters');
                          setFormErrors(prev => ({ ...prev, newPassword: true }));
                        } else {
                          const success = await changePassword(currentPassword, newPassword);
                          if (success) {
                            setChangePasswordOpen(false);
                            setPasswordVerified(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setFormErrors(prev => ({ ...prev, currentPassword: false, newPassword: false, confirmPassword: false }));
                          }
                        }
                      }}
                      className="flex-1"
                      disabled={!newPassword || !confirmPassword}
                    >
                      Confirm
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setChangePasswordOpen(false);
                        setPasswordVerified(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setFormErrors(prev => ({ ...prev, currentPassword: false, newPassword: false, confirmPassword: false }));
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {analyticsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAnalyticsOpen(false)}
          />
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-3xl mx-4 ring-1 ring-cyan-400/20 relative">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  Analytics Dashboard
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Overview of system statistics</p>
              </div>
              <button
                onClick={() => setAnalyticsOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Moderators */}
                <div className="glass-panel bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,183,255,0.3)] hover:shadow-[0_0_30px_rgba(0,183,255,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">Total Moderators</div>
                      <div className="text-3xl font-bold text-white">{totalModerators}</div>
                    </div>
                  </div>
                  <div className="text-xs text-cyan-200">All registered moderators</div>
                </div>

                {/* Online Moderators */}
                <div className="glass-panel bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,157,0.6)]">
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-green-300 uppercase tracking-wide">Online Now</div>
                      <div className="text-3xl font-bold text-white">{onlineModerators}</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-200">Active moderators</div>
                </div>

                {/* Approved Reports */}
                <div className="glass-panel bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border-2 border-purple-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)]">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-purple-300 uppercase tracking-wide">Approved</div>
                      <div className="text-3xl font-bold text-white">{totalApproved}</div>
                    </div>
                  </div>
                  <div className="text-xs text-purple-200">Approved reports</div>
                </div>

                {/* Unviewed Reports */}
                <div className="glass-panel bg-gradient-to-br from-pink-500/20 to-rose-500/20 border-2 border-pink-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(255,159,252,0.3)] hover:shadow-[0_0_30px_rgba(255,159,252,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center shadow-[0_0_15px_rgba(255,159,252,0.6)]">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-pink-300 uppercase tracking-wide">Unviewed</div>
                      <div className="text-3xl font-bold text-white">{unviewedCount}</div>
                    </div>
                  </div>
                  <div className="text-xs text-pink-200">Pending review</div>
                </div>

                {/* Total Processed */}
                <div className="glass-panel bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-yellow-300 uppercase tracking-wide">Processed</div>
                      <div className="text-3xl font-bold text-white">{totalProcessed}</div>
                    </div>
                  </div>
                  <div className="text-xs text-yellow-200">Total processed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}