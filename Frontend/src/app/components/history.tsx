import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Trash2, Video, Image as ImageIcon, Music, Edit, 
  DownloadCloud, CreditCard, Wallet, LogIn, Lock, Shield, 
  User, Bookmark, Folder, Download, Clock
} from "lucide-react";
import { useNavigate } from "react-router";
import { buildApiUrl } from "@/lib/api";

// Helper function for grouping
function getGroupKey(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) return "This Week";
  if (diffDays <= 30) return "This Month";
  
  return "Older";
}

interface HistoryItem {
  id: number;
  type: string;
  title: string;
  desc: string;
  date: string;
  time: string;
  icon: any;
  color: string;
  bg: string;
}

const initialHistory: HistoryItem[] = [];

export function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const tabs = ["All", "Ai generated video", "Reference video", "Direct pic to video", "Ai manual edit"];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(buildApiUrl("/api/history"));
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.history) {
            // Map icon string to component if needed, but since we get raw data, we can set default icons here based on type
            const mappedHistory = data.history.map((item: any) => ({
              ...item,
              icon: Video, // Default icon for video
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            }));
            setHistory(mappedHistory);
          }
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleClearHistory = () => {
    setHistory([]);
    setShowConfirm(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredHistory = activeTab === "All" 
    ? history 
    : history.filter(item => item.type === activeTab);

  const groupedHistory = filteredHistory.reduce((acc, item) => {
    const group = getGroupKey(item.date);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof history>);

  const groupOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];

  return (
    <div className="min-h-screen bg-[#0B0914] text-white selection:bg-purple-500/30 font-sans overflow-hidden flex flex-col relative">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">History</h1>
            <p className="text-xs text-gray-400">View your complete account activity.</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <button 
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 rounded-xl bg-transparent hover:bg-red-500/10 text-red-400 text-sm font-bold transition-colors border border-red-500/30 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Tabs UI */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border ${
                  activeTab === tab 
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300" 
                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                {tab === "All" ? "All History" : tab}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-32"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                <Clock className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Activity Yet</h2>
              <p className="text-gray-400 max-w-sm">
                Your account activity will appear here once you start using VEYTRIX.AI.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-12 pb-20">
              {groupOrder.map((group) => {
                if (!groupedHistory[group]) return null;
                return (
                  <div key={group} className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2 sticky top-0 bg-[#0B0914]/80 backdrop-blur-md py-2 z-10 rounded-md">
                      {group}
                    </h3>
                    <div className="space-y-3">
                      {groupedHistory[group].map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group hover:-translate-y-0.5 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                        >
                          <div className={`w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center ${item.bg} border border-white/5`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-200 truncate">{item.title}</h4>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{item.desc}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-gray-300">{item.time}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#141223] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-red-500/10"
            >
              <h3 className="text-xl font-bold mb-2">Clear History?</h3>
              <p className="text-gray-400 text-sm mb-8">
                This will permanently remove your activity history from this account. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearHistory}
                  className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  Clear History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold shadow-[0_0_20px_rgba(34,197,94,0.2)] backdrop-blur-md flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            History cleared successfully.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
