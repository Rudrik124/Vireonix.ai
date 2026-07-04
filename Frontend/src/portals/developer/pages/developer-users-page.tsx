import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Search, 
  Lock, 
  Unlock, 
  Users, 
  Activity, 
  Zap, 
  Video, 
  Plus, 
  Minus,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Calendar,
  Globe2,
  Database,
  Cloud,
  ChevronDown
} from "lucide-react";
import { useUserList } from "../../../hooks/useDashboardData";
import { addCreditsToUser, reactivateUser, suspendUser } from "../../../services/developer-portal-api.service";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'suspended';
  credits: number;
  developerCredits?: number;
  portalAccess: string[];
  videos: number;
  joinDate: string;
  lastLogin: string;
}

const particles = Array.from({ length: 30 });
const activityFeed = [
  "New user joined platform",
  "Admin updated credits",
  "AI video generated",
  "Premium activated",
  "Credits purchased",
  "New user joined platform",
  "AI video generated",
  "Admin updated credits",
];

// Animated Number Counter Component
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.round(v))
    });
    return controls.stop;
  }, [value]);

  const formatted = displayValue >= 1000000 
    ? `${(displayValue / 1000000).toFixed(1)}M` 
    : displayValue >= 1000 
      ? `${(displayValue / 1000).toFixed(0)}K` 
      : displayValue.toLocaleString();

  return <span>{prefix}{formatted}</span>;
}

export function DeveloperUsersPage() {
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [page, setPage] = useState(1);

  const { users: allUsers, isLoading, error, refetch } = useUserList(page, 20);

  const filteredUsers = (allUsers?.users || []).filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mouse Parallax for Ambient Lighting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);
  
  const glowX = useTransform(smoothMouseX, [-1, 1], [-30, 30]);
  const glowY = useTransform(smoothMouseY, [-1, 1], [-30, 30]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const handleSuspendUser = async (userId: string) => {
    setIsUpdating(true);
    try {
      await suspendUser(userId);
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: "suspended" });
      }
    } catch (error) {
      console.error("Failed to suspend user:", error);
      alert("Failed to suspend user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setIsUpdating(true);
    try {
      await reactivateUser(userId);
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status: "active" });
      }
    } catch (error) {
      console.error("Failed to reactivate user:", error);
      alert("Failed to reactivate user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    setIsUpdating(true);
    try {
      const currentUser = allUsers?.users.find(u => u.id === userId);
      if (!currentUser) return;

      const response = await addCreditsToUser(userId, amount, "Manual adjustment from developer portal");
      const newBalance = response.newBalance ?? currentUser.credits + amount;

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, credits: newBalance });
      }
    } catch (error) {
      console.error("Failed to add credits:", error);
      alert("Failed to add credits");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-[#030712] font-sans selection:bg-indigo-500/30 selection:text-white text-slate-200 pb-20">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('/noise.svg')]" />
        
        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.05, 1] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[30%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_40%)]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.1, 1] }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_45%)]" 
          />
        </div>

        {/* Mouse Follow Ambient Glow */}
        <motion.div 
          style={{ x: glowX, y: glowY, background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(59,130,246,0.2) 100%)' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] opacity-10 pointer-events-none"
        />

        {/* Floating Particles */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-indigo-400/10' : i % 3 === 1 ? 'bg-blue-400/10' : 'bg-white/5'}`}
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}vw`,
              top: `${Math.random() * 100}vh`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [0.02, 0.08, 0.02],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1">
          
          {/* Header */}
          <div className="mb-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <button
                onClick={() => navigate("/developer/dashboard")}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-6 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-400" /> Back to Dashboard
              </button>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-4">
                  <Users className="w-10 h-10 text-indigo-500" /> Users Management
                </h1>
                <p className="text-slate-400 font-medium text-lg max-w-xl">
                  View, search and manage platform users.
                </p>
              </div>

              {/* Floating Info Bar */}
              <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-[rgba(10,15,28,0.65)] backdrop-blur-[20px] border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] text-xs font-bold tracking-widest text-slate-400 uppercase">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> Database Connected</span>
                <span className="hidden sm:flex items-center gap-2"><RefreshCw className="w-3 h-3 text-indigo-400" /> Real-time Sync</span>
              </div>
            </motion.div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Users, label: "Total Users", value: 0, color: "text-indigo-400", change: "+0%" },
              { icon: Activity, label: "Active Users", value: 0, color: "text-emerald-400", change: "+0%" },
              { icon: Zap, label: "Credits Issued", value: 0, color: "text-blue-400" },
              { icon: Video, label: "Videos Generated", value: 0, color: "text-purple-400" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative p-6 rounded-[20px] bg-[rgba(10,15,28,0.65)] backdrop-blur-[20px] border border-white/[0.06] shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)]"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <stat.icon className={`w-16 h-16 ${stat.color}`} />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} /> {stat.label}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-white tracking-tight">
                      <AnimatedNumber value={stat.value} />
                    </span>
                    {stat.change && <span className="text-emerald-400 text-sm font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{stat.change}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Controls Bar (Search & Filters) */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-[18px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center bg-[rgba(10,15,28,0.65)] backdrop-blur-[20px] border border-white/[0.06] rounded-[18px] px-6 py-4 transition-all duration-300 focus-within:border-blue-500/50 focus-within:shadow-[0_0_30px_rgba(59,130,246,0.15)] focus-within:-translate-y-0.5 hover:border-white/10">
                <Search className="w-5 h-5 text-indigo-400 mr-4" />
                <input
                  type="text"
                  placeholder="Search users, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-white font-medium placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {['Status', 'Role', 'Credits', 'Newest'].map((filter) => (
                <div key={filter} className="relative group/filter shrink-0">
                  <select className="appearance-none bg-[rgba(10,15,28,0.65)] backdrop-blur-[20px] border border-white/[0.06] rounded-[16px] px-6 py-4 pr-12 text-sm font-bold text-slate-300 outline-none cursor-pointer hover:border-indigo-500/30 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(99,102,241,0.1)] transition-all">
                    <option className="bg-[#0A0F1C]">{filter}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover/filter:text-indigo-400 transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* User List or Detail View */}
          <AnimatePresence mode="wait">
            {selectedUser ? (
              // Selected User Overlay
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[rgba(10,15,28,0.65)] backdrop-blur-[20px] border border-white/[0.06] rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] p-8 overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-10 group"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Users List
                </button>

                <div className="flex items-center gap-6 mb-12">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-[#0A0F1C] flex items-center justify-center text-3xl font-black text-white">
                        {selectedUser.name.charAt(0)}
                      </div>
                    </div>
                    <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-[#0A0F1C] ${selectedUser.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">{selectedUser.name}</h2>
                    <p className="text-slate-400 text-lg">{selectedUser.email}</p>
                  </div>
                  
                  <div className="ml-auto flex gap-3">
                    <button onClick={() => handleAddCredits(selectedUser.id, 500)} className="group/btn relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-full bg-[rgba(255,255,255,0.05)] border border-white/10 hover:border-blue-500/50 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                      <Plus className="w-4 h-4 text-blue-400 group-hover/btn:rotate-90 transition-transform" /> Add 500 Credits
                    </button>
                    <button className="group/btn relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-full bg-[rgba(255,255,255,0.05)] border border-white/10 hover:border-amber-500/50 text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      <Minus className="w-4 h-4 text-amber-400" /> Remove Credits
                    </button>
                    {selectedUser.status === "active" ? (
                      <button onClick={() => handleSuspendUser(selectedUser.id)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-sm font-bold text-red-400 transition-all hover:scale-105">
                        <Lock className="w-4 h-4" /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => handleReactivateUser(selectedUser.id)} className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-sm font-bold text-emerald-400 transition-all hover:scale-105">
                        <Unlock className="w-4 h-4" /> Reactivate
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Status", value: selectedUser.status.toUpperCase(), color: selectedUser.status === 'active' ? "text-emerald-400" : "text-slate-400" },
                    { label: "Credits Available", value: <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400" /> {selectedUser.credits.toLocaleString()}</span>, color: "text-white" },
                    { label: "Videos Generated", value: <span className="flex items-center gap-2"><Video className="w-4 h-4 text-purple-400" /> {selectedUser.videos}</span>, color: "text-white" },
                    { label: "Join Date", value: <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {selectedUser.joinDate}</span>, color: "text-slate-300" },
                  ].map(stat => (
                    <div key={stat.label} className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-[20px]">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">{stat.label}</p>
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              // Users Table View
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[rgba(8,12,24,0.72)] backdrop-blur-[20px] border border-white/[0.06] rounded-[24px] shadow-[0_0_60px_rgba(99,102,241,0.08)] overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/[0.02] border-b border-white/[0.06] sticky top-0 backdrop-blur-xl z-20">
                      <tr>
                        {['User', 'Status', 'Credits', 'Videos', 'Joined', 'Action'].map((head) => (
                          <th key={head} className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {isLoading && (
                        <tr>
                          <td colSpan={6} className="p-16">
                            <div className="flex flex-col items-center justify-center text-indigo-400 font-bold gap-4">
                              <RefreshCw className="w-8 h-8 animate-spin" />
                              Syncing database...
                            </div>
                          </td>
                        </tr>
                      )}

                      {!isLoading && error && (
                        <tr>
                          <td colSpan={6} className="p-16">
                            <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center">
                              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-[20px] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <AlertCircle className="w-10 h-10 text-red-400" />
                              </div>
                              <h3 className="text-2xl font-black text-white mb-2">Unable to load users</h3>
                              <p className="text-slate-400 mb-8">{error}</p>
                              <button onClick={refetch} className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full text-sm font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                                RETRY CONNECTION
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {!isLoading && !error && filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-16 text-center text-slate-400 font-medium">
                            No users found matching your criteria.
                          </td>
                        </tr>
                      )}

                      {!isLoading && !error && filteredUsers.map((user, index) => (
                        <tr 
                          key={user.id} 
                          className={`group transition-all duration-250 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}
                        >
                          <td className="px-6 py-4 group-hover:translate-x-1 transition-transform">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/40 to-blue-500/40 p-[1px]">
                                  <div className="w-full h-full rounded-full bg-[#0A0F1C] flex items-center justify-center text-sm font-bold text-white">
                                    {user.name.charAt(0)}
                                  </div>
                                </div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0F1C] ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.status === "active" 
                                ? "bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] group-hover:scale-105 transition-transform">
                              <Zap className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs font-bold text-blue-100">{user.credits.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/5">
                              <Video className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-bold text-slate-300">{user.videos}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] text-xs font-medium text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {user.joinDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 hover:bg-indigo-500 hover:text-white hover:border-indigo-400 hover:scale-110 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Live Activity Sidebar (Desktop Only) */}
        <div className="hidden xl:block w-80 shrink-0">
          <div className="sticky top-10 bg-[rgba(10,15,28,0.65)] backdrop-blur-[20px] border border-white/[0.06] rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="p-6 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-indigo-400" /> Live Activity
              </h3>
            </div>
            <div className="p-6 space-y-6 max-h-[600px] overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0A0F1C] to-transparent z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0A0F1C] to-transparent z-10" />
              
              <motion.div 
                animate={{ y: [0, -200] }} 
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="space-y-6"
              >
                {activityFeed.concat(activityFeed).map((act, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="relative mt-1">
                      <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-indigo-400' : 'bg-emerald-400'} shadow-[0_0_8px_currentColor]`} />
                      {i !== activityFeed.length * 2 - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8 bg-white/10" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">{act}</p>
                      <p className="text-xs text-slate-500 mt-1">Just now</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
