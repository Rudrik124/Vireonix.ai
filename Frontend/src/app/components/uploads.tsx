import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Play, Info, Video, Image as ImageIcon, CheckCircle2,
  Search, HardDrive, UploadCloud
} from "lucide-react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../context/auth-context";

interface UploadItem {
  id: string;
  originalFilename: string;
  uploadType: "Video" | "Image";
  size: string;
  resolution: string;
  duration?: string; // Optional for images
  uploadDate: string;
  toolUsed: string;
  status: "Active" | "Archived";
  usedInProject: string;
  thumbnail: string;
}

const FILTERS = ["All", "Images", "Videos"];

export function UploadsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (!session?.user?.id) return;

    const fetchUploads = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('app_uploads')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          const formattedData = data.map((item: any) => ({
            id: item.id,
            originalFilename: item.original_filename,
            uploadType: item.upload_type,
            size: item.size || "15 MB",
            resolution: item.resolution || "1080p",
            duration: item.duration,
            uploadDate: new Date(item.created_at).toLocaleString(),
            toolUsed: item.tool_used,
            status: item.status || "Active",
            usedInProject: item.used_in_project || "Unassigned",
            thumbnail: item.thumbnail_url || (item.upload_type === "Video" ? "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800" : "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800"),
          }));
          setUploads(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch uploads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();

    const channel = supabase
      .channel('public:app_uploads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_uploads', filter: `user_id=eq.${session.user.id}` },
        (payload: any) => {
          const item = payload.new;
          const newItem: UploadItem = {
            id: item.id,
            originalFilename: item.original_filename,
            uploadType: item.upload_type,
            size: item.size || "15 MB",
            resolution: item.resolution || "1080p",
            duration: item.duration,
            uploadDate: new Date(item.created_at).toLocaleString(),
            toolUsed: item.tool_used,
            status: item.status || "Active",
            usedInProject: item.used_in_project || "Unassigned",
            thumbnail: item.thumbnail_url || (item.upload_type === "Video" ? "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800" : "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800"),
          };
          setUploads((prev) => [newItem, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'app_uploads', filter: `user_id=eq.${session.user.id}` },
        (payload: any) => {
          setUploads((prev) => prev.filter(item => item.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const filteredUploads = uploads.filter(item => {
    const matchesSearch = 
      item.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.usedInProject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.toolUsed.toLowerCase().includes(searchQuery.toLowerCase());
      
    let matchesFilter = true;
    if (activeFilter === "Images") matchesFilter = item.uploadType === "Image";
    if (activeFilter === "Videos") matchesFilter = item.uploadType === "Video";
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#0B0914] text-white selection:bg-purple-500/30 font-sans overflow-hidden flex flex-col relative">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl px-6 py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">My Uploads</h1>
            <p className="text-xs text-gray-400">All the source media you've uploaded for editing.</p>
          </div>
        </div>

        {/* Storage Info */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 min-w-[200px]">
          <HardDrive className="w-5 h-5 text-purple-400" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
              <span>Storage Used</span>
              <span className="text-white">{uploads.length > 0 ? `${(uploads.length * 12.4).toFixed(1)} MB` : "0 MB"} / 50 GB</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: uploads.length > 0 ? `${Math.min((uploads.length * 12.4) / 500, 100)}%` : '0%' }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                    activeFilter === filter 
                      ? 'bg-purple-600/20 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search uploads..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Grid */}
          {filteredUploads.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-32"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                <UploadCloud className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Uploads Found</h2>
              <p className="text-gray-400 max-w-sm">
                Your uploaded media will automatically appear here once you start using VEYTRIX.AI tools.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredUploads.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden hover:bg-white/[0.04] hover:border-purple-500/30 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square sm:aspect-video w-full overflow-hidden bg-black/40">
                    <img src={item.thumbnail} alt={item.originalFilename} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold border border-white/10 text-white flex items-center gap-1">
                      {item.uploadType === "Video" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {item.uploadType}
                    </div>
                    {item.duration && (
                      <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold border border-white/10 text-white flex items-center gap-1">
                        {item.duration}
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-md backdrop-blur-md text-[10px] font-bold border flex items-center gap-1 ${
                      item.status === 'Active' 
                        ? 'bg-green-500/20 border-green-500/30 text-green-400'
                        : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-sm mb-1 truncate text-white" title={item.originalFilename}>{item.originalFilename}</h3>
                    <p className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider mb-3">Project: {item.usedInProject}</p>
                    
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-y-2 text-[10px] text-gray-500 font-medium mb-4 p-3 rounded-xl bg-black/20 border border-white/5 flex-1">
                      <div className="flex flex-col">
                        <span className="text-gray-600">Size</span>
                        <span className="text-gray-300">{item.size}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600">Resolution</span>
                        <span className="text-gray-300">{item.resolution}</span>
                      </div>
                      <div className="flex flex-col col-span-2">
                        <span className="text-gray-600">Tool Used</span>
                        <span className="text-gray-300">{item.toolUsed}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-gray-600 mb-4 text-center">
                      Uploaded: {new Date(item.uploadDate).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                        <Play className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                        <Info className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
