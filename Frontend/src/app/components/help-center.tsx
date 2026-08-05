import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  HelpCircle,
  Wand2,
  ChevronDown,
  Mail,
  Lightbulb
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HelpCenterPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const quickHelpCards = [
    {
      icon: <Wand2 className="w-8 h-8 text-pink-400" />,
      title: "Quick AI Edit",
      description: "Professionally edit videos using effects, transitions, filters, and AI-powered tools.",
    }
  ];

  const steps = [
    {
      step: 1,
      title: "Create an Account",
      content: (
        <ul className="list-disc pl-5 space-y-2 text-gray-300">
          <li>Sign up or log in.</li>
          <li>Verify your email.</li>
          <li>Complete your profile.</li>
          <li>Choose your subscription plan if needed.</li>
        </ul>
      )
    },
    {
      step: 2,
      title: "Choose Your AI Tool",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">Explain the available tool:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="font-bold text-white mb-1">Quick AI Edit</h4>
              <p className="text-sm text-gray-400">Edit existing videos using professional editing tools.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 3,
      title: "Write Better Prompts",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">Tips for crafting the perfect prompt:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Describe your scene clearly.</li>
            <li>Mention camera movement.</li>
            <li>Mention lighting.</li>
            <li>Mention environment.</li>
            <li>Mention subject.</li>
            <li>Mention visual style.</li>
            <li>Mention mood.</li>
            <li>Mention color grading.</li>
          </ul>
          <div className="bg-black/30 p-4 rounded-xl border border-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-fuchsia-500" />
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Example Prompt:</h4>
            <p className="text-gray-200 italic font-medium">"A cinematic drone shot flying over snowy mountains during sunrise with volumetric lighting, realistic clouds, smooth camera movement, ultra detailed, 4K."</p>
          </div>
        </div>
      )
    },
    {
      step: 4,
      title: "Select Video Settings",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">Configure your output preferences:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="font-bold text-white mb-2 text-sm">Aspect Ratio</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li><strong className="text-gray-200">16:9</strong> for YouTube</li>
                <li><strong className="text-gray-200">9:16</strong> for Shorts & Reels</li>
                <li><strong className="text-gray-200">1:1</strong> for Social Posts</li>
                <li><strong className="text-gray-200">Custom</strong> Ratio available</li>
              </ul>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-center">
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> <strong>Duration</strong> - Select length</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> <strong>Resolution</strong> - Up to 4K</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> <strong>AI Style</strong> - Cinematic, Anime, etc.</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      step: 5,
      title: "Generate Your Video",
      content: (
        <div className="space-y-3 text-gray-300 bg-white/5 p-5 rounded-xl border border-white/10">
          <p>Click <strong className="text-white">Generate Video</strong>.</p>
          <p>The AI will process your request.</p>
          <p>Progress appears automatically.</p>
          <p>Finished videos are stored inside <strong className="text-purple-400">Downloads</strong>.</p>
        </div>
      )
    },
    {
      step: 6,
      title: "Manage Your Files",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="font-bold text-white mb-1">Downloads</h4>
            <p className="text-sm text-gray-400">Contains every generated video.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="font-bold text-white mb-1">Uploads</h4>
            <p className="text-sm text-gray-400">Contains every image/video uploaded for editing.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="font-bold text-white mb-1">History</h4>
            <p className="text-sm text-gray-400">Shows all previous generations and edits.</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <h4 className="font-bold text-white mb-1">Projects</h4>
            <p className="text-sm text-gray-400">Displays active and completed work.</p>
          </div>
        </div>
      )
    }
  ];

  const faqs = [
    { q: "How long does AI generation take?", a: "Generation typically takes 1-3 minutes depending on the resolution and duration of your video." },
    { q: "Why is my generation taking longer?", a: "High traffic or highly complex prompts at 4K resolution can sometimes increase processing time up to 5-10 minutes." },
    { q: "Which formats are supported?", a: "We support MP4, MOV, and WebM for video uploads, and JPG, PNG, and WebP for image uploads. Exports are in MP4 format." },
    { q: "Can I generate 4K videos?", a: "Yes, Pro users have access to 4K resolution generation and upscaling." },
    { q: "Can I edit videos using AI?", a: "Absolutely! You can load any video into the Quick AI Edit tool for professional refinement." },
    { q: "Where can I find my exported videos?", a: "All successfully generated and exported videos are automatically saved in the Downloads page." },
    { q: "How do credits work?", a: "Each generation consumes credits based on the complexity and length. Pro plans include a monthly refill of credits." },
    { q: "Can I delete my uploaded files?", a: "Yes, you can manage and delete your files from the Uploads and Downloads pages at any time." },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSupportEmail = () => {
    const subject = encodeURIComponent("VEYTRIX.AI Support Request");
    const body = encodeURIComponent("Hello VEYTRIX.AI Support Team,\n\nI need assistance regarding:\n\n________________________________\n\nThank you.");
    window.location.href = `mailto:official@mavrostech.in?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-[#0B0914] text-white overflow-y-auto selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.svg')]" />
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vh] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50vw] h-[50vh] bg-fuchsia-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20">
        
        {/* PAGE HEADER */}
        <div className="mb-16">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
              <HelpCircle className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Help Center</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
            Everything you need to get started with VEYTRIX.AI. Learn how to create, edit, export, and manage your AI videos with ease.
          </p>
        </div>

        {/* QUICK HELP CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {quickHelpCards.map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.07] transition-all cursor-pointer shadow-lg relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-4 bg-black/20 w-14 h-14 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{card.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>

        {/* STEP-BY-STEP GUIDE */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
            Step-by-Step Guide
            <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent flex-1 ml-4" />
          </h2>
          
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#0B0914] bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shrink-0 z-10">
                  {step.step}
                </div>
                {/* Content */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">STEP {step.step}: {step.title}</h3>
                  </div>
                  {step.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          {/* FAQ */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <button 
                    onClick={() => toggleFaq(i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-bold pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-5 pt-1 text-gray-400 border-t border-white/5">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* PRO TIPS & SUPPORT */}
          <div className="space-y-8">
            {/* TIPS SECTION */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-black/40 border border-purple-500/20 relative overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.1)]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lightbulb className="w-24 h-24" />
              </div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Pro Tips</h3>
              </div>
              <ul className="space-y-3 relative z-10">
                {[
                  "Write descriptive prompts.",
                  "Use high-quality images.",
                  "Select the correct aspect ratio.",
                  "Keep prompts concise but detailed.",
                  "Save successful prompts.",
                  "Preview before exporting."
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 shrink-0" />
                    <span className="text-gray-300 text-sm leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NEED MORE HELP? */}
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Still Need Help?</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Our support team is happy to assist you with technical issues, billing questions, feature requests, and general inquiries.
              </p>
              <button 
                onClick={handleSupportEmail}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all transform hover:-translate-y-1 relative z-10"
              >
                <Mail className="w-5 h-5" />
                Email Support
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
          <div>
            <h4 className="text-gray-400 mb-1">Need a faster response?</h4>
            <a href="mailto:official@mavrostech.in" className="text-purple-400 font-bold hover:text-purple-300 transition-colors">official@mavrostech.in</a>
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-gray-400 mb-1">Response Time</h4>
            <span className="text-white font-bold">Usually within 24 hours.</span>
          </div>
          <div className="text-center md:text-right">
            <h4 className="text-gray-400 mb-1">Support Hours</h4>
            <div className="text-white font-bold">Monday – Saturday</div>
            <div className="text-gray-300">9:00 AM – 7:00 PM IST</div>
          </div>
        </div>

      </div>
    </div>
  );
}
