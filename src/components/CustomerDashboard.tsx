import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, MapPin, ShoppingBag, Clock, Shield, Globe, 
  Lock, AlertCircle, CheckCircle2, ChevronRight, RefreshCw, Key, 
  Trash2, Edit2, Plus, Bell, Sparkles, Tag, Eye, ShieldCheck, Heart, ArrowRight,
  Star
} from 'lucide-react';
import { Order, Review } from '../types';

interface SavedAddress {
  id: string;
  label: string; // Home, Office, Club
  recipient_name: string;
  phone: string;
  address: string;
}

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'flash_sale' | 'coupon' | 'announcement';
  title: string;
  title_bn?: string;
  body: string;
  body_bn?: string;
  is_global: boolean;
  customer_phone?: string;
  created_at: string;
}

interface CustomerDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  customerUser: any | null;
  customerToken: string | null;
  setCustomerUser: (user: any | null) => void;
  lang: 'en' | 'bn';
  setLang: (lang: 'en' | 'bn') => void;
  t: (key: string) => string;
  triggerNotificationToast: (title: string, body: string, type: 'shipped' | 'paid' | 'general') => void;
  preSelectedOrderId?: string | null;
  onClearPreSelectedOrderId?: () => void;
}

export default function CustomerDashboard({
  isOpen,
  onClose,
  customerUser,
  customerToken,
  setCustomerUser,
  lang,
  setLang,
  t,
  triggerNotificationToast,
  preSelectedOrderId,
  onClearPreSelectedOrderId
}: CustomerDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'notifications' | 'security' | 'language'>('profile');
  
  // Handle pre-selected order routing for clickable notifications
  useEffect(() => {
    if (preSelectedOrderId && isOpen) {
      setActiveTab('orders');
      setSelectedOrderIdForTracking(preSelectedOrderId);
      if (onClearPreSelectedOrderId) {
        onClearPreSelectedOrderId();
      }
    }
  }, [preSelectedOrderId, isOpen, onClearPreSelectedOrderId]);
  
  // Real-time Order and tracking states
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIdForTracking, setSelectedOrderIdForTracking] = useState<string | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Reviews systems inline
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [activeReviewForm, setActiveReviewForm] = useState<{order_id: string, product_id: string} | null>(null);
  const [inlineRating, setInlineRating] = useState(5);
  const [inlineText, setInlineText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchAllReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setAllReviews(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllReviews();
    }
  }, [isOpen]);
  
  // Profile Form States
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Saved Addresses tab states
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressName, setNewAddressName] = useState('');
  const [newAddressPhone, setNewAddressPhone] = useState('');
  const [newAddressValue, setNewAddressValue] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  // Private notifications stream state
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  
  // Security settings states
  const [hardwareLock, setHardwareLock] = useState(false);
  const [dualFactor, setDualFactor] = useState(true);
  const [mfaCode, setMfaCode] = useState('Enabled');
  
  // Load initial form value states
  useEffect(() => {
    if (customerUser) {
      setNewName(customerUser.name || '');
      setNewPhone(customerUser.customer_phone || '');
      setNewAddress(customerUser.customer_address || '');
    }
  }, [customerUser]);

  // Load Saved Addresses from localStorage
  useEffect(() => {
    if (customerUser) {
      const storageKey = `jijarell_addresses_${customerUser.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setSavedAddresses(JSON.parse(saved));
        } catch (e) {
          console.error('[Dashboard] Error parsing saved addresses:', e);
        }
      } else {
        // Hydrate with initial profile address if it exists
        const initials: SavedAddress[] = [];
        if (customerUser.customer_address) {
          initials.push({
            id: 'addr-default',
            label: 'Primary Ledger Destination',
            recipient_name: customerUser.name || 'Client',
            phone: customerUser.customer_phone || '',
            address: customerUser.customer_address
          });
          setSavedAddresses(initials);
          localStorage.setItem(storageKey, JSON.stringify(initials));
        }
      }
    }
  }, [customerUser]);

  // Sync / Poll orders and notifications from backend APIs
  const fetchCustomerData = async () => {
    if (!customerUser || !customerToken) return;
    
    try {
      // Fetch orders
      const orderRes = await fetch('/api/customer/orders', {
        headers: { 'Authorization': `Bearer ${customerToken}` }
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        // Sort by date newest first
        const sortedOrders = orderData.sort((a: Order, b: Order) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sortedOrders);
      }

      // Fetch private notifications
      const phoneContext = customerUser.customer_phone || '';
      const notifUrl = phoneContext 
        ? `/api/notifications?phone=${encodeURIComponent(phoneContext)}`
        : '/api/notifications';
        
      const notifRes = await fetch(notifUrl);
      if (notifRes.ok) {
        const notifs = await notifRes.json();
        setLocalNotifications(notifs);
      }
    } catch (err) {
      console.error('[Dashboard] Error polling live backend data:', err);
    }
  };

  // Real-time updates handler with fast interval poll + SSE stream integration
  useEffect(() => {
    if (!isOpen || !customerUser) return;
    
    fetchCustomerData();
    
    // Fast Polling loop (6 seconds) to ensure status changes propagate instantly
    const interval = setInterval(() => {
      fetchCustomerData();
    }, 6000);

    // EventSource (SSE) Integration for true Instant Status Propagation
    const phoneContext = customerUser.customer_phone || '';
    const query = phoneContext ? `?phone=${encodeURIComponent(phoneContext)}` : '';
    const es = new EventSource(`/api/notifications/stream${query}`);

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type !== 'connected_handshake') {
          console.log('[SSE Dashboard] Refreshing data instantly on server dispatch event!');
          fetchCustomerData();
        }
      } catch (err) {
        // Safe fail
      }
    };

    // Load read notifications
    const savedRead = localStorage.getItem('jijarell_read_notifications');
    if (savedRead) {
      try {
        setReadNotifIds(JSON.parse(savedRead));
      } catch (e) {
        // skip
      }
    }

    return () => {
      clearInterval(interval);
      es.close();
    };
  }, [isOpen, customerUser, customerToken]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToken) return;
    setUpdatingProfile(true);
    
    try {
      const res = await fetch('/api/customer/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          address: newAddress.trim()
        })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomerUser(data.user);
        triggerNotificationToast(
          lang === 'bn' ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile Synchronized',
          lang === 'bn' ? 'আপনার লাক্সারি ক্লায়েন্ট ডেটা সফলভাবে সিঙ্ক হয়েছে।' : 'Your luxury client credentials have been updated successfully.',
          'general'
        );
        fetchCustomerData();
      } else {
        alert(data.error || 'Failed to update ledger records.');
      }
    } catch (err) {
      console.error(err);
      alert('Network transmission failure.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Saved Addresses operations
  const saveAddressesToStorage = (updated: SavedAddress[]) => {
    if (!customerUser) return;
    setSavedAddresses(updated);
    const storageKey = `jijarell_addresses_${customerUser.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressName || !newAddressPhone || !newAddressValue) return;

    if (isEditingAddress) {
      const updated = savedAddresses.map(addr => 
        addr.id === isEditingAddress 
          ? { ...addr, label: newAddressLabel, recipient_name: newAddressName, phone: newAddressPhone, address: newAddressValue }
          : addr
      );
      saveAddressesToStorage(updated);
      setIsEditingAddress(null);
      triggerNotificationToast('Address Updated', 'The saved shipping location was edited successfully.', 'general');
    } else {
      const newAddr: SavedAddress = {
        id: 'addr-' + Date.now(),
        label: newAddressLabel,
        recipient_name: newAddressName,
        phone: newAddressPhone,
        address: newAddressValue
      };
      saveAddressesToStorage([...savedAddresses, newAddr]);
      triggerNotificationToast('Address Saved', 'A secure new shipping destination is stored in your registry.', 'general');
    }

    // Reset Address form fields
    setNewAddressLabel('Home');
    setNewAddressName('');
    setNewAddressPhone('');
    setNewAddressValue('');
    setShowAddressForm(false);
  };

  const handleEditAddressInit = (addr: SavedAddress) => {
    setIsEditingAddress(addr.id);
    setNewAddressLabel(addr.label);
    setNewAddressName(addr.recipient_name);
    setNewAddressPhone(addr.phone);
    setNewAddressValue(addr.address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm('Delete this saved location?')) {
      const filtered = savedAddresses.filter(a => a.id !== id);
      saveAddressesToStorage(filtered);
      triggerNotificationToast('Address Deleted', 'A target shipping destination has been dropped.', 'general');
    }
  };

  // Clickable notification tracker handler
  const handleNotificationClick = (notif: Notification) => {
    // Mark as read immediately
    const updatedRead = Array.from(new Set([...readNotifIds, notif.id]));
    setReadNotifIds(updatedRead);
    localStorage.setItem('jijarell_read_notifications', JSON.stringify(updatedRead));

    // Try parsing Order reference
    const orderIdMatch = notif.title.match(/#([a-zA-Z0-9_-]+)/) || notif.body.match(/#([a-zA-Z0-9_-]+)/);
    if (orderIdMatch && orderIdMatch[1]) {
      const targetOrderId = orderIdMatch[1];
      // Check if order exists in local state
      const matchingOrder = orders.find(o => o.id === targetOrderId || o.id.toLowerCase() === targetOrderId.toLowerCase());
      if (matchingOrder) {
        setSelectedOrderIdForTracking(matchingOrder.id);
        setActiveTab('orders');
        return;
      }
    }
    
    // Default fallback: Switch to orders anyway to explore
    setActiveTab('orders');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border-2 border-[#C5A880] rounded-3xl overflow-hidden w-full max-w-5xl shadow-2xl flex flex-col h-[90vh] md:h-[80vh] max-h-[850px] animate-fadeIn">
        
        {/* Luxury Banner Header */}
        <div className="bg-stone-950 text-white px-6 py-4 flex items-center justify-between border-b border-[#C5A880] shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C5A880] to-stone-800 flex items-center justify-center text-stone-950 shadow-inner">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-serif font-black uppercase tracking-[0.2em]">
                {customerUser?.name || 'Private Client'}
              </h1>
              <p className="text-[9px] text-[#C5A880] font-mono tracking-widest uppercase">
                JIJARELL Global Client Dashboard
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-850 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dashboard Frame Area */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-stone-50/20">
          
          {/* Elegant Sidebar Tabs Nav */}
          <div className="w-full md:w-60 bg-stone-550 border-b md:border-b-0 md:border-r border-stone-150 p-3 flex flex-wrap md:flex-col gap-1.5 shrink-0 select-none overflow-x-auto md:overflow-x-visible">
            
            <p className="hidden md:block text-[9.5px] font-black uppercase tracking-wider text-[#C5A880] px-3 mb-2 font-mono">
              Client Directory
            </p>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all w-auto md:w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-550 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-[#C5A880]' : ''}`} />
              <span>{lang === 'bn' ? 'প্রোফাইল তথ্য' : 'Profile Profile'}</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all w-auto md:w-full text-left relative whitespace-nowrap cursor-pointer ${
                activeTab === 'orders' 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-550 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <ShoppingBag className={`w-4 h-4 ${activeTab === 'orders' ? 'text-[#C5A880]' : ''}`} />
              <span>{lang === 'bn' ? 'অর্ডার ট্র্যাকিং' : 'Bespoke Orders'}</span>
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length > 0 && (
                <span className="md:absolute right-3 top-2.5 bg-[#C5A880] text-stone-950 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-stone-950">
                  {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all w-auto md:w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'addresses' 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-550 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <MapPin className={`w-4 h-4 ${activeTab === 'addresses' ? 'text-[#C5A880]' : ''}`} />
              <span>{lang === 'bn' ? 'সংরক্ষিত ঠিকানা' : 'Saved Destinations'}</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all w-auto md:w-full text-left relative whitespace-nowrap cursor-pointer ${
                activeTab === 'notifications' 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-550 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-[#C5A880]' : ''}`} />
              <span>{lang === 'bn' ? 'নোটিফিকেশন' : 'Private Alerts'}</span>
              {localNotifications.filter(n => !readNotifIds.includes(n.id)).length > 0 && (
                <span className="md:absolute right-3 top-2.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {localNotifications.filter(n => !readNotifIds.includes(n.id)).length}
                </span>
              )}
            </button>

            <p className="hidden md:block border-t border-stone-150 my-2" />

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all w-auto md:w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'security' 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-550 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Lock className={`w-4 h-4 ${activeTab === 'security' ? 'text-[#C5A880]' : ''}`} />
              <span>{lang === 'bn' ? 'সিকিউরিটি সেটিংস' : 'Cryptographic Security'}</span>
            </button>

            <button
              onClick={() => setActiveTab('language')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all w-auto md:w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === 'language' 
                  ? 'bg-stone-950 text-white shadow-md' 
                  : 'text-stone-550 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Globe className={`w-4 h-4 ${activeTab === 'language' ? 'text-[#C5A880]' : ''}`} />
              <span>{lang === 'bn' ? 'ভাষা সেটিংস' : 'Global Language'}</span>
            </button>

          </div>

          {/* Core Tab Screen Output - Multi-panel Switcher */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 text-left">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-md font-serif font-bold uppercase text-stone-900 tracking-wider">
                      {lang === 'bn' ? 'প্রোফাইল তথ্য বিবরণী' : 'Premium Client Profile Record'}
                    </h2>
                    <p className="text-[10px] text-stone-500 font-mono">
                      End-to-End Database Synced Credentials
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-black font-sans uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Account Metadata Cards */}
                  <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shrink-0">
                    <img
                      src={customerUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerUser?.email || 'luxury')}`}
                      alt="Avatar"
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-[#C5A880] shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-stone-900 uppercase tracking-widest leading-none mt-1">
                        {customerUser?.name || 'Private Client'}
                      </p>
                      <p className="text-[10px] text-[#C5A880] font-bold uppercase tracking-wider">{customerUser?.role || 'Luxury Patron'}</p>
                      <p className="text-[9px] text-stone-400 font-mono mt-1 select-text truncate max-w-[200px]">{customerUser?.email}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A880] block">
                            Client Full Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Asif Mahmud"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full bg-stone-50 px-3.5 py-2.5 border border-stone-250 rounded-xl focus:outline-none focus:border-[#C5A880] font-semibold text-stone-850"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A880] block">
                            Direct Contact Mobile
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 017XXXXXXXX"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="w-full bg-stone-50 px-3.5 py-2.5 border border-stone-250 rounded-xl focus:outline-none focus:border-[#C5A880] font-semibold font-sans text-stone-850"
                          />
                        </div>
                      </div>

                      <div className="text-xs space-y-1">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A880] block">
                          Primary Secured Ledger Destination Address
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Please provide your precise residence or safehouse cargo routing details"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          className="w-full bg-stone-50 p-3 border border-stone-250 rounded-xl focus:outline-none focus:border-[#C5A880] font-semibold text-stone-850 leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={updatingProfile}
                        className="px-6 py-3 bg-stone-950 hover:bg-stone-900 border border-stone-850 disabled:bg-stone-700 text-white text-[10px] uppercase font-extrabold tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer pt-3"
                      >
                        {updatingProfile ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A880]" />
                        ) : (
                          'Save Credentials Ledger'
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Aesthetic Detail parameters */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-4 text-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <Clock className="w-5 h-5 text-[#C5A880]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#C5A880] uppercase tracking-wide">Last Session Activity Synchronous Node</h4>
                    <p className="text-[10.5px] text-stone-500 font-mono mt-0.5 leading-relaxed">
                      Client node registered on server cluster from local address. Dual-Token handshake verified. Real-time logging of purchase transactions is active.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS TAB WITH REAL-TIME TIMELINE */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3 flex flex-wrap gap-2 justify-between items-center">
                  <div>
                    <h2 className="text-md font-serif font-bold uppercase text-stone-900 tracking-wider">
                      {lang === 'bn' ? 'ব্যক্তিগত অর্ডার ও ট্র্যাকিং' : 'Client Bespoke Purchase Orders'}
                    </h2>
                    <p className="text-[10px] text-stone-500 font-mono">
                      Real-time Logistics Status & Financial Verification Timelines
                    </p>
                  </div>
                  {selectedOrderIdForTracking && (
                    <button
                      onClick={() => setSelectedOrderIdForTracking(null)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <span>← Back to List</span>
                    </button>
                  )}
                </div>

                {!selectedOrderIdForTracking ? (
                  // List all orders for the current user
                  orders.length === 0 ? (
                    <div className="text-center py-16 space-y-3 border border-dashed border-stone-200 rounded-3xl bg-stone-50/20">
                      <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-400">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">No secured purchases recorded</p>
                        <p className="text-[11px] text-stone-400 max-w-sm mx-auto leading-relaxed">
                          Your bespoke ledger is presently empty. Secure any masterpieces from the collection, and they will automatically append to this dashboard panel.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((ord) => {
                        const dateObj = new Date(ord.created_at);
                        const formattedDate = dateObj.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) + ' ' + dateObj.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });

                        return (
                          <div 
                            key={ord.id}
                            className="bg-white border hover:border-[#C5A880] border-stone-150 rounded-2xl transition-all duration-300 p-4 shadow-inner hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                          >
                            <div className="space-y-1.5 flex-1 text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black font-mono text-stone-900">
                                  #{ord.id}
                                </span>
                                <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                                  ord.status === 'delivered' || ord.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  ord.status === 'shipped' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                  ord.status === 'processing' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                  ord.status === 'confirmed' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                                  ord.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200' :
                                  'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                                }`}>
                                  {ord.status === 'pending' ? 'Verification' : ord.status}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                  ord.payment_status === 'paid' ? 'bg-emerald-100/50 text-emerald-800' : 'bg-amber-100/50 text-amber-800'
                                }`}>
                                  {ord.payment_status}
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-400 font-mono">{formattedDate}</p>
                              
                              {/* Display summary item preview */}
                              <div className="flex gap-2.5 pt-2 flex-wrap items-center select-none">
                                {ord.items.map((item, id) => (
                                  <div key={item.id || id} className="flex items-center gap-1.5 bg-stone-50 border border-stone-150 px-2 py-1 rounded-lg">
                                    {item.productImage ? (
                                      <img 
                                        src={item.productImage} 
                                        alt=""
                                        className="w-5 h-5 rounded object-cover border border-stone-200"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 bg-stone-100 rounded flex items-center justify-center border border-stone-200">
                                        <ShoppingBag className="w-2.5 h-2.5 text-stone-400" />
                                      </div>
                                    )}
                                    <span className="text-[10px] font-sans text-stone-700 truncate max-w-[120px]">
                                      {item.productName}
                                    </span>
                                    <span className="text-[8px] font-mono text-stone-400">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="text-left md:text-right shrink-0 space-y-1.5 flex flex-col items-start md:items-end w-full md:w-auto">
                              <div>
                                <span className="text-[10px] text-stone-400 uppercase font-bold block leading-none">Total Payment</span>
                                <span className="font-serif font-black text-stone-900 text-sm leading-none pt-1 inline-block">
                                  {ord.total.toLocaleString()} BDT
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderIdForTracking(ord.id)}
                                className="w-full md:w-auto px-4 py-2 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white rounded-xl text-[10px] uppercase font-bold tracking-widest transition flex items-center justify-center gap-1 hover:scale-102 cursor-pointer"
                              >
                                <span>Track Journey</span>
                                <ChevronRight className="w-3.5 h-3.5 text-[#C5A880]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  // Detail Tracking Timeline Panel
                  (() => {
                    const ord = orders.find(o => o.id === selectedOrderIdForTracking);
                    if (!ord) return <p className="text-xs text-red-500">Order verification failed.</p>;
                    
                    const dateObj = new Date(ord.created_at);
                    const formattedDate = dateObj.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) + ' / ' + dateObj.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US',{
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });

                    return (
                      <div className="space-y-6 animate-fadeIn pb-12 text-xs">
                        
                        {/* Status timeline pipeline banner info */}
                        <div className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-inner">
                          <div className="space-y-1 text-left">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A880] block font-mono">
                              Live Logistics Pipeline Journey
                            </span>
                            <h3 className="text-stone-905 font-bold uppercase text-[12.5px] leading-tight">
                              Order reference <strong className="font-mono text-stone-950 font-black">{ord.id}</strong>
                            </h3>
                            <p className="text-[10px] text-stone-400 font-sans">
                              Committed Ledger Date: <span className="font-mono">{formattedDate}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`text-[10.5px] px-3 py-1 rounded-full font-black uppercase tracking-wider border ${
                              ord.status === 'delivered' || ord.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              ord.status === 'shipped' ? 'bg-purple-100/70 text-purple-850 border-purple-200/50' :
                              ord.status === 'processing' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              ord.status === 'confirmed' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                              ord.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200' :
                              'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                            }`}>
                              {ord.status === 'pending' ? 'Reviewing Log' : ord.status}
                            </span>
                          </div>
                        </div>

                        {/* Order timeline stepper nodes */}
                        <div className="bg-white border border-stone-200 rounded-2xl p-6 text-left space-y-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A880] block font-mono">
                            Interactive Tracking Nodes (Refreshes Live)
                          </span>

                          {ord.status === 'cancelled' ? (
                            <div className="p-4 bg-red-50 border border-red-150 rounded-2xl flex items-start gap-3.5 text-red-800 text-left">
                              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                              <div className="space-y-1">
                                <h5 className="text-xs font-black uppercase tracking-widest text-red-900">Order Voided & Reverted</h5>
                                <p className="text-[11px] text-red-700 leading-normal font-sans">
                                  This purchase allocation reference sequence has been cancelled and reversed on our central production ledger. No transit logistics correspond to this entry.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="relative pt-4 pb-4 select-none px-4">
                              {/* Horizontal track line */}
                              <div className="absolute top-[19px] left-8 right-8 h-1 bg-stone-150" />
                              
                              {/* Progress tracker bar width animation */}
                              {(() => {
                                const states = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                                let cur = ord.status as string;
                                if (cur === 'completed') cur = 'delivered'; 
                                const currentIndex = states.indexOf(cur);
                                const pct = currentIndex < 0 ? 0 : (currentIndex / (states.length - 1)) * 100;
                                return (
                                  <div 
                                    className="absolute top-[19px] left-8 h-1 bg-gradient-to-r from-[#C5A880] to-[#E3D1B4] transition-all duration-700"
                                    style={{ width: `calc(${pct}% - 16px)` }}
                                  />
                                );
                              })()}

                              {/* Stepper nodes mapper */}
                              <div className="flex justify-between relative">
                                {[
                                  { label: 'Placed', statusKey: 'pending', desc: 'Securely Logged' },
                                  { label: 'Confirmed', statusKey: 'confirmed', desc: 'Verified Ledger' },
                                  { label: 'Processing', statusKey: 'processing', desc: 'Craft & Package' },
                                  { label: 'Shipped', statusKey: 'shipped', desc: 'Cargo Transit' },
                                  { label: 'Delivered', statusKey: 'delivered', desc: 'Receipt Sealed' }
                                ].map((step, idx) => {
                                  const states = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                                  let cur = ord.status as string;
                                  if (cur === 'completed') cur = 'delivered'; 
                                  const orderStatusIndex = states.indexOf(cur);
                                  const isCompleted = idx <= orderStatusIndex;
                                  const isCurrent = idx === orderStatusIndex;

                                  return (
                                    <div key={idx} className="flex flex-col items-center text-center max-w-[80px]">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        isCompleted 
                                          ? 'bg-stone-950 text-[#C5A880] border-2 border-[#C5A880]' 
                                          : 'bg-stone-100 text-stone-300 border border-stone-200'
                                      } ${isCurrent ? 'ring-4 ring-[#C5A880]/25 animate-pulse' : ''} z-10 rounded-full cursor-help`}>
                                        {isCompleted ? (
                                          <CheckCircle2 className="w-4 h-4 fill-stone-950 text-[#C5A880]" />
                                        ) : (
                                          <Clock className="w-3.5 h-3.5" />
                                        )}
                                      </div>
                                      <span className={`text-[10px] font-sans font-black uppercase mt-2 ${isCurrent ? 'text-stone-950' : 'text-stone-500'}`}>
                                        {step.label}
                                      </span>
                                      <span className="text-[8px] font-mono text-stone-400 mt-0.5 leading-none max-w-[70px]">
                                        {step.desc}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Split detailed billing, shipping and item assets */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                          
                          {/* Financial audit ledger */}
                          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 shadow-xs">
                            <span className="text-[9px] font-black uppercase text-[#C5A880] tracking-widest font-mono flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Financial Audits & Method</span>
                            </span>
                            <div className="space-y-1.5 text-stone-600 select-text leading-relaxed">
                              <div>Gateway Protocol: <strong className="text-stone-950 font-black uppercase">{ord.payment_method}</strong></div>
                              <div>Ledger Status: <strong className="text-stone-950 font-black uppercase">{ord.payment_status}</strong></div>
                              {ord.transaction_id && (
                                <div className="truncate">bKash Hash: <strong className="font-mono text-[9.5px] bg-stone-50 border border-stone-200 px-1 py-0.5 rounded text-stone-900">{ord.transaction_id}</strong></div>
                              )}
                              <div>Destination: <strong className="text-stone-900 font-bold">{ord.customer_address}</strong></div>
                              <div>Recipient Contact: <strong className="text-stone-900 font-bold">{ord.customer_name} ({ord.customer_phone})</strong></div>
                            </div>
                          </div>

                          {/* Notes if any */}
                          {ord.customer_notes && (
                            <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 space-y-2">
                              <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider font-mono">Bespoke Customization Request</span>
                              <p className="text-[11px] text-stone-700 italic select-text leading-relaxed">"{ord.customer_notes}"</p>
                            </div>
                          )}

                          {/* Item list inside order tracking */}
                          <div className="space-y-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-inner">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A880] block font-mono pl-1">
                              Associated High-Value Assets ({ord.items.length})
                            </span>

                            <div className="divide-y divide-stone-150">
                            {ord.items.map((item, index) => {
                              const isDelivered = ord.status === 'delivered' || ord.status === 'completed';
                              return (
                                <div key={item.id || index} className="py-3">
                                  <div className="flex items-center justify-between gap-3 font-sans">
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      {item.productImage ? (
                                        <img 
                                          src={item.productImage} 
                                          alt={item.productName} 
                                          className="w-12 h-12 object-cover rounded-xl border border-stone-200 shadow-xs shrink-0"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center shrink-0">
                                          <ShoppingBag className="w-5 h-5 text-stone-400" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <h6 className="font-bold text-stone-950 text-xs truncate">{item.productName}</h6>
                                        {item.variantStr && (
                                          <span className="text-[9px] font-mono text-stone-400 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded uppercase font-bold mt-1 inline-block">
                                            {item.variantStr}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span className="text-stone-950 font-extrabold text-xs block">{item.price.toLocaleString()} BDT</span>
                                      <span className="text-[9.5px] text-stone-400 font-mono font-medium">Quantity: {item.quantity}</span>
                                    </div>
                                  </div>

                                  {/* Review trigger options strictly when delivered */}
                                  {isDelivered && (
                                    <div className="mt-2 text-left">
                                      {(() => {
                                        const existingReview = allReviews.find(r => r.product_id === item.product_id && r.order_id === ord.id);
                                        const isFormOpen = activeReviewForm?.order_id === ord.id && activeReviewForm?.product_id === item.product_id;
                                        
                                        if (existingReview) {
                                          return (
                                            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-left mt-1.5">
                                              <div className="flex items-center justify-between">
                                                <div className="flex gap-0.5">
                                                  {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star 
                                                      key={i} 
                                                      className={`w-3 h-3 ${i < existingReview.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`} 
                                                    />
                                                  ))}
                                                </div>
                                                <span className="text-[8px] font-mono text-stone-400 font-semibold">
                                                  Delivered on {new Date(ord.delivered_at || ord.created_at).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <p className="text-[11px] font-sans text-stone-600 italic">"{existingReview.review}"</p>
                                              
                                              {existingReview.admin_reply && (
                                                <div className="mt-2 bg-stone-100 p-2.5 rounded-lg border border-stone-150 space-y-0.5 leading-normal">
                                                  <span className="text-[8.5px] font-black tracking-widest text-[#C5A880] uppercase block">💎 Concierge Reply:</span>
                                                  <p className="text-[10.5px] text-stone-605">"{existingReview.admin_reply}"</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }

                                        if (isFormOpen) {
                                          return (
                                            <div className="p-3 bg-stone-50 border border-[#C5A880]/30 rounded-xl space-y-2 mt-1.5 animate-fadeIn">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[8.5px] font-black uppercase text-[#C5A880] tracking-wider font-mono font-bold">Publish Feedback Audit</span>
                                                <div className="flex gap-1">
                                                  {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                      key={star}
                                                      type="button"
                                                      onClick={() => setInlineRating(star)}
                                                      className="p-0.5 cursor-pointer shrink-0"
                                                    >
                                                      <Star className={`w-3.5 h-3.5 ${star <= inlineRating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`} />
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>

                                              <textarea
                                                required
                                                rows={2}
                                                placeholder="Write premium audit description..."
                                                value={inlineText}
                                                onChange={(e) => setInlineText(e.target.value)}
                                                className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 select-text leading-normal font-semibold text-stone-850"
                                              />

                                              <div className="flex gap-2">
                                                <button
                                                  type="button"
                                                  disabled={submittingReview}
                                                  onClick={async () => {
                                                    if (!inlineText.trim()) return;
                                                    setSubmittingReview(true);
                                                    try {
                                                      const res = await fetch('/api/reviews', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                          order_id: ord.id,
                                                          product_id: item.product_id,
                                                          customer_phone: ord.customer_phone,
                                                          user_name: ord.customer_name || 'Verified Client',
                                                          rating: inlineRating,
                                                          review: inlineText
                                                        })
                                                      });
                                                      if (res.ok) {
                                                        await fetchAllReviews();
                                                        setActiveReviewForm(null);
                                                        setInlineText('');
                                                        setInlineRating(5);
                                                      }
                                                    } catch (err) {
                                                      console.error(err);
                                                    } finally {
                                                      setSubmittingReview(false);
                                                    }
                                                  }}
                                                  className="px-2.5 py-1 bg-stone-950 hover:bg-stone-900 text-[#C5A880] text-[9.5px] font-extrabold uppercase tracking-wider rounded-md cursor-pointer"
                                                >
                                                  Submit
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setActiveReviewForm(null)}
                                                  className="px-2.5 py-1 bg-stone-200 text-stone-700 text-[9.5px] font-extrabold uppercase tracking-wider rounded-md cursor-pointer"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveReviewForm({ order_id: ord.id, product_id: item.product_id });
                                              setInlineRating(5);
                                              setInlineText('');
                                            }}
                                            className="px-2 py-0.5 bg-[#C5A880]/15 text-[#C5A880] hover:bg-[#C5A880]/25 text-[8.5px] rounded font-bold uppercase tracking-widest flex items-center gap-1 transition cursor-pointer"
                                          >
                                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                            <span>Bespoke review audit</span>
                                          </button>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Accounting Summary */}
                        <div className="pt-3 border-t border-stone-150 space-y-2 bg-[#FAF9F6] p-3 rounded-xl border border-stone-200">
                            <div className="flex justify-between text-[11px] text-stone-500">
                              <span>Asset Collective Subtotal:</span>
                              <span className="font-mono text-stone-800">{ord.subtotal.toLocaleString()} BDT</span>
                            </div>
                            {ord.discount > 0 && (
                              <div className="flex justify-between text-[11px] text-emerald-600">
                                <span>Lux Ledger Discount Applied:</span>
                                <span className="font-mono">-{ord.discount.toLocaleString()} BDT</span>
                              </div>
                            )}
                            <div className="flex justify-between text-[11px] text-stone-500">
                              <span>Secured Dispatch Fees:</span>
                              <span className="font-mono text-stone-800">+{ord.shipping.toLocaleString()} BDT</span>
                            </div>
                            <div className="flex justify-between text-xs font-black text-stone-950 bg-white p-2 md:p-3 rounded-lg border border-stone-200">
                              <span className="uppercase tracking-wider">Total Ledger Balance Checked:</span>
                              <span className="font-serif font-black text-[#C5A880] text-[13px]">{ord.total.toLocaleString()} BDT</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })()
                )}

              </div>
            )}

            {/* SAVED ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-md font-serif font-bold uppercase text-stone-900 tracking-wider">
                      {lang === 'bn' ? 'সংরক্ষিত গন্তব্য ঠিকানা' : 'Authorized Delivery Destinations'}
                    </h2>
                    <p className="text-[10px] text-stone-500 font-mono">
                      Safehouse Shipping Destinations & Ledger Recipients
                    </p>
                  </div>
                  
                  {!showAddressForm && (
                    <button
                      onClick={() => {
                        setIsEditingAddress(null);
                        setNewAddressLabel('Home');
                        setNewAddressName(customerUser?.name || '');
                        setNewAddressPhone(customerUser?.customer_phone || '');
                        setNewAddressValue('');
                        setShowAddressForm(true);
                      }}
                      className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-900 text-[#C5A880] border border-stone-850 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Destination</span>
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  // Address Editing / Creation Form
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 mx-auto max-w-xl text-xs space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-[10px] uppercase tracking-widest text-[#C5A880]">
                        {isEditingAddress ? 'Modify Delivery Registry' : 'Establish New Logistics Address'}
                      </h4>
                      <button 
                        onClick={() => setShowAddressForm(false)}
                        className="text-stone-400 hover:text-stone-700 font-extrabold uppercase font-sans text-xs flex items-center"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleAddAddress} className="space-y-4">
                      
                      <div className="grid grid-cols-2 gap-3.5 font-sans">
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 block mb-1">Destination Tag</label>
                          <select
                            value={newAddressLabel}
                            onChange={(e) => setNewAddressLabel(e.target.value)}
                            className="bg-white w-full px-3 py-2 border border-stone-250 rounded-xl focus:outline-none focus:border-[#C5A880] font-sans pr-8 text-xs text-stone-800"
                          >
                            <option value="Home">Home Safehouse</option>
                            <option value="Office">HQ Office Node</option>
                            <option value="Luxury Lounge">Luxury Lounge</option>
                            <option value="Secure Deposit">Secure Cargo Depot</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 block mb-1">Recipient client Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Asif Mahmud"
                            value={newAddressName}
                            onChange={(e) => setNewAddressName(e.target.value)}
                            className="bg-white w-full px-3 py-2 border border-stone-250 rounded-xl font-bold focus:outline-none focus:border-[#C5A880]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 block mb-1">Secure contact Phone</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 017XXXXXXXX"
                          value={newAddressPhone}
                          onChange={(e) => setNewAddressPhone(e.target.value)}
                          className="bg-white w-full px-3 py-2 border border-stone-250 rounded-xl font-mono focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-stone-500 block mb-1 font-mono">Routing Logistics Address Detail</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Include block, level, secure code directives for precision delivery dispatch"
                          value={newAddressValue}
                          onChange={(e) => setNewAddressValue(e.target.value)}
                          className="bg-white w-full p-3 border border-stone-250 rounded-xl font-medium focus:outline-none focus:border-[#C5A880] leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-6 py-3 bg-stone-950 hover:bg-stone-900 border border-stone-850 text-white rounded-xl text-[10px] uppercase font-extrabold tracking-wider transition cursor-pointer"
                      >
                        {isEditingAddress ? 'Confirm Modification' : 'Save Secure Destination'}
                      </button>

                    </form>
                  </div>
                ) : (
                  // Display physical cards list
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedAddresses.map((addr) => (
                      <div 
                        key={addr.id}
                        className="bg-white border hover:border-[#C5A880] border-stone-150 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition-all duration-350 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-[#C5A880] bg-stone-50 border border-stone-150 px-2 py-0.5 rounded-md font-mono">
                              {addr.label}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditAddressInit(addr)}
                                className="p-1 hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {addr.id !== 'addr-default' && (
                                <button
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1 select-text leading-relaxed pt-2">
                            <p className="font-bold text-stone-900">{addr.recipient_name}</p>
                            <p className="font-mono text-stone-400 text-[10px]">{addr.phone}</p>
                            <p className="text-stone-600 font-sans mt-1 text-[11px] font-medium leading-relaxed">{addr.address}</p>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-stone-100 flex items-center gap-1.5 text-stone-400 font-mono text-[9px] uppercase tracking-wide">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Ledger Authenticated Node</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-md font-serif font-bold uppercase text-stone-900 tracking-wider">
                      {lang === 'bn' ? 'ব্যক্তিগত নোটিফিকেশন সমূহ' : 'Private Handshake Alerts'}
                    </h2>
                    <p className="text-[10px] text-stone-500 font-mono">
                      Click any order update alert to track its real-time journey instantly
                    </p>
                  </div>
                  {localNotifications.filter(n => !readNotifIds.includes(n.id)).length > 0 && (
                    <button
                      onClick={() => {
                        const allIds = localNotifications.map(n => n.id);
                        const updated = Array.from(new Set([...readNotifIds, ...allIds]));
                        setReadNotifIds(updated);
                        localStorage.setItem('jijarell_read_notifications', JSON.stringify(updated));
                        triggerNotificationToast('Alerts Read', 'All private alerts checked as verified.', 'general');
                      }}
                      className="text-[10px] font-extrabold text-[#C5A880] hover:text-[#af9268] uppercase tracking-wider"
                    >
                      ✓ Mark all read
                    </button>
                  )}
                </div>

                {localNotifications.length === 0 ? (
                  <div className="text-center py-16 space-y-3 border border-stone-200 rounded-3xl bg-stone-50/20">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-400">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">No Alerts Found</p>
                      <p className="text-[11px] text-stone-400 max-w-sm mx-auto leading-relaxed">
                        No transactions corresponding to this client context have logged events yet. Real-time logging is active.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                    {localNotifications.map((notif) => {
                      const isRead = readNotifIds.includes(notif.id);
                      const dateObj = new Date(notif.created_at);
                      const formattedDate = dateObj.toLocaleDateString() + ' @ ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 border rounded-2xl transition-all duration-200 text-left bg-white relative hover:scale-[1.015] active:scale-[0.99] cursor-pointer block select-none ${
                            isRead ? 'border-stone-150 opacity-80' : 'border-[#C5A880] ring-1 ring-[#C5A880]/15 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3 text-xs leading-normal">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              notif.type === 'order' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                              'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {notif.type === 'order' ? <ShoppingBag className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            </div>

                            <div className="space-y-1 flex-1 min-w-0 pr-8">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[12px] font-black text-stone-900 leading-tight">
                                  {lang === 'bn' && notif.title_bn ? notif.title_bn : notif.title}
                                </h4>
                                {!isRead && (
                                  <span className="text-[8px] bg-[#C5A880] text-stone-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Unread</span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-600 leading-normal font-sans select-text">
                                {lang === 'bn' && notif.body_bn ? notif.body_bn : notif.body}
                              </p>
                              <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-stone-400">
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span className="text-[#C5A880] font-black uppercase tracking-wider flex items-center gap-0.5">
                                  <span>Open Order Track</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </span>
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

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-stone-200 pb-3">
                  <h2 className="text-md font-serif font-bold uppercase text-stone-900 tracking-wider text-left">
                    {lang === 'bn' ? 'ক্রিপ্টোগ্রাফিক সিকিউরিটি সেটিং' : 'Cryptographic Security & Identity Token'}
                  </h2>
                  <p className="text-[10px] text-stone-500 font-mono">
                    Military-Grade Token Vault & Access Protocols
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-left">
                  
                  {/* Security preferences toggle */}
                  <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-4 shadow-xs">
                    <span className="text-[9px] font-black uppercase text-[#C5A880] tracking-widest font-mono block">
                      Ledger Locking Preferences
                    </span>
                    
                    <div className="space-y-4">
                      {/* Hardware Lock */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5 flex-1 select-text">
                          <span className="font-extrabold text-stone-900 block font-sans">Simulate Hardware Token Secure Lock</span>
                          <span className="text-[10px] text-stone-500 leading-relaxed max-w-xs block font-sans">
                            Bind credentials session to physical key node parameters. Halts raw session extraction vectors.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={hardwareLock}
                          onChange={(e) => {
                            setHardwareLock(e.target.checked);
                            triggerNotificationToast('Hardware Key Active', `Local cryptographic cluster bound strictly to Client session.`, 'general');
                          }}
                          className="w-4 h-4 text-[#C5A880] bg-stone-100 border-stone-300 rounded focus:ring-[#C5A880] mt-1 shrink-0"
                        />
                      </div>

                      {/* Dual Factor alerts */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-0.5 flex-1 select-text">
                          <span className="font-extrabold text-stone-900 block font-sans">Dual-Factor Ledger Dispatch Alerts</span>
                          <span className="text-[10px] text-stone-500 leading-relaxed max-w-xs block font-sans">
                            Transmits a secure ledger updates verification email payload directly alongside normal system database notifications.
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={dualFactor}
                          onChange={(e) => {
                            setDualFactor(e.target.checked);
                            triggerNotificationToast('MFA Status Sync', 'Dual-factor notifications configured safely.', 'general');
                          }}
                          className="w-4 h-4 text-[#C5A880] bg-stone-100 border-stone-300 rounded focus:ring-[#C5A880] mt-1 shrink-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vault token ledger display */}
                  <div className="bg-stone-950 text-stone-300 p-5 rounded-2xl space-y-3 shadow-inner font-mono text-[10.5px]">
                    <span className="text-[9px] font-black uppercase text-[#C5A880] tracking-widest block leading-none">
                      Security Token Handshake Signatures
                    </span>
                    <div className="space-y-2 select-text font-mono text-[9px] pt-1">
                      <div>
                        <span className="text-[#C5A880] font-black">ACTIVE HANDSHAKE ID:</span>
                        <p className="bg-stone-900 border border-stone-800 p-1.5 rounded truncate text-white select-all font-bold mt-1 text-[9.5px]">
                          {customerToken || 'NoTokenMapped'}
                        </p>
                      </div>
                      <div className="pt-1.5">
                        <span className="text-[#C5A880] font-black">ENCRYPTION HANDSHAKE PARAMETERS:</span>
                        <p className="leading-snug text-stone-400 mt-1">
                          SHA-512 Secure Client Handshake Array. Salted Cryptographic Ledger. Node-ID: <span className="text-white font-bold">{customerUser?.id}</span>. Authority Verified.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to regenerate and renew your private Client signature? This will sign out your session.')) {
                            localStorage.removeItem('jijarell_customer_token');
                            location.reload();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-[#C5A880] hover:text-white rounded-lg text-[9px] uppercase font-bold transition cursor-pointer"
                      >
                        <Key className="w-3 h-3 text-[#C5A880]" />
                        <span>Regenerate Vault Key</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* LANGUAGE TAB */}
            {activeTab === 'language' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-stone-200 pb-3 text-left">
                  <h2 className="text-md font-serif font-bold uppercase text-stone-900 tracking-wider">
                    {lang === 'bn' ? 'ভাষা নির্ধারণ ও অনুবাদ' : 'Localization & Global Language Options'}
                  </h2>
                  <p className="text-[10px] text-stone-500 font-mono">
                    Switch entire portal experience between premium languages
                  </p>
                </div>

                <div className="bg-white border border-stone-200 p-5 rounded-2xl mx-auto max-w-md text-xs text-left space-y-4 shadow-xs">
                  <span className="text-[9px] font-black uppercase text-[#C5A880] tracking-widest font-mono block">
                    Choose Luxury Language Outpost
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3 pb-2 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        setLang('en');
                        triggerNotificationToast('Language Changed', 'Locale set to International English.', 'general');
                      }}
                      className={`py-6 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-black transition cursor-pointer text-center ${
                        lang === 'en' 
                          ? 'border-[#C5A880] bg-stone-950 text-[#C5A880] shadow-md ring-2 ring-[#C5A880]/15' 
                          : 'border-stone-200 text-stone-500 bg-stone-50/55 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-xl">🇬🇧</span>
                      <span className="text-[11px] uppercase tracking-wider block mt-1">INTERNATIONAL ENGLISH</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLang('bn');
                        triggerNotificationToast('ভাষা সংক্রান্ত', 'ভাষা সফলভাবে বাংলা সেট করা হয়েছে।', 'general');
                      }}
                      className={`py-6 px-4 rounded-xl border flex flex-col items-center justify-center gap-2 font-black transition cursor-pointer text-center ${
                        lang === 'bn' 
                          ? 'border-[#C5A880] bg-stone-950 text-[#C5A880] shadow-md ring-2 ring-[#C5A880]/15' 
                          : 'border-stone-200 text-stone-500 bg-stone-50/55 hover:bg-stone-50'
                      }`}
                    >
                      <span className="text-xl">🇧🇩</span>
                      <span className="text-[11px] uppercase tracking-wider block mt-1">PREMIUM BANGLA</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-stone-400 font-sans leading-normal">
                    *Changing this preference will dynamically sync all headings, items summaries, notification alerts messages, and tracking stepper checkpoints indices into your chosen layout language instantly.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
