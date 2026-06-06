import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ 
  enabled, 
  onChange, 
  label, 
  description,
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${className}`}>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-[#cbd5e1] uppercase tracking-wider">{label}</span>
        {description && <span className="text-[10px] text-[#64748b] font-medium leading-tight mt-0.5">{description}</span>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-purple-500' : 'bg-[#3f4a67]/50'
        }`}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        />
      </button>
    </div>
  );
};
