import { useState } from "react";
import { motion } from "motion/react";
import { GripVertical, Clock, ArrowLeft, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Slider } from "../../components/ui/slider";

// Mock image data - in real app this would come from previous screen
const mockImages = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  url: `https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?w=400&h=400&fit=crop`,
  duration: 3,
}));

export function ImagesToVideoArrangeScreen() {
  const navigate = useNavigate();
  const [images, setImages] = useState(mockImages);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const updateDuration = (id: number, duration: number) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, duration } : img))
    );
  };

  const handleContinue = () => {
    navigate("/images-to-video/style");
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
          onClick={() => navigate("/images-to-video/upload")}
          className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-purple-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to upload</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-fuchsia-300 drop-shadow-[0_2px_10px_rgba(168, 85, 247,0.2)]">
            Arrange Your Images
          </h1>
          <p className="text-[#94a3b8] font-medium text-lg">Drag to reorder and set duration for each image</p>
        </motion.div>

        {/* Arrangement Area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a1b2e]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(11,13,31,0.5)] border border-[#3f4a67]/50 p-8 mb-8"
        >
          <div className="space-y-4">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedImage(image.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedImage === image.id
                  ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168, 85, 247,0.2)]"
                  : "border-[#3f4a67]/50 hover:border-purple-500/30 bg-[#2d3142]/40"
                  }`}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-[#64748b] hover:text-purple-400">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Order Number */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-[#0B1020] text-sm font-bold shadow-[0_0_10px_rgba(168, 85, 247,0.3)]">
                  {index + 1}
                </div>

                {/* Image Preview */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#0B1020]/40 border border-[#3f4a67]/50">
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${image.url})` }} />
                </div>

                {/* Image Info */}
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Image {index + 1}</p>
                  <p className="text-xs text-[#94a3b8] font-medium">Click to adjust duration</p>
                </div>

                {/* Duration Control */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <Clock className="w-4 h-4 text-[#64748b]" />
                  <div className="flex-1">
                    <Slider
                      value={[image.duration]}
                      onValueChange={(value) => updateDuration(image.id, value[0])}
                      min={1}
                      max={10}
                      step={0.5}
                      className="cursor-pointer"
                    />
                  </div>
                  <span className="text-sm font-bold text-purple-400 min-w-[3rem]">
                    {image.duration}s
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total Duration */}
          <div className="mt-6 p-4 bg-purple-900/20 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-100">Total Video Duration</span>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 drop-shadow-[0_0_8px_rgba(168, 85, 247,0.5)]">
                {images.reduce((sum, img) => sum + img.duration, 0)}s
              </span>
            </div>
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 hover:opacity-90 text-[#0B1020] shadow-[0_0_20px_rgba(168, 85, 247,0.3)] hover:shadow-[0_0_30px_rgba(168, 85, 247,0.5)] transition-all rounded-xl border border-purple-300/40"
          >
            Continue to Style Selection
          </Button>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-4 bg-[#1a1b2e]/40 backdrop-blur-md rounded-xl border border-[#3f4a67]/50 text-center shadow-md"
        >
          <p className="text-sm text-[#94a3b8] font-medium flex items-center justify-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-purple-400" /> <span className="font-bold text-purple-400">Tip:</span> Recommended duration is 2-5 seconds per image
          </p>
        </motion.div>
      </div>
    </div>
  );
}
