import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AspectRatioConfig } from '../hooks/useAspectRatio';

interface AspectRatioCardProps {
  label: string;
  ratio: string;
  icon: LucideIcon;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

export const AspectRatioCard: React.FC<AspectRatioCardProps> = ({
  label,
  ratio,
  icon: Icon,
  description,
  isSelected,
  onClick,
}) => {
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`relative h-[95px] w-full rounded-[18px] p-4 flex flex-col justify-center items-start border transition-all duration-300 text-left overflow-hidden bg-white/5 backdrop-blur-md shadow-xl ${
        isSelected
          ? 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.4)]'
          : 'border-white/10 hover:border-white/30'
      }`}
    >
      {isSelected && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl rounded-tr-[16px] text-white">
          Currently Selected
        </div>
      )}
      
      {/* Background glow when selected */}
      {isSelected && (
        <div className="absolute inset-0 bg-purple-500/10 opacity-50 pointer-events-none" />
      )}

      <div className="flex items-center gap-3 relative z-10 w-full mt-1">
        <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-purple-500/30' : 'bg-black/30'}`}>
          <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
        </div>
        <div>
          <h4 className={`font-black tracking-wide ${isSelected ? 'text-white' : 'text-slate-200'} text-sm leading-none mb-1`}>
            {label}
          </h4>
          <p className="text-[10px] text-slate-400 leading-tight">
            {ratio !== 'Custom' && <span className="font-bold text-slate-300 mr-1">{ratio}</span>}
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  );
};
