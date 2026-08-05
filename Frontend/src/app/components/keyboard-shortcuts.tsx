import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Keyboard, Search, Copy, Check, ChevronLeft, Star, 
  Settings2, Sparkles, Image as ImageIcon, Video, 
  Scissors, LayoutList, FolderOpen, SearchCode, Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router';

const shortcutsData = [
  {
    category: "General",
    icon: <Settings2 className="w-5 h-5" />,
    description: "Core navigation and essential commands.",
    items: [
      { action: "Open Home", desc: "Return to home dashboard", win: ["Ctrl", "H"], mac: ["⌘", "H"] },
      { action: "Open Projects", desc: "View all your projects", win: ["Ctrl", "P"], mac: ["⌘", "P"] },
      { action: "Open Downloads", desc: "Access your downloads", win: ["Ctrl", "D"], mac: ["⌘", "D"] },
      { action: "Open Notifications", desc: "View all notifications", win: ["Ctrl", "N"], mac: ["⌘", "N"] },
      { action: "Open Profile", desc: "Access your profile", win: ["Ctrl", "U"], mac: ["⌘", "U"] },
      { action: "Open Help Center", desc: "Get help and support", win: ["F1"], mac: ["Fn", "F1"] },
    ]
  },
  {
    category: "Quick AI Edit",
    icon: <Scissors className="w-5 h-5" />,
    description: "Precision editing controls.",
    items: [
      { action: "Undo", desc: "Revert last action", win: ["Ctrl", "Z"], mac: ["⌘", "Z"] },
      { action: "Redo", desc: "Restore last action", win: ["Ctrl", "Shift", "Z"], mac: ["⌘", "Shift", "Z"] },
      { action: "Copy Clip", desc: "Copy selected clip", win: ["Ctrl", "C"], mac: ["⌘", "C"] },
      { action: "Paste Clip", desc: "Paste copied clip", win: ["Ctrl", "V"], mac: ["⌘", "V"] },
      { action: "Delete Clip", desc: "Remove selected clip", win: ["Delete"], mac: ["Delete"] },
      { action: "Split Clip", desc: "Cut at playhead", win: ["Ctrl", "K"], mac: ["⌘", "K"] },
      { action: "Export Video", desc: "Render final video", win: ["Ctrl", "E"], mac: ["⌘", "E"] },
      { action: "Play / Pause", desc: "Toggle playback", win: ["Space"], mac: ["Space"] },
      { action: "Previous Frame", desc: "Step back 1 frame", win: ["←"], mac: ["←"] },
      { action: "Next Frame", desc: "Step forward 1 frame", win: ["→"], mac: ["→"] },
    ]
  },
  {
    category: "Timeline",
    icon: <LayoutList className="w-5 h-5" />,
    description: "Navigate your sequence.",
    items: [
      { action: "Zoom In", desc: "Expand timeline view", win: ["Ctrl", "+"], mac: ["⌘", "+"] },
      { action: "Zoom Out", desc: "Shrink timeline view", win: ["Ctrl", "-"], mac: ["⌘", "-"] },
      { action: "Fit Timeline", desc: "Show entire sequence", win: ["Ctrl", "0"], mac: ["⌘", "0"] },
      { action: "Jump To Start", desc: "Go to beginning", win: ["Home"], mac: ["Fn", "←"] },
      { action: "Jump To End", desc: "Go to end", win: ["End"], mac: ["Fn", "→"] },
    ]
  },
  {
    category: "Project",
    icon: <FolderOpen className="w-5 h-5" />,
    description: "File and project management.",
    items: [
      { action: "New Project", desc: "Create blank project", win: ["Ctrl", "Shift", "N"], mac: ["⌘", "Shift", "N"] },
      { action: "Save Project", desc: "Save current state", win: ["Ctrl", "S"], mac: ["⌘", "S"] },
      { action: "Rename Project", desc: "Edit project name", win: ["F2"], mac: ["Return"] },
      { action: "Duplicate Project", desc: "Create a copy", win: ["Ctrl", "Shift", "D"], mac: ["⌘", "Shift", "D"] },
    ]
  },
  {
    category: "Search",
    icon: <SearchCode className="w-5 h-5" />,
    description: "Find assets and projects quickly.",
    items: [
      { action: "Search Projects", desc: "Find a project", win: ["Ctrl", "F"], mac: ["⌘", "F"] },
      { action: "Global Search", desc: "Search everything", win: ["Ctrl", "Shift", "F"], mac: ["⌘", "Shift", "F"] },
    ]
  },
  {
    category: "View",
    icon: <Monitor className="w-5 h-5" />,
    description: "Interface layout controls.",
    items: [
      { action: "Toggle Fullscreen", desc: "Enter/exit fullscreen", win: ["F11"], mac: ["⌃", "⌘", "F"] },
      { action: "Refresh", desc: "Reload interface", win: ["Ctrl", "R"], mac: ["⌘", "R"] },
    ]
  }
];

const WindowsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 88 88" className={className} fill="currentColor">
    <path d="M0 12.402l35.687-4.86.016 34.423-35.703.206v-29.77zm35.67 33.729l-.015 34.652-35.655-4.996v-29.45l35.67-.206zm4.326-39.02l47.989-6.906.015 41.528-48.004.286v-34.908zm-.015 39.52l48.019.288-.03 41.83-47.989-6.842v-35.276z"/>
  </svg>
);

const MacIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 384 512" className={className} fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

const Keycap = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center min-w-[28px] h-7 px-2 text-[11px] font-bold text-white bg-[#09090F] rounded-lg border border-white/[0.08] shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
    {children}
  </div>
);

export const KeyboardShortcutsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeOS, setActiveOS] = useState<'win' | 'mac'>('win');
  const navigate = useNavigate();
  
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleFavorite = (id: string) => {
    const newFavs = new Set(favorites);
    if (newFavs.has(id)) newFavs.delete(id);
    else newFavs.add(id);
    setFavorites(newFavs);
  };

  const scrollToCategory = (category: string) => {
    const element = categoryRefs.current[category];
    if (element) {
      const yOffset = -32; 
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const filteredData = shortcutsData.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const staggerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: "easeOut" as const
      }
    })
  };

  return (
    <div className="min-h-screen bg-[#09090F] text-white font-sans selection:bg-[#A855F7]/30 pb-24">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#A855F7]/[0.05] blur-[150px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#C084FC]/[0.03] blur-[150px]"></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto p-4 md:p-8 space-y-12">
        
        {/* Top Bar */}
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[#A1A1AA] hover:text-white hover:bg-white/[0.08] transition-colors w-fit text-sm font-medium backdrop-blur-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to App
        </motion.button>

        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10"
        >
          {/* Left Side: Title & Icon */}
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 rounded-[24px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.15)] flex-shrink-0 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <Keyboard className="w-10 h-10 text-[#A855F7] relative z-10" strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Keyboard Shortcuts</h1>
              <p className="text-[#A1A1AA] text-base font-medium max-w-lg leading-relaxed">
                Master VEYTRIX faster using professional keyboard shortcuts for every AI workflow.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-2">
                <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold tracking-wide text-[#A1A1AA] flex items-center gap-2 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" /> Windows Supported
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold tracking-wide text-[#A1A1AA] flex items-center gap-2 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" /> macOS Supported
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold tracking-wide text-[#A1A1AA] flex items-center gap-2 backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" /> One-click Copy
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Toggle & Search */}
          <div className="bg-white/[0.04] border border-white/[0.08] p-5 rounded-3xl backdrop-blur-md w-full lg:w-[340px] flex flex-col gap-4">
            <div className="flex bg-[#09090F] rounded-[14px] p-1 border border-white/[0.04]">
              <button 
                onClick={() => setActiveOS('win')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeOS === 'win' ? 'bg-gradient-to-r from-[#A855F7] to-[#C084FC] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'}`}
              >
                <WindowsIcon className="w-4 h-4" />
                Windows
              </button>
              <button 
                onClick={() => setActiveOS('mac')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeOS === 'mac' ? 'bg-gradient-to-r from-[#A855F7] to-[#C084FC] text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'text-[#A1A1AA] hover:text-white hover:bg-white/[0.04]'}`}
              >
                <MacIcon className="w-4 h-4" />
                macOS
              </button>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA] group-focus-within:text-[#A855F7] transition-colors" />
              <input
                type="text"
                placeholder="Search keyboard shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#09090F] border border-white/[0.08] focus:border-[#A855F7] focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-[#A1A1AA] outline-none transition-all duration-300"
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Categories */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shortcutsData.map((cat) => (
              <button
                key={cat.category}
                onClick={() => scrollToCategory(cat.category)}
                className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-5 flex items-center justify-between hover:-translate-y-1 hover:border-[#A855F7]/50 hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)] transition-all duration-300 group backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#09090F] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] group-hover:text-[#A855F7] transition-colors">
                    {cat.icon}
                  </div>
                  <span className="font-semibold text-sm text-gray-200 group-hover:text-white transition-colors">{cat.category}</span>
                </div>
                <span className="text-[10px] font-bold text-[#A1A1AA] bg-[#09090F] px-2 py-1 rounded-md border border-white/[0.04]">
                  {cat.items.length}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content Sections */}
        <div className="space-y-16 pt-8">
          {filteredData.map((category, catIdx) => (
            <motion.div
              key={category.category}
              ref={(el) => { categoryRefs.current[category.category] = el; }}
              custom={catIdx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerVariants}
              className="scroll-mt-32"
            >
              {/* Premium Section Header */}
              <div className="flex items-center gap-6 mb-8">
                <div className="h-px bg-white/[0.08] flex-1" />
                <div className="flex flex-col items-center gap-1.5 px-6">
                  <div className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
                    <span className="text-[#A855F7]">{category.icon}</span> {category.category}
                  </div>
                  <span className="text-sm font-medium text-[#A1A1AA]">{category.description}</span>
                </div>
                <div className="h-px bg-white/[0.08] flex-1" />
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item, itemIdx) => {
                  const shortcutId = `${category.category}-${itemIdx}`;
                  const winText = item.win.join(" + ");
                  const macText = item.mac.join(" + ");
                  const copyText = activeOS === 'win' ? winText : macText;
                  const isFav = favorites.has(shortcutId);

                  return (
                    <div 
                      key={item.action}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-[24px] p-6 hover:-translate-y-1 hover:border-[#A855F7]/40 hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] transition-all duration-300 backdrop-blur-md relative group flex flex-col h-full"
                    >
                      {/* Interactive Actions (Copy / Fav) */}
                      <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <button 
                          onClick={() => handleCopy(copyText, shortcutId)}
                          className="w-8 h-8 rounded-full bg-[#09090F] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] hover:text-[#A855F7] hover:border-[#A855F7]/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:rotate-6 transition-all duration-300 backdrop-blur-md"
                          title="Copy Shortcut"
                        >
                          {copiedIndex === shortcutId ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => toggleFavorite(shortcutId)}
                          className="w-8 h-8 rounded-full bg-[#09090F] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] hover:border-[#A855F7]/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-300 backdrop-blur-md"
                          title="Favorite Shortcut"
                        >
                          <Star className={`w-3.5 h-3.5 transition-colors ${isFav ? 'fill-[#A855F7] text-[#A855F7]' : 'hover:text-[#A855F7]'}`} />
                        </button>
                      </div>

                      {/* Info Header */}
                      <div className="flex gap-4 mb-6">
                        <div className="w-12 h-12 rounded-[18px] bg-[#09090F] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] group-hover:text-[#A855F7] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 flex-shrink-0">
                          {category.icon}
                        </div>
                        <div className="pr-16">
                          <h4 className="text-base font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">{item.action}</h4>
                          <p className="text-xs font-medium text-[#A1A1AA] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>

                      {/* Shortcuts Display */}
                      <div className="flex gap-4 mt-auto pt-5 border-t border-white/[0.04]">
                        <div className="flex-1">
                          <div className="text-[10px] text-[#A1A1AA] font-bold mb-2 uppercase tracking-wider">Windows</div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.win.map((key, i) => (
                              <React.Fragment key={i}>
                                <Keycap>{key}</Keycap>
                                {i < item.win.length - 1 && <span className="text-[#A1A1AA] font-bold text-xs">+</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                        <div className="w-px bg-white/[0.04]" />
                        <div className="flex-1">
                          <div className="text-[10px] text-[#A1A1AA] font-bold mb-2 uppercase tracking-wider">macOS</div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.mac.map((key, i) => (
                              <React.Fragment key={i}>
                                <Keycap>{key}</Keycap>
                                {i < item.mac.length - 1 && <span className="text-[#A1A1AA] font-bold text-xs">+</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-white/[0.02] border border-white/[0.04] rounded-3xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#09090F] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] mb-6 shadow-xl">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No shortcuts found</h3>
            <p className="text-[#A1A1AA] font-medium max-w-sm">We couldn't find any shortcuts matching "{searchQuery}". Try a different term or browse categories.</p>
          </motion.div>
        )}
        
      </div>
    </div>
  );
};
