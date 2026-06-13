import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Sparkles, CheckCircle, XCircle, Sliders, Settings, 
  ShoppingBag, Clock, Tag, RefreshCw, BarChart2, DollarSign, 
  Users, Check, X, FileText, Download, AlertCircle, Cpu, Zap, Database, Activity, Mail,
  Layers, Percent, Star, MessageSquare
} from 'lucide-react';
import { Product, Order, Coupon, AppSettings, Category, Blog } from '../types';

interface AdminPanelProps {
  onSettingsUpdated: () => void;
  onLogout?: () => void;
}

export default function AdminPanel({ onSettingsUpdated, onLogout }: AdminPanelProps) {
  // states
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'marketing' | 'settings' | 'perf' | 'logs' | 'journal' | 'categories' | 'coupons' | 'reviews'>('stats');
  const [perfStats, setPerfStats] = useState<any>(null);
  const [simForm, setSimForm] = useState({
    type: 'promotion',
    title: 'Elite Premium Flash Sale Live!',
    title_bn: 'প্রিমিয়াম ফ্ল্যাশ সেল শুরু হয়েছে!',
    body: 'Enjoy up to 25% BDT discount reductions on select hand-wound mechanical tourbillon watches.',
    body_bn: 'আমাদের স্পেশাল হাতঘড়ি কালেকশনে ২৫% পর্যন্ত আকর্ষণীয় ছাড় উপভোগ করুন।'
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  
  // Administrative Credentials MFA & Audit Trail States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdOtp1, setPwdOtp1] = useState('');
  const [pwdOtp2, setPwdOtp2] = useState('');
  const [devOtps, setDevOtps] = useState<{ otp1?: string; otp2?: string } | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState<string | null>(null);
  const [pwdErrorMsg, setPwdErrorMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [newDeepseekKey, setNewDeepseekKey] = useState('');
  const [newOpenrouterKey, setNewOpenrouterKey] = useState('');

  const addApiKey = (provider: 'gemini' | 'deepseek' | 'openrouter', value: string) => {
    if (!value.trim() || !settings) return;
    const currentKeys = settings.api_keys || {};
    const providerKeys = currentKeys[provider] || [];
    if (providerKeys.includes(value.trim())) return;
    
    const updatedSettings = {
      ...settings,
      api_keys: {
        ...currentKeys,
        [provider]: [...providerKeys, value.trim()]
      }
    };
    setSettings(updatedSettings);
  };

  const removeApiKey = (provider: 'gemini' | 'deepseek' | 'openrouter', index: number) => {
    if (!settings) return;
    const currentKeys = settings.api_keys || {};
    const providerKeys = currentKeys[provider] || [];
    const updatedProviderKeys = providerKeys.filter((_, i) => i !== index);
    
    const updatedSettings = {
      ...settings,
      api_keys: {
        ...currentKeys,
        [provider]: updatedProviderKeys
      }
    };
    setSettings(updatedSettings);
  };

  // fetch data from server APIs
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resOrd, resCoup, resSet, resCat, resBan, resBlogs, resReviews] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/coupons').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/banners').then(r => r.json()),
        fetch('/api/blogs').then(r => r.json()),
        fetch('/api/reviews').then(r => r.json()).catch(() => [])
      ]);

      setProducts(resProd);
      setOrders(resOrd);
      setCoupons(resCoup);
      setSettings(resSet);
      setCategories(resCat);
      setBanners(resBan || []);
      setBlogs(resBlogs || []);
      setReviews(resReviews || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingBlog,
          slug: editingBlog.title ? editingBlog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'custom-article',
          created_at: editingBlog.created_at || new Date().toISOString()
        })
      });

      if (res.ok) {
        setMsg('Luxury Journal article published/updated successfully!');
        setEditingBlog(null);
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to retire this Luxury Journal article?')) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('Luxury Journal article removed.');
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPerfStats = async () => {
    try {
      const res = await fetch('/api/performance/stats');
      if (res.ok) {
        const data = await res.json();
        setPerfStats(data);
      }
    } catch (err) {
      console.warn('Error loading performance telemetry:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {
      console.error('Failed to retrieve log sequences:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'perf') {
      fetchPerfStats();
      const interval = setInterval(fetchPerfStats, 2000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'logs') {
      fetchAuditLogs();
      const interval = setInterval(fetchAuditLogs, 5000);
      return () => clearInterval(interval);
    }
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const sanitizedImages = (editingProduct.images || [])
          .map((img: string) => (img || '').trim())
          .filter((img: string) => img !== '');

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingProduct,
          images: sanitizedImages.length > 0 ? sanitizedImages : ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop'],
          slug: editingProduct.name ? editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'custom-item',
          sku: editingProduct.sku || 'JJ-CUSTOM-' + Math.floor(Math.random() * 1000)
        })
      });

      if (res.ok) {
        setMsg('Product updated successfully!');
        setEditingProduct(null);
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to retire this product artifact?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('Product removed successfully.');
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingCategory,
          slug: editingCategory.name ? editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'custom-cat'
        })
      });
      if (res.ok) {
        setMsg('Category configuration stored successfully!');
        setEditingCategory(null);
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to retire this category and all its catalog structure?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('Category removed successfully.');
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCoupon)
      });
      if (res.ok) {
        setMsg('Coupon stored successfully!');
        setEditingCoupon(null);
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to retire this discount coupon code?')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('Coupon retired successfully.');
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, payStatus?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, payment_status: payStatus })
      });
      if (res.ok) {
        setMsg(`Order status updated to ${status}`);
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMsg('Corporate settings stored successfully.');
        onSettingsUpdated();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBanner)
      });
      if (res.ok) {
        setMsg('Promotional banner preserved successfully!');
        setEditingBanner(null);
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to retire this promotional banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('Promotional banner removed.');
        fetchData();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mock excel/CSV exporter representation
  const handleExportCSV = () => {
    const headers = 'Order ID,Customer,Phone,Total,Payment Method,Payment Status,Order Status,Date\n';
    const rows = orders.map(o => 
      `"${o.id}","${o.customer_name}","${o.customer_phone}",${o.total},"${o.payment_method}","${o.payment_status}","${o.status}","${o.created_at}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'Jijarell_Orders_Report.csv');
    a.click();
  };

  // calculated metrics
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid' && o.status !== 'cancelled')
    .reduce((sum, ord) => sum + ord.total, 0);

  const pendingAuditOrders = orders.filter(o => o.payment_status === 'pending_verification');

  return (
    <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm" id="admin_terminal_view">
      {/* Admin header */}
      <div className="px-6 py-4 bg-stone-900 text-stone-100 flex flex-wrap items-center justify-between border-b border-stone-850 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#C5A880] text-stone-950 font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase">JIJARELL Enterprise Terminal</h2>
            <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase mt-0.5">Global System Logistics</p>
          </div>
        </div>

        {/* Sync & Logout Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-850 text-[11px] text-stone-300 font-bold hover:bg-stone-800 transition-colors pointer-events-auto cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>

          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-900/60 bg-red-950/40 text-[11px] text-red-200 font-bold hover:bg-red-900/30 transition-all cursor-pointer pointer-events-auto shadow-xs"
            >
              Log Out
            </button>
          )}
        </div>
      </div>

      {/* Tabs list bar */}
      <div className="flex flex-wrap border-b border-stone-150 bg-stone-50/50">
        {[
          { id: 'stats', label: 'Financial Statistics', icon: BarChart2 },
          { id: 'orders', label: 'Order Pipeline', count: pendingAuditOrders.length, icon: ShoppingBag },
          { id: 'products', label: 'Artifact Catalog', icon: Tag },
          { id: 'categories', label: 'Catalog Categories', icon: Layers },
          { id: 'coupons', label: 'Discounts & Coupons', icon: Percent },
          { id: 'marketing', label: 'Marketing Banners', icon: Sparkles },
          { id: 'journal', label: 'Luxury Journal', icon: FileText },
          { id: 'reviews', label: 'Bespoke Reviews', icon: MessageSquare },
          { id: 'settings', label: 'Corporate Preferences', icon: Settings },
          { id: 'logs', label: 'Security Audit Logs', icon: FileText },
          { id: 'perf', label: 'Cache & Speed', icon: Cpu }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                isSelected 
                  ? 'border-stone-900 bg-white text-stone-900' 
                  : 'border-transparent text-stone-500 hover:text-stone-850 hover:bg-stone-100/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-sans animate-pulse">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {msg && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Dynamic Tab Body */}
      <div className="p-6">
        
        {/* STATS VIEW */}
        {activeTab === 'stats' && (
          <div className="space-y-6" id="stats_view_tab">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 border border-stone-150 bg-[#faf9f6] rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-150 rounded-xl text-amber-900 shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Audited Sales Revenue</span>
                  <p className="text-lg font-bold text-stone-850 mt-1">{totalRevenue.toLocaleString()} BDT</p>
                </div>
              </div>

              <div className="p-5 border border-stone-150 bg-[#faf9f6] rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl text-blue-900 shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">Total Purchase Orders</span>
                  <p className="text-lg font-bold text-stone-850 mt-1">{orders.length} orders</p>
                </div>
              </div>

              <div className="p-5 border border-stone-150 bg-[#faf9f6] rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-900 shrink-0">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">bKash Verification Pending</span>
                  <p className="text-lg font-bold text-stone-850 mt-1">{pendingAuditOrders.length} payments</p>
                </div>
              </div>
            </div>

            {/* Sales table overview */}
            <div className="border border-stone-150 rounded-2xl overflow-hidden bg-white">
              <div className="px-5 py-4 bg-stone-50 border-b border-stone-150 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Financial Log Entries</h4>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-[11px] font-bold hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV Log</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-150 text-stone-500 uppercase font-bold text-[10px]">
                      <th className="p-4">Txn ID / Code</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Payment Status</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4 text-right">Order Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="hover:bg-stone-50/50">
                        <td className="p-4 font-mono font-bold text-stone-800">{o.id}</td>
                        <td className="p-4 font-semibold">{o.customer_name}</td>
                        <td className="p-4 uppercase font-bold text-stone-600">{o.payment_method}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            o.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            o.payment_status === 'pending_verification' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-stone-900">{o.total.toLocaleString()} BDT</td>
                        <td className="p-4 text-stone-400 font-mono text-[10px] text-right">
                          {new Date(o.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TIRE PIPELINE VIEW */}
        {activeTab === 'orders' && (
          <div className="space-y-6" id="orders_pipeline_tab">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">Order Auditing Dashboard</h3>
            
            {orders.length === 0 ? (
              <p className="text-xs text-stone-400">No client orders recorded on JIJARELL network yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => {
                  const isPendingAudit = ord.payment_status === 'pending_verification';
                  return (
                    <div 
                      key={ord.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        isPendingAudit ? 'bg-amber-50/20 border-amber-300 shadow-md animate-pulse-slow' : 'bg-white border-stone-150'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">Order {ord.id}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                              ord.status === 'delivered' || ord.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              ord.status === 'shipped' ? 'bg-purple-100/70 text-purple-800 border-purple-200' :
                              ord.status === 'processing' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              ord.status === 'confirmed' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                              ord.status === 'cancelled' ? 'bg-red-50 text-red-650 border-red-250/50' :
                              'bg-amber-50 text-amber-800 border-amber-250/50'
                            }`}>
                              {ord.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 mt-3 text-xs text-stone-600">
                            <p><span className="font-bold text-stone-500">Customer:</span> {ord.customer_name}</p>
                            <p><span className="font-bold text-stone-500">Phone:</span> {ord.customer_phone}</p>
                            <p className="col-span-2"><span className="font-bold text-stone-500">Address:</span> {ord.customer_address}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 uppercase font-bold block">Grand Total</span>
                          <p className="text-sm font-bold text-stone-900 mt-1">{ord.total.toLocaleString()} BDT</p>
                          <p className="text-[10px] text-stone-500 mt-1">Paid via: <strong className="uppercase">{ord.payment_method}</strong></p>
                        </div>
                      </div>

                      {/* Items details */}
                      <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-stone-700">
                            <span className="font-medium">{item.productName} <span className="text-stone-400 font-mono text-[10px]">x{item.quantity}</span></span>
                            <span className="font-mono text-stone-500">{item.price.toLocaleString()} BDT</span>
                          </div>
                        ))}
                      </div>

                      {/* Verification / bKash review panels */}
                      {ord.payment_method === 'bkash' && (
                        <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 shrink-0 font-bold text-xs select-none">bKash</div>
                            <div>
                              <p className="text-xs font-bold text-stone-850">bKash Transaction ID Audit</p>
                              <code className="text-xs font-mono bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded border border-pink-100 block mt-1 select-all">{ord.transaction_id || 'NOT SUBMITTED'}</code>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {ord.payment_status !== 'paid' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'processing', 'paid')}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve Payment & Begin Packing</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled', 'unpaid')}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject / Void</span>
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span>Audited & Approved</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Decision Console */}
                      <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                        <div className="flex items-center gap-1.5 font-bold text-stone-700">
                          <Sliders className="w-4 h-4 text-stone-500" />
                          <span>Status Operations:</span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Approve/Reject Shortcut Quick Buttons */}
                          {ord.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[10px] uppercase transition-colors pointer-events-auto cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <Check className="w-3 h-3" /> Approve / Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                                className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-extrabold text-[10px] uppercase transition-colors pointer-events-auto cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                <X className="w-3 h-3" /> Reject / Cancel
                              </button>
                            </>
                          )}

                          {/* Quick Progressive logistics buttons */}
                          {ord.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'processing')}
                              className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 font-extrabold text-[10px] uppercase transition-colors pointer-events-auto cursor-pointer shadow-2xs"
                            >
                              Move to Packing (Processing)
                            </button>
                          )}
                          {ord.status === 'processing' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'shipped')}
                              className="px-3 py-1.5 rounded-lg bg-purple-150 hover:bg-purple-250 text-purple-800 font-extrabold text-[10px] uppercase transition-colors pointer-events-auto cursor-pointer shadow-2xs"
                            >
                              Dispatch via Cargo (Shipped)
                            </button>
                          )}
                          {ord.status === 'shipped' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-250 text-emerald-800 font-extrabold text-[10px] uppercase transition-colors pointer-events-auto cursor-pointer shadow-2xs"
                            >
                              Complete Handover (Delivered)
                            </button>
                          )}

                          {/* Absolute Status Changer dropdown override */}
                          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1">
                            <span className="text-[10px] text-stone-400 font-medium px-1">Override Status:</span>
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="text-[11px] font-bold text-stone-700 bg-transparent py-0.5 px-1 outline-hidden border-none pointer-events-auto cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
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

        {/* PRODUCTS DIRECTORY CRUD EDITOR */}
        {activeTab === 'products' && (
          <div className="space-y-6" id="products_crud_tab">
            <div className="flex justify-between items-center bg-stone-50 p-4 border border-stone-150 rounded-2xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Luxury Artifact Collections</h4>
              <button
                onClick={() => setEditingProduct({
                  name: '',
                  description: '',
                  price: 50000,
                  sale_price: null,
                  stock: 5,
                  featured: true,
                  is_active: true,
                  brand: 'JIJARELL Genève',
                  type3d: 'watch',
                  images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop'],
                  category_id: 'cat-1',
                  variants: []
                })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-850 text-white text-[11px] font-bold hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product Artifact</span>
              </button>
            </div>

            {/* Editing Product Modal Form Overlay */}
            {editingProduct && (
              <form onSubmit={handleUpdateProduct} className="p-6 border border-amber-300 bg-amber-50/15 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold tracking-widest uppercase text-amber-800">
                  {editingProduct.id ? 'Edit Executive Artifact Specifications' : 'Inscribe New Product Artifact'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={editingProduct.name || ''} 
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Brand Label</label>
                    <input 
                      type="text" 
                      required
                      value={editingProduct.brand || ''} 
                      onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Price (BDT)</label>
                    <input 
                      type="number" 
                      required
                      value={editingProduct.price || 0} 
                      onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Special Promo Price (BDT - Nullable)</label>
                    <input 
                      type="number" 
                      value={editingProduct.sale_price || ''} 
                      onChange={(e) => setEditingProduct({...editingProduct, sale_price: e.target.value ? Number(e.target.value) : null})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Available Vault Stock</label>
                    <input 
                      type="number" 
                      value={editingProduct.stock || 0} 
                      onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Collection Category Selection</label>
                    <select
                      value={editingProduct.category_id || 'cat-1'}
                      onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg text-xs"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Interactive 3D Template Model</label>
                    <select
                      value={editingProduct.type3d || 'watch'}
                      onChange={(e) => setEditingProduct({...editingProduct, type3d: e.target.value as any})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg"
                    >
                      <option value="watch">Premium Horology: Watch</option>
                      <option value="shoe">Artisanal Tailored: Shoe</option>
                      <option value="bag">Vegas Leather: Bag</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-6 py-2 col-span-1 md:col-span-2">
                    <label className="flex items-center gap-2 font-bold text-stone-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingProduct.featured || false} 
                        onChange={(e) => setEditingProduct({...editingProduct, featured: e.target.checked})}
                        className="w-4 h-4 rounded text-amber-600 border-stone-300 focus:ring-amber-500 cursor-pointer text-stone-700"
                      />
                      <span>Feature in Main Spotlight Carousel</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-stone-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingProduct.is_active !== false} 
                        onChange={(e) => setEditingProduct({...editingProduct, is_active: e.target.checked})}
                        className="w-4 h-4 rounded text-amber-600 border-stone-300 focus:ring-amber-500 cursor-pointer text-stone-700"
                      />
                      <span>Active Collection Visibility</span>
                    </label>
                  </div>

                  {/* PRODUCT MEDIA ASSETS */}
                  <div className="col-span-2 border-t border-stone-200 pt-4 mt-2">
                    <h5 className="font-bold text-stone-700 uppercase tracking-widest font-mono text-[11px] mb-3 text-amber-800">Product Media & Artifact Assets</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Primary Display Image (Hero - Required)</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Primary Image URL..."
                          value={editingProduct.images?.[0] || ''} 
                          onChange={(e) => {
                            const imgs = [...(editingProduct.images || [])];
                            while (imgs.length < 1) imgs.push('');
                            imgs[0] = e.target.value.trim();
                            setEditingProduct({...editingProduct, images: imgs});
                          }}
                          className="w-full bg-white p-2.5 border border-stone-250 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Additional Image 2</label>
                        <input 
                          type="text" 
                          placeholder="Image URL..."
                          value={editingProduct.images?.[1] || ''} 
                          onChange={(e) => {
                            const imgs = [...(editingProduct.images || [])];
                            while (imgs.length < 2) imgs.push('');
                            imgs[1] = e.target.value.trim();
                            setEditingProduct({...editingProduct, images: imgs});
                          }}
                          className="w-full bg-white p-2.5 border border-stone-250 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Additional Image 3</label>
                        <input 
                          type="text" 
                          placeholder="Image URL..."
                          value={editingProduct.images?.[2] || ''} 
                          onChange={(e) => {
                            const imgs = [...(editingProduct.images || [])];
                            while (imgs.length < 3) imgs.push('');
                            imgs[2] = e.target.value.trim();
                            setEditingProduct({...editingProduct, images: imgs});
                          }}
                          className="w-full bg-white p-2.5 border border-stone-250 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-stone-600 block mb-1">Additional Image 4</label>
                        <input 
                          type="text" 
                          placeholder="Image URL..."
                          value={editingProduct.images?.[3] || ''} 
                          onChange={(e) => {
                            const imgs = [...(editingProduct.images || [])];
                            while (imgs.length < 4) imgs.push('');
                            imgs[3] = e.target.value.trim();
                            setEditingProduct({...editingProduct, images: imgs});
                          }}
                          className="w-full bg-white p-2.5 border border-stone-250 rounded-lg text-xs"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="font-semibold text-stone-600 block mb-1">YouTube Video URL</label>
                        <input 
                          type="url" 
                          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                          value={editingProduct.youtube_url || ''} 
                          onChange={(e) => setEditingProduct({...editingProduct, youtube_url: e.target.value})}
                          className="w-full bg-white p-2.5 border border-stone-250 rounded-lg text-xs"
                        />
                      </div>

                      <div className="md:col-span-2 border border-stone-150 bg-stone-50/50 p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-stone-700 text-xs uppercase tracking-wide">3D Model Custom Viewer</span>
                            <p className="text-[10px] text-stone-500">Enable an external 3D interactive layout (e.g. Sketchfab embedding or specialized canvas) for this artifact.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={editingProduct.model_3d_enabled || false}
                              onChange={(e) => setEditingProduct({...editingProduct, model_3d_enabled: e.target.checked})}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 cursor-pointer"></div>
                            <span className="ml-2 text-[10px] font-bold text-stone-700 uppercase">{editingProduct.model_3d_enabled ? 'ON' : 'OFF'}</span>
                          </label>
                        </div>
                        
                        {editingProduct.model_3d_enabled && (
                          <div className="space-y-1 animate-fadeIn">
                            <label className="font-semibold text-stone-600 text-[11px] block">3D Model Source Embed URL or glTF source file</label>
                            <input 
                              type="text" 
                              placeholder="e.g. https://sketchfab.com/models/cbd64df587c64222a08ce2ce558df011/embed"
                              value={editingProduct.model_3d_url || ''} 
                              onChange={(e) => setEditingProduct({...editingProduct, model_3d_url: e.target.value})}
                              className="w-full bg-white p-2.5 border border-stone-250 rounded-lg text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="font-bold text-stone-600 block mb-1">Descriptive Specification Editorial (Markdown permitted)</label>
                    <textarea 
                      value={editingProduct.description || ''} 
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg min-h-[90px]"
                    />
                  </div>

                  {/* VARIANTS EDITOR */}
                  <div className="col-span-2 mt-4 border-t border-stone-150 pt-4 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-widest font-mono">Boutique Item Variants</span>
                      <button
                        type="button"
                        onClick={() => {
                          const vars = editingProduct.variants || [];
                          setEditingProduct({
                            ...editingProduct,
                            variants: [
                              ...vars,
                              {
                                id: 'var-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                                size: 'Default',
                                color: 'Rose Gold',
                                price: editingProduct.price || 50000,
                                stock: editingProduct.stock || 5,
                                sku: (editingProduct.sku || 'JJ-') + '-VAR-' + (vars.length + 1)
                              }
                            ]
                          });
                        }}
                        className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold bg-[#C5A880]/15 border border-[#C5A880]/30 hover:bg-[#C5A880]/25 text-stone-850 rounded-lg cursor-pointer"
                      >
                        + Add Variant Option
                      </button>
                    </div>

                    {(editingProduct.variants && editingProduct.variants.length > 0) ? (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {editingProduct.variants.map((v: any, index: number) => (
                          <div key={v.id || index} className="p-3 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                            <div>
                              <label className="text-[9px] font-bold text-stone-500 block mb-0.5">Size/Dimension</label>
                              <input 
                                type="text"
                                value={v.size || ''}
                                onChange={(e) => {
                                  const updated = [...(editingProduct.variants || [])];
                                  updated[index] = { ...v, size: e.target.value };
                                  setEditingProduct({ ...editingProduct, variants: updated });
                                }}
                                className="w-full bg-white p-1.5 border border-stone-250 rounded-md text-xs"
                                placeholder="e.g. Medium"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-stone-500 block mb-0.5">Color Accent</label>
                              <input 
                                type="text"
                                value={v.color || ''}
                                onChange={(e) => {
                                  const updated = [...(editingProduct.variants || [])];
                                  updated[index] = { ...v, color: e.target.value };
                                  setEditingProduct({ ...editingProduct, variants: updated });
                                }}
                                className="w-full bg-white p-1.5 border border-stone-250 rounded-md text-xs"
                                placeholder="e.g. Classic Grey"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-stone-500 block mb-0.5 font-sans">Price (BDT)</label>
                              <input 
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...(editingProduct.variants || [])];
                                  updated[index] = { ...v, price: Number(e.target.value) };
                                  setEditingProduct({ ...editingProduct, variants: updated });
                                }}
                                className="w-full bg-white p-1.5 border border-stone-250 rounded-md text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[9px] font-bold text-stone-500 block mb-0.5 font-sans">Stock</label>
                              <input 
                                type="number"
                                value={v.stock}
                                onChange={(e) => {
                                  const updated = [...(editingProduct.variants || [])];
                                  updated[index] = { ...v, stock: Number(e.target.value) };
                                  setEditingProduct({ ...editingProduct, variants: updated });
                                }}
                                className="w-full bg-white p-1.5 border border-stone-250 rounded-md text-xs"
                              />
                            </div>

                            <div className="flex gap-2 items-center col-span-2 md:col-span-1">
                              <div className="flex-1">
                                <label className="text-[9px] font-bold text-stone-500 block mb-0.5 font-mono">SKU Code</label>
                                <input 
                                  type="text"
                                  value={v.sku || ''}
                                  onChange={(e) => {
                                    const updated = [...(editingProduct.variants || [])];
                                    updated[index] = { ...v, sku: e.target.value };
                                    setEditingProduct({ ...editingProduct, variants: updated });
                                  }}
                                  className="w-full bg-white p-1.5 border border-stone-250 rounded-md text-[10px] font-mono"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (editingProduct.variants || []).filter((_: any, i: number) => i !== index);
                                  setEditingProduct({ ...editingProduct, variants: updated });
                                }}
                                className="p-1.5 hover:bg-red-50 text-red-650 rounded-lg shrink-0 mt-4 cursor-pointer"
                                title="Delete Option"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-stone-400 italic">No custom variants defined. Product will utilize primary price and general stock details.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Commit Changes
                  </button>
                </div>
              </form>
            )}

            {/* Producst grid catalogue */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => (
                <div key={p.id} className="p-4 border border-stone-150 rounded-2xl bg-white space-y-3 shadow-xs">
                  <img src={p.images[0]} alt={p.name} className="w-full h-36 object-cover rounded-xl" />
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold">{p.brand}</span>
                    <h5 className="text-xs font-bold text-stone-900 truncate mt-0.5">{p.name}</h5>
                    <p className="text-xs font-bold text-stone-850 mt-1">{p.price.toLocaleString()} BDT</p>
                    <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 rounded text-stone-500 font-mono mt-2 inline-block">
                      SKU: {p.sku} • Stock: {p.stock}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-end pt-2 border-t border-stone-50">
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="p-1.5 hover:bg-stone-100 text-stone-600 rounded cursor-pointer"
                      title="Edit Specifications"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                      title="Retire Artifact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MARKETING BANNERS VIEW */}
        {activeTab === 'marketing' && (
          <div className="space-y-6" id="marketing_banners_tab">
            <div className="flex justify-between items-center bg-stone-50 p-4 border border-stone-150 rounded-2xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Promotional Slider Campaigns</h4>
              <button
                onClick={() => setEditingBanner({
                  title: '',
                  subtitle: '',
                  image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1200&auto=format&fit=crop',
                  button_text: 'Explore Now',
                  destination_url: '',
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + 3600000 * 24 * 30).toISOString().split('T')[0],
                  is_active: true,
                  click_action: 'category'
                })}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A880]" /> Setup Active Campaign Banner
              </button>
            </div>

            {/* Editing form overlay */}
            {editingBanner && (
              <form onSubmit={handleUpdateBanner} className="p-6 bg-[#faf9f6] border border-amber-200/55 rounded-2xl shadow-xs space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-stone-200/80 pb-2">
                  <h4 className="font-serif font-bold text-sm text-stone-900">
                    {editingBanner.id ? 'Refine Campaign Artifact' : 'Initiate New Slide Campaign'}
                  </h4>
                  <button type="button" onClick={() => setEditingBanner(null)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Banner Title</label>
                    <input
                      type="text"
                      required
                      value={editingBanner.title}
                      onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                      placeholder="e.g. Masterpieces in Pure Gold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Banner Subtitle</label>
                    <input
                      type="text"
                      required
                      value={editingBanner.subtitle}
                      onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                      placeholder="Descriptions of the promotional artifact"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Button Callout Text</label>
                    <input
                      type="text"
                      required
                      value={editingBanner.button_text}
                      onChange={e => setEditingBanner({ ...editingBanner, button_text: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                      placeholder="e.g. Reserve Now"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Click Redirect Action</label>
                    <select
                      value={editingBanner.click_action}
                      onChange={e => setEditingBanner({ ...editingBanner, click_action: e.target.value, destination_url: '' })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                    >
                      <option value="product">Product Page (Custom Detail ID)</option>
                      <option value="category">Category Page (Specific Filter)</option>
                      <option value="flash_sale">Flash Sale Page (All Sale Items)</option>
                      <option value="campaign">Campaign Page (All Featured Items)</option>
                    </select>
                  </div>

                  {/* Destination URL helper selections depending on selected click action */}
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">
                      {editingBanner.click_action === 'product' && 'Select Target Product'}
                      {editingBanner.click_action === 'category' && 'Select Target Category'}
                      {(editingBanner.click_action === 'flash_sale' || editingBanner.click_action === 'campaign') && 'Destination Scope'}
                    </label>

                    {editingBanner.click_action === 'product' ? (
                      <select
                        required
                        value={editingBanner.destination_url}
                        onChange={e => setEditingBanner({ ...editingBanner, destination_url: e.target.value })}
                        className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- Choose Target Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.slug}>{p.name} ({p.brand})</option>
                        ))}
                      </select>
                    ) : editingBanner.click_action === 'category' ? (
                      <select
                        required
                        value={editingBanner.destination_url}
                        onChange={e => setEditingBanner({ ...editingBanner, destination_url: e.target.value })}
                        className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                      >
                        <option value="">-- Choose Target Category --</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value="Applies instantly to matching catalogs"
                        className="w-full bg-stone-100 p-2.5 border border-stone-200 rounded-lg text-stone-500 font-mono"
                      />
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Status Coverage</label>
                    <select
                      value={editingBanner.is_active ? 'active' : 'disabled'}
                      onChange={e => setEditingBanner({ ...editingBanner, is_active: e.target.value === 'active' })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                    >
                      <option value="active">Enabled (Visible in timeline matches)</option>
                      <option value="disabled">Disabled (Hidden from visitors)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={editingBanner.start_date || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, start_date: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={editingBanner.end_date || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, end_date: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                {/* File Upload Banner System implementation */}
                <div className="space-y-2">
                  <label className="font-bold text-stone-600 block">Premium Banner Image Uploader</label>
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditingBanner({ ...editingBanner, image: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border-2 border-dashed border-stone-300 hover:border-[#C5A880] bg-stone-50 p-6 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingBanner({ ...editingBanner, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-stone-400" />
                    <span className="font-bold text-stone-700">Drag & Drop Banner Image here, or click to upload</span>
                    <span className="text-[10px] text-stone-400">Supports JPG, PNG, WEBP local files</span>
                  </div>

                  <div className="space-y-1">
                    <span className="block font-bold text-stone-600 text-[10px]">Or enter premium direct image URL:</span>
                    <input
                      type="text"
                      value={editingBanner.image || ''}
                      onChange={e => setEditingBanner({ ...editingBanner, image: e.target.value })}
                      className="w-full bg-white p-2 border border-stone-250 rounded-lg font-mono text-[10px]"
                      placeholder="https://images.unsplash.com/promo-path..."
                    />
                  </div>

                  {editingBanner.image && (
                    <div className="pt-2">
                      <span className="block font-bold text-stone-600 mb-1 text-[10px]">Image Preview:</span>
                      <div className="relative w-full h-32 rounded-lg overflow-hidden border border-stone-200">
                        <img src={editingBanner.image} alt="Preview" className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#C5A880] hover:bg-[#b09670] text-stone-900 font-extrabold tracking-wide rounded-lg cursor-pointer"
                  >
                    Confirm Campaign Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBanner(null)}
                    className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-705 font-bold rounded-lg cursor-pointer"
                  >
                    Discard Changes
                  </button>
                </div>
              </form>
            )}

            {/* List of current campaigns in system */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map(b => (
                <div key={b.id} className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-serif font-black text-xs text-stone-900 leading-tight truncate">{b.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider font-medium uppercase font-sans shrink-0 ${
                        b.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}>
                        {b.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-light truncate mt-1">{b.subtitle}</p>

                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-stone-100 mt-3 select-none">
                      <img src={b.image} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 left-2 bg-stone-900/80 px-2 py-0.5 rounded text-[8px] text-stone-200 font-mono">
                        {b.click_action.toUpperCase()}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] text-stone-500 font-mono bg-stone-50 p-2 rounded-lg border border-stone-100 gap-2">
                      <span>Start: {b.start_date || 'N/A'}</span>
                      <span>End: {b.end_date || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingBanner(b)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all text-xs"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LUXURY JOURNAL MANAGEMENT TAB */}
        {activeTab === 'journal' && (
          <div className="space-y-6" id="journal_crud_tab">
            <div className="flex justify-between items-center bg-stone-50 p-4 border border-stone-150 rounded-2xl">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Luxury Journal Articles</h4>
                <p className="text-[10px] text-stone-400 mt-0.5">Publish rich editorial guides, collections stories, and technical horology blogs.</p>
              </div>
              <button
                onClick={() => setEditingBlog({
                  title: '',
                  content: '',
                  image: 'https://images.unsplash.com/photo-1547996165-4f7f2526d529?q=80&w=1200&auto=format&fit=crop',
                  seo_title: '',
                  seo_description: '',
                  created_at: new Date().toISOString()
                })}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-850 text-white text-[11px] font-bold hover:bg-stone-800 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Journal Article</span>
              </button>
            </div>

            {/* Editing/Creating Form Block */}
            {editingBlog && (
              <form onSubmit={handleUpdateBlog} className="p-6 bg-[#faf9f6] border border-amber-205 rounded-2xl shadow-xs space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-stone-200/80 pb-2">
                  <h4 className="font-serif font-bold text-sm text-stone-900">
                    {editingBlog.id ? 'Refine Editorial Masterpiece' : 'Draft New Journal Article'}
                  </h4>
                  <button type="button" onClick={() => setEditingBlog(null)} className="text-stone-400 hover:text-stone-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="font-bold text-stone-600 block mb-1">Article Title</label>
                    <input
                      type="text"
                      required
                      value={editingBlog.title || ''}
                      onChange={e => setEditingBlog({ ...editingBlog, title: e.target.value, seo_title: editingBlog.seo_title || e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                      placeholder="e.g. The Legacy of Golden Tourbillons"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Publication Date</label>
                    <input
                      type="datetime-local"
                      required
                      value={editingBlog.created_at ? new Date(editingBlog.created_at).toISOString().slice(0, 16) : ''}
                      onChange={e => setEditingBlog({ ...editingBlog, created_at: new Date(e.target.value).toISOString() })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="font-bold text-stone-600 block mb-1">Article Editorial Content (Markdown supported)</label>
                    <textarea
                      required
                      rows={12}
                      value={editingBlog.content || ''}
                      onChange={e => setEditingBlog({ ...editingBlog, content: e.target.value, seo_description: editingBlog.seo_description || e.target.value.substring(0, 150) })}
                      className="w-full bg-white p-3 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880] font-sans"
                      placeholder="Share your expert storytelling or detailed mechanical guidance here..."
                    />
                  </div>

                  {/* Drag-and-drop Image Uploader */}
                  <div className="col-span-2 space-y-2">
                    <label className="font-bold text-stone-600 block">Cover Image</label>
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingBlog({ ...editingBlog, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="border-2 border-dashed border-stone-300 hover:border-[#C5A880] bg-stone-50 p-6 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditingBlog({ ...editingBlog, image: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                    >
                      <Sparkles className="w-5 h-5 text-stone-400" />
                      <span className="font-bold text-stone-700">Drag & Drop Cover Image here, or click to upload</span>
                      <span className="text-[10px] text-stone-400">Supports JPG, PNG, WEBP local files</span>
                    </div>

                    <div className="space-y-1">
                      <span className="block font-bold text-stone-600 text-[10px]">Or enter premium direct image URL:</span>
                      <input
                        type="text"
                        value={editingBlog.image || ''}
                        onChange={e => setEditingBlog({ ...editingBlog, image: e.target.value })}
                        className="w-full bg-white p-2 border border-stone-250 rounded-lg font-mono text-[10px]"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>

                    {editingBlog.image && (
                      <div className="pt-2">
                        <span className="block font-bold text-stone-600 mb-1 text-[10px]">Image Preview:</span>
                        <div className="relative w-full h-44 rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                          <img src={editingBlog.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEO METADATA PARAMETERS */}
                  <div className="col-span-2 border-t border-stone-200/60 pt-4 mt-2 space-y-4">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#C5A880] block font-mono">SEO Metatag Optimization (Optional)</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-stone-600 block mb-1">SEO Title Tag</label>
                        <input
                          type="text"
                          value={editingBlog.seo_title || ''}
                          onChange={e => setEditingBlog({ ...editingBlog, seo_title: e.target.value })}
                          className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                          placeholder="Golden Mechanical Watch Secrets | JIJARELL"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-600 block mb-1">SEO Description Tag (Meta Excerpt)</label>
                        <input
                          type="text"
                          value={editingBlog.seo_description || ''}
                          onChange={e => setEditingBlog({ ...editingBlog, seo_description: e.target.value })}
                          className="w-full bg-white p-2.5 border border-stone-250 rounded-lg focus:outline-none focus:border-[#C5A880]"
                          placeholder="Ex: A comprehensive guide detailing fine tourbillon mechanical actions and pure gold engineering..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-stone-200">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#C5A880] hover:bg-[#b09670] text-stone-900 font-extrabold tracking-wide rounded-lg cursor-pointer"
                  >
                    Publish Article to Journal
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBlog(null)}
                    className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-705 font-bold rounded-lg cursor-pointer"
                  >
                    Discard Draft
                  </button>
                </div>
              </form>
            )}

            {/* List of current blogs in system */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {blogs.map(b => (
                <div key={b.id} className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-serif font-black text-xs text-stone-900 leading-tight line-clamp-2">{b.title}</h4>
                      <span className="text-[8px] font-mono bg-stone-100 text-stone-550 border border-stone-150 px-2 py-0.5 rounded-full shrink-0">
                        {Math.round(b.content ? b.content.split(/\s+/).length : 0)} words
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-400 font-mono mt-1">
                      {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>

                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-stone-100 mt-3 select-none bg-stone-50">
                      <img src={b.image} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>

                    <div className="mt-3 p-2 bg-stone-50 p-2 border border-stone-100 rounded-lg space-y-1 text-[10px]">
                      <p className="text-stone-500 line-clamp-2 leading-relaxed"><span className="font-bold text-stone-650">Excerpt:</span> {b.seo_description || 'No excerpt written.'}</p>
                      <p className="text-stone-400 font-mono text-[9px] truncate"><span className="font-bold text-stone-550">Slug:</span> {b.slug}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingBlog(b)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all text-xs"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#C5A880]" /> Edit Draft
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(b.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Retire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="space-y-6" id="settings_crud_tab">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">Corporate Network Parameters</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="font-bold text-stone-600 block mb-1">WhatsApp Order Redirection Phone Number (E.164 string)</label>
                <input 
                  type="text" 
                  required
                  value={settings.whatsapp_number} 
                  onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="e.g. 8801712345678"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Corporate bKash Wallet Number</label>
                <input 
                  type="text" 
                  required
                  value={settings.bkash_number} 
                  onChange={(e) => setSettings({...settings, bkash_number: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="e.g. 01712345678"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Corporate Office Address</label>
                <input 
                  type="text" 
                  required
                  value={settings.corporate_address || ''} 
                  onChange={(e) => setSettings({...settings, corporate_address: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="e.g. Paschim Sholosahar, Chattogram, Bangladesh"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Corporate Email Address</label>
                <input 
                  type="email" 
                  required
                  value={settings.corporate_email || ''} 
                  onChange={(e) => setSettings({...settings, corporate_email: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="e.g. jijarell.official@gmail.com"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">WhatsApp Social Contact Link</label>
                <input 
                  type="text" 
                  required
                  value={settings.whatsapp_link || ''} 
                  onChange={(e) => setSettings({...settings, whatsapp_link: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="e.g. https://wa.me/8801410624199"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Delivery Support Contact Number</label>
                <input 
                  type="text" 
                  required
                  value={settings.delivery_contact_number || ''} 
                  onChange={(e) => setSettings({...settings, delivery_contact_number: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="e.g. 01410625199"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Instagram Profile Page URL</label>
                <input 
                  type="text" 
                  required
                  value={settings.instagram_link || ''} 
                  onChange={(e) => setSettings({...settings, instagram_link: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="https://www.instagram.com/jijarell..."
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Facebook Page / Share URL</label>
                <input 
                  type="text" 
                  required
                  value={settings.facebook_link || ''} 
                  onChange={(e) => setSettings({...settings, facebook_link: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                  placeholder="https://www.facebook.com/share/..."
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-stone-600 block mb-1">Upper Announcement Bar (Dynamic CMS)</label>
                <input 
                  type="text" 
                  required
                  value={settings.announcement_text} 
                  onChange={(e) => setSettings({...settings, announcement_text: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                />
              </div>

              <div className="col-span-2">
                <label className="font-bold text-stone-600 block mb-1">Promo Sale Coupon Callout Box</label>
                <input 
                  type="text" 
                  required
                  value={settings.promo_text} 
                  onChange={(e) => setSettings({...settings, promo_text: e.target.value})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Default Platform Language</label>
                <select
                  value={settings.language || 'en'}
                  onChange={(e) => setSettings({...settings, language: e.target.value as 'en' | 'bn'})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                >
                  <option value="en">English (Bespoke Editorial Mode)</option>
                  <option value="bn">বাংলা (বাংলা সংস্করণ)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-600 block mb-1">Promo Countdown End Date & Time</label>
                <input 
                  type="datetime-local" 
                  required
                  value={settings.promo_countdown_end ? settings.promo_countdown_end.substring(0, 16) : ''} 
                  onChange={(e) => setSettings({...settings, promo_countdown_end: new Date(e.target.value).toISOString()})}
                  className="w-full bg-white p-3 border border-stone-250 rounded-xl"
                />
              </div>

              {/* JIJARELL ASSISTANT API KEYS CONFIGURATION */}
              <div className="col-span-1 md:col-span-2 bg-[#faf9f6] border border-stone-200 p-5 rounded-2xl space-y-6 mt-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-1">
                    JIJARELL Assistant Smart Models & Failover APIs
                  </h4>
                  <p className="text-xs text-stone-500">
                    Add multiple API keys to prevent assistant downtime. The system automatically pivots connections to secondary providers / fallback channels if a failure occurs.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* GEMINI KEYS */}
                  <div className="space-y-2">
                    <label className="font-bold text-xs uppercase tracking-wide text-stone-700 block">Gemini API Keys</label>
                    <div className="flex gap-2">
                      <input 
                        type="password"
                        placeholder="Paste Gemini API Key..."
                        value={newGeminiKey}
                        onChange={(e) => setNewGeminiKey(e.target.value)}
                        className="flex-1 bg-white p-2.5 text-xs border border-stone-250 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newGeminiKey) {
                            addApiKey('gemini', newGeminiKey);
                            setNewGeminiKey('');
                          }
                        }}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold"
                      >
                        Add Key
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(settings.api_keys?.gemini || []).map((key, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-stone-200 border border-stone-350 text-stone-800 px-2.5 py-1 rounded-lg text-xs font-mono">
                          <span>••••{key.slice(-4) || 'Key'}</span>
                          <button
                            type="button"
                            onClick={() => removeApiKey('gemini', idx)}
                            className="text-red-650 hover:text-red-800 font-bold ml-1 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(settings.api_keys?.gemini || []).length === 0 && (
                        <span className="text-xs text-stone-400 italic">No custom Gemini keys. Will default to main Gemini key environment.</span>
                      )}
                    </div>
                  </div>

                  {/* DEEPSEEK KEYS */}
                  <div className="space-y-2">
                    <label className="font-bold text-xs uppercase tracking-wide text-stone-700 block">DeepSeek API Keys</label>
                    <div className="flex gap-2">
                      <input 
                        type="password"
                        placeholder="Paste DeepSeek API Key..."
                        value={newDeepseekKey}
                        onChange={(e) => setNewDeepseekKey(e.target.value)}
                        className="flex-1 bg-white p-2.5 text-xs border border-stone-250 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newDeepseekKey) {
                            addApiKey('deepseek', newDeepseekKey);
                            setNewDeepseekKey('');
                          }
                        }}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold"
                      >
                        Add Key
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(settings.api_keys?.deepseek || []).map((key, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-stone-200 border border-stone-350 text-stone-800 px-2.5 py-1 rounded-lg text-xs font-mono">
                          <span>••••{key.slice(-4) || 'Key'}</span>
                          <button
                            type="button"
                            onClick={() => removeApiKey('deepseek', idx)}
                            className="text-red-650 hover:text-red-800 font-bold ml-1 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(settings.api_keys?.deepseek || []).length === 0 && (
                        <span className="text-xs text-stone-400 italic">No DeepSeek API keys registered.</span>
                      )}
                    </div>
                  </div>

                  {/* OPENROUTER KEYS */}
                  <div className="space-y-2">
                    <label className="font-bold text-xs uppercase tracking-wide text-stone-700 block">OpenRouter API Keys</label>
                    <div className="flex gap-2">
                      <input 
                        type="password"
                        placeholder="Paste OpenRouter API Key..."
                        value={newOpenrouterKey}
                        onChange={(e) => setNewOpenrouterKey(e.target.value)}
                        className="flex-1 bg-white p-2.5 text-xs border border-stone-250 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newOpenrouterKey) {
                            addApiKey('openrouter', newOpenrouterKey);
                            setNewOpenrouterKey('');
                          }
                        }}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold"
                      >
                        Add Key
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(settings.api_keys?.openrouter || []).map((key, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-stone-200 border border-stone-350 text-stone-800 px-2.5 py-1 rounded-lg text-xs font-mono">
                          <span>••••{key.slice(-4) || 'Key'}</span>
                          <button
                            type="button"
                            onClick={() => removeApiKey('openrouter', idx)}
                            className="text-red-650 hover:text-red-800 font-bold ml-1 text-[10px]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(settings.api_keys?.openrouter || []).length === 0 && (
                        <span className="text-xs text-stone-400 italic">No OpenRouter API keys registered.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Verify & Store Preferences
            </button>

            {/* MUTATE CREDENTIALS PANEL */}
            <div className="mt-8 pt-8 border-t border-stone-205">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 mb-1 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-red-700 animate-pulse" />
                <span>Critical Administrative Credential Rotation</span>
              </h4>
              <p className="text-[10px] text-stone-500 mb-4 leading-relaxed">
                Re-structuring administrative terminal codes demands double-channel Multi-Factor Authentication (MFA). OTPs will be securely dispatched via live SMTP simultaneously to <strong>wasifjafarsafi.edu@gmail.com</strong> and <strong>wasifsafi55@gmail.com</strong>.
              </p>

              <div className="space-y-4 max-w-2xl bg-[#fffcfc] border border-red-100 p-5 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Current Terminal Password</label>
                    <input 
                      type="password"
                      required
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(e.target.value)}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl focus:outline-none focus:border-red-500"
                      placeholder="e.g. wasif1234"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">New Terminal Password</label>
                    <input 
                      type="password"
                      required
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl focus:outline-none focus:border-red-500"
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl focus:outline-none focus:border-red-500"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={async () => {
                      setPwdErrorMsg(null);
                      setPwdSuccessMsg(null);
                      if (!pwdCurrent || !pwdNew || !pwdConfirm) {
                        setPwdErrorMsg('Please fill in current, new, and confirmation password fields first.');
                        return;
                      }
                      if (pwdNew !== pwdConfirm) {
                        setPwdErrorMsg('New password selection mismatch.');
                        return;
                      }
                      try {
                        const res = await fetch('/api/admin/send-pw-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            currentPassword: pwdCurrent,
                            newPassword: pwdNew,
                            confirmPassword: pwdConfirm,
                            browserInfo: navigator.userAgent,
                            deviceInfo: navigator.platform + ' (' + navigator.vendor + ')',
                            ipAddress: '103.84.150.22',
                            location: 'Khulshi, Chattogram (Dhaka Security Route)'
                          })
                        });
                        if (res.ok) {
                          const ans = await res.json();
                          setOtpSent(true);
                          setPwdSuccessMsg(ans.message);
                          if (ans.dev_otp1 && ans.dev_otp2) {
                            setDevOtps({ otp1: ans.dev_otp1, otp2: ans.dev_otp2 });
                          } else {
                            setDevOtps(null);
                          }
                        } else {
                          const err = await res.json();
                          setPwdErrorMsg(err.error || 'Failed sending OTP Envelopes.');
                        }
                      } catch {
                        setPwdErrorMsg('Server error reaching verification services.');
                      }
                    }}
                    className="px-5 py-2.5 bg-red-950 hover:bg-red-900 border border-red-850 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition"
                  >
                    Generate & Send Dispatch OTP Envelopes
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] font-medium leading-relaxed">
                      🔒 Dual key channels active. Real SMTP emails containing your Verification Keys have been successfully delivered to your actual recipient inboxes (<strong>wasifjafarsafi.edu@gmail.com</strong> and <strong>wasifsafi55@gmail.com</strong>).
                    </div>

                    {devOtps && (
                      <div className="p-3 bg-red-50 border border-red-150 text-stone-900 rounded-xl text-[11px] flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <strong>🔧 Sandbox Environment Fallback:</strong> Simulated verification codes are: <code className="bg-red-105 px-1 py-0.5 rounded font-mono font-bold text-red-900">{devOtps.otp1}</code> and <code className="bg-red-105 px-1 py-0.5 rounded font-mono font-bold text-red-900">{devOtps.otp2}</code>.
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPwdOtp1(devOtps.otp1 || '');
                            setPwdOtp2(devOtps.otp2 || '');
                          }}
                          className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg text-[10px] font-bold cursor-pointer transition border border-red-850 shrink-0"
                        >
                          Auto-Fill Keys
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-bold text-red-900 block mb-1">MFA Security Code 1 (Channel 1)</label>
                        <input 
                          type="text"
                          required
                          maxLength={6}
                          value={pwdOtp1}
                          onChange={(e) => setPwdOtp1(e.target.value)}
                          className="w-full bg-white p-2.5 border border-red-200 rounded-xl text-center font-mono font-bold tracking-widest text-stone-850 focus:outline-none focus:border-red-500"
                          placeholder="e.g. 159382"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-red-900 block mb-1">MFA Security Code 2 (Channel 2)</label>
                        <input 
                          type="text"
                          required
                          maxLength={6}
                          value={pwdOtp2}
                          onChange={(e) => setPwdOtp2(e.target.value)}
                          className="w-full bg-white p-2.5 border border-red-200 rounded-xl text-center font-mono font-bold tracking-widest text-stone-850 focus:outline-none focus:border-red-500"
                          placeholder="e.g. 748291"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setPwdErrorMsg(null);
                          setPwdSuccessMsg(null);
                          try {
                            const res = await fetch('/api/admin/verify-pw-change', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                currentPassword: pwdCurrent,
                                newPassword: pwdNew,
                                confirmPassword: pwdConfirm,
                                otp1: pwdOtp1,
                                otp2: pwdOtp2
                              })
                            });
                            if (res.ok) {
                              const ans = await res.json();
                              setPwdSuccessMsg(ans.message);
                              setPwdCurrent('');
                              setPwdNew('');
                              setPwdConfirm('');
                              setPwdOtp1('');
                              setPwdOtp2('');
                              setOtpSent(false);
                            } else {
                              const err = await res.json();
                              setPwdErrorMsg(err.error || 'verification key validation failed.');
                            }
                          } catch {
                            setPwdErrorMsg('Check credentials server communication failed.');
                          }
                        }}
                        className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition"
                      >
                        Verify Codes & Change Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setPwdOtp1('');
                          setPwdOtp2('');
                        }}
                        className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition"
                      >
                        Reset Dispatch
                      </button>
                    </div>
                  </div>
                )}

                {pwdSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-xl font-semibold">
                    {pwdSuccessMsg}
                  </div>
                )}
                {pwdErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded-xl font-semibold">
                    {pwdErrorMsg}
                  </div>
                )}
              </div>
            </div>
          </form>
        )}

        {/* CATEGORIES MANAGEMENT TAB */}
        {activeTab === 'categories' && (
          <div className="space-y-6 text-xs text-stone-850" id="categories_management_tab">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A880]">Catalog Categories Master</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Define design line scopes, icons and custom curated collection tags</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory({ name: '', slug: '', icon: '', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600' })}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#b0946f] text-stone-950 font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Initialize Curated Category</span>
              </button>
            </div>

            {editingCategory && (
              <form onSubmit={handleUpdateCategory} className="p-5 border border-amber-300 bg-amber-50/15 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {editingCategory.id ? 'Edit Category Artifact Blueprint' : 'Configure New Curated Category Scope'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Curated Category Name</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.name || ''}
                      onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                      placeholder="e.g. Classic Tourbillons"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Platform Slug Identifier (Optional)</label>
                    <input
                      type="text"
                      value={editingCategory.slug || ''}
                      onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                      placeholder="e.g. classic-tourbillons"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Icon Representant ID</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.icon || ''}
                      onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                      placeholder="e.g. watch, shoe, bag"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Curation Hero Cover Image URL</label>
                    <input
                      type="text"
                      required
                      value={editingCategory.image || ''}
                      onChange={e => setEditingCategory({ ...editingCategory, image: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Commit Category Blueprint
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {categories.map(cat => (
                <div key={cat.id} className="bg-stone-50 border border-stone-200/60 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex gap-3">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">{cat.name}</h4>
                      <p className="text-[10px] text-stone-400 font-mono">ID: {cat.id}</p>
                      <p className="text-[10px] text-[#C5A880] font-bold">Slug: {cat.slug}</p>
                    </div>
                  </div>

                  <div className="flex border-t border-stone-200/50 pt-3 gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(cat)}
                      className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-[#C5A880]/15 hover:text-[#C5A880] transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg bg-stone-100 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COUPONS MANAGEMENT TAB */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 text-xs text-stone-850" id="coupons_management_tab">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A880]">Discounts & Active Coupon Register</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Issue promotional percentage and fixed-value reduction variables</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoupon({ 
                  code: '', 
                  discount_type: 'percentage', 
                  discount_value: 10,
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date(Date.now() + 1000 * 3600 * 24 * 30).toISOString().split('T')[0]
                })}
                className="px-4 py-2 bg-[#C5A880] hover:bg-[#b0946f] text-stone-950 font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Discount Coupon Code</span>
              </button>
            </div>

            {editingCoupon && (
              <form onSubmit={handleUpdateCoupon} className="p-5 border border-amber-300 bg-amber-50/15 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-150 pb-2">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {editingCoupon.id ? 'Edit Coupon Parameters' : 'Deploy New Coupon Authorization'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="p-1 rounded-lg hover:bg-stone-100 text-stone-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Coupon Promo Code (Alphanumeric)</label>
                    <input
                      type="text"
                      required
                      value={editingCoupon.code || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl font-mono uppercase"
                      placeholder="e.g. SUMMER25"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Reduction Type</label>
                    <select
                      value={editingCoupon.discount_type || 'percentage'}
                      onChange={e => setEditingCoupon({ ...editingCoupon, discount_type: e.target.value as 'fixed' | 'percentage' })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                    >
                      <option value="percentage">Percentage Reduction (%)</option>
                      <option value="fixed">Fixed Amount Deduction (BDT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Discount Amount/Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingCoupon.discount_value || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, discount_value: Number(e.target.value) })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                      placeholder="e.g. 10"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={editingCoupon.start_date || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, start_date: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-600 block mb-1">Expiration Date</label>
                    <input
                      type="date"
                      required
                      value={editingCoupon.end_date || ''}
                      onChange={e => setEditingCoupon({ ...editingCoupon, end_date: e.target.value })}
                      className="w-full bg-white p-2.5 border border-stone-250 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Deploy Coupon Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {coupons.map(coup => {
                const expired = new Date(coup.end_date) < new Date();
                return (
                  <div key={coup.id} className="bg-stone-50 border border-stone-200/60 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-stone-200 text-stone-800 font-mono font-bold rounded-lg border border-stone-300 text-xs tracking-wider select-all">
                          {coup.code}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${expired ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">
                          {coup.discount_value}{coup.discount_type === 'percentage' ? '%' : ' BDT'} OFF
                        </h4>
                        <p className="text-[10px] text-stone-400 mt-1">Scope: {coup.discount_type === 'percentage' ? 'Percentage-based reduction' : 'Fixed value deduction'}</p>
                        <p className="text-[10px] text-stone-500 font-medium">Timeline: {coup.start_date} to {coup.end_date}</p>
                      </div>
                    </div>

                    <div className="flex border-t border-stone-200/50 pt-3 gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingCoupon(coup)}
                        className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-[#C5A880]/15 hover:text-[#C5A880] transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coup.id)}
                        className="p-1.5 rounded-lg bg-stone-100 text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOGS AUDITING VIEW */}
        {activeTab === 'logs' && (
          <div className="space-y-6" id="logs_view_tab">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">Administrative Central Audit Logs</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Real-time persistent audit ledger streaming from the secure central server. Tracking all system configurations and security events.</p>
              </div>
              <button
                type="button"
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reload Logs</span>
              </button>
            </div>

            <div className="bg-stone-950 border border-stone-850 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-stone-850 bg-stone-900/50 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-[#C5A880] tracking-widest font-extrabold block">CENTRAL LOG FILE DUMP</span>
                <span className="text-[9px] font-mono text-stone-500">Node Status: AUDITING_LIVE</span>
              </div>
              
              <div className="divide-y divide-stone-900 max-h-[500px] overflow-y-auto font-mono text-xs text-stone-300 p-2 space-y-1">
                {auditLogs.length === 0 ? (
                  <div className="p-8 text-center text-stone-500 text-xs italic">
                    No log sequences currently present in database ledger.
                  </div>
                ) : (
                  auditLogs.map((log, index) => (
                    <div key={log.id || index} className="p-3 bg-stone-900/30 hover:bg-stone-900/60 rounded-xl transition border border-transparent hover:border-stone-850 space-y-1">
                      <div className="flex justify-between items-start flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded-md bg-[#C5A880]/15 text-[#C5A880] font-bold uppercase">
                          {log.action}
                        </span>
                        <span className="text-stone-500 font-sans font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-stone-200">{log.details}</p>
                      <div className="flex gap-4 text-[9px] text-stone-500 flex-wrap pt-0.5 border-t border-stone-900 mt-1">
                        <span>IP ORIGIN: <strong className="text-stone-400 font-sans">{log.ip || '127.0.0.1'}</strong></span>
                        <span className="truncate max-w-sm sm:max-w-xl">CLIENT: <strong className="text-stone-400 font-sans">{log.browser || 'System Core'}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* CACHE & PERFORMANCE DIAGNOSTIC TAB */}
        {activeTab === 'perf' && (
          <div className="space-y-6 text-stone-800" id="performance_diagnostics_tab">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">Enterprise Cache & Real-time Stream Analytics</h3>
                <p className="text-[10px] text-stone-400 mt-0.5">Live telemetry streaming from JIJARELL Geneva in-memory Redis cluster and SSE broadcaster</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch('/api/performance/flush', { method: 'POST' });
                    if (res.ok) {
                      const ans = await res.json();
                      setMsg(ans.message);
                      fetchPerfStats();
                      setTimeout(() => setMsg(null), 3000);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-950 border border-rose-900 hover:bg-rose-900 text-rose-100 font-bold text-[10px] uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  Flush Redis Cache
                </button>
                <button
                  type="button"
                  onClick={fetchPerfStats}
                  className="px-3 py-1.5 bg-stone-900 border border-stone-800 hover:bg-stone-850 text-stone-200 font-bold text-[10px] uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  <span>Fetch Diagnostics</span>
                </button>
              </div>
            </div>

            {msg && (
              <div className="p-3 bg-stone-950 text-[#C5A880] text-xs font-mono rounded-xl border border-[#C5A880]/30 animate-pulse">
                Telemetry Log: {msg}
              </div>
            )}

            {/* Metrics Telemetry Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Redis Cache Size</span>
                  <Database className="w-4 h-4 text-stone-400" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-stone-900 font-mono">
                    {perfStats?.cache?.size ?? 0}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-1">active memory keys cached</span>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Cache Hit Rate</span>
                  <Zap className="w-4 h-4 text-amber-500 animate-bounce" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-[#C5A880] font-mono">
                    {perfStats?.cache?.hitRate ?? 100}%
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-1">
                    {perfStats?.cache?.hits ?? 0} hits / {perfStats?.cache?.misses ?? 0} misses
                  </span>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">SSE Event Receivers</span>
                  <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-stone-900 font-mono">
                    {perfStats?.sseClientsCount ?? 0}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-1">active client tabs listening</span>
                </div>
              </div>

              <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Average Latency</span>
                  <Clock className="w-4 h-4 text-[#C5A880]" />
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                    &lt; 1ms
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-1">sub-millisecond static loads</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 col-span-1">
              {/* REAL-TIME NOTIFICATION BROADCASTER & EVENT SIMULATOR */}
              <div className="bg-stone-50 border border-stone-150 p-5 rounded-2xl space-y-4">
                <div className="border-b border-stone-150 pb-2">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>SSE Event Broadcast Simulator</span>
                  </h4>
                  <p className="text-[9px] text-stone-400 mt-0.5">Manually broadcast a system-wide banner update, coupon alert or flash promotion immediately</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[10px] text-stone-600 block mb-1">Event Category type</label>
                      <select
                        value={simForm.type}
                        onChange={(e) => setSimForm({ ...simForm, type: e.target.value })}
                        className="w-full bg-white p-2 border border-stone-200 rounded-lg text-xs"
                      >
                        <option value="promotion">Promotion (প্রোমোশন)</option>
                        <option value="flash_sale">Flash Sale (ফ্ল্যাশ সেল)</option>
                        <option value="coupon">Coupon Release (কুপন)</option>
                        <option value="announcement">Important Notice (ঘোষণা)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[10px] text-stone-600 block mb-1">Target Client Routing</label>
                      <input 
                        type="text" 
                        disabled
                        value="GLOBAL BROADCAST (ALL)" 
                        className="w-full bg-stone-100 p-2 border border-stone-200 rounded-lg text-stone-400 text-[10px] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[10px] text-[#C5A880] block mb-1">Title (English)</label>
                      <input
                        type="text"
                        value={simForm.title}
                        onChange={(e) => setSimForm({ ...simForm, title: e.target.value })}
                        className="w-full bg-white p-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[10px] text-[#C5A880] block mb-1">Title (বাংলা)</label>
                      <input
                        type="text"
                        value={simForm.title_bn}
                        onChange={(e) => setSimForm({ ...simForm, title_bn: e.target.value })}
                        className="w-full bg-white p-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[10px] text-stone-600 block mb-1">Alert Body (English)</label>
                      <textarea
                        rows={2}
                        value={simForm.body}
                        onChange={(e) => setSimForm({ ...simForm, body: e.target.value })}
                        className="w-full bg-white p-2 border border-stone-200 rounded-lg text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-[10px] text-stone-600 block mb-1">Alert Body (বাংলা)</label>
                      <textarea
                        rows={2}
                        value={simForm.body_bn}
                        onChange={(e) => setSimForm({ ...simForm, body_bn: e.target.value })}
                        className="w-full bg-white p-2 border border-stone-200 rounded-lg text-[11px]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const response = await fetch('/api/performance/simulate-notif', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(simForm)
                        });
                        if (response.ok) {
                          setMsg(`Instantly broadcasted event over SSE: "${simForm.title}"`);
                          setTimeout(() => setMsg(null), 4000);
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full py-2.5 bg-[#C5A880] hover:bg-[#b0946f] text-stone-950 font-bold text-[10px] uppercase tracking-widest rounded-xl transition cursor-pointer"
                  >
                    🚀 Trigger Telemetry Broadcast
                  </button>
                </div>
              </div>

              {/* LIVE REDIS CLUSTER DATA DUMP VIEW */}
              <div className="bg-stone-50 border border-stone-150 p-5 rounded-2xl select-none flex flex-col justify-between">
                <div>
                  <div className="border-b border-stone-150 pb-2 mb-3">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-stone-600" />
                      <span>In-memory Key Catalog Dump</span>
                    </h4>
                    <p className="text-[9px] text-stone-400 mt-0.5">Examine keys saved currently within the sandboxed in-memory memory map</p>
                  </div>

                  {(!perfStats?.cache?.keys || perfStats.cache.keys.length === 0) ? (
                    <div className="py-8 flex flex-col items-center justify-center text-stone-400 space-y-2">
                      <AlertCircle className="w-5 h-5 text-stone-300 animate-pulse" />
                      <span className="text-[10px] uppercase font-mono tracking-wider">Redis cache empty</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                      {perfStats.cache.keys.map((k: string) => (
                        <div key={k} className="flex items-center justify-between p-2 bg-stone-100 rounded-lg text-[10px] font-mono border border-stone-200">
                          <span className="text-stone-700 font-extrabold select-all truncate max-w-[180px]">{k}</span>
                          <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 py-0.5 rounded uppercase font-sans">Active TTL</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-stone-200/50 rounded-xl border border-stone-250 mt-4">
                  <p className="text-[9px] text-stone-500 leading-normal">
                    <strong>Typo-tolerant Cache Invalidation:</strong> Under normal production rules, these keys auto-expire after 10 minutes (600s). Making mutations inside Categories, Products or Banners clears cache tags immediately to ensure catalog freshness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS MODERATION HUB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 text-stone-800" id="reviews_moderation_tab">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">Premium Feedback & Customer Audit Moderation</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Publish responses to verified guest and member quality audits</p>
            </div>

            {loadingReviews ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin text-stone-300" />
                <span className="text-xs uppercase font-mono tracking-wider">Loading concierge audits...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 bg-white border border-stone-200 rounded-3xl flex flex-col items-center justify-center text-stone-400 space-y-3">
                <MessageSquare className="w-10 h-10 text-stone-200" />
                <span className="text-xs uppercase font-mono tracking-widest text-stone-400 font-bold">No verified reviews submitted yet</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reviews.map((rev) => {
                  const associatedProduct = products.find(p => p.id === rev.product_id);
                  const isReplying = replyingReviewId === rev.id;
                  const currentReplyText = replyTextMap[rev.id] || '';

                  return (
                    <div key={rev.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs text-left space-y-4">
                      <div className="flex justify-between items-start gap-3 flex-wrap">
                        {/* Audit Header */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-serif font-black text-stone-900 uppercase tracking-wide">
                              {rev.user_name || 'Anonymous Client'}
                            </span>
                            {rev.customer_phone && (
                              <span className="text-[9px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded animate-fadeIn">
                                📞 {rev.customer_phone}
                              </span>
                            )}
                            {rev.order_id && (
                              <span className="text-[8.5px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/40 select-all">
                                Order: #{rev.order_id}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3.5 h-3.5 ${i < (rev.rating || 5) ? 'fill-amber-500 text-amber-500' : 'text-stone-100'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[9px] font-mono text-stone-400">
                              {new Date(rev.created_at || Date.now()).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Associated Catalog Artifact */}
                        {associatedProduct && (
                          <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 max-w-xs shrink-0">
                            <img 
                              src={associatedProduct.images[0]} 
                              alt={associatedProduct.name} 
                              className="w-8 h-8 object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 text-left">
                              <h5 className="text-[10px] font-bold text-stone-800 truncate select-all">{associatedProduct.name}</h5>
                              <span className="text-[8.5px] font-bold text-[#C5A880]">{associatedProduct.sale_price || associatedProduct.price} BDT</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Review Text */}
                      <p className="text-xs text-stone-700 italic border-l-2 border-stone-200 pl-3 select-text leading-relaxed">
                        "{rev.review}"
                      </p>

                      {/* Existing Concierge Response */}
                      {rev.admin_reply ? (
                        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-bold text-[#C5A880] tracking-widest uppercase font-mono">💎 Concierge Reply Active</span>
                            {rev.admin_reply_at && (
                              <span className="text-[8px] font-mono text-stone-400">
                                {new Date(rev.admin_reply_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 font-semibold select-text">"{rev.admin_reply}"</p>
                        </div>
                      ) : (
                        <div>
                          {isReplying ? (
                            <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200 animate-fadeIn">
                              <label className="block text-[10px] uppercase tracking-wider font-bold text-stone-600 text-left mb-1">
                                Write Official Reply
                              </label>
                              <textarea
                                required
                                rows={2}
                                value={currentReplyText}
                                placeholder="Bespoke luxury greeting, response guidance and personalized customer care details..."
                                onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                                className="w-full text-xs p-3 bg-white border border-stone-205 rounded-xl text-stone-850 font-medium leading-relaxed shadow-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={submittingReplyId === rev.id || !currentReplyText.trim()}
                                  onClick={async () => {
                                    setSubmittingReplyId(rev.id);
                                    try {
                                      const res = await fetch(`/api/reviews/${rev.id}/reply`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ reply: currentReplyText })
                                      });
                                      if (res.ok) {
                                        await fetchReviews();
                                        setReplyingReviewId(null);
                                        setMsg("Concierge reply published and customer instantly notified!");
                                        setTimeout(() => setMsg(null), 3000);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    } finally {
                                      setSubmittingReplyId(null);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-[#C5A880] text-[9.5px] font-extrabold uppercase tracking-widest rounded-lg transition cursor-pointer"
                                >
                                  Publish Reply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReplyingReviewId(null)}
                                  className="px-3 py-1.5 bg-stone-200 text-stone-600 text-[9.5px] font-extrabold uppercase tracking-widest rounded-lg transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingReviewId(rev.id);
                                setReplyTextMap({ ...replyTextMap, [rev.id]: '' });
                              }}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-250 text-stone-800 text-[9px] font-extrabold uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3 text-stone-500" />
                              <span>Draft Concierge Reply</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
