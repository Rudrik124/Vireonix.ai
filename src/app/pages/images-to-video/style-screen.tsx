import { useState } from "react";
import { motion } from "motion/react";
import { Film, Sparkles, Plane, Instagram, Music, Upload, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";

const videoStyles = [
  {
    id: "cinematic",
    title: "Cinematic",
    description: "Epic and dramatic with smooth transitions",
    icon: Film,
    gradient: "from-blue-500 to-purple-400",
  },
  {
    id: "slideshow",
    title: "Slideshow",
    description: "Classic presentation style",
    icon: Sparkles,
    gradient: "from-purple-400 to-fuchsia-400",
  },
  {
    id: "travel",
    title: "Travel Vlog",
    description: "Adventure and exploration vibes",
    icon: Plane,
    gradient: "from-fuchsia-400 to-emerald-400",
  },
  {
    id: "instagram",
    title: "Instagram Reel",
    description: "Trendy and social media ready",
    icon: Instagram,
    gradient: "from-pink-500 to-rose-400",
  },
];

const transitions = [
  { id: "fade", label: "Fade" },
  { id: "zoom", label: "Zoom" },
  { id: "slide", label: "Slide" },
  { id: "dissolve", label: "Dissolve" },
];

const musicOptions = [
  { id: "upbeat", label: "Upbeat & Energetic" },
  { id: "calm", label: "Calm & Relaxing" },
  { id: "epic", label: "Epic & Dramatic" },
  { id: "none", label: "No Music" },
];

export function ImagesToVideoStyleScreen() {
  const navigate = useNavigate();
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [selectedTransition, setSelectedTransition] = useState("fade");
  const [selectedMusic, setSelectedMusic] = useState("upbeat");
  const [customAudio, setCustomAudio] = useState<File | null>(null);

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomAudio(file);
      setSelectedMusic("custom");
    }
  };

  const handleGenerate = () => {
    navigate("/images-to-video/preview");
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden font-sans selection:bg-purple-500/30 selection:text-white pb-20"
      style={{
        background: 'linear-gradient(135deg, #0B1020 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Corner Vignettes */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }}
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/images-to-video/arrange")}
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-purple-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to arrangement</span>
        </motion.button>

        {/* Header */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 drop-shadow-[0_2px_10px_rgba(168, 85, 247,0.2)]">
            Choose Your Style
          </h1>
          <p className="text-[#94a3b8] font-medium text-lg">Select video style, transitions, and music</p>
        </motion.div>

        {/* Video Styles */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="mb-8"
        >
          <h2 className="text-xl font-bold mb-4 text-white">Video Style</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoStyles.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`relative p-6 rounded-xl border transition-all text-left ${
                    selectedStyle === style.id
                      ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168, 85, 247,0.2)]"
                      : "border-[#3f4a67]/50 hover:border-purple-500/30 bg-[#1a1b2e]/60 backdrop-blur-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{style.title}</h3>
                      <p className="text-sm text-[#cbd5e1]">{style.description}</p>
                    </div>
                    {selectedStyle === style.id && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(168, 85, 247,0.5)]">
                        <svg className="w-4 h-4 text-[#0B1020]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Transitions */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="mb-8"
        >
          <h2 className="text-xl font-bold mb-4 text-white">Transition Effects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {transitions.map((transition) => (
              <button
                key={transition.id}
                onClick={() => setSelectedTransition(transition.id)}
                className={`p-4 rounded-xl border transition-all ${
                  selectedTransition === transition.id
                    ? "border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168, 85, 247,0.2)]"
                    : "border-[#3f4a67]/50 bg-[#1a1b2e]/40 hover:border-purple-500/30 text-[#cbd5e1]"
                }`}
              >
                <span className="font-semibold">{transition.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Music Selection */}
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-8 mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Music className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Background Music</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {musicOptions.map((music) => (
              <button
                key={music.id}
                onClick={() => setSelectedMusic(music.id)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedMusic === music.id
                    ? "border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168, 85, 247,0.2)]"
                    : "border-[#3f4a67]/50 bg-[#2d3142]/40 hover:border-purple-500/30 text-[#cbd5e1]"
                }`}
              >
                <span className="font-semibold">{music.label}</span>
              </button>
            ))}
          </div>

          {/* Custom Audio Upload */}
          <div className="relative border-2 border-dashed border-[#3f4a67] rounded-xl p-6 hover:border-purple-400/50 transition-all bg-[#0B1020]/40">
            <input
              type="file"
              accept="audio/*"
              onChange={handleCustomAudioUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center gap-3">
              <Upload className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-[#94a3b8]">
                {customAudio ? <span className="text-purple-400">✓ {customAudio.name}</span> : "Upload custom audio"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleGenerate}
             className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 hover:opacity-90 text-[#0B1020] shadow-[0_0_20px_rgba(168, 85, 247,0.3)] hover:shadow-[0_0_30px_rgba(168, 85, 247,0.5)] transition-all rounded-xl border border-purple-300/40"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create Video
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
