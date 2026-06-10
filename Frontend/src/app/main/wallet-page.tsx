import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Play,
  Video,
  Image as ImageIcon,
  Wand2,
  Bell,
  User,
  ChevronDown,
  ArrowLeft,
  Activity,
  Gift,
  Users,
  Award,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  History,
  X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { BrandLogo } from "../components/brand-logo";
import { useAuth } from "../context/auth-context";

// Helper for animating numbers
const AnimatedCounter = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
};

export function WalletPage() {
  const navigate = useNavigate();
  const { isLoggedIn, session, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  const totalCredits = 1250;
  const creditsUsed = 1245;
  const creditsPurchased = 2000;
  const creditsRemaining = creditsPurchased - creditsUsed;
  const isLowCredits = totalCredits < 100;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const usageCards = [
    { title: "AI Video", cost: "25 Credits", action: "Generate", icon: <Video className="w-6 h-6 text-fuchsia-400" />, color: "from-fuchsia-500/20 to-pink-500/20", borderColor: "hover:border-fuchsia-500/50" },
    { title: "Reference Edit", cost: "18 Credits", action: "Generate", icon: <Wand2 className="w-6 h-6 text-purple-400" />, color: "from-purple-500/20 to-indigo-500/20", borderColor: "hover:border-purple-500/50" },
    { title: "Image to Video", cost: "15 Credits", action: "Generate", icon: <ImageIcon className="w-6 h-6 text-blue-400" />, color: "from-blue-500/20 to-cyan-500/20", borderColor: "hover:border-blue-500/50" },
    { title: "AI Manual Edit", cost: "8 Credits / Minute", action: "Edit", icon: <Activity className="w-6 h-6 text-emerald-400" />, color: "from-emerald-500/20 to-teal-500/20", borderColor: "hover:border-emerald-500/50" }
  ];

  const pricingCards = [
    { title: "Starter", credits: "100 Credits", price: "₹99", bonus: "+10 Bonus Credits", highlight: false },
    { title: "Creator", credits: "500 Credits", price: "₹399", bonus: "+75 Bonus Credits", highlight: true, badge: "⭐ Best Value" },
    { title: "Pro", credits: "1000 Credits", price: "₹699", bonus: "+200 Bonus Credits", highlight: false }
  ];

  const transactions = [
    { title: "AI Video Generation", amount: "-25 Credits", date: "Today, 09:42 AM", type: "usage" },
    { title: "Image to Video", amount: "-15 Credits", date: "Today, 08:18 AM", type: "usage" },
    { title: "Credits Purchased", amount: "+500 Credits", date: "Yesterday, 14:30 PM", type: "purchase", bonus: "+75 Bonus Credits" }
  ];

  const particles = Array.from({ length: 30 });

  return (
    <div className="min-h-screen relative overflow-hidden font-sans bg-[#0A0A0A] text-white selection:bg-fuchsia-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen" />
        
        {particles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: Math.random() * 0.5, x: Math.random() * 100 + "vw", y: Math.random() * 100 + "vh", scale: Math.random() * 0.5 + 0.5 }}
            animate={{ y: [null, "-20vh"], opacity: [null, Math.random() * 0.4, 0] }}
            transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-1 h-1 bg-fuchsia-400/40 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 w-full py-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}
          >
            <BrandLogo size={40} />
            <span className="text-xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              VEYTRIX<span className="text-fuchsia-400">.AI</span> <span className="ml-2 px-2 py-0.5 rounded border border-white/10 text-xs text-gray-400 font-semibold bg-white/5">Credits</span>
            </span>
          </motion.div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.15)]">
              <Zap className="w-4 h-4 text-fuchsia-400" />
              <span className="text-sm font-bold text-white"><AnimatedCounter value={totalCredits} /></span>
            </div>
            
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute 0 top-0 right-0 w-2 h-2 bg-fuchsia-500 rounded-full border border-[#0A0A0A]"></span>
            </button>

            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-sm font-bold transition-colors">
                  <User className="w-4 h-4" />
                  {userName}
                  <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute right-0 top-full mt-2 w-36 bg-[#130E24] border border-white/10 rounded-xl shadow-xl z-[100] p-1">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors">
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button onClick={() => navigate("/login")} className="bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full px-6">Login</Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Low Credit Warning */}
        <AnimatePresence>
          {isLowCredits && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-between shadow-[0_0_30px_rgba(249,115,22,0.15)] animate-pulse"
            >
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                <div>
                  <h4 className="font-bold text-orange-400">⚠ Only {totalCredits} Credits Remaining</h4>
                  <p className="text-sm text-orange-200/70">Enough for approximately {Math.floor(totalCredits / 25)} AI Videos.</p>
                </div>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">Buy Credits</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Hero & Usage */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-[32px] bg-white/5 backdrop-blur-2xl border border-white/10 p-10 shadow-2xl shadow-purple-900/20 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-purple-600/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold tracking-widest uppercase mb-6">
                    <Zap className="w-3 h-3" /> AI CREDITS
                  </div>
                  <h1 className="text-4xl font-black mb-2 tracking-tight">Available Credits</h1>
                  <p className="text-gray-400 font-medium mb-8">Power your creativity with AI.</p>
                  
                  <div className="mb-8">
                    <div className="text-[4rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-fuchsia-100 to-fuchsia-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.3)] mb-2">
                      <AnimatedCounter value={totalCredits} />
                    </div>
                    <div className="flex items-center gap-2 text-fuchsia-400 font-semibold">
                      <Sparkles className="w-4 h-4" /> ≈ {Math.floor(totalCredits / 25)} AI Videos Remaining
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm font-bold text-gray-400">
                      <span>Premium Creator • Active</span>
                      <span>{Math.round((creditsRemaining / creditsPurchased) * 100)}% Remaining</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${(creditsRemaining / creditsPurchased) * 100}%` }} transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] translate-x-[-100%]" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                      Buy Credits
                    </Button>
                    <Button className="h-12 px-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-base">
                      Transaction History
                    </Button>
                  </div>
                </div>

                {/* Floating Coin Visual */}
                <div className="hidden md:flex justify-center items-center h-full perspective-[1000px]">
                  <motion.div 
                    animate={{ rotateY: [0, 360], y: [-10, 10, -10] }}
                    transition={{ rotateY: { duration: 10, repeat: Infinity, ease: "linear" }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                    className="relative w-48 h-48 rounded-full bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center shadow-[0_0_80px_rgba(168,85,247,0.4)] border-4 border-fuchsia-400/30"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-105" />
                    <div className="absolute inset-0 rounded-full border border-white/10 scale-110" />
                    <Zap className="w-20 h-20 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Usage Cards Grid */}
            <div>
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-fuchsia-400" /> AI Modules</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {usageCards.map((card, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 ${card.borderColor} transition-all relative overflow-hidden group cursor-pointer`}
                    onClick={() => {
                      setSelectedAction(card);
                      setShowConfirmModal(true);
                    }}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.color} rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-lg">
                          {card.icon}
                        </div>
                        <span className="text-sm font-bold px-3 py-1 bg-white/5 rounded-full border border-white/10">{card.cost}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{card.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400 font-medium group-hover:text-white transition-colors mt-4">
                        {card.action} <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pricing Section */}
            <div id="pricing">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-400" /> Buy Credits</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {pricingCards.map((plan, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    className={`relative p-6 rounded-3xl border transition-all ${plan.highlight ? 'bg-[#130E24] border-fuchsia-500/50 shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                        {plan.badge}
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-gray-400 mb-2">{plan.title}</h3>
                    <div className="text-3xl font-black mb-4">{plan.credits}</div>
                    <div className="text-xl font-bold text-white mb-2">{plan.price}</div>
                    <div className="text-sm text-fuchsia-400 font-semibold mb-6">{plan.bonus}</div>
                    <Button className={`w-full rounded-xl font-bold ${plan.highlight ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
                      Buy Now
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: History & Rewards */}
          <div className="space-y-8">
            {/* AI Recommendation */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-sm font-bold text-fuchsia-400 mb-2">
                  <Sparkles className="w-4 h-4" /> AI Recommendation
                </div>
                <p className="text-lg font-bold mb-6 leading-tight">
                  Based on your usage, the Creator Pack will save 18%.
                </p>
                <Button className="w-full rounded-xl bg-white text-black hover:bg-gray-200 font-bold">
                  Upgrade Plan
                </Button>
              </div>
            </motion.div>

            {/* Transaction History */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10"
            >
              <h3 className="text-xl font-black mb-6 flex items-center gap-2"><History className="w-5 h-5 text-gray-400" /> Recent Activity</h3>
              <div className="space-y-6">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="flex gap-4 items-start relative">
                    {idx !== transactions.length - 1 && <div className="absolute left-5 top-10 bottom-[-24px] w-px bg-white/10" />}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${tx.type === 'purchase' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                      {tx.type === 'purchase' ? <TrendingUp className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm mb-1">{tx.title}</div>
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className={tx.type === 'purchase' ? 'text-green-400' : 'text-white'}>{tx.amount}</span>
                        {tx.bonus && <span className="text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded-full">{tx.bonus}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{tx.date}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 text-sm font-bold text-gray-400 hover:text-white transition-colors border-t border-white/10">
                View All Transactions
              </button>
            </motion.div>

            {/* Monthly Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10"
            >
              <h3 className="text-xl font-black mb-6">Monthly Overview</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-gray-400">Credits Used</span>
                    <span>{creditsUsed}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '62%' }} viewport={{ once: true }} transition={{ duration: 1 }} className="h-full bg-blue-500" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-gray-400">Credits Purchased</span>
                    <span>{creditsPurchased}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1 }} className="h-full bg-green-500" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-gray-400">Remaining</span>
                    <span className="text-fuchsia-400">{creditsRemaining}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '38%' }} viewport={{ once: true }} transition={{ duration: 1 }} className="h-full bg-fuchsia-500" /></div>
                </div>
              </div>
            </motion.div>

            {/* Rewards */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10"
            >
              <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-yellow-400" /> Rewards</h3>
              <div className="space-y-4">
                {[
                  { title: "Daily Login", reward: "+5 Credits", icon: <Gift className="w-5 h-5 text-pink-400" />, action: "Claim" },
                  { title: "Invite Friends", reward: "+100 Credits", icon: <Users className="w-5 h-5 text-blue-400" />, action: "Share" },
                  { title: "Complete 20 Videos", reward: "+50 Credits", icon: <Video className="w-5 h-5 text-purple-400" />, action: "Track" }
                ].map((reward, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">{reward.icon}</div>
                      <div>
                        <div className="font-bold text-sm">{reward.title}</div>
                        <div className="text-xs text-fuchsia-400 font-semibold">{reward.reward}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs font-bold hover:bg-white/10">{reward.action}</Button>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#130E24] border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500" />
              <button onClick={() => setShowConfirmModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
                {selectedAction.icon}
              </div>
              <h2 className="text-2xl font-black mb-6">{selectedAction.action} {selectedAction.title}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-400 font-medium">Cost</span>
                  <span className="font-bold text-fuchsia-400">{selectedAction.cost}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-400 font-medium">Current Balance</span>
                  <span className="font-bold">{totalCredits} Credits</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-400 font-medium">Balance After</span>
                  <span className="font-bold">{totalCredits - parseInt(selectedAction.cost)} Credits</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl h-12 font-bold text-white">Cancel</Button>
                <Button className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 rounded-xl h-12 font-bold shadow-lg shadow-purple-500/20">Confirm</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
