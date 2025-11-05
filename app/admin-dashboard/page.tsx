'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
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
  EyeOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

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
            filters={{ time: timePeriod, types: selectedReportTypes }}
            enableModerationActions={false}
            showModerators={showModeratorLocations}
            moderators={moderators}
          />
        </div>
      </div>

      {/* Blur overlay when modals are open */}
      {(addModeratorOpen || invitationsOpen || currentModeratorsOpen || locationSelectionOpen || profileEditOpen || passwordVerificationOpen || changePasswordOpen) && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[75]" />
      )}

      {/* Profile Menu - Top Right */}
      <div className="fixed top-4 right-4 z-[60]">
        <div className="relative">
          {/* Profile Button */}
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
          >
            {userData?.profilePhoto ? (
              <img 
                src={userData.profilePhoto} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* User Info */}
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    {userData?.profilePhoto ? (
                      <img 
                        src={userData.profilePhoto} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-lg font-bold">
                        {(userData?.name || 'Admin').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{userData?.name || 'Admin'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs opacity-90">{userData?.email || 'admin@nivaari.com'}</p>
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
                        className="px-2 py-1 bg-white text-black text-xs rounded hover:bg-gray-100 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
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

      {/* Plus Button - Bottom Left */}
      <div className="fixed bottom-8 left-8 z-[60]">
        <div className="relative">
          {/* Expandable Menu */}
          {plusMenuOpen && (
            <div className="absolute bottom-16 left-0 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-48">
              <button
                onClick={openAddModerator}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Moderator</span>
              </button>
              <button
                onClick={openCurrentModerators}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Moderators</span>
              </button>
              <button
                onClick={openInvitations}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Mail className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Invitations Sent</span>
              </button>
            </div>
          )}

          {/* Plus Button */}
          <button
            onClick={() => setPlusMenuOpen(!plusMenuOpen)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all hover:scale-110"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Close plus menu when clicking outside */}
      {plusMenuOpen && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setPlusMenuOpen(false)}
        />
      )}

      {/* Toggle Button - Above Filter Button */}
      <button
        onClick={() => setShowModeratorLocations(!showModeratorLocations)}
        className={`fixed bottom-24 right-8 w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all z-[60] hover:scale-110 ${
          showModeratorLocations 
            ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
            : 'bg-gradient-to-br from-gray-500 to-gray-600'
        }`}
        title="Toggle Moderator Locations"
      >
        <Users className="w-5 h-5 text-white" />
      </button>

      {/* Filter Button - Bottom Right */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all z-[60] hover:scale-110"
      >
        <Filter className="w-6 h-6 text-white" />
      </button>

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
          style={{ bottom: '6rem', right: '2rem' }}
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

      {/* Add Moderator Modal */}
      {addModeratorOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Add New Moderator</h2>
              <button
                onClick={() => setAddModeratorOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Unviewed citizen reports: <span className="font-medium text-gray-900 dark:text-gray-100">{unviewedCount}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <Input 
                  placeholder="moderator@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                <Input 
                  placeholder="+1234567890" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assigned Location</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocationSelectionOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    Select Location
                  </Button>
                  {selectedLocation && (
                    <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                      Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={() => createInvite('email')} 
                  className="flex-1"
                  disabled={!email}
                >
                  Send Email Invitation
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => createInvite('sms')}
                  className="flex-1"
                  disabled={!phone}
                >
                  Send SMS Invitation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invitations Modal */}
      {invitationsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[80]">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invitations Sent</h2>
              <button
                onClick={() => setInvitationsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {invites.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No invitations sent yet.</p>
                  </div>
                ) : (
                  invites.map((invite, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {invite.link}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Expires: {new Date(invite.expiresAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => navigator.clipboard.writeText(invite.link)}
                          className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="Copy link"
                        >
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 h-96">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingModeratorId ? 'Update Moderator Location' : 'Select Moderator Location'}
              </h2>
              <button
                onClick={() => {
                  setLocationSelectionOpen(false);
                  setEditingModeratorId(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
              Double-click on the map to select a location for the moderator.
            </div>
            <div className="flex-1 p-4 h-80">
              <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 max-h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Current Moderators</h2>
              <button
                onClick={() => setCurrentModeratorsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-3">
                {moderators.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No moderators yet.</p>
                  </div>
                ) : (
                  moderators.map((moderator) => (
                    <div key={moderator.userId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Moderator Summary */}
                      <div 
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                        onClick={() => setExpandedModerator(expandedModerator === moderator.userId ? null : moderator.userId)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{moderator.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${moderator.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                              {moderator.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>📧 {moderator.email}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPinIcon className="w-3 h-3" />
                              Location: {moderator.assignedLocation 
                                ? `${moderator.assignedLocation.lat.toFixed(4)}, ${moderator.assignedLocation.lng.toFixed(4)}`
                                : 'Not assigned'
                              }
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {expandedModerator === moderator.userId ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedModerator === moderator.userId && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{moderator.approvedCount}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Approved</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{moderator.rejectedCount}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Rejected</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{moderator.approvedCount + moderator.rejectedCount}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setEditingModeratorId(moderator.userId);
                                setLocationSelectionOpen(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <MapPinIcon className="w-4 h-4" />
                              {moderator.assignedLocation ? 'Change Location' : 'Assign Location'}
                            </Button>
                          </div>
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
    </div>
  );
}