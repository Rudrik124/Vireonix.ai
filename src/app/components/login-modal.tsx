import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { fetchAppProfile } from "../../services/auth-profile";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  customMessage?: string; // e.g., "Please login to generate your video"
  customTitle?: string; // e.g., "Login Required"
}

const LoginStyles = () => (
  <style>{`
    .login-gradient-move {
      animation: gradient-move 15s ease-in-out infinite;
    }
    .login-float {
      animation: float 4s ease-in-out infinite;
    }
    .login-particle {
      position: absolute;
      width: 3px;
      height: 3px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      animation: float-up 8s ease-in-out infinite;
    }
    @keyframes gradient-move {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-20px, -20px) scale(1.05); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes float-up {
      0% { transform: translateY(0); opacity: 0; }
      10% { opacity: 0.3; }
      90% { opacity: 0.3; }
      100% { transform: translateY(-300px); opacity: 0; }
    }
    .bg-grid-pattern {
      background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 30px 30px;
    }
    .glass-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) showMessage(error.message, "error");
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

  const handleDiscordSignIn = async () => {
    showMessage("Discord login coming soon!", "error");
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
          
          let nextRoute = '/video-type';
          if (data.session) {
            const profile = await fetchAppProfile(data.session);
            
            if (profile.role === "admin" || profile.role === "super_admin") {
              nextRoute = "/admin/dashboard";
            } else if (profile.role === "developer") {
              nextRoute = "/developer/dashboard";
            } else if (profile.role === "tester") {
              nextRoute = "/tester/dashboard";
            }
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
        <motion.div
          className="fixed inset-0 z-[9999] bg-[#0B0A10] flex overflow-hidden lg:grid lg:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginStyles />
          {/* ENHANCED HOMEPAGE BACKGROUND */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0B0A10]">
            {/* Grid Glow */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [perspective:1000px] [transform-style:preserve-3d]">
               <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A10] via-transparent to-[#0B0A10]" />
            </div>
            
            {/* Gradient Blobs */}
            <motion.div 
              animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px]"
            />
            <motion.div 
              animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]"
            />
          </div>

          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 z-[10000] w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors backdrop-blur-md modal-close"
            aria-label="Close"
          >
            ✕
          </button>

          {/* LEFT PANEL - AI VISUALS */}
          <div className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden border-r border-white/5 bg-transparent z-10">

            
            {/* Particles */}
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="login-particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${6 + Math.random() * 4}s`
                }}
              />
            ))}

            <div className="relative z-10 w-full max-w-lg px-12">
              <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mb-16 text-center shadow-black drop-shadow-2xl">
                Generate cinematic AI videos instantly.
              </h2>
              
              {/* Floating Elements Container */}
              <div className="relative h-[360px] w-full mt-8" style={{ perspective: '1000px' }}>
                
                {/* Floating Card 1 */}
                <div className="absolute top-0 left-0 login-float bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-52 shadow-2xl" style={{ animationDelay: '0s' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">🎬</span>
                    <span className="text-sm font-semibold text-white">Rendering...</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-purple-400 h-full w-[75%] rounded-full shadow-[0_0_10px_#c084fc]"></div>
                  </div>
                  <div className="text-right text-[10px] text-purple-400 mt-1 font-mono">75%</div>
                </div>

                {/* Floating Card 2 */}
                <div className="absolute top-1/4 right-0 login-float bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-52 shadow-2xl" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">✨</span>
                    <span className="text-sm font-semibold text-white">AI Processing</span>
                  </div>
                  <div className="text-xs text-blue-300 mt-1">Neural Networks: 12</div>
                  <div className="flex gap-1 mt-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-1 flex-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>

                {/* Floating Card 3 */}
                <div className="absolute bottom-[20%] left-10 login-float bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-60 shadow-2xl" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">✅</span>
                    <span className="text-sm font-semibold text-white">Video Ready</span>
                  </div>
                  <div className="text-xs text-emerald-400 mt-1 flex justify-between font-medium">
                    <span>4K Export Complete</span>
                    <span className="font-bold">100%</span>
                  </div>
                </div>

                {/* Mini Video Preview Window */}
                <div className="absolute bottom-0 right-10 login-float bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-64 shadow-2xl" style={{ animationDelay: '1.5s' }}>
                  <div className="w-full h-32 bg-gray-950 rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                    
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                      <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1" />
                    </div>
                    
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider border border-white/10">PREVIEW</div>
                    <div className="absolute top-2 right-2 flex gap-1">
                       <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">4K</span>
                       <span className="bg-white/10 text-white/70 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold">60fps</span>
                    </div>
                    
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                         <div className="h-full bg-purple-400 w-1/3 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT PANEL - LOGIN FORM */}
          <div className="relative flex flex-col items-center justify-center p-6 sm:p-12 h-full overflow-y-auto bg-transparent z-10">
            


            {/* Floating Status Pills in Background (Hidden on Mobile) */}
            <div className="absolute top-10 left-10 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-medium text-white/60 login-float" style={{animationDelay: '0.5s'}}>
              <span className="text-purple-400">⚡</span> AI Engine Online
            </div>
            <div className="absolute bottom-10 right-10 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-medium text-white/60 login-float" style={{animationDelay: '1.2s'}}>
              <span className="text-emerald-400">☁</span> Secure Cloud Access
            </div>
            <div className="absolute bottom-20 left-10 hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-medium text-white/60 login-float" style={{animationDelay: '2.5s'}}>
              <span className="text-purple-400">🎬</span> Rendering Enabled
            </div>

            {/* Glass Card Container */}
            <div className="relative z-10 w-full max-w-[420px] bg-white/[0.05] backdrop-blur-[20px] border border-white/[0.1] rounded-[24px] p-8 sm:p-12 shadow-[0_25px_50px_rgba(0,0,0,0.25)]">
              
              {/* Logo & Welcome */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_20px_rgba(168,85,247,0.3)] mb-5">
                  <span className="text-xl font-black text-white">V</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                  {customTitle || "Enter your AI video studio."}
                </h3>
                <p className="text-sm text-slate-400">
                  {customMessage || "Continue creating cinematic videos with AI."}
                </p>
              </div>

              {/* Form Mode Toggle */}
              <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setMessage({text:"", type:""}); }}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all ${
                    mode === "signin" ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setMessage({text:"", type:""}); }}
                  className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all ${
                    mode === "signup" ? "bg-white/10 text-white shadow-sm border border-white/10" : "text-slate-400 hover:text-white"
                  }`}
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
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Full name"
                          className="w-full h-[52px] pl-[44px] pr-4 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 glass-input transition-all text-sm"
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
                    className="w-full h-[52px] pl-[44px] pr-4 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 glass-input transition-all text-sm"
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
                    className="w-full h-[52px] pl-[44px] pr-12 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-slate-500 glass-input transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold tracking-wider text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {/* Remember / Forgot */}
                {mode === "signin" && (
                  <div className="flex justify-between items-center py-1 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-white/20 bg-white/5 flex items-center justify-center group-hover:border-purple-400 transition-colors">
                        <div className="w-2 h-2 rounded-sm bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-medium text-slate-400 hover:text-purple-400 transition-colors"
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
                    className={`text-[11px] font-medium px-4 py-3 rounded-xl border ${
                      message.type === "error" 
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
                  className="relative w-full h-[52px] mt-6 rounded-xl font-bold text-white overflow-hidden group transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500 to-purple-600 transition-opacity duration-300" />
                  <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl" />
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                  <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
                  
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
                      <span>{mode === "signin" ? "Start Creating" : "Create Account"}</span>
                    )}
                  </div>
                </button>

                {/* Social Login Section */}
                <div className="mt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Or continue with</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Google */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading || loginSuccess}
                      className="h-11 flex flex-col items-center justify-center gap-1 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 rounded-xl transition-all group"
                      title="Google"
                    >
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] group-hover:scale-110 transition-transform">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </button>
                    
                    {/* GitHub */}
                    <button
                      type="button"
                      onClick={handleGithubSignIn}
                      disabled={isLoading || loginSuccess}
                      className="h-11 flex flex-col items-center justify-center gap-1 bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 rounded-xl transition-all group"
                      title="GitHub"
                    >
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white group-hover:scale-110 transition-transform">
                        <path d="M12 .5C5.37.5 0 5.78 0 12.31c0 5.21 3.43 9.64 8.21 11.21.6.11.82-.26.82-.57v-2.01c-3.34.72-4.04-1.61-4.04-1.61-.55-1.37-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .31.21.69.82.57C20.57 21.95 24 17.52 24 12.31 24 5.78 18.63.5 12 .5z" />
                      </svg>
                    </button>
                    
                    {/* Discord */}
                    <button
                      type="button"
                      onClick={handleDiscordSignIn}
                      disabled={isLoading || loginSuccess}
                      className="h-11 flex flex-col items-center justify-center gap-1 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 hover:border-[#5865F2]/50 rounded-xl transition-all group"
                      title="Discord"
                    >
                      <svg viewBox="0 0 127.14 96.36" className="w-[18px] h-[18px] fill-[#5865F2] group-hover:scale-110 transition-transform">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-19.32-72.1M42.68,65.23C36.62,65.23,31.63,59.5,31.63,52.34s4.89-12.89,11.05-12.89,11.15,5.82,11.05,12.89C53.73,59.5,48.84,65.23,42.68,65.23Zm41.77,0c-6.06,0-11.05-5.73-11.05-12.89s4.89-12.89,11.05-12.89,11.15,5.82,11.05,12.89C95.5,59.5,90.61,65.23,84.45,65.23Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* What You Get Checklist */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-x-6 gap-y-3 justify-center text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><span className="text-purple-400">✔</span> AI Video Generation</span>
                  <span className="flex items-center gap-1.5"><span className="text-purple-400">✔</span> 4K Exports</span>
                  <span className="flex items-center gap-1.5"><span className="text-purple-400">✔</span> Prompt-Based Editing</span>
                  <span className="flex items-center gap-1.5"><span className="text-purple-400">✔</span> Cloud Rendering</span>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
