import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ChevronLeft, BarChart3 } from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { AdminActivityMonitoringDashboard } from "../components/admin-activity-monitoring-dashboard";

export function DeveloperAdminActivityMonitoringPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="text-indigo-400" size={28} />
            Admin Activity Monitoring
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AdminActivityMonitoringDashboard />
        </motion.div>
      </div>
    </div>
  );
}
