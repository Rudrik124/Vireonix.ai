import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Bell,
  Wand2,
  Download,
  Upload,
  CreditCard,
  User,
  ShieldAlert,
  Sparkles,
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/context/auth-context';

type NotificationType = 'manual_edit' | 'download' | 'upload' | 'subscription' | 'account' | 'security' | 'feature' | 'system';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  fullMessage?: string;
  timestamp: string;
  isRead: boolean;
  category: 'AI Jobs' | 'Account' | 'System' | 'Updates';
  action?: {
    label: string;
    path: string;
  };
}

const mockNotifications: AppNotification[] = [
  {
    id: 'n2',
    type: 'download',
    title: 'Export Completed',
    description: 'Your video has been exported in 4K MP4 format.',
    timestamp: '15 minutes ago',
    isRead: false,
    category: 'AI Jobs',
    action: { label: 'View Download', path: '/downloads' }
  },
  {
    id: 'n3',
    type: 'feature',
    title: 'New Feature Released',
    description: 'AI Manual Edit now supports Motion Tracking and HDR Pop filters.',
    fullMessage: 'Head over to the Manual Editor to try out the new Motion Tracking algorithms that allow you to pin text and graphics to moving objects. HDR Pop adds an incredible dynamic range to flat footage.',
    timestamp: 'Today',
    isRead: false,
    category: 'Updates'
  },
  {
    id: 'n4',
    type: 'security',
    title: 'Security Alert',
    description: 'Your account was signed in from Chrome on Windows.',
    fullMessage: 'IP Address: 104.28.x.x. Location: San Jose, CA. If this was not you, please secure your account immediately.',
    timestamp: 'Yesterday',
    isRead: true,
    category: 'Account',
    action: { label: 'Go to Security', path: '/security' }
  },
  {
    id: 'n5',
    type: 'subscription',
    title: 'Subscription Updated',
    description: 'Your subscription has been upgraded to Pro.',
    fullMessage: 'You now have access to 4K exports, priority rendering queue, and unlimited cloud storage.',
    timestamp: 'Yesterday',
    isRead: true,
    category: 'Account'
  }
];

const getIconForType = (type: NotificationType) => {
  switch (type) {
    case 'manual_edit': return <Wand2 className="w-5 h-5 text-fuchsia-400" />;
    case 'download': return <Download className="w-5 h-5 text-green-400" />;
    case 'upload': return <Upload className="w-5 h-5 text-cyan-400" />;
    case 'subscription': return <CreditCard className="w-5 h-5 text-yellow-400" />;
    case 'account': return <User className="w-5 h-5 text-gray-400" />;
    case 'security': return <ShieldAlert className="w-5 h-5 text-red-400" />;
    case 'feature': return <Sparkles className="w-5 h-5 text-amber-400" />;
    case 'system': return <Settings className="w-5 h-5 text-gray-400" />;
    default: return <Bell className="w-5 h-5 text-gray-400" />;
  }
};

const getIconBgClass = (type: NotificationType) => {
  switch (type) {
    case 'manual_edit': return 'bg-fuchsia-500/20';
    case 'download': return 'bg-green-500/20';
    case 'upload': return 'bg-cyan-500/20';
    case 'subscription': return 'bg-yellow-500/20';
    case 'account': return 'bg-gray-500/20';
    case 'security': return 'bg-red-500/20';
    case 'feature': return 'bg-amber-500/20';
    case 'system': return 'bg-gray-500/20';
    default: return 'bg-gray-500/20';
  }
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      if (data) {
        const mapped: AppNotification[] = data.map((n: any) => {
          // Calculate time ago
          const created = new Date(n.created_at);
          const now = new Date();
          const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
          
          let timestamp = '';
          if (diffInMinutes < 1) timestamp = 'Just now';
          else if (diffInMinutes < 60) timestamp = `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
          else if (diffInMinutes < 1440) timestamp = `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) !== 1 ? 's' : ''} ago`;
          else timestamp = `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) !== 1 ? 's' : ''} ago`;

          let action = undefined;
          if (n.action_label && n.action_path) {
             action = { label: n.action_label, path: n.action_path };
          } else if (n.action && typeof n.action === 'object') {
             // In case action is a JSON object { label: string, path: string }
             action = n.action;
          }

          return {
            id: n.id,
            type: n.type as NotificationType,
            title: n.title,
            description: n.description,
            fullMessage: n.full_message,
            timestamp,
            isRead: n.is_read,
            category: n.category || 'System',
            action
          };
        });
        setNotifications(mapped);
      }
    };

    fetchNotifications();

    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const tabs = ['All', 'Unread', 'AI Jobs', 'Account', 'System', 'Updates'];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return !n.isRead;
    return n.category === activeTab;
  });

  const handleNotificationClick = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.isRead) {
      // Mark as read immediately for UX
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) {
        console.error('Failed to mark notification as read', error);
      }
    }
    
    // Toggle expansion
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const EmptyState = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-12 md:p-20 rounded-3xl bg-white/5 border border-white/10 shadow-2xl text-center relative overflow-hidden"
    >
      <div className="absolute top-[10%] left-[-10%] w-[30vw] h-[30vh] bg-purple-600/10 rounded-full blur-[100px]" />
      
      <div className="w-24 h-24 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center mb-6 relative z-10 border border-purple-500/20">
        <Bell className="w-10 h-10 text-purple-400 opacity-50" />
      </div>
      <h2 className="text-3xl font-bold mb-4 relative z-10">You're All Caught Up</h2>
      <p className="text-lg text-gray-400 max-w-lg mx-auto relative z-10 leading-relaxed">
        You don't have any new notifications right now. Future updates, AI jobs, exports, and account activity will appear here.
      </p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0B0914] text-white overflow-y-auto selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.svg')]" />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vh] bg-fuchsia-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[5%] w-[50vw] h-[50vh] bg-purple-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        {/* PAGE HEADER */}
        <div className="mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] inline-flex shrink-0 w-fit">
              <Bell className="w-12 h-12 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Notifications</h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-2xl">
                Stay up to date with your AI generations, account activity, feature releases, and important platform updates.
              </p>
            </div>
          </div>
        </div>

        {/* TOP FILTER BAR */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all text-sm border ${
                activeTab === tab 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'Unread' ? `Unread (${unreadCount})` : tab}
            </button>
          ))}
        </div>

        {/* NOTIFICATION LIST */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => {
                const isExpanded = expandedId === notification.id;
                
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${
                      !notification.isRead 
                        ? 'bg-white/[0.07] border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]' 
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="p-5 md:p-6 flex items-start gap-4 md:gap-5 relative">
                      {/* Unread Accent Bar */}
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                      )}

                      {/* Icon */}
                      <div className={`p-3 rounded-xl shrink-0 ${getIconBgClass(notification.type)}`}>
                        {getIconForType(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                          <h3 className={`font-bold text-lg truncate pr-4 ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{notification.timestamp}</span>
                            {!notification.isRead && (
                              <span className="text-[10px] uppercase tracking-wider font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full">New</span>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm leading-relaxed ${!notification.isRead ? 'text-gray-300' : 'text-gray-500'}`}>
                          {notification.description}
                        </p>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 border-t border-white/10">
                                {notification.fullMessage && (
                                  <p className="text-gray-400 text-sm mb-4 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                                    {notification.fullMessage}
                                  </p>
                                )}
                                
                                {notification.action && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(notification.action!.path);
                                    }}
                                    className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                                  >
                                    {notification.action.label}
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Expand Icon */}
                      <div className="hidden md:flex shrink-0 ml-4 self-center text-gray-500">
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                          <ChevronDown className="w-5 h-5" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <EmptyState />
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
