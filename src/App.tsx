import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Sparkles, User, Globe, MessageSquare, Clipboard, Check, 
  MapPin, Clock, Search, ChevronRight, Compass, Shield, ArrowRight, 
  Sliders, Star, Tag, X, Plus, Minus, Send, PhoneCall, Gift, CheckCircle2,
  Truck, CreditCard, RefreshCw, Bell, Mail, Facebook, Instagram, Heart,
  LayoutDashboard
} from 'lucide-react';

import { useLanguage, LanguageProvider } from './components/LanguageContext';
import { AnimatePresence } from 'motion/react';
const ThreeViewer = React.lazy(() => import('./components/ThreeViewer'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));
const AiChatAssistant = React.lazy(() => import('./components/AiChatAssistant'));
const OrderHistory = React.lazy(() => import('./components/OrderHistory'));
const NotificationCenter = React.lazy(() => import('./components/NotificationCenter'));
const ProductDetailsPage = React.lazy(() => import('./components/ProductDetailsPage'));
const CustomerDashboard = React.lazy(() => import('./components/CustomerDashboard'));

// A luxurious progressive skeleton loader fallback for React Suspense
const ElegantLoader = () => (
  <div className="flex flex-col items-center justify-center p-12 w-full text-center space-y-3">
    <RefreshCw className="w-6 h-6 animate-spin text-[#C5A880]" />
    <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase animate-pulse">Initializing Module...</span>
  </div>
);
import AdvancedSearchBar from './components/AdvancedSearchBar';
import PromoBannerSlider from './components/PromoBannerSlider';
import { Product, Order, Category, Blog, AppSettings, Review, Banner } from './types';

const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || "1009133644062-8e7v337m9q05m98qgrgq9rt7co8h3602.apps.googleusercontent.com";

// Main App Inner component after wrapping with LanguageProvider
function MainLayout() {
  const { lang, setLang, t } = useLanguage();

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Core Path routing state & popstate listener for /product/[slug]
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to resolve product from path
  const getProductFromPath = (): Product | null => {
    if (currentPath.startsWith('/product/')) {
      const slug = currentPath.substring('/product/'.length);
      return products.find(p => p.slug === slug || p.id === slug) || null;
    }
    return null;
  };

  const pathSelectedProduct = getProductFromPath();
  
// Interface panel controllers
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSizeColor, setSelectedSizeColor] = useState<any>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedVariant: any }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminAuthorized, setAdminAuthorized] = useState(() => {
    const isPathOk = window.location.pathname === '/wasif-jijarell' || window.location.pathname === '/wasif-jijarell/';
    return isPathOk && sessionStorage.getItem('jijarell_admin_auth') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isCustomerDashboardOpen, setIsCustomerDashboardOpen] = useState(false);
  const [preSelectedOrderId, setPreSelectedOrderId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'reviews'>('details');

  // Checkout Details
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponCodeApplied, setCouponCodeApplied] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'bkash'>('whatsapp');
  const [bkashTxnId, setBkashTxnId] = useState('');

  // AI Search states
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchExplanation, setAiSearchExplanation] = useState<string | null>(null);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);
  const [aiSearching, setAiSearching] = useState(false);

  // Reviews list & writing review
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');

  // Customer Authentication & Private Session States
  const [customerUser, setCustomerUser] = useState<any | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(() => localStorage.getItem('jijarell_customer_token'));
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState(false);
  const [isCustomerPanelOpen, setIsCustomerPanelOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  // Troubleshooting details for whitelisting origins in raw Google Client Console
  const [isOriginsTroubleshootOpen, setIsOriginsTroubleshootOpen] = useState(false);
  const [wasUrlCopied, setWasUrlCopied] = useState<{[key: string]: boolean}>({});
  
  // OTP Flow States
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [devCustomerOtp, setDevCustomerOtp] = useState<string | null>(null);

  // Synchronous authorization guard
  const requireCustomerAuth = (action: () => void) => {
    if (customerUser) {
      action(); // Authorized immediately
    } else {
      setPendingAction(() => action); // Buffered actions
      setIsCustomerAuthModalOpen(true); // Fire authentic verification modal
    }
  };

  // Google Sign-In SDK Handler Integration on Modal Load
  useEffect(() => {
    let interval: any;
    if (isCustomerAuthModalOpen) {
      const initGoogle = () => {
        if ((window as any).google?.accounts?.id) {
          try {
            (window as any).google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID, // client identifier
              callback: async (response: any) => {
                if (response.credential) {
                  await handleGoogleSignInResponse(response.credential);
                }
              },
              auto_select: false,
            });

            const container = document.getElementById("googleSyncBtnSlot");
            if (container) {
              (window as any).google.accounts.id.renderButton(
                container,
                { theme: "outline", size: "large", width: "320", text: "continue_with" }
              );
              clearInterval(interval);
            }
          } catch (err) {
            console.error("Fidelity Error rendering Google authentication callback widget:", err);
          }
        }
      };

      initGoogle();
      interval = setInterval(initGoogle, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCustomerAuthModalOpen, customerUser]);

  // Retrieve existing customer session on bootstrap load
  useEffect(() => {
    const fetchSession = async () => {
      const token = localStorage.getItem('jijarell_customer_token');
      if (token) {
        try {
          const res = await fetch('/api/customer/auth/session', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              setCustomerUser(data.user);
              if (data.user.name) setCustomerName(data.user.name);
              if (data.user.customer_phone) setCustomerPhone(data.user.customer_phone);
              if (data.user.customer_address) setCustomerAddress(data.user.customer_address);
            } else {
              localStorage.removeItem('jijarell_customer_token');
            }
          } else {
            localStorage.removeItem('jijarell_customer_token');
          }
        } catch (err) {
          console.error("Customer coordinate recovery session failed:", err);
        }
      }
    };
    fetchSession();
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForOtp.trim()) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/customer/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForOtp.toLowerCase().trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        if (data.dev_otp) {
          setDevCustomerOtp(data.dev_otp);
        } else {
          setDevCustomerOtp(null);
        }
        triggerNotificationToast('OTP Dispatched', `A 6-digit access code was sent to ${emailForOtp}.`, 'paid');
      } else {
        setOtpError(data.error || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setOtpError('SMTP network connection failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/customer/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailForOtp.toLowerCase().trim(), otp: otpCodeInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomerUser(data.user);
        setCustomerToken(data.token);
        localStorage.setItem('jijarell_customer_token', data.token);
        setIsCustomerAuthModalOpen(false);
        setOtpSent(false);
        setOtpCodeInput('');
        setEmailForOtp('');
        setDevCustomerOtp(null);
        
        if (data.user.name) setCustomerName(data.user.name);
        if (data.user.customer_phone) setCustomerPhone(data.user.customer_phone);
        if (data.user.customer_address) setCustomerAddress(data.user.customer_address);

        triggerNotificationToast('Authenticated Successfully', 'Your secure JIJARELL Genève session is now live.', 'paid');
        
        if (pendingAction) {
          const actionToRun = pendingAction;
          setPendingAction(null);
          actionToRun();
        }
      } else {
        setOtpError(data.error || 'Incorrect verification password token.');
      }
    } catch (err) {
      setOtpError('Verification request failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleSignInResponse = async (credential: string) => {
    setOtpLoading(true);
    setOtpError('');
    try {
       const res = await fetch('/api/customer/auth/google', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ credential })
       });
       const data = await res.json();
       if (res.ok && data.success) {
         setCustomerUser(data.user);
         setCustomerToken(data.token);
         localStorage.setItem('jijarell_customer_token', data.token);
         setIsCustomerAuthModalOpen(false);
         
         if (data.user.name) setCustomerName(data.user.name);
         if (data.user.customer_phone) setCustomerPhone(data.user.customer_phone);
         if (data.user.customer_address) setCustomerAddress(data.user.customer_address);

         triggerNotificationToast('Authenticated via Google', 'Access granted to JIJARELL catalog.', 'paid');

         if (pendingAction) {
           const actionToRun = pendingAction;
           setPendingAction(null);
           actionToRun();
         }
       } else {
         setOtpError(data.error || 'Google login verification failed.');
       }
    } catch (err) {
       setOtpError('Google session validation failed.');
    } finally {
       setOtpLoading(false);
    }
  };

  const handleGoogleContinue = () => {
    setOtpLoading(true);
    setOtpError('');

    const runGoogleOAuth = () => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: async (response: any) => {
            if (response && response.access_token) {
              try {
                const res = await fetch("/api/customer/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ accessToken: response.access_token })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                  setCustomerUser(data.user);
                  setCustomerToken(data.token);
                  localStorage.setItem('jijarell_customer_token', data.token);
                  setIsCustomerAuthModalOpen(false);
                  setOtpSent(false);
                  setOtpCodeInput('');
                  setEmailForOtp('');
                  setDevCustomerOtp(null);

                  if (data.user.name) setCustomerName(data.user.name);
                  if (data.user.customer_phone) setCustomerPhone(data.user.customer_phone);
                  if (data.user.customer_address) setCustomerAddress(data.user.customer_address);

                  triggerNotificationToast('Authenticated via Google', 'Access granted to your JIJARELL profile.', 'paid');

                  if (pendingAction) {
                    const actionToRun = pendingAction;
                    setPendingAction(null);
                    actionToRun();
                  }
                } else {
                  setOtpError(data.error || "Google sign-in registration failed.");
                }
              } catch (err) {
                setOtpError("Failed to communicate with authorization nodes.");
              } finally {
                setOtpLoading(false);
              }
            } else {
              setOtpLoading(false);
              if (response && response.error) {
                setOtpError(`Google OAuth error: ${response.error}`);
              }
            }
          },
          error_callback: (err: any) => {
            setOtpLoading(false);
            setOtpError(err.message || "Interrupted or cancelled Google Authentication.");
          }
        });
        client.requestAccessToken();
      } catch (err: any) {
        setOtpLoading(false);
        setOtpError("Google Sign-In Account Chooser failed to launch.");
        console.error("Token Client launch error:", err);
      }
    };

    // Resilient auto-loader and poller for the Google Identification API
    if (!(window as any).google?.accounts?.oauth2) {
      let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (!script) {
        script = document.createElement('script');
        (script as any).src = 'https://accounts.google.com/gsi/client';
        document.head.appendChild(script);
      }

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          runGoogleOAuth();
        } else if (attempts >= 30) {
          clearInterval(interval);
          setOtpLoading(false);
          setOtpError("The Google Identity API took too long to initialize. Please verify your internet connection and try again.");
        }
      }, 100);
    } else {
      runGoogleOAuth();
    }
  };

  const handleCustomerLogout = () => {
    setCustomerUser(null);
    setCustomerToken(null);
    localStorage.removeItem('jijarell_customer_token');
    setIsCustomerPanelOpen(false);
    triggerNotificationToast('Session Terminated', 'You are logged out safely from your customer account.', 'shipped');
  };

  const triggerNotificationToast = (title: string, desc: string, type: 'processing' | 'shipped' | 'paid' = 'paid') => {
    const newToast = {
      id: 'toast-' + Math.floor(Math.random() * 100000),
      title,
      description: desc,
      type,
      timestamp: Date.now()
    };
    setToasts(prev => [newToast, ...prev].slice(0, 3));
  };

  const toggleWishlist = async (productId: string) => {
    if (!customerToken) return;
    try {
      const res = await fetch('/api/customer/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (data.success) {
        setCustomerUser((prev: any) => ({
          ...prev,
          wishlist: data.wishlist
        }));
        triggerNotificationToast('Wishlist Synchronized', 'Collection preference stored in cloud profile.', 'paid');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToken) return;
    try {
      const res = await fetch('/api/customer/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${customerToken}`
        },
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone,
          address: customerAddress
        })
      });
      const data = await res.json();
      if (data.success) {
        setCustomerUser(data.user);
        triggerNotificationToast('Profile Synchronized', 'Your private account coordinates were updated.', 'paid');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Order Confirmed Notification Modal
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isRefreshingOrderStatus, setIsRefreshingOrderStatus] = useState(false);

  // Geolocation auto-fill states & actions
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleAutoFillAddress = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use OpenStreetMap Nominatim reverse geocoding API to resolve coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            {
              headers: {
                'Accept-Language': lang === 'bn' ? 'bn,en' : 'en',
                'User-Agent': `JIJARELL-Luxury/1.0 (wasifsafi55@gmail.com)`
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              const bldg = addr.building || addr.house_number || '';
              const road = addr.road || addr.suburb || '';
              const neighbourhood = addr.neighbourhood || addr.suburb || '';
              const city = addr.city || addr.town || addr.village || addr.municipality || '';
              const state = addr.state || addr.region || '';
              const postcode = addr.postcode || '';
              const country = addr.country || '';

              const parts = [];
              if (bldg) parts.push(bldg);
              if (road) parts.push(road);
              if (neighbourhood && neighbourhood !== road) parts.push(neighbourhood);
              if (city) parts.push(city);
              if (state && state !== city) parts.push(state);
              if (postcode) parts.push(postcode);
              if (country) parts.push(country);

              const formatted = parts.join(', ');
              if (formatted) {
                setCustomerAddress(formatted);
              } else {
                setCustomerAddress(`Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
              }
            } else {
              setCustomerAddress(`Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
            }
          } else {
            setCustomerAddress(`Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        } catch (err) {
          console.error("OSM Nominatim API request failed, using coordinate fallback:", err);
          setCustomerAddress(`Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = "Awaiting permission or signal...";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Position unavailable. Try manually.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out.";
        }
        setLocationError(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Realtime order state tracking & premium toast overlay
  interface ToastNotification {
    id: string;
    orderId: string;
    title: string;
    description: string;
    type: 'processing' | 'shipped' | 'paid';
    timestamp: number;
  }

  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const seenStatusesRef = useRef<Record<string, { status: string; payment_status: string }>>({});
  const isFirstFetchRef = useRef(true);

  // Play a beautiful high-end synthesizer chime using pristine Web Audio API
  const playLuxuryChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.18); // C6
      
      gainNode.gain.setValueAtTime(0.0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
    } catch (e) {
      console.warn("Audio Context block or unsupported:", e);
    }
  };

  const addToast = (orderId: string, title: string, description: string, type: 'processing' | 'shipped' | 'paid') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastNotification = {
      id,
      orderId,
      title,
      description,
      type,
      timestamp: Date.now()
    };
    setToasts(prev => [newToast, ...prev].slice(0, 3)); // Keep max 3 on screen
    playLuxuryChime();

    // Auto dismiss after 7.5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 7500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const syncAllTrackedStatuses = async () => {
    const currentPlacedId = placedOrder?.id;
    const lastTrackedPhone = localStorage.getItem('jijarell_last_tracked_phone');
    
    // If no active or tracked orders, skip pulling
    if (!currentPlacedId && !lastTrackedPhone) return;

    setIsRefreshingOrderStatus(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const allOrders: any[] = await res.json();
        
        // Normalize helper to match phones
        const normalize = (p: string) => p.replace(/\D/g, '');
        const isMatch = (p1: string, p2: string) => {
          const n1 = normalize(p1);
          const n2 = normalize(p2);
          return n1 && n2 && (n1 === n2 || n1.slice(-10) === n2.slice(-10));
        };

        // Filter relevant orders mapping to current placedOrder or tracked phone
        const relevant = allOrders.filter(o => {
          return o.id === currentPlacedId || (lastTrackedPhone && isMatch(o.customer_phone, lastTrackedPhone));
        });

        // Live update active modal's state
        if (currentPlacedId) {
          const matchingCurrent = relevant.find(o => o.id === currentPlacedId);
          if (matchingCurrent && JSON.stringify(matchingCurrent) !== JSON.stringify(placedOrder)) {
            setPlacedOrder(matchingCurrent);
          }
        }

        // Compare transitions
        relevant.forEach((ord) => {
          const oldState = seenStatusesRef.current[ord.id];
          
          if (oldState && !isFirstFetchRef.current) {
            // Check major status promotions
            if (oldState.status !== ord.status) {
              if (ord.status === 'processing') {
                addToast(
                  ord.id,
                  `Wrapping Status Upgraded`,
                  `Order #${ord.id} status is now being handmade, wrapped & packaged.`,
                  'processing'
                );
              } else if (ord.status === 'completed') {
                addToast(
                  ord.id,
                  `Order Dispatched`,
                  `Order #${ord.id} has been dispatched to Elite Cargo Courier!`,
                  'shipped'
                );
              }
            }

            // Check payment verification
            if (oldState.payment_status !== ord.payment_status) {
              if (ord.payment_status === 'paid') {
                addToast(
                  ord.id,
                  `Payment Ledger Approved`,
                  `Financial auditors have successfully validated and approved payment for #${ord.id}.`,
                  'paid'
                );
              }
            }
          }

          // Remember status transition points
          seenStatusesRef.current[ord.id] = {
            status: ord.status,
            payment_status: ord.payment_status
          };
        });

        // Complete first synchronization sequence
        isFirstFetchRef.current = false;
      }
    } catch (e) {
      console.error('Error in status background polling loop:', e);
    } finally {
      setIsRefreshingOrderStatus(false);
    }
  };

  // Load baseline app parameters & active catalogue from REST API
  const syncBaseCatalog = async () => {
    try {
      const [pRes, cRes, bRes, sRes, banRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/blogs').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/banners').then(r => r.json())
      ]);

      setProducts(pRes);
      setCategories(cRes);
      setBlogs(bRes);
      setSettings(sRes);
      setBanners(banRes || []);
    } catch (err) {
      console.error('Error fetching baseline inventory parameters:', err);
    }
  };

  useEffect(() => {
    syncBaseCatalog();
    const currentPath = window.location.pathname;
    if (currentPath === '/wasif' || currentPath === '/wasif/') {
      window.history.replaceState({}, '', '/wasif-jijarell/');
      setIsAdminOpen(true);
    } else if (currentPath === '/wasif-jijarell' || currentPath === '/wasif-jijarell/') {
      setIsAdminOpen(true);
    } else {
      setIsAdminOpen(false);
    }
    // Load local storage cart if exists
    const storedCart = localStorage.getItem('jijarell_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        // Safe fail
      }
    }
  }, []);

  useEffect(() => {
    // Synchronize and audit status instantly
    syncAllTrackedStatuses();
 
    // Continuous background audit cycle checking status upgrades (5 seconds interval)
    const interval = setInterval(() => {
      syncAllTrackedStatuses();
    }, 5000);
 
    return () => clearInterval(interval);
  }, [placedOrder?.id]);

  // Real-time Event Stream Subscriber for instantaneous notification updates and order progress alerts
  useEffect(() => {
    const lastPhone = localStorage.getItem('jijarell_last_tracked_phone') || '';
    const queryParam = lastPhone ? `?phone=${encodeURIComponent(lastPhone)}` : '';
    const streamUrl = `/api/notifications/stream${queryParam}`;
    
    console.log(`[EventSource] Establishing live telemetry hook to: ${streamUrl}`);
    const es = new EventSource(streamUrl);

    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        if (raw.type === 'connected_handshake') {
          console.log('[SSE Telemetry] Connection handshakes completed under 1ms.');
          return;
        }

        console.log('[SSE Notification Received]', raw);
        
        // 1. Instantly trigger database/tracking synchronization
        syncAllTrackedStatuses();
        
        // Refresh catalog parameters in case product catalogue/banners changed
        syncBaseCatalog();

        // 2. Map and instantly present luxury visual Toast alert block
        const notifTitle = lang === 'bn' ? (raw.title_bn || raw.title) : raw.title;
        const notifBody = lang === 'bn' ? (raw.body_bn || raw.body) : raw.body;
        
        let visualToastType = 'shipped';
        if (raw.type === 'promotion' || raw.type === 'coupon') {
          visualToastType = 'processing';
        } else if (raw.title?.toLowerCase().includes('reject') || raw.title?.toLowerCase().includes('cancel')) {
          visualToastType = 'cancelled';
        } else if (raw.title?.toLowerCase().includes('verify') || raw.title?.toLowerCase().includes('paid')) {
          visualToastType = 'paid';
        }

        addToast(
          raw.id || 'not-' + Date.now(),
          notifTitle,
          notifBody,
          visualToastType as any
        );

        // 3. Audio Luxe Verification chime trigger
        try {
          playLuxuryChime();
        } catch (_) {
          // ignore autoplays rules limits
        }

      } catch (err) {
        console.error('Failure executing microsecond telemetry update dispatch:', err);
      }
    };

    es.onerror = (e) => {
      console.warn('[SSE Stream Telemetry Warning] Connection dropped. Automatically reconnecting in background.', e);
    };

    return () => {
      es.close();
      console.log('[SSE Stream Telemetry Closed] Connection disposed.');
    };
  }, [lang, placedOrder?.id]);

  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.variants && selectedProduct.variants.length > 0) {
        setSelectedSizeColor(selectedProduct.variants[0]);
      } else {
        setSelectedSizeColor(null);
      }
    } else {
      setSelectedSizeColor(null);
    }
  }, [selectedProduct]);

  const updateCartLocalStorage = (newCart: typeof cart) => {
    setCart(newCart);
    localStorage.setItem('jijarell_cart', JSON.stringify(newCart));
  };

  // Add items configuration
  const addToCart = (product: Product, variant: any, quantity: number = 1) => {
    const existingIdx = cart.findIndex(
      item => item.product.id === product.id && item.selectedVariant?.id === variant?.id
    );

    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += quantity;
      updateCartLocalStorage(updated);
    } else {
      updateCartLocalStorage([...cart, { product, quantity, selectedVariant: variant }]);
    }
    setIsCartOpen(true);
  };

  const updateCartQty = (idx: number, delta: number) => {
    const updated = [...cart];
    updated[idx].quantity += delta;
    if (updated[idx].quantity <= 0) {
      updated.splice(idx, 1);
    }
    updateCartLocalStorage(updated);
  };

  // AI-Powered intelligent filter execution on search submit
  const handleAiSmartSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) {
      setAiMatchedIds(null);
      setAiSearchExplanation(null);
      return;
    }

    setAiSearching(true);
    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiSearchQuery })
      });
      const data = await res.json();
      setAiMatchedIds(data.matchedProductIds || []);
      setAiSearchExplanation(data.explanation || null);
    } catch (err) {
      console.error(err);
      setAiMatchedIds([]);
    } finally {
      setAiSearching(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const coupon = data.coupon;
        setCouponCodeApplied(coupon.code);
        if (coupon.discount_type === 'percentage') {
          const discountVal = (cartSubtotal * coupon.discount_value) / 100;
          setAppliedDiscount(discountVal);
        } else {
          setAppliedDiscount(coupon.discount_value);
        }
      } else {
        alert(data.error || 'Invalid coupon input code.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const sub = cartSubtotal;
    const finalTotal = Math.max(0, sub - appliedDiscount + 200);

    const orderPayload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      customer_notes: customerNotes,
      subtotal: sub,
      discount: appliedDiscount,
      shipping: 200,
      total: finalTotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'bkash' ? 'pending_verification' : 'unpaid',
      transaction_id: paymentMethod === 'bkash' ? bkashTxnId : '',
      user_id: customerUser?.id || undefined,
      customer_email: customerUser?.email || undefined,
      items: cart.map(c => ({
        product_id: c.product.id,
        productName: c.product.name,
        quantity: c.quantity,
        price: c.product.sale_price || c.product.price,
        variantStr: c.selectedVariant ? `${c.selectedVariant.size} (${c.selectedVariant.color})` : 'Standard Specifications',
        productImage: c.product.images[0]
      }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customerToken ? { 'Authorization': `Bearer ${customerToken}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        const bookedOrder = data.order;
        setPlacedOrder(bookedOrder);
        
        // If payment method is WhatsApp, launch auto-direction trigger
        if (paymentMethod === 'whatsapp') {
          const waNumber = settings?.whatsapp_number || '8801712345678';
          const itemsListText = cart.map(c => 
            `- ${c.product.name} [${c.selectedVariant ? c.selectedVariant.size : 'Standard Specification'}] Qty: ${c.quantity} @ ${c.product.sale_price || c.product.price} BDT`
          ).join('\n');

          const notesPart = customerNotes ? `*Special Customizations/Notes:*\n${customerNotes}\n\n` : '';

          const waText = encodeURIComponent(
            `*JIJARELL LUXURY PLACEMENT SUMMARY*\n` +
            `Order Code: *${bookedOrder.id}*\n\n` +
            `*Client Contact details:*\n` +
            `Name: ${customerName}\n` +
            `Phone: ${customerPhone}\n` +
            `Address: ${customerAddress}\n` +
            (customerNotes ? `Notes/Customizations: ${customerNotes}\n` : '') + `\n` +
            `*Selected Artifacts:*\n${itemsListText}\n\n` +
            notesPart +
            `Subtotal: ${sub.toLocaleString()} BDT\n` +
            `Discount applied: ${appliedDiscount.toLocaleString()} BDT\n` +
            `Total Outstanding: *${finalTotal.toLocaleString()} BDT*\n\n` +
            `_Requested secure dispatcher and courier scheduling approval._`
          );
          
          window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank');
        }

        // Wipe local cart on order placement
        updateCartLocalStorage([]);
        setIsCheckoutOpen(false);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setCustomerNotes('');
        setBkashTxnId('');
      }
    } catch (err) {
      console.error('Error finalising checkout:', err);
    }
  };

  // Fetch reviews for specific item when details modal renders
  const syncProductReviews = async (pId: string) => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      const filtered = data.filter((item: any) => item.product_id === pId);
      setProductReviews(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newReviewAuthor || !newReviewText) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          user_name: newReviewAuthor,
          rating: newReviewRating,
          review: newReviewText
        })
      });

      if (res.ok) {
        setNewReviewAuthor('');
        setNewReviewText('');
        setNewReviewRating(5);
        syncProductReviews(selectedProduct.id);
        // Refresh product specifications to load recalculated reviews average & count
        syncBaseCatalog();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // derived statistics calculations
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.product.sale_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  // filter catalog
  const filteredProducts = products.filter(p => {
    if (!p.is_active) return false;
    // Apply AI search restriction if set
    if (aiMatchedIds !== null) {
      return aiMatchedIds.includes(p.id);
    }
    // Apply category selection tab constraint
    if (activeCategory !== 'all') {
      return p.category_id === activeCategory;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-850 flex flex-col font-sans antialiased">
      
      {/* 1. Dynamic Announcement & Countdown banner bar */}
      <div className="bg-[#111] text-white py-2 px-6 flex flex-col sm:flex-row items-center justify-between text-xs font-semibold gap-2 border-b border-stone-850 select-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse"></span>
          <span className="tracking-wide text-xs">{settings?.announcement_text || t('welcome_announcement')}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#C5A880] text-[11px] font-mono select-none uppercase tracking-widest hidden sm:inline">
            {t('promo_countdown')}<strong className="text-white hover:underline cursor-copy font-bold bg-stone-800 px-1.5 py-0.5 rounded ml-1">LUXURY5000</strong>
          </span>
          {/* Swaps linguistic locales inside context */}
          <div className="flex border border-stone-800 bg-[#1e1e1e] rounded-md p-0.5 select-none text-[10px]">
            <button 
              onClick={() => setLang('en')} 
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${lang === 'en' ? 'bg-[#C5A880] text-stone-950 font-extrabold' : 'text-stone-400 hover:text-white'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('bn')} 
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${lang === 'bn' ? 'bg-[#C5A880] text-stone-950 font-extrabold' : 'text-stone-400 hover:text-white'}`}
            >
              BN
            </button>
          </div>
        </div>
      </div>

      {/* 2. Premium Luxury Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-stone-150 backdrop-blur-md px-4 py-3 md:px-12 select-none shadow-xs">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex flex-col select-all cursor-default">
              <span className="text-lg font-black tracking-[0.25em] text-stone-950 font-serif leading-none">{t('brand_title')}</span>
              <span className="text-[8.5px] tracking-[0.2em] text-[#C5A880] uppercase font-mono mt-1 font-extrabold">{t('brand_sub')}</span>
            </div>

            {/* Navigation link elements (Hidden on small and tablet layout to focus key UX) */}
            <nav className="hidden lg:flex items-center gap-6 text-[11px] uppercase font-bold tracking-widest text-stone-500 whitespace-nowrap ml-8">
              {categories.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => {
                    setActiveCategory(c.id);
                    setAiMatchedIds(null);
                    setAiSearchExplanation(null);
                  }} 
                  className={`hover:text-stone-900 transition-colors cursor-pointer ${activeCategory === c.id ? 'text-[#C5A880] underline underline-offset-4 font-black' : ''}`}
                >
                  {c.name}
                </button>
              ))}
              <button 
                onClick={() => {
                  setActiveCategory('all');
                  setAiMatchedIds(null);
                  setAiSearchExplanation(null);
                }} 
                className="hover:text-[#C5A880] transition-colors font-extrabold cursor-pointer"
              >
                {t('all')}
              </button>
            </nav>

            {/* Action controllers bundle for mobile (shown on mobile-only inside Logo row) */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Notification Bell Button */}
              <button 
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                className="relative flex items-center justify-center w-8 h-8 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition cursor-pointer select-none shrink-0"
                aria-label="Notifications"
              >
                <Bell className="w-3.5 h-3.5 text-[#C5A880]" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C5A880] text-stone-950 font-sans text-[7.5px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center pointer-events-none ring-1/2 ring-white">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {customerUser && (
                <button 
                  type="button"
                  onClick={() => setIsCustomerDashboardOpen(true)}
                  className="relative flex items-center justify-center w-8 h-8 rounded-xl border border-stone-200 hover:border-[#C5A880] hover:bg-stone-50 text-stone-600 hover:text-[#C5A880] transition cursor-pointer select-none shrink-0"
                  aria-label="Client Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#C5A880]" />
                </button>
              )}

              {/* Cart triggers */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-1 px-2 py-1.5 bg-stone-950 hover:bg-stone-850 active:scale-95 text-white rounded-xl text-[10px] font-bold transition-all shadow-md relative cursor-pointer"
              >
                <ShoppingBag className="w-3 h-3 text-[#C5A880]" />
                <span className="bg-[#C5A880] text-stone-950 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-extrabold font-sans leading-none">
                  {cartItemsCount}
                </span>
              </button>

              {/* Mobile User Profile Button */}
              {customerUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerPanelOpen(!isCustomerPanelOpen);
                    }}
                    className="w-8 h-8 rounded-xl p-0 flex items-center justify-center border border-stone-200 hover:border-[#C5A880] cursor-pointer overflow-hidden shrink-0"
                  >
                    <img
                      src={customerUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerUser.email)}`}
                      alt={customerUser.name}
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  
                  {isCustomerPanelOpen && (
                    <div className="absolute top-9 right-0 w-44 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-50 text-left">
                      <div className="px-3 py-1 border-b border-stone-100">
                        <p className="text-[9px] font-bold text-stone-800 truncate">{customerUser.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCustomerPanelOpen(false);
                          setIsCustomerDashboardOpen(true);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50 hover:text-[#C5A880] transition"
                      >
                        Client Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomerLogout();
                        }}
                        className="w-full text-left px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustomerAuthModalOpen(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center border border-[#C5A880]/85 bg-[#FAF9F6] text-stone-800 cursor-pointer shrink-0"
                  aria-label="Sign In"
                >
                  <User className="w-3.5 h-3.5 text-[#C5A880]" />
                </button>
              )}
            </div>
          </div>

          {/* 2.5 Advanced Live Header Search Bar (full-width on mobile, centered on large screens) */}
          <div className="w-full md:max-w-md md:flex-1 flex justify-center">
            <AdvancedSearchBar
              products={products}
              categories={categories}
              onNavigate={navigateTo}
              setActiveCategory={setActiveCategory}
              setAiMatchedIds={setAiMatchedIds}
              setAiSearchExplanation={setAiSearchExplanation}
            />
          </div>

          {/* Action controllers bundle (shown on desktop views/tablets only) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notification Bell Button */}
            <button 
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative flex items-center justify-center w-8.5 h-8.5 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition cursor-pointer select-none shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#C5A880]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-[#C5A880] text-stone-950 font-sans text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center pointer-events-none ring-2 ring-white">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Client Dashboard Button */}
            {customerUser && (
              <button 
                type="button"
                onClick={() => setIsCustomerDashboardOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer bg-white border-stone-200 text-stone-600 hover:text-[#C5A880] hover:bg-stone-100"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="hidden lg:inline">Client Dashboard</span>
              </button>
            )}

            {/* Cart triggers */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-stone-950 hover:bg-stone-850 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md relative cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
              <span>{t('cart')}</span>
              <span className="bg-[#C5A880] text-stone-950 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold font-sans">
                {cartItemsCount}
              </span>
            </button>

            {/* Premium Client Session Menu */}
            {customerUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCustomerPanelOpen(!isCustomerPanelOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-xl border border-stone-200/80 hover:border-[#C5A880] hover:bg-stone-50 transition duration-200 cursor-pointer shrink-0 max-w-[160px]"
                >
                  <img
                    src={customerUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerUser.email)}`}
                    alt={customerUser.name}
                    className="w-6.5 h-6.5 rounded-lg object-cover ring-1 ring-stone-200/80 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-700 truncate">
                    {customerUser.name.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isCustomerPanelOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-stone-200 rounded-2xl shadow-xl py-3 z-50 text-left animate-in fade-in duration-300">
                    <div className="px-4 pb-2 mb-2 border-b border-stone-100">
                      <p className="text-[10px] font-black tracking-wider uppercase text-[#C5A880]">Luxury Client</p>
                      <p className="text-xs font-bold text-stone-900 truncate leading-none mt-1">{customerUser.name}</p>
                      <p className="text-[9px] text-stone-400 font-mono truncate mt-1">{customerUser.email}</p>
                    </div>
                    {customerUser.wishlist && customerUser.wishlist.length > 0 && (
                      <div className="px-4 py-1 text-[9px] text-stone-500 font-semibold uppercase tracking-wider">
                        Saved Pieces: {customerUser.wishlist.length}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerPanelOpen(false);
                        setIsCustomerDashboardOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-600 hover:bg-stone-50 hover:text-[#C5A880] transition"
                    >
                      Client Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCustomerLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                    >
                      Sign Out Outpost
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomerAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold tracking-wider uppercase transition-all cursor-pointer bg-[#FAF9F6] border-[#C5A880] text-stone-850 hover:bg-stone-100"
              >
                <User className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main body layouts spacer */}
      <main className="flex-1 space-y-12 pb-16">
        
        {/* Dynamic Admin panel overlay toggle */}
        {(isAdminOpen && (window.location.pathname === '/wasif-jijarell' || window.location.pathname === '/wasif-jijarell/')) && (
          <div className="max-w-7xl mx-auto px-6 pt-6">
            {!adminAuthorized ? (
              <div className="max-w-md mx-auto my-12 bg-white border border-stone-200 rounded-3xl p-8 shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <Sliders className="w-10 h-10 mx-auto text-[#C5A880]" />
                  <h3 className="text-lg font-serif font-black uppercase text-stone-900">JIJARELL Admin Terminal</h3>
                  <p className="text-xs text-stone-500">Please enter secure credentials to access corporate logistic pipeline.</p>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch('/api/admin/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: adminPasswordInput, role: 'admin' })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setAdminAuthorized(true);
                      setAdminAuthError('');
                      sessionStorage.setItem('jijarell_admin_auth', 'true');
                      sessionStorage.setItem('jijarell_admin_token', data.token);
                    } else {
                      const err = await res.json();
                      setAdminAuthError(err.error || 'Invalid credentials. Access denied.');
                    }
                  } catch (err) {
                    setAdminAuthError('Auditing connection failed. Please check network.');
                  }
                }} className="space-y-4">
                  <div className="text-xs">
                    <label className="font-bold text-stone-600 block mb-1">Admin Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="Enter password..."
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="bg-white w-full p-2.5 border border-stone-250 rounded-lg select-text font-serif tracking-widest text-center focus:outline-none focus:border-stone-950"
                    />
                  </div>

                  {adminAuthError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-[11px] rounded-lg font-semibold text-center">
                      {adminAuthError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-stone-900 hover:bg-stone-850 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Unlock Terminal
                  </button>
                </form>
              </div>
            ) : (
              <React.Suspense fallback={<ElegantLoader />}>
                <AdminPanel 
                  onSettingsUpdated={syncBaseCatalog} 
                  onLogout={async () => {
                    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
                    setAdminAuthorized(false);
                    sessionStorage.removeItem('jijarell_admin_auth');
                    sessionStorage.removeItem('jijarell_admin_token');
                    window.history.pushState({}, '', '/');
                    setIsAdminOpen(false);
                  }}
                />
              </React.Suspense>
            )}
          </div>
        )}

        {pathSelectedProduct ? (
          <React.Suspense fallback={<ElegantLoader />}>
            <ProductDetailsPage
              product={pathSelectedProduct}
              allProducts={products}
              onAddToCart={(product, variant, qty) => {
                requireCustomerAuth(() => addToCart(product, variant, qty));
              }}
              onInstantBuy={(p, variant) => {
                requireCustomerAuth(() => {
                  addToCart(p, variant, 1);
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                });
              }}
              lang={lang}
              t={t}
              onNavigate={navigateTo}
              requireCustomerAuth={requireCustomerAuth}
              customerUser={customerUser}
            />
          </React.Suspense>
        ) : (
          <>
            {/* 3. Hero Visual Section - SMART PROMOTION BANNER SYSTEM */}
            {!isAdminOpen && (
              <PromoBannerSlider
                banners={banners}
                products={products}
                onNavigate={navigateTo}
                setActiveCategory={setActiveCategory}
                setAiMatchedIds={setAiMatchedIds}
                setAiSearchExplanation={setAiSearchExplanation}
                lang={lang}
              />
            )}

            {/* 4. Active Interactive Catalog Product Grid */}
            <section id="catalog-section" className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 space-y-6">
              <div className="flex flex-wrap items-end justify-between border-b border-stone-200 pb-4 gap-4">
                <div>
                  <h2 className="text-xs uppercase font-extrabold tracking-[0.2em] text-[#C5A880]">{t('featured')}</h2>
                  <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">Exclusive Master Artifacts</h3>
                </div>
                
                {/* Categories filter tabs */}
                <div className="flex flex-wrap gap-2 select-none text-[10px]">
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setAiMatchedIds(null);
                      setAiSearchExplanation(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-full border font-bold uppercase cursor-pointer ${
                      activeCategory === 'all' && aiMatchedIds === null
                        ? 'bg-stone-950 border-stone-950 text-white' 
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    All Collections
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCategory(c.id);
                        setAiMatchedIds(null);
                        setAiSearchExplanation(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-full border font-bold uppercase cursor-pointer ${
                        activeCategory === c.id && aiMatchedIds === null
                          ? 'bg-stone-950 border-stone-950 text-white' 
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Render description of active AI Query filters */}
              {aiSearchExplanation && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-start gap-3 max-w-3xl">
                  <Sparkles className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">CONCIERGE SEARCH HIGHLIGHT:</span>
                    <p className="text-xs text-stone-700 leading-relaxed mt-1 select-all">{aiSearchExplanation}</p>
                  </div>
                </div>
              )}

              {/* Product grid catalogues container */}
              {filteredProducts.length === 0 ? (
                <div className="py-12 px-6 bg-stone-50 border border-stone-200 rounded-3xl space-y-8 max-w-4xl mx-auto text-center select-none">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-amber-50/50 rounded-full border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-base font-serif font-black uppercase text-stone-900 tracking-wide">
                      {lang === 'bn' ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি' : 'No matching products found'}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
                      {lang === 'bn' 
                        ? 'আমরা আপনার অনুসন্ধানের সাথে মিলে যায় এমন কোনো লাক্সারি উপাদান খুঁজে পাইনি। অনুগ্রহ করে অন্য কোনো কি-ওয়ার্ড ব্যবহার করুন বা নিচে দেওয়া ক্যাটাগরিগুলো অন্বেষণ করুন।' 
                        : 'We could not locate any luxury pieces matching your specific query. Consider trying typed terms like "watch" or "bag", or explore collections below.'}
                    </p>
                  </div>

                  {/* Related Categories row */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block font-mono">
                      {lang === 'bn' ? 'সম্পর্কিত ক্যাটাগরি' : 'Related Categories'}
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setActiveCategory(c.id);
                            setAiMatchedIds(null);
                            setAiSearchExplanation(null);
                          }}
                          className="px-4 py-2 bg-white hover:bg-stone-100 text-stone-800 text-[10px] font-bold uppercase border border-stone-200 rounded-xl transition cursor-pointer hover:shadow-xs active:scale-95"
                        >
                          {c.name}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setActiveCategory('all');
                          setAiMatchedIds(null);
                          setAiSearchExplanation(null);
                        }}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold uppercase rounded-xl transition cursor-pointer"
                      >
                        {lang === 'bn' ? 'সব কালেকশন দেখুন' : 'Explore All Collections'}
                      </button>
                    </div>
                  </div>

                  {/* Popular & Similar Products recommended section */}
                  <div className="space-y-4 pt-6 border-t border-stone-200/65">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block font-mono">
                      {lang === 'bn' ? 'জনপ্রিয় ও প্রস্তাবিত পণ্যসমূহ' : 'Popular & Similar Products'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {products.filter(p => p.featured && p.is_active).slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            navigateTo(`/product/${p.slug}`);
                          }}
                          className="group bg-white border border-stone-150 rounded-2xl overflow-hidden p-2.5 transition-all text-left cursor-pointer hover:shadow-md hover:border-stone-350 flex flex-col justify-between"
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-stone-50 select-none relative">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                requireCustomerAuth(() => toggleWishlist(p.id));
                              }}
                              className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-full shadow-xs hover:bg-white text-stone-600 hover:text-rose-600 transition z-10 cursor-pointer"
                            >
                              <Heart className={`w-3.5 h-3.5 ${customerUser?.wishlist?.includes(p.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`} />
                            </button>
                          </div>
                          <div className="mt-2 space-y-1">
                            <span className="text-[8px] font-mono tracking-widest text-[#C5A880] uppercase font-bold block">{p.brand}</span>
                            <h4 className="text-[10px] font-bold text-stone-900 leading-tight line-clamp-1 group-hover:text-amber-850 transition-colors">
                              {p.name}
                            </h4>
                            <span className="text-[10px] font-serif font-black text-stone-950 block">
                              {(p.sale_price || p.price).toLocaleString()} BDT
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                  {filteredProducts.map((p) => {
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          navigateTo(`/product/${p.slug}`);
                        }}
                        className="group flex flex-col justify-between border border-stone-200 rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-300 transform md:hover:-translate-y-0.5 cursor-pointer text-left"
                      >
                        {/* Compact Image aspect-square */}
                        <div className="relative w-full aspect-square overflow-hidden bg-stone-50 select-none">
                          <img 
                            src={p.images[0]} 
                            alt={p.name} 
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          
                          {p.sale_price && (
                            <div className="absolute top-2.5 left-2.5 bg-amber-600 px-2 py-0.5 text-white text-[8px] font-black uppercase rounded tracking-widest z-10 font-mono">
                              SALE
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              requireCustomerAuth(() => toggleWishlist(p.id));
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-xs rounded-full shadow-xs hover:bg-white text-stone-600 hover:text-rose-600 transition z-10 cursor-pointer"
                          >
                            <Heart className={`w-3.5 h-3.5 ${customerUser?.wishlist?.includes(p.id) ? 'fill-rose-500 text-rose-500' : 'text-stone-600'}`} />
                          </button>
                        </div>

                        {/* Compact Metadata Frame */}
                        <div className="p-3 bg-white space-y-1.5 flex flex-col justify-between flex-1">
                          <div>
                            <span className="text-[8px] font-mono tracking-widest text-[#C5A880] uppercase font-bold block">{p.brand}</span>
                            <h4 className="text-xs font-bold text-stone-900 leading-snug line-clamp-2 truncate-none group-hover:text-amber-800 transition-colors">
                              {p.name}
                            </h4>
                          </div>
                          
                          <div className="flex items-center justify-between pt-1.5 border-t border-stone-100/80 mt-1 gap-2">
                            <div>
                              {p.sale_price ? (
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1">
                                  <span className="text-[11px] font-black text-stone-950 font-serif leading-none">{p.sale_price.toLocaleString()} BDT</span>
                                  <span className="text-[9px] text-stone-400 line-through font-mono leading-none">{p.price.toLocaleString()} BDT</span>
                                </div>
                              ) : (
                                <span className="text-[11px] font-black text-stone-950 font-serif leading-none">{p.price.toLocaleString()} BDT</span>
                              )}
                            </div>

                            <div className="flex items-center gap-0.5 text-[9px] text-amber-500 font-bold shrink-0">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>{p.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* 5. Luxury Journal Blogs Editorial Section */}
            {!isAdminOpen && aiMatchedIds === null && (
              <section className="bg-stone-50 border-y border-stone-200 py-12">
                <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-6">
                  <div className="text-center">
                    <h3 className="text-xs uppercase font-extrabold tracking-[0.2em] text-[#C5A880]">{t('latest_news')}</h3>
                    <h4 className="text-2xl font-serif font-black text-stone-900 mt-1">Refined Horology & Leather Culture</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {blogs.map((b) => (
                      <div key={b.id} className="p-5 border border-stone-200 rounded-3xl bg-white flex flex-col md:flex-row gap-5 items-center">
                        <img src={b.image} alt={b.title} className="w-full md:w-44 h-40 object-cover rounded-2xl" />
                        <div className="space-y-2">
                          <span className="text-[9px] text-[#C5A880] uppercase tracking-wider font-bold">JIJARELL EDITORIAL</span>
                          <h5 className="text-xs font-bold text-stone-900 leading-snug line-clamp-2">{b.title}</h5>
                          <p className="text-[11px] text-stone-500 line-clamp-3 leading-relaxed">{b.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

      </main>

      {/* 6. Product Details Interaction & Canvas Overlay Dialog Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-5xl shadow-2xl flex flex-col lg:flex-row max-h-[92vh] select-none">
            
            {/* Visual 3D canvas viewport or static images gallery left block */}
            <div className="w-full lg:w-1/2 p-6 bg-stone-50 flex flex-col justify-between border-r border-stone-150 relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Virtual Interactive Sandbox</span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">WebGL Rendered</span>
              </div>

              {/* Render Three.js rotational viewer */}
              <div className="flex-1 min-h-[300px] h-full flex items-center justify-center">
                <React.Suspense fallback={<ElegantLoader />}>
                  <ThreeViewer 
                    type={selectedProduct.type3d} 
                    activeColor={selectedProduct.variants?.[0]?.color}
                  />
                </React.Suspense>
              </div>

              <p className="text-[10px] text-stone-400 text-center mt-3 leading-normal font-sans">
                Drag to orbit, pinch/wheel to zoom detail components. Hover with cursor triggers lighting shading changes.
              </p>
            </div>

            {/* Content parameters right column */}
            <div className="w-full lg:w-1/2 p-8 flex flex-col overflow-y-auto max-h-[85vh]">
              {/* Escape close CTA */}
              <div className="flex justify-end select-none mb-4">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors pointer-events-auto cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Specification layout */}
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#C5A880] uppercase font-bold">{selectedProduct.brand}</span>
                  <h3 className="text-xl font-serif font-bold text-[#111] mt-1">{selectedProduct.name}</h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-amber-500 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                      <span>{selectedProduct.rating}</span>
                    </div>
                    <span className="text-stone-300">|</span>
                    <span className="text-xs text-stone-500 font-mono">SKU: {selectedProduct.sku}</span>
                  </div>
                </div>

                {/* Sub-navigation inside details modal */}
                <div className="flex border-b border-stone-150 select-none text-xs">
                  <button 
                    onClick={() => setActiveDetailTab('details')}
                    className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${activeDetailTab === 'details' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    {t('product_details')}
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('reviews')}
                    className={`pb-2.5 px-3 font-bold transition-all border-b-2 cursor-pointer ${activeDetailTab === 'reviews' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    {t('reviews')} ({productReviews.length})
                  </button>
                </div>

                {/* Tab Content details specifications */}
                {activeDetailTab === 'details' && (
                  <div className="space-y-5 text-xs text-stone-700 leading-relaxed">
                    <p className="select-text">{selectedProduct.description}</p>
                    
                    {/* Render color choices */}
                    {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                      <div className="space-y-2">
                        <span className="font-bold text-stone-500 block uppercase tracking-wider text-[10px]">{t('color')} / {t('size')} Options</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.variants.map((v: any, idx) => {
                            const isSelected = selectedSizeColor?.id === v.id;
                            return (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setSelectedSizeColor(v)}
                                className={`p-2.5 border rounded-xl text-[11px] text-left transition cursor-pointer select-none ${
                                  isSelected 
                                    ? 'border-stone-950 bg-stone-950 text-white font-bold' 
                                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium'
                                }`}
                              >
                                <span className="block">Size: {v.size}</span>
                                <span className="block text-[10px] opacity-80 mt-0.5">Color: {v.color}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Submit Purchase action */}
                    <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div>
                        {selectedProduct.sale_price ? (
                          <div className="flex flex-col">
                            <span className="text-md font-black text-stone-950">{selectedProduct.sale_price.toLocaleString()} BDT</span>
                            <span className="text-xs text-stone-400 line-through">{selectedProduct.price.toLocaleString()} BDT</span>
                          </div>
                        ) : (
                          <span className="text-md font-black text-stone-950">{selectedProduct.price.toLocaleString()} BDT</span>
                        )}
                      </div>

                       <div className="flex-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            requireCustomerAuth(() => {
                              addToCart(selectedProduct, selectedSizeColor);
                              setSelectedProduct(null);
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 font-extrabold uppercase text-[11px] tracking-wider rounded-xl transition cursor-pointer pointer-events-auto"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-800" />
                          <span>{t('add_to_cart')}</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            requireCustomerAuth(() => {
                              addToCart(selectedProduct, selectedSizeColor);
                              setSelectedProduct(null);
                              setIsCartOpen(false);
                              setIsCheckoutOpen(true);
                            });
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-stone-950 hover:bg-stone-850 text-white font-extrabold uppercase text-[11px] tracking-wider rounded-xl transition cursor-pointer pointer-events-auto"
                        >
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content reviews section */}
                {activeDetailTab === 'reviews' && (
                  <div className="space-y-6 text-xs">
                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {productReviews.length === 0 ? (
                        <p className="text-stone-400 py-3 block text-center">Be the first client to provide review feedback for this antique piece.</p>
                      ) : (
                        productReviews.map((rev) => (
                          <div key={rev.id} className="p-3.5 border border-stone-150 rounded-xl bg-stone-50/50 space-y-1.5 select-text">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-850">{rev.user_name}</span>
                              <div className="flex items-center text-amber-500">
                                <Star className="w-3 h-3 fill-amber-500" />
                                <span className="text-[10px] ml-0.5 font-bold">{rev.rating}</span>
                              </div>
                            </div>
                            <p className="text-stone-600 italic leading-relaxed">{rev.review}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Lead write review form */}
                    <form onSubmit={handleAddReview} className="p-4 border border-stone-200 rounded-2xl space-y-3 bg-stone-50/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{t('write_review')}</span>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">{t('your_name')}</label>
                          <input 
                            type="text" 
                            required 
                            value={newReviewAuthor} 
                            onChange={(e) => setNewReviewAuthor(e.target.value)}
                            className="bg-white w-full p-2 border border-stone-250 rounded-lg select-text" 
                          />
                        </div>
                        <div>
                          <label className="font-bold text-stone-600 block mb-1">{t('review_rating')} (1-5)</label>
                          <select 
                            value={newReviewRating} 
                            onChange={(e) => setNewReviewRating(Number(e.target.value))}
                            className="bg-white w-full p-2 border border-stone-250 rounded-lg"
                          >
                            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                            <option value="3">⭐⭐⭐ 3 Stars</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="font-bold text-stone-600 block mb-1">Feedback Specifications</label>
                          <textarea 
                            required 
                            rows={2}
                            placeholder={t('review_placeholder')}
                            value={newReviewText} 
                            onChange={(e) => setNewReviewText(e.target.value)}
                            className="bg-white w-full p-2 border border-stone-250 rounded-lg select-text" 
                          ></textarea>
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        className="bg-stone-900 text-stone-100 hover:bg-stone-850 px-4 py-2 font-bold text-[10px] uppercase tracking-wider rounded-lg select-none cursor-pointer"
                      >
                        {t('submit_review')}
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. Cart Sliding Right-Bar Drawer Panel Component */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl relative select-none">
            
            {/* Header */}
            <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-900 text-stone-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C5A880]" />
                <h3 className="text-xs font-bold uppercase tracking-widest">{t('cart')} ({cartItemsCount})</h3>
              </div>

              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart item listing container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="py-20 text-center text-stone-400 space-y-3">
                  <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
                  <p className="text-xs font-mono">Exclusive collection is empty.</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const itemPrice = item.product.sale_price || item.product.price;
                  return (
                    <div key={idx} className="p-3 border border-stone-150 bg-stone-50/50 rounded-2xl flex gap-3.5 items-center justify-between">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-14 h-14 object-cover rounded-xl border" />
                      
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] text-[#C5A880] uppercase tracking-wider font-bold block">{item.product.brand}</span>
                        <h4 className="text-xs font-bold text-stone-850 truncate">{item.product.name}</h4>
                        <span className="text-stone-400 text-[10px] block mt-0.5 font-mono">
                          {itemPrice.toLocaleString()} BDT
                        </span>
                      </div>

                      {/* Quantity switcher */}
                      <div className="flex items-center gap-2.5 border border-stone-250 bg-white p-1 rounded-xl">
                        <button 
                          onClick={() => updateCartQty(idx, -1)}
                          className="p-1 hover:bg-stone-100 text-stone-600 rounded transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-stone-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQty(idx, 1)}
                          className="p-1 hover:bg-stone-100 text-stone-600 rounded transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & checkout */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-stone-150 bg-stone-50 space-y-4 font-mono text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>{t('subtotal')}:</span>
                  <span className="font-bold">{cartSubtotal.toLocaleString()} BDT</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    requireCustomerAuth(() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white font-extrabold uppercase tracking-widest text-xs rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#C5A880] animate-pulse" />
                  <span>{t('checkout')}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 8. Checkout Modal Dialog Panel */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
            
            {/* Form list left columns */}
            <form onSubmit={handleCheckoutSubmit} className="w-full md:w-1/2 p-8 overflow-y-auto space-y-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-serif font-black uppercase tracking-wider text-stone-900">{t('checkout')} Info</h3>
                <button 
                  type="button" 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* General inputs */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-600 block mb-1">{t('full_name')}</label>
                  <input 
                    type="text" 
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white w-full p-2.5 border border-stone-250 rounded-lg select-text"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-600 block mb-1">{t('phone_number')}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 01712345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-white w-full p-2.5 border border-stone-250 rounded-lg select-text"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-600 block">{t('shipping_address')}</label>
                    <button
                      type="button"
                      onClick={handleAutoFillAddress}
                      disabled={isLocating}
                      className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-extrabold text-[#C5A880] hover:text-[#b4956d] transition bg-stone-50 border border-stone-200/80 hover:bg-stone-100 px-2 py-1 rounded-md cursor-pointer disabled:opacity-60"
                    >
                      <MapPin className={`w-3 h-3 ${isLocating ? 'animate-bounce' : ''}`} />
                      <span>{isLocating ? 'Locating...' : 'Auto-Fill Location'}</span>
                    </button>
                  </div>
                  <textarea 
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. House/Road Address, Neighborhood/Block, City, Bangladesh"
                    className="bg-white w-full p-2.5 border border-stone-250 rounded-lg min-h-[50px] select-text"
                  />
                  {locationError && (
                    <span className="text-[9px] text-red-500 font-medium block mt-1">
                      {locationError}
                    </span>
                  )}
                </div>

                <div>
                  <label className="font-bold text-stone-600 block mb-1">Custom Order Notes / Size Customizations (Optional)</label>
                  <textarea 
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Specific size requirements, delivery hour adjustments, etc."
                    className="bg-white w-full p-2.5 border border-stone-250 rounded-lg min-h-[50px] select-text"
                  />
                </div>

                {/* Double dynamic payment switcher tier */}
                <div className="space-y-2 pt-2">
                  <label className="font-bold text-stone-600 block mb-1">Double Verification Payment Strategy</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('whatsapp')}
                      className={`p-3.5 border text-center rounded-xl font-bold uppercase transition-all ${
                        paymentMethod === 'whatsapp' 
                          ? 'border-emerald-300 bg-emerald-50/30 text-emerald-900 shadow-xs' 
                          : 'border-stone-200 hover:bg-stone-50 text-stone-500'
                      }`}
                    >
                      WhatsApp Redirect
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bkash')}
                      className={`p-3.5 border text-center rounded-xl font-bold uppercase transition-all ${
                        paymentMethod === 'bkash' 
                          ? 'border-pink-300 bg-pink-50/20 text-pink-900 shadow-xs animate-pulse-slow' 
                          : 'border-stone-200 hover:bg-stone-50 text-stone-500'
                      }`}
                    >
                      bKash Gateway
                    </button>
                  </div>
                </div>

                {/* Secure bKash verification container */}
                {paymentMethod === 'bkash' && (
                  <div className="p-4 bg-stone-50 border border-stone-150 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-600">bKash Account Number:</span>
                      <code className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-mono font-bold select-all border border-pink-100">
                        {settings?.bkash_number || '01712345678'}
                      </code>
                    </div>
                    <p className="text-[10px] text-stone-500 italic">Please send outstanding sum to JIJARELL bKash personal wallet and submit the numeric Transaction ID (TxnId) code below.</p>
                    
                    <div>
                      <label className="font-semibold text-stone-500 block mb-0.5">{t('enter_transaction')}</label>
                      <input 
                        type="text" 
                        required
                        value={bkashTxnId}
                        onChange={(e) => setBkashTxnId(e.target.value)}
                        className="bg-white w-full p-2 border border-stone-250 rounded-lg select-text font-mono tracking-wider"
                        placeholder="e.g. BK8219AXS92"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* finalize order CTAs */}
              <button
                type="submit"
                className="w-full py-4 mt-6 bg-stone-900 border border-stone-850 hover:bg-stone-800 text-stone-100 font-extrabold uppercase text-xs tracking-widest rounded-2xl transition hover:shadow-lg cursor-pointer"
              >
                {t('place_order')}
              </button>
            </form>

            {/* Calculations summaries right column block */}
            <div className="w-full md:w-1/2 p-8 bg-stone-50 flex flex-col justify-between border-l border-stone-150">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">{t('order_summary')}</span>
                
                {/* Scrollable list inside checkout summary */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto">
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-stone-700 gap-4">
                      <span className="truncate">{c.product.name} <span className="font-mono text-stone-400">x{c.quantity}</span></span>
                      <span className="font-mono text-stone-500 shrink-0 font-bold">{(c.quantity * (c.product.sale_price || c.product.price)).toLocaleString()} BDT</span>
                    </div>
                  ))}
                </div>

                {/* Promo Code input validators */}
                <div className="pt-4 border-t border-stone-200">
                  <label className="text-[10px] font-bold text-stone-500 block mb-1 uppercase tracking-wider">Discount Coupon Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="bg-white border text-xs p-2 rounded-lg flex-1 font-mono uppercase select-text" 
                      placeholder="LUXURY5000"
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyCoupon}
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-[10px] rounded-lg cursor-pointer uppercase"
                    >
                      {t('apply_coupon')}
                    </button>
                  </div>
                  {couponCodeApplied && (
                    <span className="text-[10px] text-emerald-800 font-bold mt-1 block">✓ Promo '{couponCodeApplied}' Applied Successfully!</span>
                  )}
                </div>
              </div>

              {/* Final totals */}
              <div className="pt-6 border-t border-stone-200 font-mono text-xs space-y-2">
                <div className="flex justify-between text-stone-500">
                  <span>Subtotal:</span>
                  <span>{cartSubtotal.toLocaleString()} BDT</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Discount Code Applied:</span>
                    <span>- {appliedDiscount.toLocaleString()} BDT</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-500">
                  <span>Elite Courier Shipping:</span>
                  <span>200 BDT</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-stone-250 text-stone-900 font-extrabold text-sm">
                  <span>Grand Total:</span>
                  <span>{Math.max(0, cartSubtotal - appliedDiscount + 200).toLocaleString()} BDT</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 9. Order Confirmed Placeholder Notification Modal */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-stone-200 text-center space-y-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-sm animate-bounce-slow">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h4 className="text-md font-serif font-black uppercase text-stone-900">Luxury Placement Confirmed</h4>
              <p className="text-xs text-stone-500">Your unique order draft #<strong className="text-stone-900 font-bold font-mono">{placedOrder.id}</strong> has been secured on the JIJARELL network in Dhaka.</p>
            </div>

            <p className="text-[11px] text-stone-600 bg-stone-50 p-3 rounded-2xl leading-relaxed select-text">
              {placedOrder.payment_method === 'bkash' 
                ? "Our financial dispatchers are validating the submitted bKash Txn code. Auditing typically takes under 10 minutes." 
                : "Your draft has been initialized. If the WhatsApp redirect tab did not open automatically, click the button below to submit your details directly to our agent."}
            </p>

            {/* Dynamic Status Progress Stepper */}
            <div className="bg-stone-50 rounded-2xl p-4 text-left border border-stone-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C5A880]">Pipeline tracking status</span>
                <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-stone-500">
                  <RefreshCw className={`w-3 h-3 ${isRefreshingOrderStatus ? 'animate-spin text-[#C5A880]' : ''}`} />
                  <span>{isRefreshingOrderStatus ? 'Syncing...' : 'Auto-Sync Active (5s)'}</span>
                </span>
              </div>

              <div className="relative pl-6 space-y-5">
                {/* Visual Line connector */}
                <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-stone-200" />

                {/* Stage 1: Secured / Placed */}
                <div className="relative flex items-start gap-3">
                  <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                  <div>
                    <h5 className="text-[11px] font-bold text-stone-900 uppercase tracking-wide">1. Placement Secured</h5>
                    <p className="text-[10px] text-stone-500 mt-0.5">Reference draft allocated on network</p>
                  </div>
                </div>

                {/* Stage 2: Payment Verified */}
                <div className="relative flex items-start gap-3">
                  {(() => {
                    const isVerified = placedOrder.payment_status === 'paid' || placedOrder.status === 'processing' || placedOrder.status === 'completed';
                    const isPending = placedOrder.payment_status === 'pending_verification';
                    return (
                      <>
                        <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full ring-4 transition ${
                          isVerified ? 'bg-emerald-600 ring-emerald-100' : 
                          isPending ? 'bg-amber-500 ring-amber-100 animate-pulse' : 'bg-stone-300 ring-stone-100'
                        }`} />
                        <div>
                          <h5 className={`text-[11px] font-bold uppercase tracking-wide ${isVerified ? 'text-stone-900' : 'text-stone-400'}`}>
                            2. Payment Verified & Approved
                          </h5>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {isVerified ? 'Finance clearance authorized' : (isPending ? 'Audit in progress (under 10m)' : 'Awaiting confirmation')}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Stage 3: Processing */}
                <div className="relative flex items-start gap-3">
                  {(() => {
                    const isProcessing = placedOrder.status === 'processing' || placedOrder.status === 'completed';
                    const isCurrent = placedOrder.status === 'processing';
                    return (
                      <>
                        <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full ring-4 transition ${
                          isProcessing ? 'bg-emerald-600 ring-emerald-100' : 
                          isCurrent ? 'bg-blue-500 ring-blue-100 animate-pulse' : 'bg-stone-300 ring-stone-100'
                        }`} />
                        <div>
                          <h5 className={`text-[11px] font-bold uppercase tracking-wide ${isProcessing ? 'text-stone-900' : 'text-stone-400'}`}>
                            3. Wrapping & Packing
                          </h5>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {isProcessing ? 'Secured in elite bespoke cargo housing' : (isCurrent ? 'Handmade wrapping and calibration active' : 'Awaiting payment ledger clearance')}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Stage 4: Shipped */}
                <div className="relative flex items-start gap-3">
                  {(() => {
                    const isShipped = placedOrder.status === 'completed';
                    return (
                      <>
                        <div className={`absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full ring-4 transition ${
                          isShipped ? 'bg-emerald-600 ring-emerald-100' : 'bg-stone-300 ring-stone-100'
                        }`} />
                        <div>
                          <h5 className={`text-[11px] font-bold uppercase tracking-wide ${isShipped ? 'text-stone-900' : 'text-stone-400'}`}>
                            4. Shipped / Dispatched
                          </h5>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {isShipped ? 'Handed to Elite Courier courier' : 'Pending dispatch logistics routing'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>
            </div>

            {placedOrder.payment_method === 'whatsapp' && (
              <a
                href={`https://wa.me/${settings?.whatsapp_number || '8801712345678'}?text=${encodeURIComponent(
                  `*JIJARELL LUXURY PLACEMENT SUMMARY*\n` +
                  `Order Code: *${placedOrder.id}*\n\n` +
                  `*Client Contact details:*\n` +
                  `Name: ${placedOrder.customer_name || ''}\n` +
                  `Phone: ${placedOrder.customer_phone || ''}\n` +
                  `Address: ${placedOrder.customer_address || ''}\n` +
                  (placedOrder.customer_notes ? `Notes/Customizations: ${placedOrder.customer_notes}\n` : '') + `\n` +
                  `*Selected Artifacts:*\n` +
                  (placedOrder.items || []).map((c: any) => 
                    `- ${c.productName} [${c.variantStr}] Qty: ${c.quantity} @ ${c.price} BDT`
                  ).join('\n') + `\n\n` +
                  (placedOrder.customer_notes ? `*Special Customizations/Notes:*\n${placedOrder.customer_notes}\n\n` : '') +
                  `Subtotal: ${(placedOrder.subtotal || 0).toLocaleString()} BDT\n` +
                  `Discount applied: ${(placedOrder.discount || 0).toLocaleString()} BDT\n` +
                  `Total Outstanding: *${(placedOrder.total || 0).toLocaleString()} BDT*\n\n` +
                  `_Requested secure dispatcher and courier scheduling approval._`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase text-[11px] tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-900/40 transition shrink-0 pointer-events-auto"
              >
                <span>Complete on WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => setPlacedOrder(null)}
              className="w-full py-3.5 bg-stone-900 hover:bg-stone-850 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl cursor-pointer"
            >
              {t('back_to_shop')}
            </button>
          </div>
        </div>
      )}

      {/* 10. Sliding Floating Widget triggers for AI Client Concierge */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button 
          onClick={() => setIsAiConciergeOpen(!isAiConciergeOpen)}
          className="w-14 h-14 rounded-full bg-stone-900 border border-stone-800 hover:bg-stone-800 text-white flex items-center justify-center shadow-2xl relative hover:scale-110 active:scale-95 transition-all text-xs cursor-pointer"
        >
          <MessageSquare className="w-6 h-6 text-[#C5A880] animate-pulse" />
          <span className="absolute -top-1 -right-1 bg-[#C5A880] text-stone-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full select-none">AI</span>
        </button>
      </div>

      {isAiConciergeOpen && (
        <div className="fixed right-0 bottom-0 top-0 z-50 flex items-stretch">
          <React.Suspense fallback={<ElegantLoader />}>
            <AiChatAssistant onClose={() => setIsAiConciergeOpen(false)} />
          </React.Suspense>
        </div>
      )}

      {/* 10.5 High-End Order History Tracking Terminal Overlay */}
      <React.Suspense fallback={null}>
        <OrderHistory 
          isOpen={isOrderHistoryOpen}
          onClose={() => setIsOrderHistoryOpen(false)}
          whatsappNumber={settings?.whatsapp_number}
        />
      </React.Suspense>

      {/* 10.52 High-End Professional Customer Dashboard Overlay */}
      <AnimatePresence>
        {isCustomerDashboardOpen && (
          <React.Suspense fallback={<ElegantLoader />}>
            <CustomerDashboard 
              isOpen={isCustomerDashboardOpen}
              onClose={() => setIsCustomerDashboardOpen(false)}
              customerUser={customerUser}
              customerToken={customerToken}
              setCustomerUser={setCustomerUser}
              lang={lang}
              setLang={setLang}
              t={t}
              triggerNotificationToast={triggerNotificationToast}
              preSelectedOrderId={preSelectedOrderId}
              onClearPreSelectedOrderId={() => setPreSelectedOrderId(null)}
            />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* 10.55 High-End Client Notification Hub Overlay wrapper */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <React.Suspense fallback={null}>
            <NotificationCenter 
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              lang={lang}
              onUnreadCountChange={(count) => setUnreadNotificationCount(count)}
              onOrderClick={(orderId) => {
                setIsNotificationsOpen(false);
                setIsCustomerDashboardOpen(true);
                // Also set the tracked order target
                setPreSelectedOrderId(orderId);
              }}
            />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* 10.58 High-End Customer Authentication Portal Overlay */}
      {isCustomerAuthModalOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#C5A880] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative animate-fadeIn text-left">
            {/* Modal close icon */}
            <button 
              onClick={() => {
                setIsCustomerAuthModalOpen(false);
                setOtpSent(false);
                setOtpError('');
                setDevCustomerOtp(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition cursor-pointer pointer-events-auto"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header branding */}
            <div className="bg-stone-950 p-6 text-center border-b border-[#C5A880]">
              <span className="text-xl font-serif font-black tracking-[0.25em] text-[#C5A880]">JIJARELL</span>
              <p className="text-[9px] text-stone-400 font-mono tracking-widest uppercase mt-1">GENÈVE CLIENT LOBBY</p>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">
                  {otpSent ? 'Enter Access Pin' : 'Client Access Authorization'}
                </h3>
                <p className="text-[10px] text-stone-500 max-w-[280px] mx-auto leading-relaxed">
                  {otpSent 
                    ? `Please enter the 6-digit access token dispatched to ${emailForOtp}.`
                    : 'To curate bespoke orders, save wishlist items, and publish reviews, authenticate your luxury client profile.'}
                </p>
              </div>

              {otpError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-900 text-[11px] leading-relaxed">
                  <span className="font-extrabold shrink-0">⚠️ Error:</span>
                  <span>{otpError}</span>
                </div>
              )}

              {/* Form segment */}
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A880] block mb-1">Authorized Email Address</label>
                    <input 
                      type="email"
                      required
                      value={emailForOtp}
                      onChange={(e) => setEmailForOtp(e.target.value)}
                      className="w-full bg-stone-50 p-3 border border-stone-250 rounded-xl text-xs focus:outline-none focus:border-[#C5A880] font-sans text-stone-905"
                      placeholder="e.g. client@domain.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full h-11 bg-stone-950 hover:bg-stone-900 text-white text-[10px] uppercase font-extrabold tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer pointer-events-auto"
                  >
                    {otpLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A880]" />
                    ) : (
                      'Dispatch Access Token OTP'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* Dev Sandbox Fallback Alert inside customer Modal */}
                  {devCustomerOtp && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-xl space-y-2.5 text-left">
                      <div className="text-[10px] text-stone-700 leading-normal">
                        <strong>🔧 Sandbox Environment:</strong> Simulated OTP code created is <code className="bg-red-105 font-mono text-red-900 font-extrabold px-1.5 py-0.5 rounded text-[11px]">{devCustomerOtp}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCodeInput(devCustomerOtp);
                          // Auto trigger submission for awesome user flow
                          setOtpLoading(true);
                          fetch('/api/customer/auth/verify-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: emailForOtp.toLowerCase().trim(), otp: devCustomerOtp })
                          })
                          .then(r => r.json())
                          .then(data => {
                            if (data.success) {
                              setCustomerUser(data.user);
                              setCustomerToken(data.token);
                              localStorage.setItem('jijarell_customer_token', data.token);
                              setIsCustomerAuthModalOpen(false);
                              setOtpSent(false);
                              setOtpCodeInput('');
                              setEmailForOtp('');
                              setDevCustomerOtp(null);
                              if (data.user.name) setCustomerName(data.user.name);
                              if (data.user.customer_phone) setCustomerPhone(data.user.customer_phone);
                              if (data.user.customer_address) setCustomerAddress(data.user.customer_address);
                              triggerNotificationToast('Authenticated Successfully', 'Your secure JIJARELL Genève session is now live.', 'paid');
                            } else {
                              setOtpError(data.error || 'Autofill auth failed.');
                            }
                          })
                          .catch(() => setOtpError('Autofill request failed.'))
                          .finally(() => setOtpLoading(false));
                        }}
                        className="w-full py-2 bg-red-900 hover:bg-red-850 text-white rounded-lg text-[9px] uppercase font-extrabold tracking-wider transition cursor-pointer"
                      >
                        Auto-Fill & Authorize Profile
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[#C5A880] block mb-1">6-Digit Verification Pin</label>
                    <input 
                      type="text"
                      required
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      className="w-full bg-stone-50 p-3 border border-stone-250 rounded-xl text-center text-md font-mono font-bold tracking-[0.4em] text-stone-905 focus:outline-none focus:border-[#C5A880]"
                      placeholder="e.g. 195820"
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCodeInput('');
                        setOtpError('');
                        setDevCustomerOtp(null);
                      }}
                      className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-850 rounded-xl text-[10px] uppercase font-black cursor-pointer transition text-center"
                    >
                      Change Email
                    </button>
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="flex-1 py-3 bg-stone-950 hover:bg-stone-900 text-white text-[10px] uppercase font-black tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {otpLoading ? (
                        <RefreshCw className="w-3 animate-spin text-[#C5A880]" />
                      ) : (
                        'Verify PIN'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Separator rule */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-150"></div>
                <span className="flex-shrink mx-3 text-[8px] font-mono tracking-widest text-stone-400 uppercase select-none">Or choose Google Identity</span>
                <div className="flex-grow border-t border-stone-150"></div>
              </div>
 
              {/* Google integration slot */}
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={handleGoogleContinue}
                    disabled={otpLoading}
                    className="flex items-center justify-center gap-3 w-full h-11 bg-white border border-stone-250 hover:bg-stone-50 hover:border-stone-400 text-stone-700 text-[11px] uppercase font-black tracking-wider rounded-xl transition cursor-pointer pointer-events-auto shadow-sm disabled:opacity-50"
                  >
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.55 15.01 1 12 1 7.37 1 3.4 3.63 1.48 7.48l3.85 2.99C6.26 6.94 8.89 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.45c-.28 1.44-1.09 2.66-2.31 3.48l3.58 2.78c2.1-1.94 3.32-4.79 3.32-8.36z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.33 14.51c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.48 6.89C.53 8.78 0 10.89 0 13s.53 4.22 1.48 6.11l3.85-3l-.23-.6z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.58-2.78c-1 .67-2.28 1.07-3.79 1.07-3.11 0-5.74-1.9-6.67-4.47l-3.85 3C2.86 20.35 6.74 23 12 23z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Hidden / Backup element slot to guarantee background event integrations */}
                  <div id="googleSyncBtnSlot" className="hidden" />

                  {/* Dynamic Developer Action advice about domain origins */}
                  <div className="mt-2.5 w-full text-center">
                    <button
                      type="button"
                      onClick={() => setIsOriginsTroubleshootOpen(!isOriginsTroubleshootOpen)}
                      className="text-[9px] text-[#C5A880] hover:underline uppercase font-bold tracking-widest cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>🔑 Developer: Fix Google Sign-In Origin Mismatch</span>
                      <span>{isOriginsTroubleshootOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOriginsTroubleshootOpen && (
                      <div className="mt-3 p-3 bg-stone-50 border border-stone-200 rounded-2xl text-left space-y-2 text-[10px] text-stone-600 leading-relaxed">
                        <p className="font-bold text-stone-800">Why does "origin_mismatch" occur?</p>
                        <p>Google OAuth requires whitelisting the active URL domains of this app under <strong>Authorized JavaScript origins</strong> inside your Google APIs credentials console.</p>
                        <p className="font-bold text-stone-800 mt-1">Copy and whitelist these origins:</p>
                        
                        <div className="space-y-1.5">
                          {[
                            "https://ais-dev-47vedod77xl4jxidkww7kv-444887237495.asia-east1.run.app",
                            "https://ais-pre-47vedod77xl4jxidkww7kv-444887237495.asia-east1.run.app",
                            window.location.origin
                          ].filter((url, idx, self) => self.indexOf(url) === idx).map((url, i) => (
                            <div key={i} className="flex items-center justify-between gap-1.5 bg-white border border-stone-200 rounded-lg p-1.5 font-mono text-[9px] truncate">
                              <span className="truncate flex-1 select-all">{url}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(url);
                                  setWasUrlCopied(prev => ({ ...prev, [url]: true }));
                                  setTimeout(() => {
                                    setWasUrlCopied(prev => ({ ...prev, [url]: false }));
                                  }, 1500);
                                }}
                                className="px-2 py-1 bg-stone-900 text-white rounded font-sans uppercase font-extrabold text-[8px] cursor-pointer hover:bg-stone-800 shrink-0 transition"
                              >
                                {wasUrlCopied[url] ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          ))}
                        </div>

                        <p className="text-[9px] text-stone-500 mt-1 leading-normal">
                          💡 <strong>Testing Fallback:</strong> To bypass Google setup and sign in instantly, simply enter any email in the <strong>SMTP OTP email flow</strong> above. Since testing bypass is enabled, simulated verification PINs are generated on-the-fly right inside your sandbox!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-stone-400 select-none">
                    🔑 Protected by JIJARELL Genève End-to-End Cryptography Nodes.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10.6 Visual Notification Toast Overlay Stack */}
      <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full space-y-3 pointer-events-none select-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => {
              dismissToast(toast.id);
              setIsOrderHistoryOpen(true);
            }}
            className="pointer-events-auto bg-stone-950 text-white rounded-2xl border border-stone-800 shadow-2xl p-4 flex gap-3.5 items-start justify-between cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all animate-slideInUp select-text animate-pulseBorder"
          >
            <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0">
              {toast.type === 'shipped' && <Truck className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'processing' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
              {toast.type === 'paid' && <CreditCard className="w-5 h-5 text-[#C5A880]" />}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black tracking-widest text-[#C5A880] uppercase font-mono">
                  LOGISTICS UPDATED
                </span>
                <span className="text-[8px] text-stone-500 font-mono">Just Now</span>
              </div>
              <h4 className="text-xs font-serif font-black uppercase text-stone-100 truncate">
                {toast.title}
              </h4>
              <p className="text-[10px] text-stone-400 leading-normal line-clamp-2">
                {toast.description}
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[8px] font-mono font-bold text-stone-500 uppercase">
                <span>View tracked ledger</span>
                <span className="text-[#C5A880]">→</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="p-1 rounded-md hover:bg-stone-900 text-stone-500 hover:text-stone-300 transition shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* 11. Premium Editorial Footer UI */}
      <footer className="bg-stone-950 border-t border-stone-900 text-stone-300 py-16 px-6 md:px-12 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-stone-900 text-xs text-left">
          {/* Brand Pillar Column */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-lg font-black tracking-[0.25em] text-[#C5A880] font-serif leading-none">JIJARELL</span>
              <p className="text-[9px] text-stone-500 tracking-widest block uppercase font-mono">{t('footer_tag') || 'Where Quality Meets Trust'}</p>
            </div>
            <p className="text-stone-400 leading-relaxed text-[11px]">
              Distributing the finest luxury horology masterpieces, high-end calves leather goods, and high-precision mechanical artifacts across global corridors.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {settings?.instagram_link && (
                <a
                  href={settings.instagram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center text-[#C5A880] hover:bg-stone-900 hover:text-white transition duration-200 cursor-pointer"
                  aria-label="Instagram Profile"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings?.facebook_link && (
                <a
                  href={settings.facebook_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center text-[#C5A880] hover:bg-stone-900 hover:text-white transition duration-200 cursor-pointer"
                  aria-label="Facebook Page"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings?.whatsapp_link && (
                <a
                  href={settings.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-stone-800 flex items-center justify-center text-[#C5A880] hover:bg-stone-900 hover:text-white transition duration-200 cursor-pointer"
                  aria-label="WhatsApp Contact"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Location & Headquarters Column */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880] font-mono">Corporate Location</h4>
            <div className="flex gap-2.5 items-start">
              <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
              <div>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(settings?.corporate_address || 'Paschim Sholosahar, Chattogram, Chattogram Division, 4211, Bangladesh')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-300 hover:text-[#C5A880] transition leading-relaxed block hover:underline cursor-pointer"
                >
                  {settings?.corporate_address || 'Paschim Sholosahar, Chattogram, Chattogram Division, 4211, Bangladesh'}
                </a>
              </div>
            </div>
          </div>

          {/* Secure Transacts & Payments Column */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880] font-mono">Secure Payment & Logistics</h4>
            <div className="space-y-3 leading-relaxed">
              <div className="flex gap-2.5 items-center">
                <CreditCard className="w-4 h-4 text-[#C5A880] shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-mono block">bKash Payment Wallet</span>
                  <a 
                    href={`tel:${settings?.bkash_number || '01410625199'}`}
                    className="text-stone-300 hover:text-[#C5A880] font-mono font-bold hover:underline transition cursor-pointer"
                  >
                    {settings?.bkash_number || '01410625199'}
                  </a>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <Truck className="w-4 h-4 text-[#C5A880] shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-mono block">Delivery Dispatch Cargo</span>
                  <a 
                    href={`tel:${settings?.delivery_contact_number || '01410625199'}`}
                    className="text-stone-300 hover:text-[#C5A880] font-mono font-bold hover:underline transition cursor-pointer"
                  >
                    {settings?.delivery_contact_number || '01410625199'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Support Channels Column */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880] font-mono">Official Communications</h4>
            <div className="space-y-3 leading-relaxed">
              <div className="flex gap-2.5 items-center">
                <Mail className="w-4 h-4 text-[#C5A880] shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-mono block">Corporate Mailbox</span>
                  <a 
                    href={`mailto:${settings?.corporate_email || 'jijarell.official@gmail.com'}`}
                    className="text-stone-300 hover:text-[#C5A880] hover:underline transition break-all cursor-pointer"
                  >
                    {settings?.corporate_email || 'jijarell.official@gmail.com'}
                  </a>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <PhoneCall className="w-4 h-4 text-[#C5A880] shrink-0" />
                <div>
                  <span className="text-[10px] text-stone-500 uppercase font-mono block">Direct Hotline</span>
                  <a 
                    href={settings?.whatsapp_link || 'https://wa.me/8801410624199'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-300 hover:text-[#C5A880] hover:underline transition cursor-pointer"
                  >
                    Connect on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-stone-600 font-mono">
          <span>{t('all_rights_reserved')} • Exquisite Craftsmanship & Secure Global Distribution</span>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Security Audited</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">PWA Manifests</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">3D Engine Active</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainLayout />
    </LanguageProvider>
  );
}
