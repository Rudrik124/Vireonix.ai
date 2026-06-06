import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, 
  X, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Video,
  Layers
} from "lucide-react";
import { 
  Dialog, 
  DialogContent,
} from "./ui/dialog";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: "watermark" | "4k" | "60fps" | "general";
}

const featureContent = {
  watermark: {
    title: "Remove Watermark",
    description: "Remove the Veytrix branding and present your work with pure professional focus.",
    icon: Layers,
    color: "text-blue-400"
  },
  "4k": {
    title: "4K Ultra HD Export",
    description: "Export in stunning 4K resolution for maximum cinematic detail and clarity.",
    icon: Video,
    color: "text-fuchsia-400"
  },
  "60fps": {
    title: "60 FPS Production",
    description: "Unlock ultra-smooth 60 FPS motion for high-end professional animations.",
    icon: Zap,
    color: "text-amber-400"
  },
  general: {
    title: "Unlock Premium Studio",
    description: "Get access to all elite features and high-end production tools.",
    icon: Sparkles,
    color: "text-purple-400"
  }
};

export function PremiumModal({ open, onOpenChange, feature = "general" }: PremiumModalProps) {
  const content = featureContent[feature] || featureContent.general;
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B1020]/95 backdrop-blur-2xl border-white/10 text-white sm:max-w-md rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
        <div className="relative p-10">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-transparent pointer-events-none" />
          
          {/* Redundant close button removed to avoid double icons with Dialog default close */}

          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 border border-white/10 shadow-2xl flex items-center justify-center relative`}
            >
              <div className="absolute inset-0 blur-2xl bg-purple-500/20 rounded-full" />
              <Icon className={`w-10 h-10 ${content.color} relative z-10 drop-shadow-[0_0_15px_rgba(168, 85, 247,0.5)]`} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-white/5 rounded-3xl"
              />
            </motion.div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0B1020] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                <Crown className="w-3 h-3" />
                <span>Premium Feature</span>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-white">
                {content.title}
              </h2>
              <p className="text-[#94a3b8] text-sm font-medium leading-relaxed max-w-sm">
                {content.description}
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {[
                  "No-Watermark Exports",
                  "4K Ultra HD Rendering",
                  "60 FPS Motion Synthesis",
                  "Priority GPU Processing",
                  "Unlimited Cloud History"
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{perk}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(168, 85, 247,0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white font-black uppercase tracking-[0.3em] text-sm shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Upgrade to Premium
              </motion.button>
              
              <button 
                onClick={() => onOpenChange(false)}
                className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
