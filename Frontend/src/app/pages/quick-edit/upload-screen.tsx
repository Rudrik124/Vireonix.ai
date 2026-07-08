import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, User, Upload, Music, Shield, FileVideo, Check, X, Zap, Cloud, Sparkles, Layers, Lock, Play, Loader, ArrowRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/auth-context";
import { BrandLogo } from "../../components/brand-logo";
import { useRedirectParam } from "../../lib/useRedirectParam";

const particles = Array.from({ length: 40 });

// ============================================
// CONFIG - Match Landing Page Theme
// ============================================
const CONFIG = {
  background: 'linear-gradient(135deg, #050812 0%, #0d1222 30%, #171d33 60%, #1f2540 85%, #0d1222 100%)',
  accent: '#3b82f6', // blue-500
  accentCyan: '#8b5cf6', // purple-500
  accentPurple: '#a855f7', // purple-500
  accentGlow: 'rgba(59, 130, 246, 0.5)',
  accentLight: 'rgba(59, 130, 246, 0.12)',
  text: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  textMuted2: 'rgba(255, 255, 255, 0.35)',
  gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', // blue to purple
  gradientCyan: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
  gradientHover: '0 10px 40px rgba(59, 130, 246, 0.45)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
};

export function QuickEditUploadScreen() {
  const navigate = useNavigate();
  const redirectTo = useRedirectParam();
  const { isLoggedIn, session, logout } = useAuth();
  
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // ----- MOUSE TRACKING -----
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ----- HANDLERS -----
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    if (selectedFile.type.startsWith('video/') || selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
    } else {
      setFileError("Unsupported file type. Please upload a video (e.g., mp4) or image file.");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const handleAudioSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setAudioFile(selectedFile);
  }, []);

  const handleContinue = useCallback(() => {
    if (file) {
      setUploading(true);
      setTimeout(() => {
        setUploading(false);
        navigate("/quick-edit/style", {
          state: {
            initialMedia: {
              name: file.name,
              type: file.type.startsWith('video/') ? 'video' : 'image',
              preview: URL.createObjectURL(file),
              file: file
            },
            initialAudio: audioFile ? {
              name: audioFile.name,
              type: 'direct',
              file: audioFile
            } : null
          }
        });
      }, 1500);
    }
  }, [file, audioFile, navigate]);

  // ----- STYLES -----
  const styles: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      height: '100vh',
      overflow: 'hidden',
      color: CONFIG.text,
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      background: CONFIG.background,
    },

    // Background Effects from prompt (Spotlight, grid, watermark)
    watermark: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '280px',
      fontWeight: '800',
      opacity: 0.03,
      pointerEvents: 'none',
      zIndex: 1,
      color: CONFIG.text,
    },
    gridPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      pointerEvents: 'none',
      zIndex: 2,
    },
    spotlight: {
      position: 'absolute',
      width: '600px',
      height: '600px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
      transform: `translate(${mousePos.x * 8 - 300}px, ${mousePos.y * 8 - 300}px)`,
      pointerEvents: 'none',
      zIndex: 3,
    },

    // ===== MAIN CONTENT =====
    content: {
      position: 'relative',
      zIndex: 10,
      minHeight: '100vh',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 5% 16px',
    },

    // Navbar
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '22px',
      fontWeight: '700',
      cursor: 'pointer',
    },
    navRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    navBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: 'rgba(255,255,255,0.08)',
      border: 'none',
      borderRadius: '8px',
      color: CONFIG.text,
      cursor: 'pointer',
      fontSize: '13px',
      transition: 'all 0.2s ease',
    },

    // ===== CORNER BADGES =====
    cornerBadge: {
      position: 'absolute',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: CONFIG.textMuted2,
      zIndex: 1,
    },
    topLeft: { top: '90px', left: '5%' },
    topRight: { top: '90px', right: '5%' },
    statusDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: CONFIG.accentCyan,
      boxShadow: `0 0 8px ${CONFIG.accentCyan}`,
    },

    // Main Area
    mainArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      maxWidth: '800px',
      width: '100%',
      margin: '0 auto',
      gap: '20px',
      paddingBottom: '60px',
    },
    headerArea: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '1vh',
      marginBottom: '2vh',
    },

    title: {
      fontSize: 'clamp(2rem, 3.5vw, 3.5rem)',
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: '8px',
      letterSpacing: '-0.02em',
      textShadow: '0 4px 20px rgba(0,0,0,0.5)',
    },
    subtitle: {
      fontSize: '16px',
      color: CONFIG.textMuted,
      textAlign: 'center',
      marginBottom: '24px',
    },
    titleBadges: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '16px',
    },
    titleBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      color: CONFIG.textMuted2,
    },

    // Upload Zone
    uploadZone: {
      width: '100%',
      flex: 1,
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: dragOver ? CONFIG.accentLight : CONFIG.glassBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `2px ${dragOver ? 'solid' : 'dashed'} ${dragOver ? CONFIG.accent : CONFIG.glassBorder}`,
      borderRadius: '24px',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      position: 'relative',
      overflow: 'hidden',
    },
    uploadIcon: {
      marginBottom: '16px',
      opacity: dragOver ? 1 : 0.5,
    },
    uploadText: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '8px',
    },
    uploadSubtext: {
      fontSize: '14px',
      color: CONFIG.textMuted,
    },
    uploadFormats: {
      display: 'flex',
      gap: '20px',
      fontSize: '12px',
      color: CONFIG.textMuted2,
      marginTop: '16px',
    },
    fileName: {
      position: 'absolute',
      bottom: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '6px',
      fontSize: '12px',
    },
    hiddenInput: { display: 'none' },

    // Requirements Row
    reqRow: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '20px 30px',
      marginTop: '4px',
      fontSize: '13px',
      color: CONFIG.accent,
    },
    reqItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontWeight: '500',
    },

    // Audio Card
    audioCard: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: CONFIG.glassBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${CONFIG.glassBorder}`,
      borderRadius: '10px',
      padding: '12px 16px',
      marginTop: '12px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    audioLeft: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
    audioTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      fontWeight: '500',
    },
    audioDesc: {
      fontSize: '11px',
      color: CONFIG.textMuted2,
    },
    uploadBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '8px',
      color: CONFIG.text,
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    audioFileName: {
      fontSize: '12px',
      color: CONFIG.accent,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },

    // CTA Button
    ctaBtn: {
      width: '100%',
      height: '56px',
      background: file ? CONFIG.gradient : 'rgba(255, 255, 255, 0.15)',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '16px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: file ? 'pointer' : 'not-allowed',
      transition: 'all 0.25s ease',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      opacity: uploading ? 0.8 : 1,
      position: 'relative',
      overflow: 'hidden',
    },
    ctaBtnHover: file ? {
      transform: 'translateY(-2px)',
      boxShadow: CONFIG.gradientHover,
    } : {},

    // Status Row
    statusRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: '24px',
      marginTop: '8px',
      fontSize: '11px',
      color: CONFIG.textMuted2,
    },
    statusItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },

    // Security
    security: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      fontSize: '10px',
      color: CONFIG.textMuted2,
      marginTop: '8px',
    },

    // ===== BOTTOM FEATURE RIBBON =====
    bottomRibbon: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      background: CONFIG.glassBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${CONFIG.glassBorder}`,
      padding: '14px 5%',
      display: 'flex',
      justifyContent: 'center',
      gap: '32px',
      flexWrap: 'wrap',
      zIndex: 100,
    },
    ribbonItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: CONFIG.textMuted,
    },
  };

  return (
    <div 
      style={styles.page}
      className="relative selection:bg-blue-500/30 text-slate-200"
    >
      {/* ===== BACKGROUND EFFECTS ===== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[30vh] bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-[90px] rotate-[35deg]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[25vh] bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-[100px] rotate-[-25deg]" />
      </div>
      <div className="fixed top-[5%] left-[5%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-[0%] right-[5%] w-[70%] h-[70%] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-screen" />

      {/* ===== CORNER BADGES ===== */}
      <div style={{...styles.cornerBadge, ...styles.topLeft}}>
        <div style={styles.statusDot} />
        System Online
      </div>
      <div style={{...styles.cornerBadge, ...styles.topRight}}>
        <Shield size={12} color={CONFIG.accentCyan} />
        Encrypted Session
      </div>

      <div style={styles.content}>
        {/* ===== NAVBAR ===== */}
        <nav style={styles.navbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={styles.logo} onClick={() => navigate(redirectTo || "/features")}>
              <BrandLogo size={32} />
              <span style={{ marginLeft: '8px', color: '#FFFFFF' }}>VEYTRIX<span style={{ color: '#c084fc' }}>.AI</span></span>
            </div>
            <button style={styles.navBtn} onClick={() => navigate(redirectTo || "/features")}>
              <ArrowLeft size={16} />
              <span className="hidden md:inline">Back</span>
            </button>
          </div>
          <div style={styles.navRight}>
            <button style={{...styles.navBtn, padding: '8px'}}>
              <User size={18} />
            </button>
          </div>
        </nav>

        {/* ===== HEADER AREA (Moved Above) ===== */}
        <div style={styles.headerArea}>
          <div style={styles.titleBadges}>
            <div style={styles.titleBadge}><Sparkles size={12} color={CONFIG.accent} /> AI Video Engine 2.0</div>
            <div style={styles.titleBadge}><Layers size={12} color={CONFIG.accentCyan} /> Neural Processing</div>
          </div>
          <h1 style={styles.title}>QUICK AI STUDIO</h1>
          <p style={styles.subtitle}>Upload your media to initialize the neural editing environment</p>
        </div>

        {/* ===== MAIN AREA ===== */}
        <div style={styles.mainArea}>
          
          {/* Upload Zone */}
          <div
            style={styles.uploadZone}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/mov,video/avi,video/mkv,image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelect}
              style={styles.hiddenInput}
            />
            
            {!file ? (
              <>
                <div style={styles.uploadIcon}>
                  {dragOver ? <Upload size={72} color={CONFIG.accent} /> : <FileVideo size={72} color={CONFIG.textMuted2} />}
                </div>
                <div style={styles.uploadText}>
                  {dragOver ? 'Release to Upload Media' : 'Drag & Drop Media Files'}
                </div>
                <div style={styles.uploadSubtext}>
                  or click to browse from your computer
                </div>
                <div style={styles.uploadFormats}>
                  <span>MP4 • MOV • AVI • MKV</span>
                  <span>|</span>
                  <span>Max 10GB</span>
                  <span>|</span>
                  <span>4K & 8K</span>
                </div>
              </>
            ) : (
              <>
                <FileVideo size={80} color={CONFIG.accent} style={{ marginBottom: '20px' }} />
                <div style={styles.fileName}>
                  <FileVideo size={16} />
                  {file.name.length > 40 ? file.name.substring(0, 37) + '...' : file.name}
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null); }}
                    style={{background: 'none', border: 'none', color: CONFIG.textMuted, cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center'}}
                  >
                    <X size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {fileError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {fileError}
            </motion.div>
          )}

          {/* Requirements Row */}
          <div style={styles.reqRow}>
            <div style={styles.reqItem}><Check size={12} /> Auto-Enhancement</div>
            <div style={styles.reqItem}><Check size={12} /> Smart Framing</div>
            <div style={styles.reqItem}><Check size={12} /> Lossless Export</div>
          </div>

          {/* Audio Card */}
          <div style={styles.audioCard}>
            <div style={styles.audioLeft}>
              <div style={styles.audioTitle}>
                <Music size={14} color={CONFIG.accentPurple} /> Custom Soundtrack
              </div>
              <div style={styles.audioDesc}>
                Upload background audio for beat-synced edits
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              {audioFile && (
                <span style={styles.audioFileName}>
                  <Check size={12} />
                  {audioFile.name.length > 20 ? audioFile.name.substring(0, 17) + '...' : audioFile.name}
                  <button
                    onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                    style={{background: 'none', border: 'none', color: CONFIG.textMuted, cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center'}}
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
              <button 
                style={styles.uploadBtn}
                onClick={() => audioInputRef.current?.click()}
              >
                <Upload size={12} /> Upload Audio
              </button>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                style={styles.hiddenInput}
              />
            </div>
          </div>

          {/* CTA Button */}
          <button
            style={{...styles.ctaBtn, ...(file ? styles.ctaBtnHover : {})}}
            onClick={handleContinue}
            disabled={!file || uploading}
          >
            {uploading ? (
              <><Loader className="animate-spin" size={18} /> Processing...</>
            ) : (
              <>Launch Neural Engine <ArrowRight size={18} /></>
            )}
          </button>

          {/* Security */}
          <div style={styles.security}>
            <Lock size={12} /> Military-Grade Encryption • Zero Data Retention
          </div>
        </div>
      </div>
      
      {/* ===== BOTTOM RIBBON ===== */}
      <div style={styles.bottomRibbon}>
        <div style={styles.ribbonItem}><Zap size={14} color={CONFIG.accent} /> Real-time Rendering</div>
        <div style={styles.ribbonItem}><Cloud size={14} color={CONFIG.accentCyan} /> Cloud Synced</div>
      </div>
    </div>
  );
}
