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
  AlertTriangle, 
  Construction, 
  Car, 
  Trash2, 
  Lightbulb, 
  Droplets, 
  Trees,
  MapPin,
  CheckCircle,
  Map,
  List,
  Image as ImageIcon,
  Home,
  FileText,
  TrendingUp,
  Activity,
  BarChart3,
  Search,
  Eye,
  Clock,
  Satellite,
  Edit,
  Camera,
  Archive
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

const issueTypes = ['Road Damage', 'Water Supply', 'Electricity', 'Garbage', 'Healthcare', 'Flooding', 'Other'];

type ViewMode = 'map' | 'list' | 'image';

type ApprovedReport = { 
  id?: string; 
  title: string; 
  type: string; 
  city?: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
};

export default function CitizenDashboard() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [passwordVerificationOpen, setPasswordVerificationOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [locationSelectionOpen, setLocationSelectionOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [reportLocation, setReportLocation] = useState<{lat: number, lng: number} | null>(null);
  const [reportImage, setReportImage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [currentView, setCurrentView] = useState<ViewMode>('map');
  const [showArchive, setShowArchive] = useState(false);
  const [reports, setReports] = useState<ApprovedReport[]>([]);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [useSatelliteView, setUseSatelliteView] = useState(false);
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
  
  const router = useRouter();
  const { userData, logout, refresh } = useAuth();
  
  const [editFormData, setEditFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: '',
    profilePhoto: ''
  });

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/citizen-reports', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setReports(data.reports);
    };
    load();
  }, []);

  const filteredReports = selectedCategories.length === 0 
    ? reports 
    : reports.filter(report => selectedCategories.includes(report.type));

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };

  const submitReport = async () => {
    if (!title || !type || !description) {
      toast.error('Please fill in title, type and description');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/citizen-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          type, 
          description, 
          location: reportLocation ? {
            lat: reportLocation.lat,
            lng: reportLocation.lng,
            address: address
          } : { address },
          image: reportImage
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Report submitted successfully');
        setTitle(''); 
        setType(''); 
        setDescription(''); 
        setAddress('');
        setReportLocation(null);
        setReportImage('');
        setReportOpen(false);
        // Reload reports
        const load = async () => {
          const res = await fetch('/api/citizen-reports', { cache: 'no-store' });
          const data = await res.json();
          if (res.ok) setReports(data.reports);
        };
        load();
      } else {
        toast.error(data?.error || 'Failed to submit report');
      }
    } finally {
      setSubmitting(false);
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

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
    toast.success(`Navigating to ${name.split(',')[0]}`);
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

  const handleReportImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReportImage(result);
        toast.success('Image uploaded successfully!');
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
        await refresh();
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
      icon: <Plus className="w-5 h-5" />, 
      label: 'Report Issue', 
      onClick: () => setReportOpen(true) 
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
    { 
      icon: <BarChart3 className="w-5 h-5" />, 
      label: 'View Stats', 
      onClick: () => setAnalyticsOpen(true) 
    },
  ];

  // Calculate stats
  const totalReports = reports.length;
  const infrastructureReports = reports.filter(r => ['Road Damage', 'potholes'].includes(r.type)).length;
  const healthReports = reports.filter(r => ['Healthcare', 'water'].includes(r.type)).length;
  const safetyReports = reports.filter(r => ['danger', 'traffic'].includes(r.type)).length;

  return (
    <div className="fixed inset-0 w-full h-screen bg-black">

      {/* Map/View Container - Fixed Size */}
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
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Archive className="w-8 h-8 text-cyan-400" />
                Report Archive
              </h2>
              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
                  <p className="text-cyan-300/70 text-lg">No approved reports yet. They will appear here once moderators approve them.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="glass-panel bg-black/60 backdrop-blur-xl border-2 border-cyan-400/30 rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(0,183,255,0.4)] transition-all duration-300 hover:scale-105">
                      <h3 className="text-lg font-bold text-white mb-2">{report.title}</h3>
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
              reports={filteredReports}
              center={mapCenter}
              zoom={mapZoom}
              useSatelliteView={useSatelliteView}
            />
          )}
        </div>
      </div>

      {/* Blur overlay when modals are open (but not search bar) */}
      {(reportOpen || analyticsOpen || profileEditOpen || passwordVerificationOpen || changePasswordOpen || locationSelectionOpen) && (
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
                        {(userData?.name || 'Citizen').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate text-white">{userData?.name || 'Citizen'}</p>
                    <p className="text-sm text-cyan-300 truncate">{userData?.email || 'citizen@nivaari.com'}</p>
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
                    const checked = selectedCategories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCategory(c.id)}
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

              {/* Satellite View Toggle */}
              <div>
                <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(255,200,0,0.5)]"></div>
                  Display Options
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

      {/* Report Issue Modal */}
      {reportOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-2xl mx-4 ring-1 ring-cyan-400/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-black/90 backdrop-blur-xl z-10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  Report an Issue
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Help improve your community</p>
              </div>
              <button
                onClick={() => {
                  setReportOpen(false);
                  setTitle('');
                  setType('');
                  setDescription('');
                  setAddress('');
                  setReportLocation(null);
                  setReportImage('');
                }}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Title
                  </label>
                  <Input 
                    placeholder="Brief title of the issue" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Issue Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {reportCategories.map((c) => {
                      const Icon = c.icon;
                      const checked = type === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setType(c.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                            checked
                              ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,183,255,0.3)]'
                              : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            checked 
                              ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(0,183,255,0.5)]' 
                              : 'border-white/30'
                          }`}>
                            {checked && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <Icon className={`w-4 h-4 ${c.color}`} />
                          <span className="text-sm font-medium text-white">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Description
                  </label>
                  <Textarea 
                    placeholder="Describe the issue in detail" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[100px] rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500 resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-cyan-400" />
                    Upload Image (Optional)
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      id="report-image-upload"
                      accept="image/*"
                      onChange={handleReportImageUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('report-image-upload')?.click()}
                      className="w-full h-12 rounded-xl border-2 border-dashed border-cyan-400/50 hover:border-cyan-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 transition-all text-white"
                    >
                      <Camera className="w-5 h-5 text-cyan-400" />
                      {reportImage ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {reportImage && (
                      <div className="relative rounded-xl overflow-hidden border-2 border-cyan-400/30">
                        <img 
                          src={reportImage} 
                          alt="Report preview" 
                          className="w-full h-48 object-cover"
                        />
                        <button
                          onClick={() => setReportImage('')}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                          title="Remove image"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Selection */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Location
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Address (optional)" 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)}
                        className="flex-1 h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => navigator.geolocation?.getCurrentPosition((pos) => {
                          setReportLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                          setAddress(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                          toast.success('Location captured from GPS');
                        })}
                        className="h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white px-4 whitespace-nowrap"
                      >
                        Use GPS
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setLocationSelectionOpen(true)}
                      className="w-full h-12 rounded-xl border-2 border-dashed border-cyan-400/50 hover:border-cyan-400 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 transition-all text-white"
                    >
                      <MapPin className="w-5 h-5 text-cyan-400" />
                      {reportLocation ? 'Change Location on Map' : 'Select Location on Map'}
                    </Button>
                    {reportLocation && (
                      <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/30 shadow-[0_0_10px_rgba(0,183,255,0.2)]">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-white">
                            📍 Location Selected
                          </div>
                          <button
                            onClick={() => {
                              setReportLocation(null);
                              setAddress('');
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="text-xs text-cyan-300 mt-1 font-mono">
                          Lat: {reportLocation.lat.toFixed(6)}, Lng: {reportLocation.lng.toFixed(6)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={submitReport} 
                  disabled={submitting}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] transition-all font-semibold border-0 text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
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
                  Report Statistics
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Overview of community reports</p>
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
                {/* Total Reports */}
                <div className="glass-panel bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,183,255,0.3)] hover:shadow-[0_0_30px_rgba(0,183,255,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">Total Reports</div>
                      <div className="text-3xl font-bold text-white">{totalReports}</div>
                    </div>
                  </div>
                  <div className="text-xs text-cyan-200">Approved community reports</div>
                </div>

                {/* Infrastructure */}
                <div className="glass-panel bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(251,146,60,0.3)] hover:shadow-[0_0_30px_rgba(251,146,60,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,146,60,0.6)]">
                      <Construction className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-orange-300 uppercase tracking-wide">Infrastructure</div>
                      <div className="text-3xl font-bold text-white">{infrastructureReports}</div>
                    </div>
                  </div>
                  <div className="text-xs text-orange-200">Roads & utilities</div>
                </div>

                {/* Health & Safety */}
                <div className="glass-panel bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/40 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)] transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,157,0.6)]">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-green-300 uppercase tracking-wide">Health & Safety</div>
                      <div className="text-3xl font-bold text-white">{healthReports + safetyReports}</div>
                    </div>
                  </div>
                  <div className="text-xs text-green-200">Health & safety issues</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                        {(editFormData.name || 'C').charAt(0).toUpperCase()}
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
                  <Input 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </label>
                  <Input 
                    value={editFormData.email} 
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-gray-400 cursor-not-allowed"
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
                  <Input 
                    value={editFormData.phone} 
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full h-12 rounded-xl border-2 border-white/10 bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Change Password Button */}
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-white border-2 border-white/10 hover:border-cyan-400/50 transition-all font-medium"
              >
                Change Password
              </button>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => setPasswordVerificationOpen(true)}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] transition-all font-semibold border-0 text-white"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setProfileEditOpen(false)}
                  className="flex-1 h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white bg-transparent"
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
          <div className={`glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border-2 ${formErrors.verificationPassword ? 'border-red-500/50' : 'border-cyan-400/30'} w-full max-w-md mx-4 ring-1 ring-cyan-400/20`}>
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
                <p className="text-sm text-cyan-300 mt-1">Enter password to confirm changes</p>
              </div>
              <button
                onClick={() => {
                  setPasswordVerificationOpen(false);
                  setVerificationPassword('');
                  setFormErrors(prev => ({ ...prev, verificationPassword: false }));
                }}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-cyan-300/80">
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
                  className={`w-full h-12 rounded-xl border-2 ${formErrors.verificationPassword ? 'border-red-500/50' : 'border-white/10'} bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500`}
                />
                {formErrors.verificationPassword && (
                  <p className="text-xs text-red-400 mt-2">Incorrect password</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
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
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] transition-all font-semibold border-0 text-white"
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
                  className="flex-1 h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white bg-transparent"
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
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-md mx-4 ring-1 ring-cyan-400/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.6)]">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  Change Password
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Update your account password</p>
              </div>
              <button
                onClick={() => {
                  setChangePasswordOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setFormErrors(prev => ({ ...prev, currentPassword: false, newPassword: false, confirmPassword: false }));
                }}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">Current Password</label>
                <Input 
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setFormErrors(prev => ({ ...prev, currentPassword: false }));
                  }}
                  className={`w-full h-12 rounded-xl border-2 ${formErrors.currentPassword ? 'border-red-500/50' : 'border-white/10'} bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500`}
                />
                {formErrors.currentPassword && (
                  <p className="text-xs text-red-400 mt-2">Incorrect current password</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">New Password</label>
                <Input 
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setFormErrors(prev => ({ ...prev, newPassword: false }));
                  }}
                  className={`w-full h-12 rounded-xl border-2 ${formErrors.newPassword ? 'border-red-500/50' : 'border-white/10'} bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500`}
                />
                {formErrors.newPassword && (
                  <p className="text-xs text-red-400 mt-2">Password must be at least 6 characters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">Confirm New Password</label>
                <Input 
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setFormErrors(prev => ({ ...prev, confirmPassword: false }));
                  }}
                  className={`w-full h-12 rounded-xl border-2 ${formErrors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} bg-white/5 text-white focus:border-cyan-400 transition-colors placeholder:text-gray-500`}
                />
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-2">Passwords do not match</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={async () => {
                    if (newPassword !== confirmPassword) {
                      toast.error('Passwords do not match');
                      setFormErrors(prev => ({ ...prev, confirmPassword: true }));
                    } else if (newPassword.length < 6) {
                      toast.error('Password must be at least 6 characters');
                      setFormErrors(prev => ({ ...prev, newPassword: true }));
                    } else {
                      const success = await changePassword(currentPassword, newPassword);
                      if (success) {
                        setChangePasswordOpen(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setFormErrors(prev => ({ ...prev, currentPassword: false, newPassword: false, confirmPassword: false }));
                      }
                    }
                  }}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 shadow-[0_0_20px_rgba(0,183,255,0.4)] hover:shadow-[0_0_30px_rgba(0,183,255,0.6)] transition-all font-semibold border-0 text-white"
                  disabled={!newPassword || !confirmPassword}
                >
                  Confirm
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setFormErrors(prev => ({ ...prev, currentPassword: false, newPassword: false, confirmPassword: false }));
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-white/20 hover:bg-white/10 font-semibold transition-all text-white bg-transparent"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Map Modal */}
      {locationSelectionOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[90]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setLocationSelectionOpen(false)}
          />
          <div className="glass-panel bg-black/90 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_rgba(0,183,255,0.4)] border border-cyan-400/30 w-full max-w-4xl mx-4 ring-1 ring-cyan-400/20 relative h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,183,255,0.6)]">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  Select Location
                </h2>
                <p className="text-sm text-cyan-300 mt-1">Click on the map to select incident location</p>
              </div>
              <button
                onClick={() => setLocationSelectionOpen(false)}
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="h-[calc(100%-120px)]">
              <LocationSelectionMap
                onLocationSelect={(location) => {
                  setReportLocation(location);
                  setAddress(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
                  setLocationSelectionOpen(false);
                  toast.success('Location selected on map');
                }}
                initialLocation={reportLocation}
              />
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