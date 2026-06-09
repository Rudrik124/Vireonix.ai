import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type LoadingState = "loading" | "success" | "error" | null;

interface LoadingModalProps {
  state: LoadingState;
  message?: string;
  onDismiss?: () => void;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  state,
  message,
  onDismiss,
}) => {
  // Auto-dismiss success after 2.5 seconds
  useEffect(() => {
    if (state === "success") {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state, onDismiss]);

  return (
    <AnimatePresence>
      {state && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => state !== "loading" && onDismiss?.()}
          />

          {/* Modal Container */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl shadow-lg overflow-hidden bg-white dark:bg-slate-900"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Loading State */}
              {state === "loading" && (
                <div className="p-12 flex flex-col items-center gap-8">
                  {/* Modern spinner */}
                  <div className="relative w-20 h-20">
                    {/* Outer rotating ring */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-blue-500 dark:border-t-blue-400"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    
                    {/* Inner rotating ring */}
                    <motion.div
                      className="absolute inset-3 rounded-full border-2 border-slate-100 dark:border-slate-800 border-r-slate-400 dark:border-r-slate-500"
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>

                  {/* Text content */}
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Creating your video
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs">
                      {message || "This typically takes 30-60 seconds. Please don't close this window."}
                    </p>
                  </div>

                  {/* Progress dots */}
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Success State */}
              {state === "success" && (
                <div className="p-12 flex flex-col items-center gap-6">
                  {/* Success icon with circle */}
                  <motion.div
                    className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 flex items-center justify-center"
                    animate={{ scale: [0.8, 1] }}
                    transition={{ type: "spring", damping: 12, stiffness: 150 }}
                  >
                    <motion.svg
                      className="w-10 h-10 text-green-600 dark:text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </motion.div>

                  {/* Text */}
                  <div className="text-center space-y-2">
                    <motion.h3
                      className="text-xl font-semibold text-slate-900 dark:text-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Video ready!
                    </motion.h3>
                    <motion.p
                      className="text-slate-600 dark:text-slate-400 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {message || "Redirecting to your video..."}
                    </motion.p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {state === "error" && (
                <div className="p-12 flex flex-col items-center gap-6">
                  {/* Error icon */}
                  <motion.div
                    className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 flex items-center justify-center"
                    animate={{
                      scale: [0.8, 1],
                    }}
                    transition={{ type: "spring", damping: 12 }}
                  >
                    <motion.svg
                      className="w-10 h-10 text-red-600 dark:text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </motion.svg>
                  </motion.div>

                  {/* Text */}
                  <div className="text-center space-y-2">
                    <motion.h3
                      className="text-xl font-semibold text-slate-900 dark:text-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Something went wrong
                    </motion.h3>
                    <motion.p
                      className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed break-words"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {message || "We couldn't generate your video. Please try again."}
                    </motion.p>
                  </div>

                  {/* Try Again button */}
                  <motion.button
                    onClick={onDismiss}
                    className="w-full px-6 py-3 mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Try Again
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
