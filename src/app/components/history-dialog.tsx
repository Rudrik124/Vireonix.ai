import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Search, 
  Trash2, 
  Video, 
  Image as ImageIcon, 
  Sparkles, 
  Zap,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

export interface HistoryItem {
  id: string;
  title: string;
  tool: 'quick-edit' | 'reference-video' | 'forge' | 'avatar';
  timestamp: number;
  preview?: string;
  config: any;
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item: HistoryItem) => void;
  currentTool?: string;
}

const toolConfig = {
  'quick-edit': { label: 'Quick AI Studio', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  'reference-video': { label: 'Reference Video Studio', icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  'forge': { label: 'Video Forge Studio', icon: Sparkles, color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10' },
  'avatar': { label: 'Avatar Pro Studio', icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
};

export function HistoryDialog({ open, onOpenChange, onSelect }: HistoryDialogProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem('veytrix_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHistory(parsed.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp));
        } catch (e) {
          console.error("Failed to parse history", e);
        }
      }
    }
  }, [open]);

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem('veytrix_history', JSON.stringify(newHistory));
  };

  const filteredHistory = history.filter(item => {
    const matchesFilter = filter === 'all' || item.tool === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                         (toolConfig[item.tool] && toolConfig[item.tool].label.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-transparent border-none text-white sm:max-w-5xl rounded-[2.5rem] shadow-none p-0 overflow-hidden outline-none">
        <div className="flex bg-[#0B1020]/95 backdrop-blur-2xl">
          {/* Sidebar */}
          <div className="w-[240px] flex-none border-r border-white/5 flex flex-col bg-white/[0.02]">
            <div className="p-8 border-b border-white/5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
                  <Clock className="w-6 h-6 text-purple-400" />
                  History
                </DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="flex-1 p-4 space-y-2 py-6">
              <button
                onClick={() => setFilter('all')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  filter === 'all' 
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168, 85, 247,0.15)]' 
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                <ChevronRight className={`w-3 h-3 transition-transform ${filter === 'all' ? 'rotate-0' : '-rotate-90 opacity-0'}`} />
                All Productions
              </button>

              <div className="pt-4 pb-2 px-4">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Studio Tools</span>
              </div>

              {['quick-edit', 'reference-video', 'forge', 'avatar'].map((f) => {
                const config = toolConfig[f as keyof typeof toolConfig];
                const Icon = config.icon;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      filter === f 
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168, 85, 247,0.15)]' 
                        : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${filter === f ? 'text-purple-400' : 'text-slate-600'}`} />
                    <span className="truncate">{config.label.replace(' Studio', '')}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5">
               <div className="flex items-center gap-3 text-purple-500/40">
                 <ExternalLink className="w-3 h-3" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Persistence Active</span>
               </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col h-[650px]">
            {/* Header / Search */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-white">
                  {filter === 'all' ? 'All Productions' : toolConfig[filter as keyof typeof toolConfig]?.label}
                </h3>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                  Showing {filteredHistory.length} recordings
                </span>
              </div>

              <div className="relative w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-5 text-[11px] font-bold focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {filteredHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="p-6 rounded-full bg-white/5 border border-dashed border-white/10">
                  <Clock className="w-12 h-12 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-white">No projects found</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Start creating to build your history</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredHistory.map((item) => {
                  const config = toolConfig[item.tool];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onSelect?.(item)}
                      className="group relative bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-2xl p-4 cursor-pointer transition-all hover:bg-white/[0.08]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${config.bg} ${config.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <button
                          onClick={(e) => deleteItem(item.id, e)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white truncate group-hover:text-purple-100 transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
                            {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function saveToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>) {
  const saved = localStorage.getItem('veytrix_history');
  let history: HistoryItem[] = [];
  if (saved) {
    try { history = JSON.parse(saved); } catch (e) {}
  }
  
  const newItem: HistoryItem = {
    ...item,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
  
  history.unshift(newItem);
  // Keep only last 50 items
  const pruned = history.slice(0, 50);
  localStorage.setItem('veytrix_history', JSON.stringify(pruned));
}
