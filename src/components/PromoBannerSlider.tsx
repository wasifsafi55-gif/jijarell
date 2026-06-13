import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Banner, Product } from '../types';

interface PromoBannerSliderProps {
  banners: Banner[];
  products: Product[];
  onNavigate: (path: string) => void;
  setActiveCategory: (catId: string) => void;
  setAiMatchedIds: (ids: string[] | null) => void;
  setAiSearchExplanation: (text: string | null) => void;
  lang: 'en' | 'bn';
}

export default function PromoBannerSlider({
  banners,
  products,
  onNavigate,
  setActiveCategory,
  setAiMatchedIds,
  setAiSearchExplanation,
  lang,
}: PromoBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter only active banners scheduled within valid start/end dates
  const activeBanners = banners.filter((b) => {
    if (!b.is_active) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (b.start_date) {
      const start = new Date(b.start_date);
      start.setHours(0, 0, 0, 0);
      if (now < start) return false;
    }
    if (b.end_date) {
      const end = new Date(b.end_date);
      end.setHours(23, 59, 59, 999);
      if (now > end) return false;
    }
    return true;
  });

  const startAutoSlide = () => {
    stopAutoSlide();
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (activeBanners.length > 0 ? (prev + 1) % activeBanners.length : 0));
    }, 4500); // Between 4-5 seconds auto-slide
  };

  const stopAutoSlide = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (activeBanners.length > 0) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    // Elegant fallback Hero if no active banners
    return (
      <section className="relative w-full min-h-[460px] md:min-h-[520px] bg-stone-950 text-[#faf9f6] flex items-center px-6 md:px-12 select-none overflow-hidden border-b border-stone-900">
        <div className="absolute inset-0 opacity-25 select-none pointer-events-none">
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black" />
          <img 
            src="https://images.unsplash.com/photo-1475965894430-b05c9d13568a?q=80&w=1400&auto=format&fit=crop" 
            alt="Luxury Background" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-900/80 border border-stone-800 text-xs font-bold text-[#C5A880]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="uppercase tracking-wider">AI Powered Real-Time Grounding Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight leading-tight text-white select-all">
            The Heritage of Pure Craftsmanship
          </h1>
          <p className="text-sm md:text-base text-stone-300 leading-relaxed max-w-xl font-light">
            Discover limited-collector watches, Goodyear-welt shoes, and premium pebble-tanned Italian leather duffles. Every piece is presented in full interactive 3D, crafted to endure lifetimes of wear.
          </p>
        </div>
      </section>
    );
  }

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    startAutoSlide();
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
    startAutoSlide();
  };

  // Simple touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    if (touchStartX - touchEndX > swipeThreshold) {
      // Swiped Left -> Next banner
      handleNext();
    } else if (touchEndX - touchStartX > swipeThreshold) {
      // Swiped Right -> Prev banner
      handlePrev();
    }
  };

  const handleBannerClick = (banner: Banner) => {
    const { click_action, destination_url } = banner;
    if (click_action === 'product') {
      onNavigate(`/product/${destination_url}`);
    } else if (click_action === 'category') {
      setActiveCategory(destination_url);
      setAiMatchedIds(null);
      setAiSearchExplanation(null);
      const catalogElement = document.getElementById('catalog-section');
      if (catalogElement) {
        catalogElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (click_action === 'flash_sale') {
      const saleProductIds = products.filter((p) => p.sale_price !== null).map((p) => p.id);
      setAiMatchedIds(saleProductIds);
      setAiSearchExplanation(
        lang === 'bn'
          ? "সরাসরি জেনেভা ভল্ট থেকে আমাদের বিশেষ কিউরেটেড ফ্ল্যাশ সেল: সীমিত সময়ের অফার।"
          : "Special Curated Flash Sale from our Geneva vaults: limited time offerings with special pricing."
      );
      setActiveCategory('all');
      const catalogElement = document.getElementById('catalog-section');
      if (catalogElement) {
        catalogElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (click_action === 'campaign') {
      const featuredIds = products.filter((p) => p.featured).map((p) => p.id);
      setAiMatchedIds(featuredIds);
      setAiSearchExplanation(
        lang === 'bn'
          ? "জিজরেল প্রিমিয়াম ক্যাম্পেইন কালেকশন: অত্যন্ত আকাঙ্ক্ষিত, হ্যান্ডপিক করা খাঁটি কারিগরির কাজ।"
          : "Sovereign JIJARELL Premium Campaign Collection: highly coveted, handpicked works of pure craftsmanship."
      );
      setActiveCategory('all');
      const catalogElement = document.getElementById('catalog-section');
      if (catalogElement) {
        catalogElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const currentBanner = activeBanners[currentIndex];

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  return (
    <div
      id="smart-promo-slider"
      className="relative w-full aspect-[21/9] min-h-[360px] md:min-h-[440px] bg-stone-950 text-white overflow-hidden border-b border-stone-900 group select-none"
      onMouseEnter={stopAutoSlide}
      onMouseLeave={startAutoSlide}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentBanner.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center"
          onClick={() => handleBannerClick(currentBanner)}
        >
          {/* Banner Image */}
          <div className="absolute inset-0 select-none pointer-events-none">
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40 opacity-90" />
            <img
              src={currentBanner.image}
              alt={currentBanner.title}
              className="w-full h-full object-cover object-center grayscale select-none"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Banner Content Card */}
          <div className="relative z-10 w-full max-w-4xl mx-auto px-6 md:px-12 text-center md:text-left flex flex-col items-center md:items-start gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-[9px] md:text-xs font-mono font-bold text-[#C5A880] uppercase tracking-widest leading-none">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>{lang === 'bn' ? 'বিশেষ অফার' : 'Premium Highlight'}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight leading-tight select-all text-stone-100 max-w-2xl">
              {currentBanner.title}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-stone-300 leading-relaxed font-light max-w-xl">
              {currentBanner.subtitle}
            </p>

            <div className="pt-2">
              <button
                type="button"
                className="bg-[#C5A880] hover:bg-[#b09670] active:scale-95 text-stone-950 font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-widest transition-all select-none shadow-md hover:shadow-lg cursor-pointer"
              >
                {currentBanner.button_text || (lang === 'bn' ? 'বিস্তারিত দেখুন' : 'Explore Now')}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-[#C5A880] text-white hover:text-stone-950 border border-stone-800/80 hover:border-[#C5A880] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer focus:outline-none"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-900/60 hover:bg-[#C5A880] text-white hover:text-stone-950 border border-stone-800/80 hover:border-[#C5A880] flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer focus:outline-none"
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Pagination indicators dots */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-25 flex justify-center gap-2">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
                startAutoSlide();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                idx === currentIndex ? 'w-6 bg-[#C5A880]' : 'w-1.5 bg-stone-600/80 hover:bg-stone-500'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
