import React from "react";
import { useAuth } from "../context/auth-context";
import { motion } from "framer-motion";
import { 
  User, Mail, Shield, CreditCard, Wallet, Coins, Calendar, Clock, Activity, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, Share2, Settings, Edit2, 
  Video, PlayCircle, HardDrive, Zap, Edit, Image as ImageIcon, ChevronRight, ChevronLeft,
  DownloadCloud, Star, Award, Lock, Smartphone, MonitorPlay, Save, 
  Globe, LogOut, Trash2, Database, Download, Bell, Play, FileVideo, Sparkles
} from "lucide-react";

import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { AnimatePresence } from "framer-motion";

export function ProfilePage() {
  const navigate = useNavigate();
  const { session, profile, isLoading, refreshProfile, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [stats, setStats] = React.useState({
    projects: 0,
    videosGenerated: 0,
    imagesGenerated: 0,
    manualEdits: 0,
    creditsUsed: 0
  });

  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    fullName: "",
    username: "",
    timezone: "",
    phone: "",
    country: "",
    language: ""
  });
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || "",
        username: profile.name || "",
        timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        phone: profile.phone || "",
        country: profile.country || "",
        language: profile.language || "English (US)"
      });
    }
  }, [profile]);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('veytrix_history');
      if (saved) {
        const history = JSON.parse(saved);
        const projects = history.length;
        const videosGenerated = history.filter((i: any) => ['forge'].includes(i.tool)).length;
        const imagesGenerated = history.filter((i: any) => ['avatar'].includes(i.tool)).length;
        const manualEdits = history.filter((i: any) => ['quick-edit'].includes(i.tool)).length;
        
        setStats({
          projects,
          videosGenerated,
          imagesGenerated,
          manualEdits,
          creditsUsed: projects * 5 // Mocking 5 credits per project since we don't have a backend ledger yet
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await refreshProfile();
    } catch (err) {
      setError("Failed to refresh profile data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('app_profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: editForm.fullName,
          name: editForm.username,
          timezone: editForm.timezone,
          phone: editForm.phone,
          country: editForm.country,
          language: editForm.language,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.error('Failed to update profile:', error);
        setError("Failed to update profile. Please try again.");
      } else {
        await refreshProfile();
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0B0815] p-6 lg:p-12 flex flex-col items-center justify-start text-white">
        <div className="w-full max-w-[1600px] space-y-8 animate-pulse">
          <div className="h-40 w-full bg-white/5 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl" />)}
          </div>
          <div className="h-64 w-full bg-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || (!profile && !session)) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0B0815] flex flex-col items-center justify-center p-6 text-white text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Profile</h2>
        <p className="text-gray-400 mb-6">{error || "Could not load user profile."}</p>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    );
  }

  const userInitial = profile?.fullName?.charAt(0) || session?.user?.email?.charAt(0) || "U";
  const fullName = profile?.fullName || "User";
  const email = profile?.email || session?.user?.email || "Unknown";
  const role = profile?.role || "User";
  
  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };
  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit'
    });
  }

  const accountCreated = session?.user?.created_at ? formatDate(session.user.created_at) : "N/A";
  const lastLogin = session?.user?.last_sign_in_at ? `${formatDate(session.user.last_sign_in_at)} ${formatTime(session.user.last_sign_in_at)}` : "N/A";
  const isEmailVerified = !!session?.user?.email_confirmed_at;

  const SectionTitle = ({ title }: { title: string }) => (
    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
      {title}
      <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-2" />
    </h2>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-[#0B0815] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-[#0B0815] to-[#0B0815] overflow-y-auto overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8 lg:py-12 space-y-12">
        
        {/* Back Button */}
        <div className="-mb-8 relative z-20">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold w-fit bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 backdrop-blur-md">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* TOP HEADER: Profile Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141223]/80 backdrop-blur-3xl border border-purple-500/10 shadow-[0_0_50px_rgba(168,85,247,0.05)] rounded-3xl p-6 lg:p-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 relative overflow-hidden"
        >
          {/* Decorative Glow */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-center gap-8 relative z-10 w-full lg:w-auto">
            <div className="relative shrink-0">
              <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-4xl font-black shadow-[0_0_30px_rgba(168,85,247,0.4)] border-4 border-[#141223]">
                {userInitial.toUpperCase()}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-[3px] border-[#141223]" title="Online" />
            </div>
            
            <div className="text-center md:text-left w-full lg:w-auto">
              <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-white">{fullName}</h1>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 uppercase tracking-wider">
                    Pro Plan
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">{email} • {role} • Member since {accountCreated}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto relative z-10 shrink-0">
            <button onClick={() => setIsEditing(true)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all flex items-center gap-2 border border-white/5 hover:border-white/10 cursor-pointer">
              <Edit2 className="w-4 h-4 text-gray-400" /> Edit Profile
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all flex items-center gap-2 border border-white/5 hover:border-white/10">
              <Share2 className="w-4 h-4 text-gray-400" /> Share
            </button>
          </div>
        </motion.div>

        {/* ROW 1: Key Statistics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-purple-500/30 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Current Plan</span>
            <div className="flex items-end gap-3 mt-auto">
              <span className="text-3xl font-black text-white">Pro Tier</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-fuchsia-500/30 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-fuchsia-500/20 transition-all" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Wallet Balance</span>
            <div className="flex items-end gap-3 mt-auto">
              <span className="text-3xl font-black text-white">$0.00</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Available Credits</span>
            <div className="flex items-end gap-3 mt-auto">
              <span className="text-3xl font-black text-white">0</span>
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-emerald-500/30 transition-all cursor-default">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Projects Created</span>
            <div className="flex items-end gap-3 mt-auto">
              <span className="text-3xl font-black text-white">{stats.projects}</span>
            </div>
          </div>
        </motion.div>

        {/* ROW 2: Account Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionTitle title="Account Information" />
          <div className="bg-[#141223]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Full Name</p>
                <p className="text-sm font-medium text-white">{fullName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-2">
                  Username
                  <button onClick={() => setIsEditing(true)} className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"><Edit2 className="w-3 h-3" /></button>
                </p>
                <p className="text-sm font-medium text-white">@{profile?.name || "Not Set"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Email Address</p>
                <p className="text-sm font-medium text-white">{email}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-2">
                  Phone Number
                  <button onClick={() => setIsEditing(true)} className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"><Edit2 className="w-3 h-3" /></button>
                </p>
                <p className="text-sm font-medium text-white">{profile?.phone || <span className="text-gray-400 italic">Not provided</span>}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-2">
                  Country / Region
                  <button onClick={() => setIsEditing(true)} className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"><Edit2 className="w-3 h-3" /></button>
                </p>
                <p className="text-sm font-medium text-white">{profile?.country || <span className="text-gray-400 italic">Not set</span>}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Timezone</p>
                <p className="text-sm font-medium text-white">{profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-2">
                  Language
                  <button onClick={() => setIsEditing(true)} className="text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"><Edit2 className="w-3 h-3" /></button>
                </p>
                <p className="text-sm font-medium text-white">{profile?.language || "English (US)"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Account Status</p>
                <p className="text-sm font-medium text-green-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Active</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Email Verification</p>
                <p className={`text-sm font-medium flex items-center gap-1.5 ${isEmailVerified ? 'text-green-400' : 'text-red-400'}`}>
                  {isEmailVerified ? <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</> : <><XCircle className="w-3.5 h-3.5" /> Unverified</>}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Member Since</p>
                <p className="text-sm font-medium text-white">{accountCreated}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Last Login</p>
                <p className="text-sm font-medium text-white">{lastLogin}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1.5">Login Method</p>
                <p className="text-sm font-medium text-white capitalize">{session?.user?.app_metadata?.provider === 'email' ? 'Email' : session?.user?.app_metadata?.provider || 'Email'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ROW 3: Workspace Statistics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SectionTitle title="Workspace Statistics" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Video, label: "Videos Generated", value: stats.videosGenerated.toString(), color: "text-purple-400" },
              { icon: Database, label: "Projects", value: stats.projects.toString(), color: "text-blue-400" },
              { icon: Download, label: "Exports", value: "0", color: "text-green-400" },
              { icon: Zap, label: "Credits Used", value: stats.creditsUsed.toString(), color: "text-amber-400" },
              { icon: HardDrive, label: "Storage Used", value: "0 GB", color: "text-cyan-400" },
              { icon: Clock, label: "AI Hours", value: "0h", color: "text-fuchsia-400" },
              { icon: Edit, label: "Manual Edits", value: stats.manualEdits.toString(), color: "text-pink-400" },
              { icon: ImageIcon, label: "Images Generated", value: stats.imagesGenerated.toString(), color: "text-indigo-400" }
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-colors flex flex-col gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ROW 4 & 5 GRID: Subscription & Activity Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* ROW 4: Subscription (Takes 1 Column) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="xl:col-span-1">
            <SectionTitle title="Subscription" />
            <div className="bg-gradient-to-br from-[#1A1435] to-[#110D24] border border-purple-500/20 rounded-3xl p-6 lg:p-8 h-[calc(100%-3rem)] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              
              <div className="mb-8">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 uppercase tracking-wider mb-4 inline-block">Active Plan</span>
                <h3 className="text-4xl font-black text-white">Pro Tier</h3>
                <p className="text-gray-400 text-sm mt-2">Billed Annually</p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-sm text-gray-400 font-medium">Renewal Date</span>
                  <span className="text-sm font-bold text-white">Dec 31, 2026</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-sm text-gray-400 font-medium">Credits Remaining</span>
                  <span className="text-sm font-bold text-white">0 / month</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400 font-medium">Billing Cycle</span>
                  <span className="text-sm font-bold text-white">Yearly</span>
                </div>
              </div>

              <div className="space-y-3 mt-auto relative z-10">
                <button onClick={() => navigate('/wallet')} className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Upgrade Plan
                </button>
                <button className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors border border-white/5">
                  Manage Subscription
                </button>
              </div>
            </div>
          </motion.div>

          {/* ROW 5: Recent Activity Timeline (Takes 2 Columns) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="xl:col-span-2">
            <SectionTitle title="Recent Activity" />
            <div className="bg-[#141223]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 lg:p-8 h-[calc(100%-3rem)]">
              <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                
                {/* Dummy Event 1 */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-purple-500 bg-[#141223] group-[.is-active]:bg-purple-500 text-slate-500 group-[.is-active]:text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-[-24px] md:static md:left-auto">
                    <User className="w-3 h-3" />
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2.5rem)] bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-white text-sm">Account Created</div>
                      <time className="text-[10px] text-gray-500 font-medium">{accountCreated}</time>
                    </div>
                    <div className="text-xs text-gray-400">Welcome to VEYTRIX.AI!</div>
                  </div>
                </div>

                {/* Simulated empty states or previous logins */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/10 bg-[#141223] text-gray-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-[-24px] md:static md:left-auto">
                    <Shield className="w-3 h-3" />
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2.5rem)] bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-gray-300 text-sm">New Login</div>
                      <time className="text-[10px] text-gray-500 font-medium">{lastLogin}</time>
                    </div>
                    <div className="text-xs text-gray-500">Logged in securely.</div>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group opacity-50">
                   <div className="text-xs text-gray-500 italic w-full text-center py-4">
                     Generate your first AI Video to see more activity here.
                   </div>
                </div>

              </div>
            </div>
          </motion.div>
        </div>

        {/* ROW 6: Achievements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <SectionTitle title="Achievements" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Star, label: "Early User", active: true, color: "from-amber-500/20 to-orange-600/20 border-orange-500/30 text-orange-400" },
              { icon: Shield, label: "Verified", active: isEmailVerified, color: "from-blue-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400" },
              { icon: Award, label: "Pro Member", active: true, color: "from-purple-500/20 to-fuchsia-600/20 border-fuchsia-500/30 text-fuchsia-400" },
              { icon: Play, label: "First Video", active: false, color: "from-white/5 to-white/5 border-white/10 text-gray-600" },
              { icon: Zap, label: "Power User", active: false, color: "from-white/5 to-white/5 border-white/10 text-gray-600" },
              { icon: Video, label: "100 Videos", active: false, color: "from-white/5 to-white/5 border-white/10 text-gray-600" }
            ].map((badge, i) => (
              <div key={i} className={`flex flex-col items-center justify-center p-6 rounded-2xl border bg-gradient-to-br ${badge.color} ${!badge.active && 'grayscale opacity-50'}`}>
                <badge.icon className="w-8 h-8 mb-3 drop-shadow-[0_0_10px_currentColor]" />
                <span className="text-xs font-bold uppercase tracking-wider text-center">{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>


        {/* ROW 8 & 9 GRID: Security & Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ROW 8: Security */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <SectionTitle title="Security" />
            <div className="bg-[#141223]/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {[
                  { label: "Password", value: "Updated 3 months ago", action: "Change" },
                  { label: "Two-Factor Auth", value: "Not configured", action: "Enable", alert: true },
                  { label: "Active Devices", value: "2 devices connected", action: "Manage" },
                  { label: "Recent Sessions", value: lastLogin, action: "View All" },
                  { label: "Connected Accounts", value: "Google", action: "Manage" }
                ].map((item, i) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        {item.label}
                        {item.alert && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                      </p>
                      <p className="text-xs text-gray-400">{item.value}</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ROW 9: Preferences */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <SectionTitle title="Preferences" />
            <div className="bg-[#141223]/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {[
                  { label: "Theme", value: "System Default (Dark)", action: "Edit" },
                  { label: "Language", value: "English (US)", action: "Edit" },
                  { label: "Default Resolution", value: "4K (2160p)", action: "Edit" },
                  { label: "Default Aspect Ratio", value: "16:9 (Landscape)", action: "Edit" },
                  { label: "Notification Settings", value: "All enabled", action: "Manage" }
                ].map((item, i) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.value}</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM: Danger Zone / Log Out */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="pt-8">
          <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-red-400 mb-2">Sign Out</h3>
              <p className="text-sm text-gray-400 max-w-xl">
                You will be securely logged out of your account on this device.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
              <button onClick={logout} className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-all flex justify-center items-center gap-2 border border-red-500/20">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom padding for scroll */}
        <div className="h-12" />
      </div>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#141223] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.fullName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                    <input 
                      type="text" 
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      placeholder="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Timezone</label>
                  <input 
                    type="text" 
                    value={editForm.timezone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    placeholder="e.g. America/New_York"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Phone</label>
                    <input 
                      type="tel" 
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Country</label>
                    <input 
                      type="text" 
                      value={editForm.country}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      placeholder="e.g. United States"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Language</label>
                  <input 
                    type="text" 
                    value={editForm.language}
                    onChange={(e) => setEditForm(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    placeholder="e.g. English (US)"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  >
                    {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProfilePage;
