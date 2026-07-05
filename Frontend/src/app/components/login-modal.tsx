import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { fetchAppProfile } from "../../services/auth-profile";
import { recordLoginActivity } from "../../lib/auth-login-activity";
import { getRoleRedirectUrl } from "../../lib/role-redirect";
import { signInWithGoogle } from "@/lib/auth-helpers";
import { BrandLogo } from "./brand-logo";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMessage?: string; // e.g., "Please login to generate your video"
  customTitle?: string; // e.g., "Login Required"
}

const LoginStyles = () => (
  <style>{`
    .glass-input:focus {
      border-color: #a855f7;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
      outline: none;
    }
  `}</style>
);

export function LoginModal({ isOpen, onClose, customMessage, customTitle }: LoginModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (mode === "signup") {
          nameInputRef.current?.focus();
        } else {
          emailInputRef.current?.focus();
        }
      }, 150);
    }
  }, [isOpen, mode]);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setMessage({ text: "", type: "" });
    setLoginSuccess(false);
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
      showMessage("Login is unavailable: missing Supabase frontend env.", "error");
      return false;
    }
    return true;
  };

  const handleGoogleSignIn = async () => {
    if (!ensureSupabaseConfigured()) return;
    try {
      setIsLoading(true);
      await signInWithGoogle(`${window.location.origin}/auth/callback`);
    } catch (err: any) {
      showMessage(err?.message || "Google sign-in failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    if (!ensureSupabaseConfigured()) return;
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) showMessage(error.message, "error");
    } catch (err: any) {
      showMessage(err?.message || "GitHub sign-in failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!ensureSupabaseConfigured()) return;
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
      if (error) showMessage(error.message, "error");
      else showMessage(`Password reset link sent to ${trimmedEmail}.`, "success");
    } catch (err) {
      showMessage("Failed to send reset link.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (!ensureSupabaseConfigured()) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      showMessage("Please enter a valid email address.", "error");
      return;
    }
    if (!password || password.length < 8) {
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
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password,
        });

        if (error) {
          showMessage(error.message, "error");
        } else {
          setLoginSuccess(true);
          localStorage.setItem("justLoggedIn", "true");

          let nextRoute = '/home';
          const authRedirectUrl = localStorage.getItem("authRedirectUrl");

          if (authRedirectUrl) {
            localStorage.removeItem("authRedirectUrl");
          }

          if (data.session) {
            const profile = await fetchAppProfile(data.session);
            await recordLoginActivity(data.session, profile);

            const userEmail = data.session.user.email?.toLowerCase() || "";

            // Use the centralized role redirect logic
            nextRoute = getRoleRedirectUrl(userEmail, profile, authRedirectUrl || '/home');
          } else if (authRedirectUrl) {
            nextRoute = authRedirectUrl;
          }

          setTimeout(() => {
            handleClose();
            navigate(nextRoute);
          }, 1500);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: password,
          options: { data: { full_name: fullName.trim() } },
        });

        if (error) {
          showMessage(error.message, "error");
        } else {
          showMessage("Account created! Check your email.", "success");
          setTimeout(() => { resetForm(); setMode("signin"); }, 2000);
        }
      }
    } catch (err: any) {
      showMessage(err?.message || "An error occurred.", "error");
    } finally {
      if (mode === "signup" || !loginSuccess) {
        setIsLoading(false);
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: "rgba(5, 5, 15, 0.55)", backdropFilter: "blur(12px)" }}
          onClick={handleOverlayClick}
        >
          <LoginStyles />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto bg-[#0a0a10]/80 backdrop-blur-2xl border border-white/[0.08] rounded-[28px] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),0_0_40px_rgba(168,85,247,0.1)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Logo & Header */}
            <div className="flex flex-col items-center text-center mb-8 mt-2">
              <BrandLogo size={42} className="mb-5 inline-flex" />
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                {customTitle || "Welcome Back"}
              </h3>
              <p className="text-sm text-slate-400 max-w-[280px]">
                {customMessage || "Sign in to continue creating AI-powered videos."}
              </p>
            </div>

            {/* Segmented Control */}
            <div className="flex relative bg-white/[0.03] p-1 rounded-xl mb-6 border border-white/5">
              <div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg shadow-sm border border-white/10 transition-transform duration-300 ease-out pointer-events-none"
                style={{ transform: mode === "signin" ? "translateX(0)" : "translateX(100%)" }}
              />
              <button
                type="button"
                onClick={() => { setMode("signin"); setMessage({ text: "", type: "" }); }}
                className={`relative z-10 flex-1 text-sm font-semibold py-2.5 rounded-lg transition-colors duration-300 ${mode === "signin" ? "text-white" : "text-slate-400 hover:text-white"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setMessage({ text: "", type: "" }); }}
                className={`relative z-10 flex-1 text-sm font-semibold py-2.5 rounded-lg transition-colors duration-300 ${mode === "signup" ? "text-white" : "text-slate-400 hover:text-white"}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Signup only) */}
              <AnimatePresence>
                {mode === "signup" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        👤
                      </div>
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Full name"
                        className="w-full h-11 pl-11 pr-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 glass-input transition-all text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  ✉
                </div>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full h-11 pl-11 pr-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 glass-input transition-all text-sm"
                />
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  🔒
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-11 pl-11 pr-16 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 glass-input transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[10px] font-bold tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {/* Forgot password */}
              {mode === "signin" && (
                <div className="flex justify-end items-center pt-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-slate-400 hover:text-fuchsia-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Alert Messages */}
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-[11px] font-medium px-4 py-3 rounded-xl border ${message.type === "error"
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                >
                  {message.text}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || loginSuccess}
                className="relative w-full h-12 mt-2 rounded-xl font-bold text-white overflow-hidden group transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-purple-600 transition-transform group-hover:scale-[1.02]" />
                <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-xl" />

                <div className="relative flex items-center justify-center gap-2 h-full w-full">
                  {loginSuccess ? (
                    <>
                      <span className="text-xl">✨</span>
                      <span>Welcome back!</span>
                    </>
                  ) : isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{mode === "signin" ? "Authenticating..." : "Creating account..."}</span>
                    </>
                  ) : (
                    <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
                  )}
                </div>
              </button>

              {/* Social Login Section */}
              <div className="mt-6 pt-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-white/[0.05]" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Continue with</span>
                  <div className="h-px flex-1 bg-white/[0.05]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || loginSuccess}
                    className="h-11 flex flex-col items-center justify-center gap-1 bg-white/[0.03] hover:bg-white/[0.06] hover:-translate-y-0.5 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 group"
                    title="Google"
                  >
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </button>

                  {/* GitHub */}
                  <button
                    type="button"
                    onClick={handleGithubSignIn}
                    disabled={isLoading || loginSuccess}
                    className="h-11 flex flex-col items-center justify-center gap-1 bg-white/[0.03] hover:bg-white/[0.06] hover:-translate-y-0.5 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200 group"
                    title="GitHub"
                  >
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
                      <path d="M12 .5C5.37.5 0 5.78 0 12.31c0 5.21 3.43 9.64 8.21 11.21.6.11.82-.26.82-.57v-2.01c-3.34.72-4.04-1.61-4.04-1.61-.55-1.37-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.21.69.82.57C20.57 21.95 24 17.52 24 12.31 24 5.78 18.63.5 12 .5z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Footer text */}
              <div className="mt-8 pt-6 flex justify-center text-center">
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  🔒 Secure authentication powered by VEYTRIX.AI
                </span>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
