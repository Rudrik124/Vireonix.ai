import { Row, Col, Typography } from 'antd';
import { motion } from 'framer-motion';

const { Title } = Typography;

export const WorkflowsSection = ({ isDarkMode, fadeInUp, workflows }: any) => {
  return (
    <section id="features" className={`py-32 px-6 relative overflow-hidden ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-20">
           {/* Extracted Workflows Content Here */}
           <Title level={2} className="!text-white">Workflows Component</Title>
        </motion.div>
      </div>
    </section>
  );
};
