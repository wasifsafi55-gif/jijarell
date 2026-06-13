import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'en' | 'bn';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  en: {
    brand_title: "JIJARELL",
    brand_sub: "Where Quality Meets Trust",
    ai_assistant: "JIJARELL Assistant",
    ai_search_placeholder: "Try: 'black leather watch under 200000 BDT'...",
    search: "Search",
    cart: "Cart",
    wishlist: "Wishlist",
    checkout: "Checkout",
    welcome_announcement: "✨ Exclusive Eid Collector Collection launched! View premium watch & shoes in virtual 3D viewer.",
    promo_countdown: "Eid Flash Sale Discount Code: ",
    buy_now: "Order via WhatsApp",
    pay_bkash: "Pay via bKash Secure Gateway",
    submit_transaction: "Submit Transaction ID",
    enter_transaction: "Enter bKash Trx ID",
    view_details: "Interaction & 3D View",
    product_details: "Product Specifications",
    price: "Price",
    add_to_cart: "Purchase Artifact",
    qty: "Qty",
    size: "Size",
    color: "Color",
    reviews: "Client Reviews",
    write_review: "Leave a Review",
    submit_review: "Submit Review",
    review_rating: "Rating",
    review_placeholder: "Share your experience with this premium artifact...",
    your_name: "Your Name",
    latest_news: "Luxury Journal",
    footer_tag: "JIJARELL Genève - Haute Artisanal luxury, redefining global e-commerce excellence.",
    all_rights_reserved: "© 2026 JIJARELL. All rights reserved.",
    featured: "Featured",
    trending: "Trending",
    flash_sale: "Flash Sale",
    new_arrival: "New Arrival",
    recommended: "Recommended",
    top_selling: "Top Selling",
    contact_info: "Customer Details",
    full_name: "Full Name",
    phone_number: "Phone Number",
    shipping_address: "Shipping Address",
    subtotal: "Subtotal",
    discount: "Promo Discount",
    shipping: "Elite White-glove Shipping",
    total: "Total",
    unpaid: "Unpaid",
    paid: "Paid",
    pending_verification: "Pending Auditing",
    processing: "Processing Delivery",
    completed: "Assigned & Delivered",
    cancelled: "Voided",
    admin_dashboard: "Admin Terminal",
    apply_coupon: "Apply Coupon",
    coupon_applied: "Coupon Applied Successfully",
    order_summary: "Order Summary",
    place_order: "Finalize Order Placement",
    back_to_shop: "Back to Catalog",
    ar_ready: "AR Ready",
    verify_payment: "Verify Payments",
    all: "View All Artifacts"
  },
  bn: {
    brand_title: "JIJARELL",
    brand_sub: "Where Quality Meets Trust",
    ai_assistant: "JIJARELL Assistant",
    ai_search_placeholder: "যেমন: '২ লাখ টাকার নিচে কালো চামড়ার ঘড়ি'...",
    search: "অনুসন্ধান করুন",
    cart: "কার্ট",
    wishlist: "উইশলিস্ট",
    checkout: "চেকআউট",
    welcome_announcement: "✨ এক্সক্লুসিভ ঈদ কালেক্টর কালেকশন চালু হয়েছে! ভার্চুয়াল থ্রিডি ভিউয়ারে প্রিমিয়াম ঘড়ি ও জুতো দেখুন।",
    promo_countdown: "ঈদ ফ্ল্যাশ সেল ডিসকাউন্ট কোড: ",
    buy_now: "হোয়াটসঅ্যাপের মাধ্যমে অর্ডার করুন",
    pay_bkash: "বিকাশ পেমেন্ট গেটওয়ে",
    submit_transaction: "লেনদেন (Trx ID) সাবমিট করুন",
    enter_transaction: "বিকাশ ট্রানজ্যাকশন আইডি লিখুন",
    view_details: "থ্রিডি ভিউ ও ইন্টারঅ্যাকশন",
    product_details: "পণ্যের বিবরণ",
    price: "মূল্য",
    add_to_cart: "ক্রয় করুন",
    qty: "পরিমাণ",
    size: "সাইজ",
    color: "রঙ",
    reviews: "গ্রাহক পর্যালোচনা",
    write_review: "পর্যালোচনা লিখুন",
    submit_review: "পর্যালোচনা জমা দিন",
    review_rating: "রেটিং দিন",
    review_placeholder: "এই প্রিমিয়াম পণ্যটি সম্পর্কে আপনার অভিজ্ঞতা লিখুন...",
    your_name: "আপনার নাম",
    latest_news: "লাক্সারি জার্নাল (ব্লগ)",
    footer_tag: "JIJARELL Genève - চমৎকার কারিগরী শিল্প ও বৈশ্বিক কমার্স শ্রেষ্ঠত্ব।",
    all_rights_reserved: "© ২০২৬ JIJARELL। সর্বস্বত্ব সংরক্ষিত।",
    featured: "ফিচার্ড",
    trending: "ট্রেন্ডিং",
    flash_sale: "ফ্ল্যাশ সেল",
    new_arrival: "নতুন সংগ্রহ",
    recommended: "প্রস্তাবিত পণ্য",
    top_selling: "শীর্ষ বিক্রিত",
    contact_info: "যোগাযোগের বিবরণ",
    full_name: "সম্পূর্ণ নাম",
    phone_number: "ফোন নম্বর",
    shipping_address: "ডেলিভারি ঠিকানা",
    subtotal: "সাবটোটাল",
    discount: "প্রোমো ডিসকাউন্ট",
    shipping: "অভিজাত ডেলিভারি চার্জ",
    total: "সর্বমোট",
    unpaid: "পরিশোধ করা হয়নি",
    paid: "পরিশোধিত",
    pending_verification: "অপেক্ষমান যাচাইকরণ",
    processing: "প্রক্রিয়াকরণ চলছে",
    completed: "ডেলিভারি সম্পন্ন",
    cancelled: "বাতিল করা হয়েছে",
    admin_dashboard: "অ্যাডমিন টার্মিনাল",
    apply_coupon: "কুপন প্রয়োগ করুন",
    coupon_applied: "কুপন সফলভাবে প্রয়োগ করা হয়েছে",
    order_summary: "অর্ডার সামারি",
    place_order: "অর্ডার নিশ্চিত করুন",
    back_to_shop: "ক্যাটালগে ফিরে যান",
    ar_ready: "এআর রেডি",
    verify_payment: "পেমেন্ট ভেরিফাই করুন",
    all: "সব পণ্য দেখুন"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    // 1. Check if the user has a manually saved language choice to respect manual override
    try {
      const cached = localStorage.getItem('jijarell_lang');
      if (cached === 'en' || cached === 'bn') {
        return cached;
      }
    } catch (e) {
      console.warn('Failed to access localStorage for language settings:', e);
    }

    // 2. Initial visit: detect the best match from the user's browser languages
    try {
      const userLocales = navigator.languages || [navigator.language];
      for (const locale of userLocales) {
        if (locale && locale.toLowerCase().startsWith('bn')) {
          return 'bn';
        }
      }
    } catch (e) {
      console.warn('Auto-locale detection failed:', e);
    }

    // 3. Fallback default
    return 'en';
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem('jijarell_lang', newLang);
    } catch (e) {
      console.warn('Failed to save language choice to localStorage:', e);
    }
  };

  const t = (key: string): string => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
