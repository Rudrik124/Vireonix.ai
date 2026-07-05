import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Shield,
  Key,
  Smartphone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Laptop,
  Download,
  Trash2,
  Github,
  MonitorPlay,
  Lock,
  Clock,
  LogOut,
  X,
  Server
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SecurityPage() {
  const navigate = useNavigate();

  // State for modals and toggles
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSignOutAllModal, setShowSignOutAllModal] = useState(false);

  // SECTION 1 — ACCOUNT SECURITY
  const AccountSecuritySection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 opacity-50 group-hover:opacity-100 transition-opacity" />
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Shield className="w-6 h-6 text-purple-400" /> Account Security
      </h2>
      
      <div className="space-y-6">
        {/* Change Password */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 mt-1 md:mt-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Change Password</h3>
              <p className="text-sm text-gray-400">Update your account password to keep your account secure.</p>
            </div>
          </div>
          <button className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10 shrink-0">
            Change Password
          </button>
        </div>

        {/* 2FA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 mt-1 md:mt-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Two-Factor Authentication (2FA)</h3>
              <p className="text-sm text-gray-400 max-w-md">Add an extra layer of security by requiring a verification code during sign in.</p>
            </div>
          </div>
          <button 
            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors focus:outline-none ${is2FAEnabled ? 'bg-purple-600' : 'bg-gray-600'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${is2FAEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Email Verification */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400 mt-1 md:mt-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-white">Email Verification</h3>
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              </div>
              <p className="text-sm text-gray-400">official@mavrostech.in</p>
            </div>
          </div>
          <button disabled className="px-5 py-2.5 rounded-lg bg-white/5 text-gray-500 font-medium border border-white/5 shrink-0 cursor-not-allowed">
            Verify Email
          </button>
        </div>
      </div>
    </div>
  );

  // SECTION 2 — ACTIVE SESSIONS
  const ActiveSessionsSection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Monitor className="w-6 h-6 text-purple-400" /> Active Sessions
      </h2>
      <div className="space-y-4">
        {/* Current Session */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-purple-500/10 border border-purple-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-black/40 text-white shrink-0 mt-1 md:mt-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-white text-lg">MacBook Pro M3 Max</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">Current Device</span>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Safari on macOS Sonoma</p>
                <p>IP: 192.168.1.105 • San Francisco, CA (USA)</p>
                <p>Active now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Other Session */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-white/5 text-gray-400 shrink-0 mt-1 md:mt-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg mb-1">iPhone 15 Pro</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Safari on iOS 17</p>
                <p>IP: 104.28.x.x • San Jose, CA (USA)</p>
                <p>Last active: 2 hours ago</p>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30 shrink-0 text-sm font-medium">
            Remove Session
          </button>
        </div>

        <div className="pt-4 mt-2 border-t border-white/10">
          <button 
            onClick={() => setShowSignOutAllModal(true)}
            className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out From All Devices
          </button>
        </div>
      </div>
    </div>
  );

  // SECTION 3 — TRUSTED DEVICES
  const TrustedDevicesSection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-green-400" /> Trusted Devices
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Laptop className="w-5 h-5 text-gray-400" />
              <h3 className="font-bold text-white">MacBook Pro M3 Max</h3>
            </div>
            <p className="text-sm text-gray-400">Safari on macOS</p>
            <p className="text-sm text-gray-400">San Francisco, CA</p>
            <p className="text-xs text-gray-500 mt-2">Trusted since Jan 15, 2026</p>
          </div>
          <button className="self-start text-sm text-gray-400 hover:text-red-400 transition-colors">
            Remove Device
          </button>
        </div>
      </div>
    </div>
  );

  // SECTION 4 — PRIVACY & DATA
  const PrivacyDataSection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Lock className="w-6 h-6 text-purple-400" /> Privacy & Data
      </h2>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 mt-1 md:mt-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Download My Data</h3>
              <p className="text-sm text-gray-400">Download a copy of your VEYTRIX.AI account information.</p>
            </div>
          </div>
          <button className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/10 shrink-0">
            Download Data
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 mt-1 md:mt-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Delete Account</h3>
              <p className="text-sm text-gray-400">Permanently delete your account and associated data.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors border border-red-500/30 shrink-0"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  // SECTION 5 — CONNECTED ACCOUNTS
  const ConnectedAccountsSection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Server className="w-6 h-6 text-purple-400" /> Connected Accounts
      </h2>
      <div className="space-y-4">
        {/* Google */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2">
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Google</h3>
              <span className="text-xs text-green-400 font-medium">Connected</span>
            </div>
          </div>
          <button className="text-sm text-gray-400 hover:text-white transition-colors">Disconnect</button>
        </div>

        {/* GitHub */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#24292e] flex items-center justify-center p-2">
              <Github className="w-full h-full text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">GitHub</h3>
              <span className="text-xs text-gray-500 font-medium">Not Connected</span>
            </div>
          </div>
          <button className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">Connect</button>
        </div>
      </div>
    </div>
  );

  // SECTION 6 — AI SECURITY
  const AISecuritySection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-purple-900/20 to-black/40 border border-purple-500/20 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <MonitorPlay className="w-6 h-6 text-fuchsia-400" /> AI Security
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          "AI Processing is encrypted.",
          "Uploaded files are securely stored.",
          "HTTPS secure connection enabled.",
          "Passwords are securely hashed.",
          "Account activity is monitored for suspicious logins.",
          "Uploaded media is processed securely.",
          "Files can be automatically deleted after processing if enabled."
        ].map((info, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
            <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <span className="text-sm text-gray-300 leading-relaxed">{info}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // SECTION 7 — SECURITY ACTIVITY
  const SecurityActivitySection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Clock className="w-6 h-6 text-purple-400" /> Recent Security Activity
      </h2>
      <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
        {[
          { title: "New Device Login", desc: "MacBook Pro M3 Max (Safari) in San Francisco, CA", time: "Just now", type: "info" },
          { title: "Last Login", desc: "iPhone 15 Pro (Safari) in San Jose, CA", time: "2 hours ago", type: "info" },
          { title: "Last Email Verification", desc: "official@mavrostech.in successfully verified", time: "Jan 15, 2026", type: "success" },
          { title: "Last Password Change", desc: "Password updated successfully", time: "Dec 10, 2025", type: "success" },
        ].map((item, idx) => (
          <div key={idx} className="relative">
            <div className={`absolute -left-[1.95rem] top-1 w-3 h-3 rounded-full border-2 border-[#0B0914] ${item.type === 'success' ? 'bg-green-500' : 'bg-purple-500'}`} />
            <div>
              <h4 className="font-bold text-white">{item.title}</h4>
              <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
              <span className="text-xs text-gray-500 mt-2 block">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // SECTION 8 — SECURITY TIPS
  const SecurityRecommendationsSection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-yellow-400" /> Security Recommendations
      </h2>
      <ul className="space-y-4">
        {[
          "Use a strong password with at least 12 characters.",
          "Enable Two-Factor Authentication.",
          "Never share your login credentials.",
          "Review active sessions regularly.",
          "Keep your recovery email updated.",
          "Report suspicious activity immediately."
        ].map((tip, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <div className="p-1 rounded-full bg-green-500/20 text-green-400">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <span className="text-gray-300 font-medium">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  // SECTION 9 — DANGER ZONE
  const DangerZoneSection = () => (
    <div className="p-6 md:p-8 rounded-3xl bg-red-950/20 border border-red-500/30 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
      <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
        Danger Zone
      </h2>
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => setShowSignOutAllModal(true)}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold transition-colors"
        >
          <span className="flex items-center gap-2"><LogOut className="w-5 h-5" /> Sign Out From All Devices</span>
        </button>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-colors"
        >
          <span className="flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete Account Permanently</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0914] text-white overflow-y-auto selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.svg')]" />
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vh] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vh] bg-blue-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
        
        {/* PAGE HEADER */}
        <div className="mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] inline-flex shrink-0 w-fit">
              <Shield className="w-12 h-12 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Security</h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
                Manage your account security, privacy settings, connected devices, and protect your VEYTRIX.AI account.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 grid-cols-1 lg:grid-cols-12"
        >
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            <AccountSecuritySection />
            <ActiveSessionsSection />
            <TrustedDevicesSection />
            <PrivacyDataSection />
            <ConnectedAccountsSection />
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-8">
            <SecurityRecommendationsSection />
            <AISecuritySection />
            <SecurityActivitySection />
            <DangerZoneSection />
          </div>
        </motion.div>

      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md p-8 rounded-3xl bg-[#13111C] border border-red-500/30 shadow-2xl relative"
            >
              <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30 mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-2 text-white">Delete Account?</h3>
              <p className="text-gray-400 text-center mb-8">This action is permanent and cannot be undone. All your generated content, credits, and data will be permanently wiped.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold transition-colors">Cancel</button>
                <button onClick={() => setShowDeleteModal(false)} className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]">Delete Account</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSignOutAllModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md p-8 rounded-3xl bg-[#13111C] border border-red-500/30 shadow-2xl relative"
            >
              <button onClick={() => setShowSignOutAllModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30 mx-auto">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-2 text-white">Sign Out All Devices?</h3>
              <p className="text-gray-400 text-center mb-8">You will be signed out of all other active sessions immediately. Your current session will remain active.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowSignOutAllModal(false)} className="py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold transition-colors">Cancel</button>
                <button onClick={() => setShowSignOutAllModal(false)} className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]">Sign Out</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
