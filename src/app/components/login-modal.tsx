import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMessage?: string; // e.g., "Please login to generate your video"
  customTitle?: string; // e.g., "Login Required"
}

export function LoginModal({ isOpen, onClose, customMessage, customTitle }: LoginModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailInputRef.current?.focus(), 150);
    }
  }, [isOpen, mode]);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setMessage({ text: "", type: "" });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const showMessage = (text: string, type: "error" | "success") => {
    setMessage({ text, type });
  };

  const ensureSupabaseConfigured = () => {
    if (!isSupabaseConfigured || !supabase) {
      showMessage("Login is unavailable: missing Supabase frontend env (SUPABASE_ANON_KEY).", "error");
      return false;
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    if (!ensureSupabaseConfigured()) {
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        showMessage(error.message, "error");
      }
    } catch (err: any) {
      showMessage(err?.message || "Google sign-in failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!ensureSupabaseConfigured()) {
      return;
    }

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      showMessage("Enter your email above first to reset your password.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        showMessage(error.message, "error");
      } else {
        showMessage(`Password reset link sent to ${trimmedEmail}. Check your email.`, "success");
      }
    } catch (err) {
      showMessage("Failed to send reset link. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!ensureSupabaseConfigured()) {
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 8) {
      showMessage("Password must be at least 8 characters.", "error");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      showMessage("Please enter your full name for sign up.", "error");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signin") {
        // Sign in with email and password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });

        if (error) {
          showMessage(error.message, "error");
        } else {
          // Set flag for login success message
          localStorage.setItem("justLoggedIn", "true");
          showMessage("Signed in successfully!", "success");
          setTimeout(() => {
            handleClose(); // Just close the modal, don't redirect
          }, 1500);
        }
      } else {
        // Sign up with email and password
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          showMessage(error.message, "error");
        } else {
          showMessage(
            "Account created! Check your email to confirm your account.",
            "success"
          );
          setTimeout(() => {
            resetForm();
            setMode("signin");
          }, 2000);
        }
      }
    } catch (err: any) {
      showMessage(err?.message || "An error occurred. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/28 backdrop-blur-md flex items-center justify-center px-4 z-[9999]"
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="w-full max-w-2xl bg-white rounded-[18px] shadow-[0_18px_45px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.02)] p-8 relative pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 12, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.17, 0.67, 0.36, 1.02] }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/4 hover:bg-black/8 flex items-center justify-center text-base font-semibold transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Brand */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                V
              </div>
              <div className="text-base font-semibold text-gray-900">Vireonix</div>
            </div>

            {/* Title */}
            <h1 className={`text-3xl font-bold mb-2 ${mode === "signin" ? "text-black" : "text-gray-900"}`}>
              {customTitle || (mode === "signin" ? "Sign in to Vireonix" : "Create an account")}
            </h1>
            <p className={`text-base mb-6 ${mode === "signin" ? "text-black" : "text-gray-500"}`}>
              {customMessage ||
                (mode === "signin"
                  ? "Sign in to access your Vireonix account."
                  : "Create your Vireonix account to continue.")}
            </p>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 -mx-8 px-8">
              <button
                onClick={() => {
                  setMode("signin");
                  setMessage({ text: "", type: "" });
                }}
                className={`flex-1 text-center py-4 text-base font-medium cursor-pointer transition-all relative ${
                  mode === "signin"
                    ? "text-black font-semibold"
                    : "text-gray-500"
                }`}
              >
                Sign In
                {mode === "signin" && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gray-900" />
                )}
              </button>
              <button
                onClick={() => {
                  setMode("signup");
                  setMessage({ text: "", type: "" });
                }}
                className={`flex-1 text-center py-4 text-base font-medium cursor-pointer transition-all relative ${
                  mode === "signup"
                    ? "text-gray-900 font-semibold"
                    : "text-gray-500"
                }`}
              >
                Sign Up
                {mode === "signup" && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gray-900" />
                )}
              </button>
            </div>

            {/* Social Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex-1 h-12 rounded-full border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium text-gray-700 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                className="flex-1 h-12 rounded-full border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 flex items-center justify-center gap-2 text-sm font-medium text-gray-700 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-900">
                  <path d="M12 .5C5.37.5 0 5.78 0 12.31c0 5.21 3.43 9.64 8.21 11.21.6.11.82-.26.82-.57v-2.01c-3.34.72-4.04-1.61-4.04-1.61-.55-1.37-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.21.69.82.57C20.57 21.95 24 17.52 24 12.31 24 5.78 18.63.5 12 .5z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-4 text-gray-400 text-xs uppercase tracking-wide my-6 font-medium">
              <div className="flex-1 h-px bg-gray-200" />
              <span>OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            <form 
              onSubmit={handleSubmit} 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="space-y-4 pointer-events-auto"
            >
              {/* Name Field - only for Sign Up */}
              <motion.div
                initial={{ maxHeight: 0, opacity: 0, marginBottom: 0 }}
                animate={{
                  maxHeight: mode === "signup" ? 80 : 0,
                  opacity: mode === "signup" ? 1 : 0,
                  marginBottom: mode === "signup" ? 16 : 0,
                }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden pointer-events-auto"
              >
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  tabIndex={0}
                  className="w-full h-12 rounded-lg border border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-black/10 px-4 text-sm font-normal transition-all cursor-text"
                />
              </motion.div>

              {/* Email Field */}
              <div className="pointer-events-auto">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="you@company.com"
                  autoComplete="email"
                  tabIndex={0}
                  className="w-full h-12 rounded-lg border border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-black/10 px-4 text-sm font-normal transition-all cursor-text"
                />
              </div>

              {/* Password Field */}
              <div className="pointer-events-auto">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-gray-700">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Min. 8 characters"
                    autoComplete="current-password"
                    tabIndex={0}
                    className="w-full h-12 rounded-lg border border-gray-300 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-black/10 px-4 text-sm font-normal transition-all pr-12 cursor-text"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-semibold mt-4 transition-all hover:shadow-lg active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? "Processing..."
                  : mode === "signin"
                  ? "Continue"
                  : "Create account"}
              </button>

              {/* Message */}
              {message.text && (
                <div
                  className={`text-xs text-center py-3 px-4 rounded-lg ${
                    message.type === "error"
                      ? "text-red-700 bg-red-50"
                      : "text-green-700 bg-green-50"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Footnote */}
              <p className="text-xs text-gray-500 text-center mt-4">
                By continuing, you agree to Vireonix's{" "}
                <a href="#" className="text-gray-600 underline hover:text-gray-900">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-gray-600 underline hover:text-gray-900">
                  Privacy Policy
                </a>
              </p>
              
              {/* Footer Note */}
              <p className="text-[10px] text-gray-400 text-center mt-3 pt-3 border-t border-gray-200">
                Secure authentication powered by Vireonix. Your data is always protected.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
