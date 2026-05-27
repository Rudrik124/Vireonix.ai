import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
	Upload,
	X,
	FileVideo,
	Video,
	Sparkles,
	ArrowLeft,
	Play,
	Zap,
	Clock,
	Gauge,
	MonitorPlay,
	CheckCircle2,
	ChevronRight,
	LogOut,
	User,
	ChevronDown,
	Image as ImageIcon,
	Menu
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../context/auth-context";
import { SuccessToast } from "../components/success-toast";
import { BrandLogo } from "../components/brand-logo";
import { generateVideo } from "../../api/generatevideo";
import { usePortalTestingContext } from "../../shared/portal/testing-context";

const durations = [
	{ value: 1, label: "1 min" },
	{ value: 2, label: "2 min" },
	{ value: 5, label: "5 min" },
];

const particles = Array.from({ length: 40 });


export function HomePage() {
	const navigate = useNavigate();
	const { isLoggedIn, logout, session } = useAuth();
	const { usageContext } = usePortalTestingContext();
	const [prompt, setPrompt] = useState("");
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [referenceVideo, setReferenceVideo] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isRefDragging, setIsRefDragging] = useState(false);
	const [selectedDuration, setSelectedDuration] = useState(2);
	const [uploading, setUploading] = useState(false);
	const [showLoginSuccess, setShowLoginSuccess] = useState(false);
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

	const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

	useEffect(() => {
		// Check if user just logged in
		const loginFlag = localStorage.getItem("justLoggedIn");
		if (loginFlag && isLoggedIn) {
			setShowLoginSuccess(true);
			localStorage.removeItem("justLoggedIn");
		}
	}, [isLoggedIn]);

	const handleLogout = async () => {
		await logout();
		setIsUserMenuOpen(false);
		navigate("/", { replace: true });
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>, isReference = false) => {
		e.preventDefault();
		if (isReference) {
			setIsRefDragging(true);
		} else {
			setIsDragging(true);
		}
	};

	const handleDragLeave = (isReference = false) => {
		if (isReference) {
			setIsRefDragging(false);
		} else {
			setIsDragging(false);
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>, isReference = false) => {
		e.preventDefault();
		if (isReference) {
			setIsRefDragging(false);
			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0) {
				setReferenceVideo(files[0] as File);
			}
		} else {
			setIsDragging(false);
			const files = Array.from(e.dataTransfer.files);
			setUploadedFiles((prev) => [...prev, ...files]);
		}
	};

	const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const files = Array.from(e.target.files);
			setUploadedFiles((prev) => [...prev, ...files]);
		}
	};

	const handleReferenceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setReferenceVideo(e.target.files[0]);
		}
	};

	const handleGenerate = async () => {
		if (!prompt.trim() || uploadedFiles.length === 0) {
			alert("Please provide a prompt and at least one media file.");
			return;
		}

		setUploading(true);

		try {
			const requestPayload = {
				prompt: prompt.trim(),
				duration: selectedDuration * 60,
				frame: "16:9",
				usageContext,
			};

			const data = await generateVideo(requestPayload);

			console.log("Backend response:", data);

			if (!data.success) {
				alert(data.error || "Video generation failed");
				return;
			}

			localStorage.setItem("generatedVideo", data.video);
			navigate("/result");
		} catch (err) {
			console.error(err);
			alert("Error generating video");
		} finally {
			setUploading(false);
		}
	};

	return (
		<>
			<motion.div
				className="min-h-screen relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-white pb-20 flex flex-col"
				animate={{
					background: [
						'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
						'linear-gradient(135deg, #1a1b2e 0%, #2d3142 30%, #3f4a67 60%, #0b0d1f 85%, #2d3142 100%)',
						'linear-gradient(135deg, #0b0d1f 0%, #1a1b2e 30%, #2d3142 60%, #3f4a67 85%, #1a1b2e 100%)',
					]
				}}
				transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
				style={{ backgroundAttachment: 'fixed' }}
			>
			{/* Focal Radial Glow (Behind Title) */}
			<div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

			{/* Floating Particles */}
			<div className="fixed inset-0 pointer-events-none z-0">
				{particles.map((_, i) => (
					<motion.div
						key={i}
						initial={{
							opacity: Math.random() * 0.4,
							x: Math.random() * 100 + "%",
							y: Math.random() * 100 + "%",
							scale: Math.random() * 0.5 + 0.5
						}}
						animate={{
							y: [null, (Math.random() * -100 - 50) + "px"],
							opacity: [null, Math.random() * 0.3, 0]
						}}
						transition={{
							duration: Math.random() * 10 + 10,
							repeat: Infinity,
							ease: "linear",
							delay: Math.random() * 20
						}}
						className="absolute w-1 h-1 bg-cyan-400/40 rounded-full blur-[1px]"
					/>
				))}
			</div>

			{/* Corner Vignettes */}
			<div
				className="fixed inset-0 pointer-events-none z-10"
				style={{ boxShadow: 'inset 0 0 500px rgba(11,13,31,0.95)' }}
			/>

			<div className="relative z-10 container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
				{/* Top Header with Logo */}
				<div className="flex justify-between items-center mb-12">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						className="flex items-center gap-2 group cursor-pointer"
						onClick={() => window.location.reload()}
					>
						<div className="relative">
							{/* Theme Background Glow */}
							<div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
							
							<BrandLogo size={56} className="relative z-10" />
						</div>
						<span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:text-cyan-400/80 transition-colors">
							VIREONIX<span className="text-cyan-400">.AI</span>
						</span>
					</motion.div>

					<div className="flex items-center gap-6">
						<button 
							className="md:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white"
							onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
						>
							<Menu className="w-6 h-6" />
						</button>
						<div className="hidden md:flex items-center gap-6">
							{isLoggedIn ? (
								<div className="relative">
									<motion.button
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
										className="flex items-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 transition-all text-white group shadow-xl"
									>
										<div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
											<User className="w-4 h-4 text-[#0b0d1f]" />
										</div>
										<span className="text-sm font-bold tracking-tight">{userName}</span>
										<ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
									</motion.button>
								</div>
							) : (
								<button className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">Documentation</button>
							)}
						</div>
						
						<AnimatePresence>
							{isUserMenuOpen && (
								<motion.div
									initial={{ opacity: 0, y: 10, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 10, scale: 0.95 }}
									className="absolute right-4 top-24 md:right-auto md:top-auto md:mt-3 w-48 bg-[#0b0d1f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
								>
									<div className="p-2">
										{!isLoggedIn && (
											<button className="w-full md:hidden flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all text-sm font-bold tracking-widest">
												<span>Documentation</span>
											</button>
										)}
										{isLoggedIn && (
											<button 
												onClick={() => {
													void handleLogout();
												}}
												className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold uppercase tracking-widest group"
											>
												<LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
												<span>Logout</span>
											</button>
										)}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* Back Button */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.25 }}
					className="mb-8"
				>
					<button
						onClick={() => navigate("/features")}
						className="inline-flex items-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors group"
					>
						<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
						<span className="text-sm">Back to selection</span>
					</button>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="text-center mb-12"
				>
					<div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 mb-6">
						<Sparkles className="w-4 h-4 text-cyan-400" />
						<span className="text-sm text-gray-400">Powered by AI Video Engine v2.0</span>
					</div>

					<h1 className="text-[clamp(2.5rem,8vw,4.5rem)] leading-tight font-black mb-6 bg-gradient-to-r from-white via-cyan-100 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(34,211,238,0.2)]">
						AI Video Editor
					</h1>

					<p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
						Refine your vision with professional AI-powered editing tools. Upload multiple clips and let our engine handle the magic.
					</p>


				</motion.div>

				{/* Main Content Card */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, delay: 0.1 }}
					className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 p-6 md:p-10"
				>
					{/* Prompt Input */}
					<div className="mb-10">
						<label className="block text-sm font-semibold mb-4 text-gray-300">
							Describe your cinematic vision
						</label>
						<Textarea
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="e.g. A fast-paced cinematic trailer with glitch transitions and color grading focused on cold blue tones..."
							className="min-h-[150px] text-lg resize-none rounded-2xl border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/30 bg-white/5 text-white placeholder:text-gray-600"
						/>
					</div>

					{/* Upload Area */}
					<div className="mb-10">
						<label className="block text-sm font-semibold mb-4 text-gray-300">
							Upload source media
						</label>
						<div
							onDragOver={(e) => handleDragOver(e, false)}
							onDragLeave={() => handleDragLeave(false)}
							onDrop={(e) => handleDrop(e, false)}
							className={`relative border-2 border-dashed rounded-2xl p-10 md:p-16 text-center transition-all duration-300 ${isDragging
								? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.2)]"
								: "border-white/10 hover:border-white/20 bg-white/5"
								}`}
						>
							<input
								type="file"
								multiple
								accept="video/*,image/*"
								onChange={handleFileInput}
								className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							/>
							<div className="flex flex-col items-center gap-6">
								<div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
									<Upload className="w-10 h-10 text-[#0b0d1f]" />
								</div>
								<div>
									<p className="text-lg mb-1">
										<span className="font-bold text-cyan-400">Click to upload</span> or drag and drop
									</p>
									<p className="text-sm text-gray-500">Supports MP4, MOV, JPG, PNG (Max 500MB)</p>
								</div>
							</div>
						</div>

						{/* Uploaded Files List */}
						<AnimatePresence>
							{uploadedFiles.length > 0 && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
								>
									{uploadedFiles.map((file, index) => (
										<motion.div
											key={`${file.name}-${index}`}
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
										>
											<div className="flex items-center gap-3">
												{file.type.startsWith("video") ? (
													<Video className="w-5 h-5 text-cyan-400" />
												) : (
													<ImageIcon className="w-5 h-5 text-teal-400" />
												)}
												<span className="text-sm font-medium truncate max-w-[150px]">{file.name}</span>
											</div>
											<button
												onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
												className="p-1 hover:bg-red-500/20 rounded-md text-gray-500 hover:text-red-400 transition-all"
											>
												<X className="w-4 h-4" />
											</button>
										</motion.div>
									))}
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					{/* Duration Selection */}
					<div className="mb-10">
						<label className="block text-sm font-semibold mb-4 text-gray-300 text-center">
							Final output duration
						</label>
						<div className="flex flex-wrap items-center justify-center gap-4">
							{durations.map((duration) => (
								<button
									key={duration.value}
									onClick={() => setSelectedDuration(duration.value)}
									className={`flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all duration-300 ${selectedDuration === duration.value
										? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
										: "border-white/10 hover:border-white/20 bg-white/5 text-gray-400"
										}`}
								>
									<Clock className={`w-5 h-5 ${selectedDuration === duration.value ? "text-cyan-400" : "text-gray-500"}`} />
									<span className="font-bold">{duration.label}</span>
								</button>
							))}
						</div>
					</div>

					{/* Generate Button */}
					<Button
						onClick={handleGenerate}
						disabled={!prompt.trim() || uploadedFiles.length === 0 || uploading}
						className="w-full h-16 text-xl font-bold bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-400 text-[#0b0d1f] hover:opacity-95 transition-all shadow-[0_10px_40px_rgba(34,211,238,0.3)] disabled:opacity-30 rounded-2xl relative overflow-hidden group"
					>
						{uploading ? (
							<div className="flex items-center gap-3">
								<div className="w-6 h-6 border-4 border-[#0b0d1f] border-t-transparent rounded-full animate-spin" />
								Processing Media...
							</div>
						) : (
							<div className="flex items-center gap-3">
								<Sparkles className="w-6 h-6" />
								Generate AI Video
							</div>
						)}
						<div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
					</Button>
				</motion.div>


			</div>
		</motion.div>
		<AnimatePresence>
			{showLoginSuccess && (
				<SuccessToast
					message="Login successful! Welcome back!"
					onDismiss={() => setShowLoginSuccess(false)}
				/>
			)}
		</AnimatePresence>
		</>
	);
}
