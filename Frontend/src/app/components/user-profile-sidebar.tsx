import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { 
  User, Wallet, Folder, Clock, Bookmark, Heart, Download,
  PlusCircle, Wand2, Edit, Upload, Settings2,
  Globe, Palette, Bell, Lock, Shield, Keyboard,
  BookOpen, HelpCircle, Bug, Lightbulb, Users, MessageSquare,
  Sparkles, LogOut, X, ChevronRight, Video, PlayCircle, Zap, Mail
} from "lucide-react";

interface UserProfileSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  userName: string;
  onLogout: () => void;
  variant?: "permanent" | "drawer";
}

export function UserProfileSidebar({ 
  isOpen = false, 
  onClose, 
  userName, 
  onLogout,
  variant = "drawer"
}: UserProfileSidebarProps) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (variant === "drawer" && onClose) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    if (variant === "permanent") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, variant]);

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (variant === "permanent") return;
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, variant]);

  const navItemClass = "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all cursor-pointer group";

  const isPermanent = variant === "permanent";

  const sidebarContent = (
    <div
      className={isPermanent 
        ? "w-full h-full flex flex-col overflow-hidden" 
        : "fixed top-0 left-0 h-full z-[101] flex flex-col w-full md:w-[300px] lg:w-[340px] overflow-hidden"
      }
      style={isPermanent ? {} : {
        backgroundColor: "rgba(20, 18, 35, 0.92)",
        backdropFilter: "blur(30px)",
        borderRight: "1px solid rgba(180, 120, 255, 0.12)",
        boxShadow: "5px 0 30px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header / Profile Section */}
      <div className="p-6 border-b border-white/5 shrink-0 relative">
        {!isPermanent && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-[#141223]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{userName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                      Pro User
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">AI Creator since 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-purple-500/30 transition-colors group cursor-default">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Credits</div>
                  <div className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">0</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 hover:border-fuchsia-500/30 transition-colors group cursor-default">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Balance</div>
                  <div className="text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors">$0.00</div>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-4 px-3 space-y-6">
              
              {/* Quick Stats */}
              <div className="px-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <Video className="w-4 h-4 text-purple-400 mb-1" />
                    <span className="text-[10px] text-gray-400">Videos</span>
                    <span className="text-sm font-bold text-white">0</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <Zap className="w-4 h-4 text-fuchsia-400 mb-1" />
                    <span className="text-[10px] text-gray-400">Used</span>
                    <span className="text-sm font-bold text-white">0</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <Folder className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-[10px] text-gray-400">Projects</span>
                    <span className="text-sm font-bold text-white">0</span>
                  </div>
                </div>
              </div>

              {/* Account */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Account</h3>
                <div className="space-y-0.5">
                  <div className={navItemClass} onClick={() => handleNavigation("/profile")}>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                      <span>Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={navItemClass} onClick={() => handleNavigation("/wallet")}>
                    <div className="flex items-center gap-3">
                      <Wallet className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                      <span>Wallet</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className={navItemClass} onClick={() => handleNavigation("/history")}>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                      <span>History</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className={navItemClass} onClick={() => handleNavigation("/downloads")}>
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                      <span>Downloads</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Workspace */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Workspace</h3>
                <div className="space-y-0.5">
                  <div className={navItemClass} onClick={() => handleNavigation("/uploads")}>
                    <div className="flex items-center gap-3">
                      <Upload className="w-4 h-4 text-gray-400 group-hover:text-fuchsia-400 transition-colors" />
                      <span>My Uploads</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>



              {/* Settings */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Settings</h3>
                <div className="space-y-0.5">


                  <div className={navItemClass} onClick={() => handleNavigation("/notifications")}>
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      <span>Notifications</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>


                  <div className={navItemClass} onClick={() => handleNavigation("/keyboard-shortcuts")}>
                    <div className="flex items-center gap-3">
                      <Keyboard className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      <span>Keyboard Shortcuts</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Support</h3>
                <div className="space-y-0.5">
                  <div className={navItemClass}>
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                      <span>Documentation</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={navItemClass} onClick={() => handleNavigation("/help-center")}>
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                      <span>Help Center</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={navItemClass} onClick={() => handleNavigation("/report-bug")}>
                    <div className="flex items-center gap-3">
                      <Bug className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                      <span>Report Bug</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={navItemClass}>
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                      <span>Feature Request</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={navItemClass}>
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                      <span>Community</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className={navItemClass}>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                      <span>Discord</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Bottom padding for scroll */}
              <div className="h-4" />
            </div>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-white/5 bg-black/20 shrink-0 space-y-3">
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 font-bold text-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
    </div>
  );

  if (isPermanent) {
    return sidebarContent;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full z-[101]"
          >
            {sidebarContent}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
