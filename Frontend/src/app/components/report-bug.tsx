import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Bug,
  UploadCloud,
  X,
  FileVideo,
  CheckCircle2,
  Mail,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ReportBugPage() {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    tool: '',
    description: '',
    steps: '',
    severity: 'Medium'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    "AI Video Generation",
    "Image to Video",
    "Reference Video Editing",
    "AI Manual Edit",
    "Downloads",
    "Uploads",
    "Profile",
    "Wallet",
    "Login",
    "Other"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const validFiles = newFiles.filter(file => validImageTypes.includes(file.type) && file.size <= 10 * 1024 * 1024);
    
    setFiles(prev => {
      const combined = [...prev, ...validFiles];
      return combined.slice(0, 5); // Max 5
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm']; // quicktime is .mov
      if (validVideoTypes.includes(file.type) && file.size <= 100 * 1024 * 1024) {
        setVideoFile(file);
      }
    }
  };

  const isValid = formData.title.trim() !== '' && 
                  formData.tool !== '' && 
                  formData.description.trim() !== '' && 
                  formData.steps.trim() !== '' &&
                  files.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      setIsSubmitted(true);
    }
  };

  const handleSupportEmail = () => {
    const subject = encodeURIComponent("VEYTRIX.AI Bug Report");
    const body = encodeURIComponent(`Hello VEYTRIX.AI Support Team,\n\nI would like to report the following issue:\n\nIssue:\n${formData.description || '________________________'}\n\nSteps to reproduce:\n${formData.steps || '________________________'}\n\nThank you.`);
    window.location.href = `mailto:official@mavrostech.in?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0914] text-white overflow-y-auto selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.svg')]" />
        <div className="absolute top-[10%] right-[-10%] w-[50vw] h-[50vh] bg-purple-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
        
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
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-purple-600/20 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] inline-flex shrink-0 w-fit">
              <Bug className="w-12 h-12 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Report a Bug</h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
                Found an issue? Help us improve VEYTRIX.AI by reporting bugs with detailed information. Our support team reviews every report and responds within 24 hours.
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid gap-8"
            >
              {/* BUG REPORT FORM */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                
                <div className="space-y-8">
                  
                  {/* Title & Tool */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Bug Title *</label>
                      <input 
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter a short title for the issue"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-300 mb-2">Affected Tool *</label>
                      <div className="relative">
                        <select
                          name="tool"
                          value={formData.tool}
                          onChange={handleInputChange}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
                        >
                          <option value="" disabled className="bg-[#0B0914] text-gray-400">Select a tool</option>
                          {tools.map(tool => (
                            <option key={tool} value={tool} className="bg-[#0B0914] text-white">{tool}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-gray-300">Bug Description *</label>
                      <span className="text-xs text-gray-500 font-mono">{formData.description.length} / 2000</span>
                    </div>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      maxLength={2000}
                      rows={6}
                      placeholder="Describe the issue in as much detail as possible.&#10;&#10;Please include:&#10;• What you were trying to do&#10;• What happened&#10;• What you expected to happen&#10;• Steps to reproduce the issue"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-y"
                    />
                  </div>

                  {/* Steps */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Steps to Reproduce *</label>
                    <textarea
                      name="steps"
                      value={formData.steps}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Example:&#10;1. Logged into account&#10;2. Opened Manual Edit&#10;3. Uploaded a video&#10;4. Clicked Generate&#10;5. Application crashed"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-y"
                    />
                  </div>

                  {/* Screenshots */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Upload Screenshots *</label>
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 bg-black/20 hover:bg-white/5 hover:border-purple-500/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                    >
                      <UploadCloud className="w-10 h-10 text-gray-500 group-hover:text-purple-400 transition-colors mb-4" />
                      <p className="font-bold text-white mb-1">Click or drag & drop</p>
                      <p className="text-sm text-gray-500 max-w-sm">
                        Supported formats: PNG, JPG, JPEG, WEBP. <br/> Max 5 screenshots (10MB each)
                      </p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        multiple 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileInput}
                      />
                    </div>
                    {/* Previews */}
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                            {/* In a real app we'd use URL.createObjectURL, but for mock we just show an icon if we don't read it */}
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt="Preview" 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                              className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Video Upload (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-gray-300">Optional Video Recording</label>
                      <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2 py-0.5 rounded-md">Optional</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-black/40 hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                      >
                        <FileVideo className="w-4 h-4 text-purple-400" />
                        {videoFile ? 'Change Video' : 'Select Video'}
                      </button>
                      {videoFile && (
                        <div className="flex items-center gap-3 text-sm bg-white/5 px-3 py-1.5 rounded-md border border-white/10">
                          <span className="text-gray-300 truncate max-w-[150px]">{videoFile.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setVideoFile(null)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={videoInputRef}
                        className="hidden" 
                        accept="video/mp4, video/quicktime, video/webm"
                        onChange={handleVideoInput}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Supported: MP4, MOV, WEBM. Maximum 100MB.</p>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">Severity</label>
                    <div className="flex flex-wrap gap-4">
                      {['Low', 'Medium', 'High', 'Critical'].map(level => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${formData.severity === level ? 'border-purple-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                            {formData.severity === level && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                          </div>
                          <span className={`${formData.severity === level ? 'text-white' : 'text-gray-400'} font-medium`}>{level}</span>
                          <input 
                            type="radio" 
                            name="severity" 
                            value={level} 
                            checked={formData.severity === level}
                            onChange={handleInputChange}
                            className="hidden" 
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="pt-6 border-t border-white/10">
                    <button
                      type="submit"
                      disabled={!isValid}
                      className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all transform ${
                        isValid 
                          ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:-translate-y-1 cursor-pointer' 
                          : 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Bug className="w-5 h-5" />
                      Submit Bug Report
                    </button>
                    {!isValid && (
                      <p className="text-center text-sm text-gray-500 mt-3">Please fill out all required fields (*) and upload at least one screenshot.</p>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-10 rounded-3xl bg-white/5 border border-white/10 shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
              <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6 relative z-10 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 relative z-10">Bug Report Submitted Successfully</h2>
              <p className="text-xl text-gray-300 max-w-lg mx-auto mb-2 relative z-10">Thank you for helping improve VEYTRIX.AI.</p>
              <p className="text-gray-400 max-w-lg mx-auto mb-8 relative z-10">Our engineering team will review your report and respond within 24 hours.</p>
              
              <button 
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ title: '', tool: '', description: '', steps: '', severity: 'Medium' });
                  setFiles([]);
                  setVideoFile(null);
                }}
                className="px-8 py-3 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 text-white font-medium transition-colors relative z-10"
              >
                Submit Another Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* INFO AND CONTACT */}
        {!isSubmitted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            {/* RESPONSE INFORMATION */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">What happens after you submit?</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Your bug report is securely submitted to our engineering team.",
                  "Each report is manually reviewed.",
                  "Screenshots and videos help us identify issues faster.",
                  "If additional information is required, we will contact you via your registered email address.",
                  "You can expect a response within 24 hours."
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <span className="text-gray-300 text-sm leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* EMAIL SUPPORT */}
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-purple-900/30 to-black/40 border border-purple-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Mail className="w-24 h-24" />
              </div>
              <div className="relative z-10 h-full flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-3">Need immediate assistance?</h3>
                <div className="text-gray-400 text-sm mb-6">
                  <span className="block mb-1">Email:</span>
                  <a href="mailto:official@mavrostech.in" className="text-purple-400 font-bold hover:text-purple-300 transition-colors text-base">official@mavrostech.in</a>
                </div>
                <button 
                  onClick={handleSupportEmail}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all transform hover:-translate-y-1 mt-auto"
                >
                  <Mail className="w-5 h-5" />
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
