import { Row, Col, Card, Button, Typography } from 'antd';
import { motion } from 'framer-motion';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Sparkles } from 'lucide-react';

const { Title } = Typography;

interface PricingSectionProps {
  isDarkMode: boolean;
  fadeInUp: any;
}

export const PricingSection = ({ isDarkMode, fadeInUp }: PricingSectionProps) => {
  return (
    <section id="pricing" className={`py-32 px-6 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-b from-[#130E24] to-[#0B0815]' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
      {/* Background Enhancements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fuchsia-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-20">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black mb-4 leading-tight">
            Build Without Limits.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">Create. Edit. Export.</span>
          </h2>
          <p className="text-xl opacity-70 max-w-3xl mx-auto leading-relaxed">
            Choose a plan that matches your creative journey. Whether you're just exploring AI or producing content professionally, VEYTRIX.AI scales with you.
          </p>
        </motion.div>

        <Row gutter={[32, 32]} justify="center" align="middle" className="items-stretch">
          {[
            {
              name: 'Plus',
              price: '₹99',
              period: '/month',
              badge: 'Perfect for Beginners',
              features: ['40 AI Credits + 5 Bonus Credits', 'AI Video Generation', 'Image to Video', 'AI Manual Edit', 'HD Export', 'Standard Render Queue', 'Commercial Usage'],
              buttonText: 'Start with Plus',
              featured: false
            },
            {
              name: 'Pro',
              price: '₹199',
              period: '/month',
              badge: 'Best for Creators',
              topBadge: '🔥 MOST POPULAR',
              features: ['80 AI Credits + 10 Bonus Credits', 'AI Video Generation', 'Image to Video', 'AI Manual Edit', 'Faster AI Rendering', 'Priority Queue', 'Full HD Export', 'Commercial Usage', 'Early Access Features'],
              buttonText: 'Go Pro',
              featured: true
            },
            {
              name: 'Elite',
              price: '₹299',
              period: '/month',
              badge: 'For Professionals',
              features: ['130 AI Credits + 15 Bonus Credits', 'Unlimited AI Creativity', 'AI Video Generation', 'Image to Video', 'AI Manual Edit', 'Fastest Rendering', '4K Export', 'Premium AI Models', 'Priority Support', 'Commercial License', 'Early Beta Features'],
              buttonText: 'Choose Elite',
              featured: false
            }
          ].map((plan, i) => (
            <Col xs={24} md={8} key={i} className="flex">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="w-full">
                <Card
                  variant={plan.featured ? "outlined" : "borderless"}
                  className={`h-full flex flex-col text-center rounded-[2rem] transition-all duration-300 transform hover:-translate-y-[10px] hover:scale-[1.03] ${plan.featured
                    ? 'border-fuchsia-500 shadow-[0_20px_50px_rgba(168,85,247,0.3)] scale-100 md:scale-105 z-10 relative py-6 bg-[#1A1528]/80 backdrop-blur-xl hover:shadow-[0_25px_60px_rgba(168,85,247,0.4)] hover:border-fuchsia-400'
                    : 'border-white/5 bg-white/5 backdrop-blur-lg shadow-xl hover:shadow-fuchsia-500/10 hover:border-white/10'
                    }`}
                  styles={{ body: { display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 } }}
                >
                  {plan.topBadge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white px-6 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                      {plan.topBadge}
                    </div>
                  )}
                  <Title level={3} className={`mt-4 mb-1 !font-black text-3xl ${plan.featured ? '!text-white' : ''}`}>{plan.name}</Title>
                  <div className={`text-sm font-bold tracking-wide uppercase ${plan.featured ? 'text-fuchsia-300' : 'text-fuchsia-400'} mb-4`}>{plan.badge}</div>

                  <div className="flex items-baseline justify-center gap-1 my-6">
                    <span className={`text-6xl font-black ${plan.featured ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 drop-shadow-lg' : ''}`}>{plan.price}</span>
                    <span className="text-xl opacity-60 font-medium">{plan.period}</span>
                  </div>

                  <ul className="text-left space-y-4 mb-10 px-2 md:px-4 flex-grow">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-[15px] font-medium">
                        <CheckCircleOutlined className={`text-lg shrink-0 mt-0.5 ${plan.featured ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'text-fuchsia-500/70'}`} />
                        <span className={plan.featured ? 'opacity-100 text-white' : 'opacity-80'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type={plan.featured ? "primary" : "default"}
                    size="large"
                    block
                    shape="round"
                    className={`h-14 mt-auto font-bold text-lg rounded-full transition-all duration-300 border-0 ${plan.featured
                        ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 hover:to-purple-400 shadow-[0_10px_20px_rgba(168,85,247,0.3)] hover:shadow-[0_15px_30px_rgba(168,85,247,0.5)] text-white'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-fuchsia-400 text-white'
                      }`}
                  >
                    {plan.buttonText}
                  </Button>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mt-24">
          <div className="inline-block p-[1px] rounded-3xl bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-fuchsia-500/20 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-fuchsia-500/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
            <div className="relative bg-[#130E24] rounded-3xl py-10 px-12 border border-white/5 shadow-2xl backdrop-blur-sm">
              <h3 className="text-2xl font-black mb-3 flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 text-fuchsia-400" /> ✨ Need more credits?
              </h3>
              <p className="text-lg opacity-80 mb-4 max-w-2xl mx-auto">
                Purchase additional AI Credit Packs anytime without changing your subscription.
              </p>
              <p className="text-sm opacity-50 max-w-xl mx-auto">
                Unused subscription credits expire at the end of the billing cycle. Bonus credits are consumed first.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
