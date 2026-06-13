import React, { useState, useEffect } from 'react';
import { 
  X, Search, Clock, ChevronDown, ChevronUp, CheckCircle2, 
  Truck, CreditCard, RefreshCw, AlertCircle, ShoppingBag, MapPin, 
  MessageSquare, Star, Mail, Phone, ShieldCheck, User
} from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

export default function OrderHistory({ isOpen, onClose, whatsappNumber = '8801712345678' }: OrderHistoryProps) {
  // Step-by-step state: 'email' | 'phone' | 'dashboard'
  const [step, setStep] = useState<'email' | 'phone' | 'dashboard'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Reviews systems inline
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [activeReviewForm, setActiveReviewForm] = useState<{order_id: string, product_id: string} | null>(null);
  const [inlineRating, setInlineRating] = useState(5);
  const [inlineText, setInlineText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const isValidEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  };

  const isValidPhone = (p: string) => {
    const clean = p.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 15;
  };

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

  // Check saved session in localStorage on open
  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('jijarell_verify_token');
      const savedEmail = localStorage.getItem('jijarell_verify_email');
      const savedPhone = localStorage.getItem('jijarell_verify_phone');

      if (savedToken && savedEmail && savedPhone) {
        setEmail(savedEmail);
        setPhone(savedPhone);
        setVerificationToken(savedToken);
        fetchOrdersWithToken(savedToken);
      } else {
        setStep('email');
        setEmail('');
        setPhone('');
        setVerificationToken(null);
        setOrders([]);
        setErrorMsg(null);
      }
      fetchAllReviews();
    }
  }, [isOpen]);

  const fetchOrdersWithToken = async (token: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/user-orders?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setOrders(result.orders || []);
          setStep('dashboard');
          if (result.orders && result.orders.length > 0) {
            setExpandedOrderId(result.orders[0].id);
          }
        } else {
          // Token invalid/expired
          clearSavedSession();
          setStep('email');
          setErrorMsg(result.error || 'Session expired. Please authenticate again.');
        }
      } else {
        clearSavedSession();
        setStep('email');
        setErrorMsg('Authentication error. Please re-verify.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error while retrieving client orders.');
    } finally {
      setLoading(false);
    }
  };

  const clearSavedSession = () => {
    localStorage.removeItem('jijarell_verify_token');
    localStorage.removeItem('jijarell_verify_email');
    localStorage.removeItem('jijarell_verify_phone');
    setVerificationToken(null);
    setOrders([]);
  };

  // Submit Step 1 (Email)
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid administrative email address.');
      return;
    }

    setStep('phone');
  };

  // Submit Step 2 (Phone & Verification Check)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!phone.trim()) {
      setErrorMsg('Please enter your contact phone number.');
      return;
    }
    if (!isValidPhone(phone)) {
      setErrorMsg('Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Authenticated! Save session details
        localStorage.setItem('jijarell_verify_token', data.token);
        localStorage.setItem('jijarell_verify_email', data.email);
        localStorage.setItem('jijarell_verify_phone', data.phone);
        
        setVerificationToken(data.token);
        
        // Fetch order details
        await fetchOrdersWithToken(data.token);
      } else {
        setErrorMsg(data.error || 'No matching active luxury orders discovered for this combination.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Concierge database connection timeout. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearSavedSession();
    setStep('email');
    setEmail('');
    setPhone('');
    setErrorMsg(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] border border-stone-200">
        
        {/* Modal Header */}
        <div className="bg-stone-950 text-white px-6 py-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5 text-left">
            <Clock className="w-5 h-5 text-[#C5A880]" />
            <div>
              <h3 className="text-xs font-serif font-black uppercase tracking-wider">Secure Order Terminal</h3>
              <p className="text-[9px] text-[#C5A880] font-mono uppercase tracking-widest">Real-Time verified customer logistics</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Notice Panel */}
        {errorMsg && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 animate-fadeIn text-left">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h5 className="text-[10px] font-black uppercase tracking-wider font-mono">Authentication Alert</h5>
              <p className="text-xs leading-relaxed font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Dynamic step-by-step content interface */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
          
          {/* STEP 1: Email Address Input */}
          {step === 'email' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[9px] font-black bg-[#C5A880]/10 text-[#C5A880] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  Step 1 of 2
                </span>
                <h4 className="text-sm font-serif font-black text-stone-950 uppercase tracking-tight pt-1.5">
                  Secure Customer Email Verification
                </h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Enter your registered client billing email sequence. Our corporate firewalls require this to index your luxury assets safely.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[9px] font-black uppercase tracking-wider text-stone-550 block font-mono">
                    Official Email Sequence
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      id="email"
                      type="email"
                      required
                      placeholder="e.g. client@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-stone-50 w-full pl-10 pr-4 py-3 border border-stone-250 rounded-xl select-text text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-950 focus:ring-1 focus:ring-stone-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-stone-950 hover:bg-stone-850 disabled:bg-stone-600 text-[#C5A880] rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Proceed to Phone Verification</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Phone Authentication */}
          {step === 'phone' && (
            <div className="space-y-6 text-left animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[9px] font-black bg-[#C5A880]/10 text-[#C5A880] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  Step 2 of 2
                </span>
                <h4 className="text-sm font-serif font-black text-stone-950 uppercase tracking-tight pt-1.5">
                  Contact Phone Number Verification
                </h4>
                <div className="flex justify-between items-center text-[11px] bg-stone-50 border border-stone-200 p-2.5 rounded-xl">
                  <span className="text-stone-500 font-mono truncate mr-2">Email: {email}</span>
                  <button 
                    type="button" 
                    onClick={() => setStep('email')}
                    className="text-[#C5A880] hover:underline font-extrabold text-[9.5px] uppercase font-mono shrink-0 cursor-pointer"
                  >
                    Edit Email
                  </button>
                </div>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-[9px] font-black uppercase tracking-wider text-stone-550 block font-mono">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input 
                      id="phone"
                      type="tel"
                      required
                      placeholder="e.g. 017XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-stone-50 w-full pl-10 pr-4 py-3 border border-stone-250 rounded-xl select-text text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-950 focus:ring-1 focus:ring-stone-950"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="px-5 border border-stone-250 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-stone-950 hover:bg-stone-850 disabled:bg-stone-600 text-[#C5A880] rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C5A880]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    )}
                    <span>Authenticate & Synchronize</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: LOGISTICS DASHBOARD WITH STUNNING RED STYLE IMPORTANT DATA HIGHLIGHTING */}
          {step === 'dashboard' && (
            <div className="space-y-5 text-left animate-fadeIn">
              
              {/* Dashboard Subheader */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex justify-between items-center gap-2 shadow-xs">
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest font-mono text-red-800">Verified Client Account</span>
                  <p className="text-xs text-red-950 font-bold truncate select-all">{email}</p>
                </div>
                <button 
                  onClick={handleReset}
                  className="px-3 py-1 bg-red-655 text-white hover:bg-red-700 text-[9.5px] tracking-wide font-black uppercase rounded-lg shadow-sm transition shrink-0 cursor-pointer"
                >
                  Clear Terminal Session
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-red-200 rounded-2xl bg-red-50/20 space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center mx-auto text-red-650">
                    <AlertCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-red-950 uppercase tracking-widest font-mono">No Active Assets Discovered</h4>
                    <p className="text-[11px] text-stone-500 max-w-sm mx-auto leading-relaxed">
                      You are authenticated, but we found no finalized client transactions mapping to your registry address. Check with your boutique operator.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[9px] uppercase font-mono font-black text-red-700 pl-1 tracking-wider">
                    <span>💳 Discovered {orders.length} secure tracking match(es)</span>
                    <span className="hidden sm:block">▼ Click matching card below to expand details</span>
                  </div>

                  <div className="space-y-3.5">
                    {orders.map((ord) => {
                      const isExpanded = expandedOrderId === ord.id;
                      const formattedDate = new Date(ord.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      const isDelivered = ord.status === 'delivered' || ord.status === 'completed';

                      return (
                        <div 
                          key={ord.id}
                          className={`border rounded-2xl overflow-hidden transition-all shadow-md group ${
                            isExpanded ? 'border-red-600 ring-2 ring-red-100' : 'border-red-200 hover:border-red-400'
                          }`}
                        >
                          {/* Card Summary - PURE RED HIGHLIGHTS */}
                          <div 
                            onClick={() => toggleExpand(ord.id)}
                            className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none bg-red-50/40 hover:bg-red-50/80 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black font-mono text-red-900 uppercase">
                                  #{ord.id}
                                </span>
                                <span className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                                  isDelivered ? 'bg-red-600 text-white border-red-700' :
                                  ord.status === 'shipped' ? 'bg-red-100 text-red-900 border-red-300' :
                                  ord.status === 'processing' ? 'bg-red-50 text-red-800 border-red-200' :
                                  ord.status === 'confirmed' ? 'bg-red-100 text-red-800 border-red-300' :
                                  ord.status === 'cancelled' ? 'bg-stone-100 text-stone-600 border-stone-200' :
                                  'bg-red-50 text-red-700 border-red-200 animate-pulse'
                                }`}>
                                  {ord.status === 'pending' ? 'Reviewing Details' : ord.status}
                                </span>

                                {isDelivered && (
                                  <span className="bg-emerald-50 text-emerald-850 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest text-[8.5px] border border-emerald-200 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Delivered status verified</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-red-750 font-mono font-extrabold">Order Date: {formattedDate}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-xs font-black text-red-900 block font-serif">
                                  {ord.total.toLocaleString()} BDT
                                </span>
                                <span className="text-[8.5px] text-red-700 font-bold font-mono uppercase block">
                                  {ord.items.length} {ord.items.length === 1 ? 'asset' : 'assets'}
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-red-700" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-red-700" />
                              )}
                            </div>
                          </div>

                          {/* Expandable Details Frame - ALL INTERIOR HIGHLY HIGHLIGHTED IN RED STYLE */}
                          {isExpanded && (
                            <div className="p-5 border-t border-red-200 bg-white space-y-5 animate-fadeIn">
                              
                              {/* Customer Identity Profile - HIGHLY HIGHLIGHTED RED CARD SECTION */}
                              <div className="bg-red-50/50 border-2 border-red-500 rounded-2xl p-4 text-left space-y-3">
                                <span className="text-[9.5px] font-black uppercase tracking-widest text-red-850 block font-mono">
                                  ⚠️ REGISTRATION & LOGISTICS ID MATCH
                                </span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="space-y-0.5">
                                    <span className="text-[8.5px] font-mono text-red-700 uppercase font-black block">Recipient Name</span>
                                    <span className="text-xs font-serif font-black text-red-950 uppercase block select-all">
                                      {ord.customer_name}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8.5px] font-mono text-red-700 uppercase font-black block">Client Email Address</span>
                                    <span className="text-xs font-mono font-black text-red-950 block select-all">
                                      {ord.customer_email || email}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8.5px] font-mono text-red-700 uppercase font-black block">Verified Mobile Number</span>
                                    <span className="text-xs font-mono font-black text-red-955 block select-all">
                                      {ord.customer_phone}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Logistics Pipeline Stepper tracker */}
                              <div className="bg-red-50/20 border border-red-200 rounded-xl p-4 text-left space-y-3">
                                <span className="text-[9px] font-black uppercase tracking-widest text-red-800 block font-mono">Realtime Logistics Pipeline</span>
                                
                                {ord.status === 'cancelled' ? (
                                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800">
                                    <AlertCircle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5 text-left">
                                      <h5 className="text-xs font-extrabold uppercase tracking-wide">Transaction reference voided</h5>
                                      <p className="text-[10.5px] text-red-700 leading-normal font-sans">
                                        This order reference has been cancelled. If you've submitted a deposit, contact client care.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-5 gap-1 relative pt-2">
                                    <div className="absolute top-[19px] left-6 right-6 h-0.5 bg-red-100" />
                                    
                                    {(() => {
                                      const states = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                                      let cur = ord.status as string;
                                      if (cur === 'completed') cur = 'delivered'; 
                                      const currentIndex = states.indexOf(cur);
                                      const pct = currentIndex < 0 ? 0 : (currentIndex / (states.length - 1)) * 100;
                                      return (
                                        <div 
                                          className="absolute top-[19px] left-6 h-0.5 bg-red-650 transition-all duration-500" 
                                          style={{ width: `calc(${pct}% - 12px)` }} 
                                        />
                                      );
                                    })()}

                                    {[
                                      { label: 'Placed', statusKey: 'pending', desc: 'Logged' },
                                      { label: 'Confirmed', statusKey: 'confirmed', desc: 'Verified' },
                                      { label: 'Processing', statusKey: 'processing', desc: 'Assembled' },
                                      { label: 'Shipped', statusKey: 'shipped', desc: 'In Transit' },
                                      { label: 'Delivered', statusKey: 'delivered', desc: 'Received' }
                                    ].map((step, idx) => {
                                      const states = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
                                      let cur = ord.status as string;
                                      if (cur === 'completed') cur = 'delivered'; 
                                      const orderStatusIndex = states.indexOf(cur);
                                      const isCompleted = idx <= orderStatusIndex;
                                      const isCurrent = idx === orderStatusIndex;

                                      return (
                                        <div key={idx} className="flex flex-col items-center text-center z-10 space-y-1 bg-white px-1">
                                          <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ring-4 transition-all duration-300 ${
                                            isCompleted 
                                              ? 'bg-red-650 text-white ring-red-100' 
                                              : 'bg-stone-100 text-stone-400 ring-stone-50'
                                          } ${isCurrent && cur !== 'delivered' ? 'animate-pulse ring-red-200' : ''}`}>
                                            {idx + 1}
                                          </div>
                                          <h5 className={`text-[9px] font-black uppercase tracking-tight leading-tight ${isCompleted ? 'text-red-900 font-black' : 'text-stone-400'}`}>
                                            {step.label}
                                          </h5>
                                          <span className="text-[7.5px] text-stone-400 font-mono tracking-tight hidden md:block leading-none">
                                            {step.desc}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Destination Specs / Detailed Invoice parameters */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-red-50/20 p-3 rounded-xl border border-red-200">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase text-red-800 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-red-600" />
                                    <span>Shipping Destination</span>
                                  </span>
                                  <p className="text-[11px] font-extrabold text-[#991B1B] leading-relaxed capitalize-first">
                                    {ord.customer_address}
                                  </p>
                                </div>
                                
                                <div className="space-y-1 md:border-l md:border-red-200 md:pl-4">
                                  <span className="text-[9px] font-black uppercase text-red-800 flex items-center gap-1">
                                    <CreditCard className="w-3 h-3 text-red-600" />
                                    <span>Ledger Audits</span>
                                  </span>
                                  <div className="text-[10px] space-y-0.5 text-stone-700">
                                    <div>Method: <strong className="text-red-900 uppercase font-black">{ord.payment_method}</strong></div>
                                    <div>Status: <strong className="text-red-900 uppercase font-black">{ord.payment_status}</strong></div>
                                    {ord.transaction_id && (
                                      <div className="truncate">Txn ID: <strong className="text-red-900 font-mono text-[9px] bg-white border border-red-200 px-1 rounded">{ord.transaction_id}</strong></div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Customer customization guidelines */}
                              {ord.customer_notes && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                                  <span className="text-[9.5px] font-black uppercase text-red-900 tracking-wide block">Bespoke custom order specifications:</span>
                                  <p className="text-[11px] text-red-950 italic font-semibold select-text">"{ord.customer_notes}"</p>
                                </div>
                              )}

                              {/* High-Value Asset Catalog listing (RED COLOR STYLE THEMED) */}
                              <div className="space-y-3 bg-red-50/10 border-2 border-red-200 rounded-2xl p-4 shadow-inner">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#991B1B] block font-mono pl-1">
                                  Associated Premium Assets ({ord.items.length})
                                </span>
                                
                                <div className="divide-y divide-red-100">
                                  {ord.items.map((item, index) => {
                                    return (
                                      <div key={item.id || index} className="py-2.5">
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                          <div className="flex items-center gap-3 min-w-0">
                                            {item.productImage ? (
                                              <img 
                                                src={item.productImage} 
                                                alt={item.productName} 
                                                className="w-10 h-10 object-cover rounded-md border border-red-200 shrink-0"
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <div className="w-10 h-10 bg-red-50 border border-red-150 rounded-md flex items-center justify-center shrink-0">
                                                <ShoppingBag className="w-4 h-4 text-red-400" />
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <h6 className="font-black text-[#7F1D1D] truncate select-all">{item.productName}</h6>
                                              {item.variantStr && (
                                                <span className="text-[9px] font-mono text-red-800 bg-red-50 px-1.5 py-0.5 rounded uppercase font-bold">
                                                  {item.variantStr}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="text-right shrink-0">
                                            <span className="text-[#991B1B] font-extrabold block">{item.price.toLocaleString()} BDT</span>
                                            <span className="text-[9.5px] text-red-700 font-mono font-bold">Quantity: {item.quantity}</span>
                                          </div>
                                        </div>

                                        {/* Inline verified review triggers */}
                                        {isDelivered && (
                                          <div className="mt-2 text-left">
                                            {(() => {
                                              const existingReview = allReviews.find(r => r.product_id === item.product_id && r.order_id === ord.id);
                                              const isFormOpen = activeReviewForm?.order_id === ord.id && activeReviewForm?.product_id === item.product_id;
                                              
                                              if (existingReview) {
                                                return (
                                                  <div className="p-3 bg-red-50/55 border border-red-200 rounded-xl space-y-1 text-left mt-1.5">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex gap-0.5">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                          <Star 
                                                            key={i} 
                                                            className={`w-3 h-3 ${i < existingReview.rating ? 'fill-amber-500 text-amber-500' : 'text-red-200'}`} 
                                                          />
                                                        ))}
                                                      </div>
                                                      <span className="text-[8.5px] font-mono text-red-700 font-bold">
                                                        Verified cargo receipt review
                                                      </span>
                                                    </div>
                                                    <p className="text-[11px] font-sans text-red-950 italic">"{existingReview.review}"</p>
                                                    
                                                    {existingReview.admin_reply && (
                                                      <div className="mt-2 bg-red-100/40 p-2.5 rounded-lg border border-red-200 space-y-0.5 leading-normal">
                                                        <span className="text-[8.5px] font-black tracking-widest text-[#C5A880] uppercase block">💎 Concierge Reply:</span>
                                                        <p className="text-[10.5px] text-red-900 font-medium">"{existingReview.admin_reply}"</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              }

                                              if (isFormOpen) {
                                                return (
                                                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 mt-1.5 animate-fadeIn">
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-[8px] font-black uppercase text-red-800 tracking-wider font-mono">Publish Custom Registry Audit</span>
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
                                                      placeholder="Write premium asset verification review details here..."
                                                      value={inlineText}
                                                      onChange={(e) => setInlineText(e.target.value)}
                                                      className="w-full text-xs p-2 bg-white border border-red-200 rounded-lg focus:outline-none focus:border-red-650 focus:ring-1 focus:ring-red-650 select-text leading-normal font-semibold text-stone-850"
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
                                                        className="px-2.5 py-1 bg-red-700 hover:bg-red-855 text-white text-[9.5px] font-extrabold uppercase tracking-wider rounded-md cursor-pointer"
                                                      >
                                                        Submit Review Audit
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
                                                  className="px-2.5 py-1 bg-red-100 text-red-800 hover:bg-red-200 text-[9px] rounded font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                                                >
                                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                                  <span>Provide Registry Audit Review</span>
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

                              {/* Order Accounting Summary Details - PURE RED STYLED EMPHASIS */}
                              <div className="pt-3 border-t border-red-200 space-y-2 bg-red-50/10 p-4 rounded-2xl border-2 border-dashed border-red-300">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#991B1B] block font-mono pl-0.5">
                                  FINANCIAL LEDGER REPORT
                                </span>
                                <div className="flex justify-between text-[11px] text-red-950 font-bold">
                                  <span>Subtotal:</span>
                                  <span className="font-mono text-red-900">{ord.subtotal.toLocaleString()} BDT</span>
                                </div>

                                {ord.discount > 0 && (
                                  <div className="flex justify-between text-[11px] text-red-750 font-black font-mono">
                                    <span>Applied Code Discount:</span>
                                    <span>-{ord.discount.toLocaleString()} BDT</span>
                                  </div>
                                )}

                                <div className="flex justify-between text-[11px] text-red-950 font-bold">
                                  <span>Secure Cargo & Dispatch Fees:</span>
                                  <span className="font-mono text-red-900">+{ord.shipping.toLocaleString()} BDT</span>
                                </div>

                                <div className="flex justify-between text-xs font-black text-white bg-red-650 p-3 rounded-xl shadow-inner border border-red-700">
                                  <span className="uppercase tracking-widest font-mono">Total Price</span>
                                  <span className="font-serif leading-none text-sm">{ord.total.toLocaleString()} BDT</span>
                                </div>

                                {/* Support link */}
                                <div className="pt-2">
                                  <a
                                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                      `*JIJARELL LUXURY COURIER INQUIRY*\n` +
                                      `Verified Client: *${ord.customer_name}*\n` +
                                      `Tracking Identifier: *${ord.id}*\n` +
                                      `Logistics Status: ${ord.status.toUpperCase()}\n\n` +
                                      `Requesting professional support review for my synchronized premium purchase.`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full py-2.5 bg-red-700 hover:bg-red-800 text-white font-extrabold uppercase text-[10px] tracking-widest rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md transition duration-200"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Immediate WhatsApp Support</span>
                                  </a>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 border-t border-stone-200 p-4 flex items-center justify-between shrink-0">
          <p className="text-[9px] text-stone-400 font-mono">Precision Swiss Tourbillons, Bespoke Tailoring & Concierge.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-950 hover:bg-stone-850 text-[#C5A880] font-black uppercase text-[10px] tracking-widest rounded-lg cursor-pointer transition shadow-xs"
          >
            Close Terminal
          </button>
        </div>

      </div>
    </div>
  );
}
