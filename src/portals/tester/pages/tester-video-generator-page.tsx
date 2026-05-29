import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Play, Loader, Star, AlertCircle, RefreshCw } from "lucide-react";

interface VideoTest {
  id: string;
  prompt: string;
  style: string;
  duration: number;
  resolution: string;
  seed: string;
  status: "pending" | "generating" | "completed" | "failed";
  rating?: number;
  feedback?: string;
  generationTime?: number;
  timestamp: string;
}

export function TesterVideoGeneratorPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [duration, setDuration] = useState(10);
  const [resolution, setResolution] = useState("1080p");
  const [seed, setSeed] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const [videoTests, setVideoTests] = useState<VideoTest[]>([
    {
      id: "VID-001",
      prompt: "A cat playing with a red ball in a sunny garden",
      style: "realistic",
      duration: 15,
      resolution: "1080p",
      seed: "12345",
      status: "completed",
      rating: 5,
      feedback: "High quality, smooth animations",
      generationTime: 45,
      timestamp: "2026-05-28 10:15",
    },
    {
      id: "VID-002",
      prompt: "Futuristic city with flying cars at night",
      style: "cinematic",
      duration: 30,
      resolution: "1080p",
      seed: "67890",
      status: "completed",
      rating: 4,
      feedback: "Good but some motion artifacts",
      generationTime: 85,
      timestamp: "2026-05-28 09:30",
    },
    {
      id: "VID-003",
      prompt: "Ocean waves crashing on a beach at sunset",
      style: "artistic",
      duration: 10,
      resolution: "720p",
      seed: "11111",
      status: "completed",
      rating: 3,
      feedback: "Colors slightly off, needs adjustment",
      generationTime: 28,
      timestamp: "2026-05-28 08:45",
    },
  ]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    setIsGenerating(true);

    const newTest: VideoTest = {
      id: `VID-${String(videoTests.length + 1).padStart(3, "0")}`,
      prompt,
      style,
      duration,
      resolution,
      seed: seed || "auto",
      status: "generating",
      timestamp: new Date().toLocaleString(),
    };

    setVideoTests([newTest, ...videoTests]);

    // Simulate generation
    setTimeout(() => {
      setVideoTests((prev) =>
        prev.map((v) =>
          v.id === newTest.id
            ? {
                ...v,
                status: "completed",
                generationTime: Math.floor(Math.random() * 60) + 20,
              }
            : v
        )
      );
      setIsGenerating(false);
      setPrompt("");
      setSeed("");
    }, 3000);
  };

  const handleRateVideo = (videoId: string, rating: number, feedback: string) => {
    setVideoTests(
      videoTests.map((v) =>
        v.id === videoId
          ? {
              ...v,
              rating,
              feedback,
            }
          : v
      )
    );
  };

  const handleReportRegression = (video: VideoTest) => {
    navigate("/tester/bug-reports", {
      state: {
        prefilled: {
          title: `Video Regression: ${video.prompt.substring(0, 50)}...`,
          description: `Regression detected in video generation:\n\nPrompt: ${video.prompt}\nStyle: ${video.style}\nResolution: ${video.resolution}\nGeneration ID: ${video.id}`,
          component: "video-generator",
          severity: "high",
        },
      },
    });
  };

  const averageRating =
    videoTests.filter((v) => v.rating).reduce((sum, v) => sum + (v.rating || 0), 0) /
    videoTests.filter((v) => v.rating).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Video Generator Testing</h1>
            <p className="text-purple-200">Test Veytrix video generation with full parameter control</p>
          </div>
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-purple-700 p-6 rounded-lg sticky top-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Generate Video</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-white font-semibold block mb-2">Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the video you want to generate..."
                    className="w-full px-4 py-2 rounded text-white bg-purple-600 placeholder-purple-300 h-24 resize-none"
                  />
                  <p className="text-purple-300 text-xs mt-1">{prompt.length}/500 characters</p>
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full px-4 py-2 rounded text-white bg-purple-600"
                  >
                    <option value="realistic">Realistic</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="artistic">Artistic</option>
                    <option value="anime">Anime</option>
                    <option value="3d">3D</option>
                  </select>
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">
                    Duration: {duration}s
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-2 rounded text-white bg-purple-600"
                  >
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="2k">2K</option>
                    <option value="4k">4K (Beta)</option>
                  </select>
                </div>

                <div>
                  <label className="text-white font-semibold block mb-2">Seed (Optional)</label>
                  <input
                    type="text"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Leave blank for random"
                    className="w-full px-4 py-2 rounded text-white bg-purple-600 placeholder-purple-300"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded transition font-semibold flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Generate Video
                    </>
                  )}
                </button>

                {/* Stats */}
                <div className="bg-purple-600 p-4 rounded mt-6">
                  <p className="text-purple-200 text-sm mb-2">Avg Rating</p>
                  <p className="text-white text-2xl font-bold">
                    {averageRating > 0 ? averageRating.toFixed(1) : "N/A"}
                  </p>
                  <p className="text-purple-300 text-xs mt-2">
                    {videoTests.filter((v) => v.rating).length} rated videos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History Panel */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-white mb-4">Generation History</h2>

            <div className="space-y-4">
              {videoTests.map((video) => (
                <div key={video.id} className="bg-purple-700 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-purple-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-400 font-mono text-xs">{video.id}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              video.status === "completed"
                                ? "bg-green-600 text-white"
                                : video.status === "generating"
                                ? "bg-blue-600 text-white"
                                : video.status === "failed"
                                ? "bg-red-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {video.status === "generating" && (
                              <Loader className="w-3 h-3 animate-spin inline mr-1" />
                            )}
                            {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-white font-semibold">{video.prompt}</p>
                      </div>
                      <span className="text-purple-300 text-xs">{video.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs text-purple-200 mt-3">
                      <div>
                        <span className="text-purple-400">Style:</span> {video.style}
                      </div>
                      <div>
                        <span className="text-purple-400">Duration:</span> {video.duration}s
                      </div>
                      <div>
                        <span className="text-purple-400">Resolution:</span> {video.resolution}
                      </div>
                      <div>
                        <span className="text-purple-400">Seed:</span> {video.seed}
                      </div>
                    </div>

                    {video.generationTime && (
                      <p className="text-purple-300 text-xs mt-2">
                        ⏱ Generated in {video.generationTime} seconds
                      </p>
                    )}
                  </div>

                  {/* Rating Section */}
                  {video.status === "completed" && (
                    <div className="p-4 bg-purple-600 space-y-3">
                      <div>
                        <p className="text-white font-semibold mb-2">Quality Rating</p>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRateVideo(video.id, star, video.feedback || "")}
                              className={`transition ${
                                (video.rating || 0) >= star
                                  ? "text-yellow-400"
                                  : "text-gray-400 hover:text-yellow-300"
                              }`}
                            >
                              <Star className="w-6 h-6 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {video.feedback && (
                        <div className="text-purple-200 text-sm bg-purple-500 p-2 rounded">
                          <span className="font-semibold">Feedback:</span> {video.feedback}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition">
                          Edit Feedback
                        </button>
                        <button
                          onClick={() => handleReportRegression(video)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded transition flex items-center gap-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Report Regression
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
