import { useState, useEffect } from 'react';
import { User, LogOut, CheckCircle2, AlertCircle, RefreshCw, Save, Mail, Calendar, Clock } from 'lucide-react';
import { getUserStats, getConnectionStatus, updateUserProfile, getUserProfile } from '../services/api';

interface ProfileScreenProps {
  onLogout: () => void;
}

interface StatsData {
  emailsToday: number;
  totalEmails: number;
  timeSavedMinutes: number;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
}

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [connection, setConnection] = useState<{ isConnected: boolean; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Personal Information state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const [statsData, connectionData] = await Promise.all([
        getUserStats(),
        getConnectionStatus()
      ]);
      setStats(statsData);
      setConnection(connectionData);

      try {
        const profileData = await getUserProfile();
        setPersonalInfo({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || connectionData?.email || ''
        });
      } catch {
        if (connectionData?.email) {
          const emailParts = connectionData.email.split('@')[0].split('.');
          setPersonalInfo({
            firstName: emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || '',
            lastName: emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || '',
            email: connectionData.email
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile data:', err);
      setError(err.message || 'Failed to load profile data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await updateUserProfile(personalInfo);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const getInitials = () => {
    const first = personalInfo.firstName?.[0]?.toUpperCase() || '';
    const last = personalInfo.lastName?.[0]?.toUpperCase() || '';
    return first + last || connection?.email?.[0]?.toUpperCase() || 'U';
  };

  const formatTimeSaved = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${(minutes / 60).toFixed(1)}h`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0A0A0A] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#22d3ee]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-[#0A0A0A] text-white font-sans selection:bg-[#22d3ee] selection:text-black">

      {/* --- Ambient Background --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#22d3ee]/5 blur-[80px] rounded-full opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#3b82f6]/5 blur-[80px] rounded-full opacity-40"></div>
      </div>

      {/* --- Header --- */}
      <div className="relative sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#262626]">
        <h1 className="text-lg font-semibold tracking-wide">Settings & Profile</h1>
        <button
          onClick={fetchData}
          className="p-2 hover:bg-[#1f1f1f] rounded-full transition-all active:scale-90 text-gray-400 hover:text-white"
          title="Refresh Data"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* --- Content --- */}
      <div className="relative z-10 flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-[#22d3ee]/20 scrollbar-track-transparent">
        <div className="max-w-md mx-auto space-y-8 pb-10">

          {/* 1. Avatar & Hero Section */}
          <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#171717] to-[#262626] border-2 border-[#333] flex items-center justify-center text-[#22d3ee] text-3xl font-bold shadow-xl overflow-hidden group-hover:border-[#22d3ee] transition-all duration-300">
                {getInitials()}
              </div>
              <div className="absolute bottom-0 right-0 bg-[#22d3ee] text-[#0A0A0A] p-1.5 rounded-full border-2 border-[#0A0A0A] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <User className="w-3 h-3" />
              </div>
            </div>
            <h2 className="mt-4 text-xl font-bold text-white">{personalInfo.firstName} {personalInfo.lastName}</h2>
            <p className="text-gray-500 text-sm">{personalInfo.email}</p>
          </div>

          {/* 2. Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 flex flex-col items-center justify-center hover:border-[#22d3ee]/30 transition-colors">
              <div className="mb-2 p-2 bg-[#22d3ee]/10 rounded-full text-[#22d3ee]">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white">{stats?.emailsToday || 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">Today</span>
            </div>
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 flex flex-col items-center justify-center hover:border-[#22d3ee]/30 transition-colors">
              <div className="mb-2 p-2 bg-[#22d3ee]/10 rounded-full text-[#22d3ee]">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white">{stats?.totalEmails || 0}</span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">Total</span>
            </div>
            <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 flex flex-col items-center justify-center hover:border-[#22d3ee]/30 transition-colors">
              <div className="mb-2 p-2 bg-[#22d3ee]/10 rounded-full text-[#22d3ee]">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white">
                {stats?.timeSavedMinutes ? formatTimeSaved(stats.timeSavedMinutes) : '0m'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mt-1">Saved</span>
            </div>
          </div>

          {/* 3. Personal Info Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider ml-1">Account Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 ml-1">First Name</label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee]/50 transition-all placeholder-gray-600"
                  placeholder="First name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500 ml-1">Last Name</label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee]/50 transition-all placeholder-gray-600"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500 ml-1">Email Address</label>
              <input
                type="email"
                value={personalInfo.email}
                disabled
                className="w-full bg-[#121212]/50 border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full mt-2 bg-[#22d3ee] hover:bg-[#1bbccf] text-black font-semibold py-3 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>

          {/* 4. Danger / Logout Zone */}
          <div className="pt-6 border-t border-[#262626]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connection?.isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-400 font-medium">
                  {connection?.isConnected ? 'Gmail Connected' : 'Gmail Disconnected'}
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full bg-[#121212] hover:bg-red-900/10 text-red-500 border border-[#262626] hover:border-red-500/30 py-3 rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>


          {/* Error Toast */}
          {error && (
            <div className="fixed bottom-4 left-4 right-4 bg-red-900/90 border border-red-500/50 text-white px-4 py-3 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-3 animate-in slide-in-from-bottom-5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}