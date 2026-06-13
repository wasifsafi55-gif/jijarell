import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ShoppingBag, Star, Share2, Shield, Truck, RotateCcw, 
  MessageSquare, Sliders, ChevronLeft, ChevronRight, Play, Eye, 
  Sparkles, Check, CheckCircle2, AlertCircle, Maximize2
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../types';
import ThreeViewer from './ThreeViewer';

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}`;
  }
  return null;
}

interface ProductDetailsPageProps {
  product: Product;
  allProducts: Product[];
  onAddToCart: (product: Product, variant: ProductVariant | null, quantity?: number) => void;
  onInstantBuy: (product: Product, variant: ProductVariant | null) => void;
  lang: 'en' | 'bn';
  t: (key: string) => string;
  onNavigate: (path: string) => void;
  requireCustomerAuth?: (action: () => void) => void;
  customerUser?: any | null;
}

export default function ProductDetailsPage({
  product,
  allProducts,
  onAddToCart,
  onInstantBuy,
  lang,
  t,
  onNavigate,
  requireCustomerAuth,
  customerUser
}: ProductDetailsPageProps) {
  // Gallery & Visual Views
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'images' | '3d' | 'video'>('images');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSpecCategory, setActiveSpecCategory] = useState<'craft' | 'specs' | 'returns'>('craft');

  // Zoom magnifier states
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);
  const mainImageRef = useRef<HTMLImageElement>(null);

  // Reviews integration
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Review eligibility parameters
  const [isEligibleForReview, setIsEligibleForReview] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [associatedOrderId, setAssociatedOrderId] = useState<string | null>(null);

  const checkReviewEligibility = async () => {
    try {
      const token = localStorage.getItem('jijarell_customer_token');
      const lastPhone = localStorage.getItem('jijarell_last_tracked_phone');
      
      let customerOrders: any[] = [];
      
      if (token) {
        const res = await fetch('/api/customer/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          customerOrders = await res.json();
        }
      } else if (lastPhone) {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const allOrders = await res.json();
          customerOrders = allOrders.filter((o: any) => o.customer_phone === lastPhone);
        }
      }
      
      const deliveredOrderForProduct = customerOrders.find((order: any) => 
        (order.status === 'delivered' || order.status === 'completed') && 
        order.items && order.items.some((item: any) => item.product_id === product.id)
      );
      
      if (deliveredOrderForProduct) {
        setIsEligibleForReview(true);
        setAssociatedOrderId(deliveredOrderForProduct.id);
        setDeliveryDate(deliveredOrderForProduct.delivered_at || deliveredOrderForProduct.created_at || new Date().toISOString());
      } else {
        setIsEligibleForReview(false);
        setAssociatedOrderId(null);
        setDeliveryDate(null);
      }
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      setIsEligibleForReview(false);
    }
  };

  // Sync reviews when product changes
  const fetchReviewsForProduct = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/reviews?product_id=${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsForProduct();
    checkReviewEligibility();
    // Scroll to top
    window.scrollTo(0, 0);

    // Save to recently viewed
    saveRecentlyViewed(product.id);

    // Default active variant
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    // Reset inputs
    setQuantity(1);
    setActiveMediaIndex(0);
    setActiveTab('images');
    setReviewSuccess(false);
  }, [product.id, customerUser]);

  useEffect(() => {
    if (customerUser && customerUser.name) {
      setNewReviewAuthor(customerUser.name);
    } else {
      setNewReviewAuthor('');
    }
  }, [customerUser]);

  // Keep track of Recently Viewed Products
  const saveRecentlyViewed = (id: string) => {
    try {
      const saved = localStorage.getItem('jijarell_recently_viewed');
      let list: string[] = saved ? JSON.parse(saved) : [];
      // Remove matching id and prepended
      list = list.filter(item => item !== id);
      list.unshift(id);
      // Keep max 8
      list = list.slice(0, 8);
      localStorage.setItem('jijarell_recently_viewed', JSON.stringify(list));
    } catch (err) {
      console.error(err);
    }
  };

  const getRecentlyViewed = (): Product[] => {
    try {
      const saved = localStorage.getItem('jijarell_recently_viewed');
      if (!saved) return [];
      const ids: string[] = JSON.parse(saved);
      // Filter out current product, map to objects
      return ids
        .filter(id => id !== product.id)
        .map(id => allProducts.find(p => p.id === id))
        .filter((p): p is Product => !!p);
    } catch (e) {
      return [];
    }
  };

  const recentlyViewed = getRecentlyViewed();

  // Highlight Related items from same category
  const relatedProducts = allProducts
    .filter(p => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4);

  // Zoom Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current) return;
    const { left, top, width, height } = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  // Submit dynamic review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewText.trim()) return;

    try {
      const lastPhone = localStorage.getItem('jijarell_last_tracked_phone') || '';
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          order_id: associatedOrderId || '',
          customer_phone: customerUser?.customer_phone || lastPhone,
          user_name: newReviewAuthor,
          rating: newReviewRating,
          review: newReviewText
        })
      });
      if (res.ok) {
        setNewReviewAuthor('');
        setNewReviewText('');
        setNewReviewRating(5);
        setReviewSuccess(true);
        fetchReviewsForProduct();
        checkReviewEligibility();
        setTimeout(() => setReviewSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Share action URL
  const handleShare = () => {
    const canonicalUrl = `${window.location.origin}/product/${product.slug}`;
    navigator.clipboard.writeText(canonicalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Carousel handlers for images gallery
  const nextMedia = () => {
    setActiveMediaIndex(prev => (prev + 1) % product.images.length);
  };

  const prevMedia = () => {
    setActiveMediaIndex(prev => (prev - 1 + product.images.length) % product.images.length);
  };

  const currentPrice = selectedVariant 
    ? selectedVariant.price 
    : (product.sale_price || product.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 space-y-12 select-none animate-fadeIn text-left text-stone-800">
      
      {/* Editorial Back Header Anchor and Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-stone-200">
        <button 
          onClick={() => onNavigate('/')} 
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#C5A880]" />
          <span>{lang === 'bn' ? 'তালিকায় ফিরে যান' : 'Back to Collection'}</span>
        </button>
        <div className="text-[10px] uppercase font-mono font-extrabold text-stone-400 flex items-center gap-1.5 shrink-0">
          <span>JIJARELL VAULT</span>
          <span>/</span>
          <span className="text-[#C5A880]">{product.brand}</span>
          <span>/</span>
          <span className="text-stone-700 truncate max-w-[120px]">{product.name}</span>
        </div>
      </div>

      {/* Main Showcase Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
        
        {/* Left Side: Advanced Multi-Media Interactive Showcase (Images Slider, Swipe, 3D, Video) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Top Panel Tab Toggles */}
          <div className="flex bg-stone-100 border border-stone-200 p-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider max-w-xs select-none">
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'images' ? 'bg-stone-950 text-white font-extrabold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>
            <button
              onClick={() => setActiveTab('3d')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === '3d' ? 'bg-stone-950 text-white font-extrabold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3D Orbit</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'video' ? 'bg-stone-950 text-white font-extrabold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Play className="w-3.5 h-3.5 animate-pulse text-amber-600" />
              <span>Showcase</span>
            </button>
          </div>

          {/* Interactive Screen viewport */}
          <div className="relative bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden aspect-square flex items-center justify-center group shadow-sm">
            
            {/* Tab 1: Image Slider + Hover Magnifier Zoom */}
            {activeTab === 'images' && (
              <div 
                className="relative w-full h-full overflow-hidden cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setShowZoom(true)}
                onMouseLeave={() => setShowZoom(false)}
              >
                <img 
                  ref={mainImageRef}
                  src={product.images[activeMediaIndex] || 'https://placehold.co/800'} 
                  alt={product.name} 
                  className="w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />

                {/* Smooth Hover Magnifier Overlay */}
                {showZoom && (
                  <div 
                    className="absolute inset-0 pointer-events-none border-2 border-[#C5A880]/30 shadow-inner rounded-3xl"
                    style={{
                      backgroundImage: `url(${product.images[activeMediaIndex] || 'https://placehold.co/800'})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: '240%', // Scale zoom degree
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                )}

                {/* Swiping Indicator buttons */}
                <button 
                  onClick={(e) => { e.stopPropagation(); prevMedia(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border border-stone-200 text-stone-800 hover:bg-white transition cursor-pointer shadow-md select-none opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextMedia(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border border-stone-200 text-stone-800 hover:bg-white transition cursor-pointer shadow-md select-none opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Image Dots sequence indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-stone-950/40 backdrop-blur-xs select-none">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); setActiveMediaIndex(idx); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                        activeMediaIndex === idx ? 'w-4 bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Live HTMLInteractive 3D rotational renderer */}
            {activeTab === '3d' && (
              <div className="w-full h-full p-4 flex flex-col justify-between">
                {product.model_3d_enabled ? (
                  product.model_3d_url ? (
                    <div className="w-full h-full rounded-2xl overflow-hidden min-h-[340px]">
                      <iframe
                        src={product.model_3d_url}
                        title="Product 3D Model Custom Orbit"
                        className="w-full h-full border-0 min-h-[340px]"
                        allow="autoplay; fullscreen; xr-spatial-tracking"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-[340px] flex items-center justify-center text-center p-6 bg-stone-100 rounded-2xl border border-stone-200">
                      <div>
                        <Sliders className="w-8 h-8 text-stone-400 mx-auto mb-2 animate-bounce" />
                        <span className="text-xs font-bold text-stone-600 block uppercase tracking-wide">3D Custom Orbit Active</span>
                        <p className="text-[10px] text-stone-400 mt-1 max-w-xs font-mono">3D Model Enabled but model link is empty. Configure a valid iframe embed source URL in administrative panel specs.</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex-1 min-h-[340px]">
                    <ThreeViewer 
                      type={product.type3d} 
                      activeColor={selectedVariant?.color || product.variants?.[0]?.color}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Cinematic loop background video showcase */}
            {activeTab === 'video' && (
              <div className="relative w-full h-full bg-stone-950 flex items-center justify-center">
                {getYoutubeEmbedUrl(product.youtube_url) ? (
                  <iframe
                    src={getYoutubeEmbedUrl(product.youtube_url)!}
                    title="Product Showcase Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0 min-h-[340px]"
                  ></iframe>
                ) : (
                  <>
                    {/* Embedded mock product background video placeholder - luxurious watch gearing background */}
                    <img 
                      src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1200" 
                      alt="Video background placeholder" 
                      className="absolute inset-0 w-full h-full object-cover opacity-35 filter saturate-50 select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Beautiful pulse radar for watch showcase */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#C5A880]/15 flex items-center justify-center text-[#C5A880] border border-[#C5A880]/30 animate-pulse">
                        <Play className="w-8 h-8 fill-current" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#C5A880]">Live Cinematic Showcase</span>
                        <h5 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Handcrafted Mechanics Workflow</h5>
                        <p className="text-[10px] text-stone-400 max-w-sm font-mono leading-relaxed">
                          Every piece of JIJARELL armor, chronometer watch gearing or cowhide bag is custom stitched manually. High quality production ensures standard certified quality audits.
                        </p>
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-4 text-[9px] font-mono text-stone-500 bg-black/40 px-2.5 py-1 rounded">
                      STREAM IN FULL HD (1080P)
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Premium tag overlay info */}
            <span className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-white/95 text-stone-900 border border-stone-200 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
              {product.brand} Collection
            </span>

            {product.sale_price && (
              <span className="absolute top-4 right-4 z-10 px-2.5 py-1 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                Bespoke Offer
              </span>
            )}
          </div>

          {/* Swipe Thumbnail Gallery Strip */}
          <div className="flex gap-2 bg-[#FAF9F6] p-2 border border-stone-200/80 rounded-2xl overflow-x-auto scrollbar-none select-none">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveMediaIndex(idx);
                  setActiveTab('images');
                }}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                  activeTab === 'images' && activeMediaIndex === idx 
                    ? 'border-[#C5A880] ring-2 ring-[#C5A880]/15' 
                    : 'border-stone-200 opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={img} 
                  alt="Thumbnail" 
                  className="w-full h-full object-cover select-none pointer-events-none" 
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>

        </div>

        {/* Right Side: Product Details Column */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold">
                {product.brand}
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[9px] font-mono text-stone-400 uppercase">SKU: {product.sku}</span>
            </div>
            
            <h1 className="text-2xl font-serif font-black text-stone-950 leading-tight uppercase tracking-wider">
              {product.name}
            </h1>

            {/* Rating Stars Summary Box */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex items-center text-amber-500 font-bold text-xs bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                <span>{product.rating}</span>
                <span className="text-stone-400 font-normal ml-1">({reviews.length || product.reviewsCount} {lang === 'bn' ? 'রিভিউ' : 'reviews'})</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${product.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {product.stock > 0 
                  ? `${product.stock} ${lang === 'bn' ? 'স্টকে আছে' : 'Items In Vault'}`
                  : (lang === 'bn' ? 'স্টক শেষ' : 'Sold Out')
                }
              </span>
            </div>
          </div>

          {/* Luxury Pricing Panel */}
          <div className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-4.5 space-y-1">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400 block">Ledger Evaluation Price</span>
            <div className="flex items-baseline gap-3">
              {product.sale_price ? (
                <>
                  <span className="text-2xl font-black text-stone-950 font-serif">
                    {product.sale_price.toLocaleString()} BDT
                  </span>
                  <span className="text-sm text-stone-400 line-through font-mono">
                    {product.price.toLocaleString()} BDT
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-extrabold font-mono border border-emerald-200">
                    SAVE {(product.price - product.sale_price).toLocaleString()} BDT
                  </span>
                </>
              ) : (
                <span className="text-2xl font-black text-stone-950 font-serif">
                  {product.price.toLocaleString()} BDT
                </span>
              )}
            </div>
          </div>

          {/* Premium Size & Color Options Grid */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3.5 border-t border-b border-stone-150 py-5">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                <span>Select Craft Spec Customization:</span>
                <span className="text-amber-700">Hand-assembled size/color</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 border rounded-xl text-left select-none transition cursor-pointer relative flex flex-col group ${
                        isSelected 
                          ? 'border-stone-950 bg-stone-950 text-white' 
                          : 'border-stone-250 bg-white hover:border-stone-450 text-stone-700'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 bg-[#C5A880] rounded-full p-0.5 text-stone-950 shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[4.5]" />
                        </span>
                      )}
                      <span className="text-[11px] font-extrabold tracking-wide">Size: {v.size}</span>
                      <span className={`text-[10px] font-medium font-mono mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {v.color}
                      </span>
                      {v.stock <= 3 && v.stock > 0 && (
                        <span className="text-[8px] font-bold text-red-500 uppercase mt-1 animate-pulse">
                          Only {v.stock} left!
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity selector stepper input */}
          <div className="flex items-center justify-between gap-6 bg-stone-50 border border-stone-200.80 p-3.5 rounded-2xl">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-stone-400 block">Dispatch Quantity</span>
              <p className="text-[10px] text-stone-500">Limit 10 matching assets per order</p>
            </div>

            <div className="flex items-center border border-stone-250 rounded-xl bg-white overflow-hidden text-xs select-none">
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-3.5 py-2 font-bold hover:bg-stone-100 transition cursor-pointer"
              >
                -
              </button>
              <span className="px-5 py-2 font-black font-mono text-stone-950">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.min(10, prev + 1))}
                className="px-3.5 py-2 font-bold hover:bg-stone-100 transition cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Action CTAs: Add to Cart and Instant Buy Now */}
          <div className="grid grid-cols-2 gap-3.5 select-none pt-2">
            <button
              onClick={() => onAddToCart(product, selectedVariant, quantity)}
              className="px-6 py-4 border-2 border-stone-900 bg-white hover:bg-stone-50 text-stone-950 hover:text-stone-900 font-extrabold uppercase text-xs tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition duration-200"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
              <span>{lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add To Cart'}</span>
            </button>

            <button
              onClick={() => {
                // Instantly buy
                onInstantBuy(product, selectedVariant);
              }}
              className="px-6 py-4 bg-stone-950 hover:bg-stone-850 text-white font-extrabold uppercase text-xs tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition duration-200 shadow-md shadow-stone-950/15"
            >
              <span>{lang === 'bn' ? 'সহজে কিনুন' : 'Buy Instantly'}</span>
            </button>
          </div>

          {/* Share with friends */}
          <div className="flex gap-4 items-center justify-between text-[11px] text-stone-500 font-mono py-1 border-t border-stone-150 mt-4">
            <span>SECURE VAULT CERTIFICATE COMPLIANT</span>
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-[#C5A880] transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'COPIED LINK' : 'SHARE ITEM'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Editorial Tabs: Specs, Craftsmanship details */}
      <div className="border border-stone-200 rounded-3xl overflow-hidden bg-white shadow-xs">
        
        {/* Spec tabs selectors */}
        <div className="bg-stone-950 px-6 py-2.5 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-white border-b border-stone-800">
          <button
            onClick={() => setActiveSpecCategory('craft')}
            className={`px-4 py-2 transition-colors rounded-lg cursor-pointer ${
              activeSpecCategory === 'craft' ? 'text-stone-950 bg-[#C5A880]' : 'text-stone-400 hover:text-white'
            }`}
          >
            Craftsmanship Narrative
          </button>
          <button
            onClick={() => setActiveSpecCategory('specs')}
            className={`px-4 py-2 transition-colors rounded-lg cursor-pointer ${
              activeSpecCategory === 'specs' ? 'text-stone-950 bg-[#C5A880]' : 'text-stone-400 hover:text-white'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveSpecCategory('returns')}
            className={`px-4 py-2 transition-colors rounded-lg cursor-pointer ${
              activeSpecCategory === 'returns' ? 'text-stone-950 bg-[#C5A880]' : 'text-stone-400 hover:text-white'
            }`}
          >
            Logistics & Cargo Guarantees
          </button>
        </div>

        {/* Tab contents frame */}
        <div className="p-6 md:p-8 font-sans text-xs sm:text-xs">
          
          {activeSpecCategory === 'craft' && (
            <div className="max-w-3xl space-y-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C5A880] block">The Maker's Mark Statement</span>
              <h3 className="text-lg font-serif font-black text-stone-900 uppercase">
                Bespoke luxury built by generational hands in the JIJARELL Vaults
              </h3>
              <p className="text-stone-600 leading-relaxed max-w-2xl select-text text-sm">
                {product.description}
              </p>
              <p className="text-stone-500 leading-relaxed text-[11px] italic font-mono">
                "Our designs prioritize quality density over massive scale. Every artifact is double audited by JIJARELL’s precision quality department to guarantee an flawless life cycle."
              </p>
            </div>
          )}

          {activeSpecCategory === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono max-w-4xl text-left">
              <div className="space-y-2.5 p-4 bg-stone-50 rounded-2xl border border-stone-150">
                <span className="text-[10px] text-[#C5A880] font-black uppercase tracking-wider block">Caliber & Foundation</span>
                <ul className="space-y-1 text-[11px] text-stone-600">
                  <li>- Material Grade: <strong className="text-stone-950 font-bold">Premium Aerospace Alloy</strong></li>
                  <li>- Stitching / Bezel: <strong className="text-stone-950 font-bold">Hand-drawn meticulous mesh</strong></li>
                  <li>- Custom Engraving: <strong className="text-stone-950 font-bold">Available on bKash Validation</strong></li>
                </ul>
              </div>

              <div className="space-y-2.5 p-4 bg-stone-50 rounded-2xl border border-stone-150">
                <span className="text-[10px] text-[#C5A880] font-black uppercase tracking-wider block">Dimensions & Volume</span>
                <ul className="space-y-1 text-[11px] text-stone-600">
                  <li>- Weight Factor: <strong className="text-stone-950 font-bold">Individually balanced</strong></li>
                  <li>- Certified Certs: <strong className="text-stone-950 font-bold">Swiss Quality Audited</strong></li>
                  <li>- Unique ID Sequence: <strong className="text-stone-950 font-bold">Laser etched on case backing</strong></li>
                </ul>
              </div>

              <div className="space-y-2.5 p-4 bg-stone-50 rounded-2xl border border-stone-150">
                <span className="text-[10px] text-[#C5A880] font-black uppercase tracking-wider block">Box Extras Included</span>
                <ul className="space-y-1 text-[11px] text-stone-600">
                  <li>- Core Presentation: <strong className="text-stone-950 font-bold">Polished Mahogany Box</strong></li>
                  <li>- Warranty Cards: <strong className="text-stone-950 font-bold">24-month JIJARELL Bond Card</strong></li>
                  <li>- Logistics Seal: <strong className="text-stone-950 font-bold">Original Hologram verified</strong></li>
                </ul>
              </div>
            </div>
          )}

          {activeSpecCategory === 'returns' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed max-w-4xl">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-stone-100 rounded-xl shrink-0 text-stone-850">
                  <Truck className="w-5 h-5 text-[#C5A880]" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-stone-900 uppercase text-xs">Secured Express Dispatch Cargo</h4>
                  <p className="text-[11px] text-stone-500">
                    Your luxury package is transported via customized elite locked containers. Dhaka metropolitan area receives hand-delivery within 24-48 hours. Nationwide deliveries are packaged within double cardboard layers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-stone-100 rounded-xl shrink-0 text-stone-850">
                  <RotateCcw className="w-5 h-5 text-[#C5A880]" />
                </div>
                <div className="space-y-1 text-left">
                  <h4 className="font-bold text-stone-900 uppercase text-xs">3-Day Bespoke Quality Return Assurance</h4>
                  <p className="text-[11px] text-stone-500">
                    If the size or caliber exhibits even microscopic deviations from specifications, request an immediate swap loop via JIJARELL courier nodes. Product tags must remain uncompromised.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Reviews Section Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Aspect: Submit Review Box */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-3xl p-6 space-y-4">
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-mono font-extrabold uppercase tracking-wide text-[#C5A880]">VALUED feedback audits</span>
            <h3 className="text-base font-serif font-black uppercase text-stone-900">WRITE CUSTOMER REPORT</h3>
            <p className="text-[11px] text-stone-500">Publish your audit on this piece's quality, weight, and delivery.</p>
          </div>

          {isEligibleForReview ? (
            <>
              <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-[10px] text-left leading-normal">
                <p className="font-bold">✓ Delivered Order Verified!</p>
                <p className="text-[9.5px] mt-0.5 text-emerald-700">
                  Associated Order: <strong className="font-mono">#{associatedOrderId}</strong>
                  {deliveryDate && ` • Delivered on: ${new Date(deliveryDate).toLocaleDateString()}`}
                </p>
              </div>

              <form 
                onSubmit={handleReviewSubmit}
                onClickCapture={(e) => {
                  if (!customerUser && requireCustomerAuth) {
                    e.stopPropagation();
                    e.preventDefault();
                    requireCustomerAuth(() => {});
                  }
                }}
                className="space-y-3"
              >
                <div className="text-xs text-left">
                  <label className="font-bold text-stone-600 block mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    disabled={!!customerUser}
                    placeholder="e.g. Asif Mahmud"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    className="bg-stone-50 border border-stone-200/80 w-full px-3 py-2 rounded-xl focus:outline-none focus:border-stone-950 font-semibold select-text disabled:bg-stone-100 disabled:opacity-80"
                  />
                </div>

                <div className="text-xs text-left">
                  <label className="font-bold text-stone-600 block mb-1.5">Aesthetic Rating (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          if (customerUser) setNewReviewRating(star);
                        }}
                        className="p-1 transition cursor-pointer select-none"
                      >
                        <Star className={`w-5 h-5 ${star <= newReviewRating ? 'fill-amber-500 text-amber-500' : 'text-stone-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-left">
                  <label className="font-bold text-stone-600 block mb-1">Report Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Detail your styling satisfaction, mechanics feedback, or courier handling feedback..."
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="bg-stone-50 border border-stone-200/80 w-full p-3 rounded-xl focus:outline-none focus:border-stone-950 select-text"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-stone-950 hover:bg-stone-850 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer transition shadow-md"
                >
                  Submit Report Verification
                </button>
              </form>
            </>
          ) : (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-500 text-[11px] text-left leading-relaxed space-y-2">
              <p className="font-bold text-stone-750 uppercase text-[10px] tracking-wider">🔒 Review Section Policy</p>
              <p>
                A customer can only write and see the review option after their order is marked as **Delivered** (completed). Review section controls remain hidden until a verified delivery transaction is logged.
              </p>
              <p className="text-[10px] text-stone-400 font-mono">
                Order status is checked automatically on your active phone number or session profile.
              </p>
            </div>
          )}

          {reviewSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[10px] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Report uploaded! It will be verified instantly by ledger miners.</span>
            </div>
          )}
        </div>

        {/* Right Aspect: Reviews Ledger Feed */}
        <div className="lg:col-span-8 bg-[#FAF9F6] border border-stone-205 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h4 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#C5A880]">
              VERIFIED AUDITOR REPORTS ({reviews.length})
            </h4>
            <span className="text-[9px] font-mono text-stone-400">DOUBLE INTEGRITY ENCRYPTED</span>
          </div>

          <div className="divide-y divide-stone-200/80 max-h-[360px] overflow-y-auto space-y-4 pr-1.5 scrollbar-thin">
            {reviewsLoading ? (
              <div className="text-center py-12 text-xs font-bold text-stone-400 uppercase animate-pulse">
                Auditing user feedback servers...
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <MessageSquare className="w-6 h-6 text-stone-300 mx-auto" />
                <p className="text-[10px] text-stone-400 uppercase font-mono tracking-wide">
                  No verified client ledgers found on products yet. Feel free to deploy the first.
                </p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-2 text-left">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                       <span className="w-7 h-7 rounded-full bg-[#C5A880]/15 flex items-center justify-center font-black text-[10px] text-[#C5A880] uppercase">
                        {rev.user_name.slice(0, 2)}
                      </span>
                      <div>
                        <h5 className="font-extrabold text-stone-950 text-[11px] leading-tight select-text">
                          {rev.user_name}
                        </h5>
                        <div className="flex gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-2.5 h-2.5 ${i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-stone-400 font-semibold">
                      {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 pl-9 leading-relaxed select-text">
                    "{rev.review}"
                  </p>
                  
                  {rev.admin_reply && (
                    <div className="ml-9 mt-2 p-3 bg-stone-100 rounded-xl border border-stone-200 text-left space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-black tracking-widest text-[#C5A880] uppercase block">💎 Concierge Reply</span>
                        {rev.admin_reply_at && (
                          <span className="text-[8px] font-mono text-stone-400">
                            {new Date(rev.admin_reply_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] italic text-stone-750">"{rev.admin_reply}"</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Related Premium Vault Items */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-stone-200">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-black">
              VAULT EXPLORER
            </span>
            <h3 className="text-lg font-serif font-black text-stone-950 uppercase tracking-wider mt-0.5">
              Similar Elite Collections
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((rel) => {
              const relPrice = rel.sale_price || rel.price;
              return (
                <div
                  key={rel.id}
                  onClick={() => onNavigate(`/product/${rel.slug}`)}
                  className="group bg-white border border-stone-200 rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-square bg-stone-100 overflow-hidden relative">
                    <img
                      src={rel.images[0]}
                      alt={rel.name}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-3 text-left space-y-1">
                    <span className="text-[8px] font-mono tracking-widest text-[#C5A880] uppercase font-bold">
                      {rel.brand}
                    </span>
                    <h4 className="text-[11px] font-bold text-stone-800 line-clamp-1 group-hover:text-[#C5A880] transition-colors leading-tight">
                      {rel.name}
                    </h4>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-sans font-black text-stone-900 shrink-0">
                        {relPrice.toLocaleString()} BDT
                      </span>
                      <div className="flex items-center text-[9px] text-amber-500 font-bold shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 mr-0.5" />
                        <span>{rel.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Viewed Drawer Cards Section */}
      {recentlyViewed.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-stone-200">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-black">
              History Log
            </span>
            <h3 className="text-lg font-serif font-black text-stone-950 uppercase tracking-wider mt-0.5">
              Recently Visited Artifacts
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {recentlyViewed.map((rev) => {
              const revPrice = rev.sale_price || rev.price;
              return (
                <div
                  key={rev.id}
                  onClick={() => onNavigate(`/product/${rev.slug}`)}
                  className="group bg-white border border-stone-200 rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-square bg-stone-50 overflow-hidden relative">
                    <img
                      src={rev.images[0]}
                      alt={rev.name}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-2.5 text-left space-y-1">
                    <h4 className="text-[10px] font-extrabold text-stone-850 line-clamp-1 leading-tight">
                      {rev.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#C5A880] font-sans">
                        {revPrice.toLocaleString()} BDT
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
