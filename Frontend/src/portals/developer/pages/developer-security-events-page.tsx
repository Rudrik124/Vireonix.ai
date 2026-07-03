import { useNavigate } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Lock,
  LogIn,
  LogOut,
  Edit,
  Upload,
  Zap,
  Ban,
  Settings,
  Search,
  Filter,
  Eye,
  X,
  Download,
  Clock,
  User,
  Cog
} from "lucide-react";
import { useAuth } from "../../../app/context/auth-context";
import { supabase } from "@/lib/supabase";
import { SecurityOverviewDashboard } from "../components/security-overview-dashboard";

type SecurityEventCategory = 'AUTH' | 'PROMPT' | 'FILE_UPLOAD' | 'RATE_LIMIT' | 'API' | 'ADMIN' | 'AI_COST' | 'SECURITY_ALERT';
type SecurityEventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
type SecurityEventStatus = 'logged' | 'acknowledged' | 'resolved' | 'escalated';

interface SecurityEvent {
  id: string;
  user_id: string | null;
  category: SecurityEventCategory;
  action: string;
  severity: SecurityEventSeverity;
  event_message: string;
  event_source: string;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  actor_role: string | null;
  affected_user_id: string | null;
  metadata: Record<string, any> | null;
  status: SecurityEventStatus;
  response_code: number | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  notes: string | null;
  resolved_by: string | null;
}

interface SecurityEventsSummary {
  total: number;
  bySeverity: Record<SecurityEventSeverity, number>;
  byCategory: Record<SecurityEventCategory, number>;
  byAction: Record<string, number>;
}

const CATEGORY_ICONS: Record<SecurityEventCategory, typeof Shield> = {
  AUTH: LogIn,
  PROMPT: Edit,
  FILE_UPLOAD: Upload,
  RATE_LIMIT: Zap,
  API: Cog,
  ADMIN: Settings,
  AI_COST: Lock,
  SECURITY_ALERT: AlertTriangle,
};

const SEVERITY_COLORS: Record<SecurityEventSeverity, string> = {
  INFO: 'text-blue-400 bg-blue-900/20',
  WARNING: 'text-yellow-400 bg-yellow-900/20',
  CRITICAL: 'text-red-400 bg-red-900/20',
};

const CATEGORY_COLORS: Record<SecurityEventCategory, string> = {
  AUTH: 'text-green-400 bg-green-900/20',
  PROMPT: 'text-purple-400 bg-purple-900/20',
  FILE_UPLOAD: 'text-blue-400 bg-blue-900/20',
  RATE_LIMIT: 'text-yellow-400 bg-yellow-900/20',
  API: 'text-cyan-400 bg-cyan-900/20',
  ADMIN: 'text-red-400 bg-red-900/20',
  AI_COST: 'text-pink-400 bg-pink-900/20',
  SECURITY_ALERT: 'text-orange-400 bg-orange-900/20',
};

export function DeveloperSecurityEventsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [summary, setSummary] = useState<SecurityEventsSummary>({
    total: 0,
    bySeverity: { INFO: 0, WARNING: 0, CRITICAL: 0 },
    byCategory: {} as Record<SecurityEventCategory, number>,
    byAction: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<SecurityEventCategory | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<SecurityEventSeverity | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<SecurityEventStatus | 'ALL'>('ALL');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | 'all'>('24h');

  // Fetch security events
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchSecurityEvents = async () => {
      setLoading(true);
      try {
        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        if (timeRange === '1h') startDate.setHours(now.getHours() - 1);
        else if (timeRange === '24h') startDate.setDate(now.getDate() - 1);
        else if (timeRange === '7d') startDate.setDate(now.getDate() - 7);
        else if (timeRange === '30d') startDate.setDate(now.getDate() - 30);

        let query = supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false });

        if (timeRange !== 'all') {
          query = query.gte('created_at', startDate.toISOString());
        }

        if (filterCategory !== 'ALL') {
          query = query.eq('category', filterCategory);
        }

        if (filterSeverity !== 'ALL') {
          query = query.eq('severity', filterSeverity);
        }

        if (filterStatus !== 'ALL') {
          query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;

        if (error) throw error;

        setEvents(data || []);

        // Calculate summary
        const summaryData: SecurityEventsSummary = {
          total: data?.length || 0,
          bySeverity: { INFO: 0, WARNING: 0, CRITICAL: 0 },
          byCategory: {} as Record<SecurityEventCategory, number>,
          byAction: {},
        };

        (data || []).forEach(event => {
          summaryData.bySeverity[event.severity as SecurityEventSeverity]++;
          summaryData.byCategory[event.category] = (summaryData.byCategory[event.category] || 0) + 1;
          summaryData.byAction[event.action] = (summaryData.byAction[event.action] || 0) + 1;
        });

        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to fetch security events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityEvents();
  }, [filterCategory, filterSeverity, filterStatus, timeRange]);

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;

    const query = searchQuery.toLowerCase();
    return events.filter(event =>
      event.event_message.toLowerCase().includes(query) ||
      event.action.toLowerCase().includes(query) ||
      event.event_source.toLowerCase().includes(query) ||
      event.actor_role?.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  const handleAcknowledge = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('security_events')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(e =>
        e.id === eventId
          ? { ...e, status: 'acknowledged', acknowledged_at: new Date().toISOString() }
          : e
      ));

      if (selectedEvent?.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
    }
  };

  const handleResolve = async (eventId: string, notes: string = '') => {
    try {
      const { error } = await supabase
        .from('security_events')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.id,
          notes
        })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(events.map(e =>
        e.id === eventId
          ? {
            ...e,
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolved_by: profile?.id,
            notes
          }
          : e
      ));

      if (selectedEvent?.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.id,
          notes
        });
      }
    } catch (err) {
      console.error('Failed to resolve event:', err);
    }
  };

  const handleExport = async () => {
    try {
      const csv = [
        ['Timestamp', 'Category', 'Action', 'Severity', 'Message', 'User ID', 'IP Address', 'Source'].join(','),
        ...filteredEvents.map(e => [
          e.created_at,
          e.category,
          e.action,
          e.severity,
          `"${e.event_message.replace(/"/g, '""')}"`,
          e.user_id || '',
          e.ip_address || '',
          e.event_source
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-events-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/developer')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Shield className="text-red-400" size={28} />
            Security Events
          </h1>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Overview Dashboard */}
        <div className="mb-12">
          <SecurityOverviewDashboard />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/40 backdrop-blur border border-slate-700 rounded-lg p-6"
          >
            <div className="text-sm text-slate-400 mb-2">Total Events</div>
            <div className="text-3xl font-bold">{summary.total}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-900/20 backdrop-blur border border-red-800 rounded-lg p-6"
          >
            <div className="text-sm text-red-400 mb-2">Critical</div>
            <div className="text-3xl font-bold text-red-400">{summary.bySeverity.CRITICAL}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-yellow-900/20 backdrop-blur border border-yellow-800 rounded-lg p-6"
          >
            <div className="text-sm text-yellow-400 mb-2">Warnings</div>
            <div className="text-3xl font-bold text-yellow-400">{summary.bySeverity.WARNING}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-900/20 backdrop-blur border border-blue-800 rounded-lg p-6"
          >
            <div className="text-sm text-blue-400 mb-2">Info</div>
            <div className="text-3xl font-bold text-blue-400">{summary.bySeverity.INFO}</div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/40 backdrop-blur border border-slate-700 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Time Range</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              >
                <option value="1h">Last 1 Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              >
                <option value="ALL">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              >
                <option value="ALL">All Statuses</option>
                <option value="logged">Logged</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 pl-9 text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading security events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No security events found</div>
          ) : (
            filteredEvents.map((event, index) => {
              const CategoryIcon = CATEGORY_ICONS[event.category];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-slate-800/40 backdrop-blur border border-slate-700 rounded-lg p-4 cursor-pointer hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${CATEGORY_COLORS[event.category]}`}>
                      <CategoryIcon size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded ${CATEGORY_COLORS[event.category]}`}>
                          {event.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${SEVERITY_COLORS[event.severity]}`}>
                          {event.severity}
                        </span>
                        {event.status !== 'logged' && (
                          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                            {event.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-200">{event.event_message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                        {event.user_id && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {event.user_id.slice(0, 8)}...
                          </span>
                        )}
                        {event.ip_address && (
                          <span>{event.ip_address}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold">Security Event Details</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Category</div>
                    <div className={`text-sm px-2 py-1 rounded inline-block ${CATEGORY_COLORS[selectedEvent.category]}`}>
                      {selectedEvent.category}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Severity</div>
                    <div className={`text-sm px-2 py-1 rounded inline-block ${SEVERITY_COLORS[selectedEvent.severity]}`}>
                      {selectedEvent.severity}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Status</div>
                    <div className="text-sm px-2 py-1 rounded inline-block bg-slate-700">
                      {selectedEvent.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Action</div>
                    <div className="text-sm text-slate-300">{selectedEvent.action}</div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Message</div>
                  <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded">
                    {selectedEvent.event_message}
                  </p>
                </div>

                {/* Context Information */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedEvent.user_id && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">User ID</div>
                      <div className="text-sm text-slate-300 font-mono">{selectedEvent.user_id}</div>
                    </div>
                  )}
                  {selectedEvent.ip_address && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">IP Address</div>
                      <div className="text-sm text-slate-300">{selectedEvent.ip_address}</div>
                    </div>
                  )}
                  {selectedEvent.event_source && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Source</div>
                      <div className="text-sm text-slate-300">{selectedEvent.event_source}</div>
                    </div>
                  )}
                  {selectedEvent.actor_role && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Actor Role</div>
                      <div className="text-sm text-slate-300">{selectedEvent.actor_role}</div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Metadata</div>
                    <pre className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedEvent.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Created</div>
                    <div className="text-sm text-slate-300">
                      {new Date(selectedEvent.created_at).toLocaleString()}
                    </div>
                  </div>
                  {selectedEvent.resolved_at && (
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Resolved</div>
                      <div className="text-sm text-slate-300">
                        {new Date(selectedEvent.resolved_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedEvent.notes && (
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Resolution Notes</div>
                    <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {selectedEvent.status === 'logged' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAcknowledge(selectedEvent.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Enter resolution notes:');
                        if (notes !== null) {
                          handleResolve(selectedEvent.id, notes);
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
