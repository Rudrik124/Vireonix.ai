import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: "What is VEYTRIX.AI?", a: "VEYTRIX.AI is an AI-powered cinematic video creation platform that enables creators, marketers, agencies, and businesses to generate professional-quality videos using advanced artificial intelligence." },
    { q: "Which AI tools are currently available?", a: "VEYTRIX.AI currently offers:\n• Quick AI Edit\n\nEach tool is optimized for professional creative workflows." },
    { q: "Do I need editing experience?", a: "No.\n\nVEYTRIX.AI is built for everyone. Beginners can generate videos with simple prompts, while professionals can access advanced editing controls for precise creative output." },
    { q: "How does the credit system work?", a: "Every AI generation or editing operation consumes credits depending on rendering complexity and duration.\n\nCredits are included with subscription plans, and additional credit packs can be purchased anytime." },
    { q: "Can I use generated videos commercially?", a: "Yes.\n\nVideos created using VEYTRIX.AI may be used for commercial purposes according to your active subscription plan and licensing terms." },
    { q: "What export quality is supported?", a: "Depending on your subscription plan, exports are available in:\n• HD\n• Full HD\n• 4K\n\nwith optimized AI rendering." },
    { q: "How long does generation take?", a: "Most projects are completed within 30 seconds to 3 minutes depending on complexity, duration, and server load." },
    { q: "Is my uploaded content secure?", a: "Yes.\n\nAll uploaded files and generated projects are processed securely using encrypted cloud infrastructure and protected storage systems." },
    { q: "Which devices are supported?", a: "VEYTRIX.AI works directly inside modern web browsers on Windows, macOS, Linux, and tablets without requiring installation." },
    { q: "Will more AI tools be added?", a: "Absolutely.\n\nVEYTRIX.AI is continuously evolving with new AI models, cinematic effects, editing capabilities, and creative workflows to provide a world-class AI video production platform." }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="rounded-2xl border border-white/5 bg-[#1A1528]/60 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-[0_10px_30px_rgba(168,85,247,0.15)] group">
          <button
            className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="font-bold text-lg text-white group-hover:text-fuchsia-300 transition-colors">{faq.q}</span>
            <ChevronDown className={`w-5 h-5 text-fuchsia-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="px-6 pb-6 pt-2 text-gray-300 text-[15px] leading-relaxed whitespace-pre-wrap opacity-90 border-t border-white/5">
                  {faq.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
