import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, X, Mail, Sparkles, Tag, ShoppingBag, Clock, ShieldCheck, 
  ChevronRight, AlertCircle, RefreshCw, Send, CheckCircle2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'flash_sale' | 'coupon' | 'announcement';
  title: string;
  title_bn?: string;
  body: string;
  body_bn?: string;
  link?: string;
  is_global: boolean;
  customer_phone?: string;
  created_at: string;
}

interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  bodyHtml: string;
  customer_phone: string;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  onUnreadCountChange?: (count: number) => void;
  onOrderClick?: (orderId: string) => void;
}

export default function NotificationCenter({ 
  isOpen, 
  onClose, 
  lang,
  onUnreadCountChange,
  onOrderClick
}: NotificationCenterProps) {
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emails, setEmails] = useState<SimulatedEmail[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  
  const [activeTab, setActiveTab] = useState<'alerts' | 'emails'>('alerts');
  const [alertFilter, setAlertFilter] = useState<'all' | 'order' | 'promo' | 'announcement'>('all');
  
  const [phoneQuery, setPhoneQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SimulatedEmail | null>(null);

  // Initialize read mapping and last tracked phone from localStorage
  useEffect(() => {
    const savedRead = localStorage.getItem('jijarell_read_notifications');
    if (savedRead) {
      try {
        setReadIds(JSON.parse(savedRead));
      } catch (e) {
        console.error(e);
      }
    }

    const savedPhone = localStorage.getItem('jijarell_last_tracked_phone');
    if (savedPhone) {
      setPhoneQuery(savedPhone);
    }
  }, []);

  // Sync data function
  const syncNotificationsAndEmails = async () => {
    // Determine search phone context
    const currentPhone = localStorage.getItem('jijarell_last_tracked_phone') || phoneQuery;
    
    try {
      // 1. Fetch notifications
      const notifUrl = currentPhone 
        ? `/api/notifications?phone=${encodeURIComponent(currentPhone)}`
        : '/api/notifications';
      
      const notifRes = await fetch(notifUrl);
      if (notifRes.ok) {
        const notifs: Notification[] = await notifRes.json();
        setNotifications(notifs);
        
        // Match unread count
        const savedRead = localStorage.getItem('jijarell_read_notifications');
        const parsedReadIds: string[] = savedRead ? JSON.parse(savedRead) : [];
        const unreadList = notifs.filter(n => !parsedReadIds.includes(n.id));
        if (onUnreadCountChange) {
          onUnreadCountChange(unreadList.length);
        }
      }

      // 2. Fetch simulated transactional emails
      const emailUrl = currentPhone
        ? `/api/emails?phone=${encodeURIComponent(currentPhone)}`
        : '/api/emails';
        
      const emailRes = await fetch(emailUrl);
      if (emailRes.ok) {
        const mailList: SimulatedEmail[] = await emailRes.json();
        setEmails(mailList);
      }
    } catch (err) {
      console.error('Error polling notifications:', err);
    }
  };

  // Poll for modifications in background while the panel is mounted or open & register live SSE triggers
  useEffect(() => {
    syncNotificationsAndEmails();
    
    // Set active periodic tracker (updates database triggers dynamically)
    const interval = setInterval(() => {
      syncNotificationsAndEmails();
    }, 6000);

    // Setup active real-time event stream connection
    const currentPhone = localStorage.getItem('jijarell_last_tracked_phone') || phoneQuery;
    const query = currentPhone ? `?phone=${encodeURIComponent(currentPhone)}` : '';
    const es = new EventSource(`/api/notifications/stream${query}`);

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type !== 'connected_handshake') {
          console.log('[SSE NotificationCenter] Refreshing view elements instantly due to real-time update.');
          syncNotificationsAndEmails();
        }
      } catch (err) {
        // Safe fail
      }
    };

    return () => {
      clearInterval(interval);
      es.close();
    };
  }, [phoneQuery, isOpen]);

  // Handle phone query submission
  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Persist phone query coordinates
    localStorage.setItem('jijarell_last_tracked_phone', phoneQuery);
    
    setTimeout(() => {
      syncNotificationsAndEmails();
      setLoading(false);
    }, 500);
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem('jijarell_read_notifications', JSON.stringify(updated));
    if (onUnreadCountChange) {
      onUnreadCountChange(0);
    }
  };

  // Mark single notification as read
  const handleMarkSingleRead = (id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem('jijarell_read_notifications', JSON.stringify(updated));
    
    // Calculate new unread
    const unreadCount = notifications.filter(n => !updated.includes(n.id)).length;
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  };

  // Filter alerts matching criteria
  const filteredAlerts = notifications.filter(notif => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'order') return notif.type === 'order';
    if (alertFilter === 'announcement') return notif.type === 'announcement';
    if (alertFilter === 'promo') {
      return notif.type === 'promotion' || notif.type === 'flash_sale' || notif.type === 'coupon';
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex justify-end">
      {/* Drawer Overlay Container */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-stone-200"
      >
        {/* Header */}
        <div className="p-5 bg-stone-950 text-white flex items-center justify-between border-b border-[#C5A880]/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Bell className="w-5 h-5 text-[#C5A880]" />
              {notifications.filter(n => !readIds.includes(n.id)).length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-serif font-black uppercase tracking-wider">Client Notification Hub</h3>
              <p className="text-[10px] text-stone-400 font-mono">Real-time updates & Simulated transactional logs</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Dynamic Registered Phone Sync Panel */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 shrink-0 space-y-2">
          <form onSubmit={handlePhoneSubmit} className="space-y-1.5">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-[#a58e6c] block">
              Synchronize Device Orders & Email Box
            </label>
            <div className="flex gap-1.5">
              <input 
                type="tel"
                placeholder="e.g. 017XXXXXXXX"
                value={phoneQuery}
                onChange={(e) => setPhoneQuery(e.target.value)}
                className="flex-1 text-[11px] font-bold font-sans bg-white px-3 py-2 border border-stone-250 rounded-lg placeholder-stone-400 focus:outline-hidden text-stone-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-3 bg-stone-900 text-stone-100 hover:bg-stone-800 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Link System</span>
              </button>
            </div>
          </form>
          {phoneQuery && (
            <p className="text-[8.5px] text-stone-400 font-mono uppercase tracking-wider">
              Connected Coordinates: <strong className="text-stone-700 font-bold">{phoneQuery}</strong>
            </p>
          )}
        </div>

        {/* Categories Tab Toggles */}
        <div className="flex border-b border-stone-150 bg-stone-50/50 shrink-0 select-none">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 text-center py-3 text-xs font-bold border-b-2 tracking-wider ${
              activeTab === 'alerts' 
                ? 'border-stone-900 text-stone-900 bg-white font-extrabold' 
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/40'
            }`}
          >
            Website Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`flex-1 text-center py-3 text-xs font-bold border-b-2 tracking-wider ${
              activeTab === 'emails' 
                ? 'border-stone-900 text-stone-900 bg-white font-extrabold' 
                : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100/40'
            }`}
          >
            Email Inbox Sync ({emails.length})
          </button>
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto bg-stone-50/30">
          
          {/* ALERTS TAB CONTENT */}
          {activeTab === 'alerts' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              {/* Alert category sub-filters */}
              <div className="flex flex-wrap gap-1.5 select-none shrink-0 pb-1">
                {[
                  { id: 'all' as const, label: 'All Alerts' },
                  { id: 'order' as const, label: 'Order Updates' },
                  { id: 'promo' as const, label: 'Offers & Coupons' },
                  { id: 'announcement' as const, label: 'Announcements' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAlertFilter(f.id)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                      alertFilter === f.id 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-white border border-stone-200 text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Utility Clear Controls */}
              {notifications.filter(n => !readIds.includes(n.id)).length > 0 && (
                <div className="flex justify-end pr-1">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-bold text-[#C5A880] hover:text-[#b0936b] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    ✓ Mark all as read
                  </button>
                </div>
              )}

              {/* Notification feed cards */}
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-12 h-12 bg-stone-100 border border-stone-200 rounded-2xl flex items-center justify-center mx-auto text-stone-400">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">No alerts recorded</p>
                    <p className="text-[10.5px] text-stone-500 max-w-xs mx-auto leading-relaxed">
                      {phoneQuery 
                        ? "We found no active security updates corresponding to this credential profile."
                        : "Link your purchase phone number above to sync direct logistics alerts."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAlerts.map((notif) => {
                    const isRead = readIds.includes(notif.id);
                    const formattedDate = new Date(notif.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    }) + ' / ' + new Date(notif.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <div 
                        key={notif.id}
                        onMouseEnter={() => handleMarkSingleRead(notif.id)}
                        onClick={() => {
                          const orderIdMatch = notif.title.match(/#([a-zA-Z0-9_-]+)/) || notif.body.match(/#([a-zA-Z0-9_-]+)/);
                          if (orderIdMatch && orderIdMatch[1] && onOrderClick) {
                            onOrderClick(orderIdMatch[1]);
                          }
                        }}
                        className={`p-3.5 border rounded-2xl transition bg-white block select-none ${
                          notif.type === 'order' && onOrderClick ? 'cursor-pointer hover:border-[#C5A880]/90 hover:shadow-md' : ''
                        } ${
                          isRead ? 'border-stone-150 opacity-80' : 'border-[#C5A880]/50 ring-1 ring-[#C5A880]/10 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Sponsoring Icon */}
                          <div className={`p-2 rounded-xl shrink-0 ${
                            notif.type === 'order' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            notif.type === 'promotion' || notif.type === 'flash_sale' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-stone-50 text-stone-700 border border-stone-150'
                          }`}>
                            {notif.type === 'order' ? <ShoppingBag className="w-3.5 h-3.5" /> :
                             notif.type === 'promotion' || notif.type === 'flash_sale' ? <Sparkles className="w-3.5 h-3.5" /> :
                             <Tag className="w-3.5 h-3.5" />}
                          </div>

                          <div className="space-y-1 flex-1 text-left">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="text-[11.5px] font-extrabold text-stone-900 tracking-tight leading-tight">
                                {lang === 'bn' && notif.title_bn ? notif.title_bn : notif.title}
                              </h4>
                              {!isRead && (
                                <span className="text-[8px] bg-amber-550 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-widest scale-90">Unread</span>
                              )}
                            </div>
                            
                            <p className="text-[11px] text-stone-600 leading-normal font-sans select-text">
                              {lang === 'bn' && notif.body_bn ? notif.body_bn : notif.body}
                            </p>

                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[9px] text-stone-400 font-mono block">{formattedDate}</span>
                              {notif.type === 'order' && onOrderClick && (
                                <span className="text-[9.5px] text-[#C5A880] font-black uppercase tracking-wider flex items-center gap-0.5">
                                  <span>Track Order →</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SIMULATED DIRECT EMAIL INBOX TAB CONTENT */}
          {activeTab === 'emails' && (
            <div className="p-4 space-y-4 animate-fadeIn">
              <div className="p-3 bg-stone-100 border border-stone-250 rounded-xl">
                <p className="text-[10px] text-stone-600 font-sans leading-normal">
                  ✉ <strong>Simulated Corporate Node:</strong> Whenever JIJARELL team confirms or modifies logs, our node transmits a professional HTML email invoice to the customer directory. Preview the live dispatch records below.
                </p>
              </div>

              {emails.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-12 h-12 bg-stone-150 border border-stone-200 rounded-2xl flex items-center justify-center mx-auto text-stone-400">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">Simulated mailbox empty</p>
                    <p className="text-[10.5px] text-stone-500 max-w-xs mx-auto leading-relaxed">
                      {phoneQuery 
                        ? "Verify your order. No automated transaction updates have been dispatched for this profile credentials yet."
                        : "Synchronize your purchase coordinates above to discover sent emails."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((email) => {
                    const formattedDate = new Date(email.created_at).toLocaleString();
                    return (
                      <div 
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className="p-3 border border-stone-200 hover:border-[#C5A880]/75 bg-white hover:bg-stone-50 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 text-left"
                      >
                        <div className="space-y-0.5 truncate">
                          <h4 className="text-[11.5px] font-extrabold text-stone-900 truncate flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{email.subject}</span>
                          </h4>
                          <p className="text-[9.5px] text-stone-500 font-mono truncate">To: {email.to}</p>
                          <span className="text-[8.5px] text-stone-400 font-mono block">{formattedDate}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Static decorative footer tag */}
        <div className="p-4 bg-stone-50 border-t border-stone-150 text-center text-[9.5px] text-stone-400 font-mono shrink-0 select-none">
          JIJARELL Network Security Shield Active
        </div>
      </motion.div>

      {/* Floating full screen HTML invoice simulator frame */}
      <AnimatePresence>
        {selectedEmail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-stone-50 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-stone-300 flex flex-col overflow-hidden"
            >
              {/* Simulator shell header info */}
              <div className="px-5 py-4 bg-stone-900 text-stone-100 border-b border-stone-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-stone-400 text-[10px] ml-2 tracking-widest font-bold">JIJARELL MAIL-TRANSMISSIONS NODE</span>
                </div>
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="p-1 px-2 text-[10.5px] font-extrabold font-mono hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-300 rounded cursor-pointer"
                >
                  ESC
                </button>
              </div>

              {/* Envelope details bar */}
              <div className="p-4 bg-white border-b border-stone-200 text-xs text-stone-700 text-left space-y-1 shrink-0 font-mono">
                <div><span className="font-bold text-stone-400">Subject:</span> <strong className="text-stone-900">{selectedEmail.subject}</strong></div>
                <div><span className="font-bold text-stone-400">Recipient Address:</span> <span className="text-blue-650 underline inline-block">{selectedEmail.to}</span></div>
                <div><span className="font-bold text-stone-400">Outgoing Server IP:</span> <span className="text-stone-500">104.244.42.1 (Jijarell secure SSL node)</span></div>
              </div>

              {/* Styled Email body display iframe/HTML wrapper */}
              <div className="flex-1 overflow-y-auto p-6 bg-stone-100 flex items-center justify-center">
                <div 
                  className="w-full select-text max-w-lg bg-white rounded-xl shadow-xs border border-stone-200" 
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} 
                />
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Close Email Simulator
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
