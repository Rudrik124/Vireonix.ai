import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#3f4a67]/50 bg-[#1a1b2e]/40 backdrop-blur-xl shadow-lg transition-all duration-300 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-purple-400 group-hover:scale-110 transition-transform duration-300">{icon}</div>}
          <span className="text-sm font-bold uppercase tracking-widest text-[#cbd5e1]">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-[#64748b] group-hover:text-purple-400"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-5 pt-0 border-t border-[#3f4a67]/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
