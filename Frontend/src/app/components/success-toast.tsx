import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface SuccessToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  duration = 3000,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-6 right-6 z-[9999]"
        initial={{ opacity: 0, x: 100, y: -20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 100, y: -20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 backdrop-blur-xl rounded-lg p-4 flex items-center gap-3 shadow-lg">
          <motion.div
            className="flex-shrink-0"
            animate={{ scale: [0.8, 1] }}
            transition={{ type: "spring", damping: 10 }}
          >
            <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
          </motion.div>
          <p className="text-sm font-medium text-green-400">{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
