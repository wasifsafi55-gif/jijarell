export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  sku: string;
}

export interface ProductMedia {
  id: string;
  url: string;
  media_type: 'image' | 'video' | 'model_3d';
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  featured: boolean;
  is_active: boolean;
  category_id: string;
  brand: string;
  images: string[];
  type3d: 'watch' | 'shoe' | 'bag';
  variants: ProductVariant[];
  media: ProductMedia[];
  rating: number;
  reviewsCount: number;
  youtube_url?: string;
  model_3d_url?: string;
  model_3d_enabled?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  productName: string;
  quantity: number;
  price: number;
  variantStr: string;
  productImage: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_status: 'paid' | 'unpaid' | 'pending_verification';
  payment_method: 'bkash' | 'whatsapp';
  transaction_id?: string;
  proof_image?: string;
  items: OrderItem[];
  created_at: string;
  delivered_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  start_date: string;
  end_date: string;
}

export interface Review {
  id: string;
  product_id: string;
  order_id?: string;
  customer_phone?: string;
  user_name: string;
  rating: number;
  review: string;
  created_at: string;
  admin_reply?: string;
  admin_reply_at?: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  image: string;
  seo_title: string;
  seo_description: string;
  created_at: string;
}

export interface AppSettings {
  whatsapp_number: string;
  bkash_number: string;
  announcement_text: string;
  promo_text: string;
  promo_countdown_end: string;
  language: 'en' | 'bn';
  corporate_address?: string;
  corporate_email?: string;
  whatsapp_link?: string;
  instagram_link?: string;
  facebook_link?: string;
  delivery_contact_number?: string;
  admin_password?: string;
  api_keys?: {
    gemini?: string[];
    deepseek?: string[];
    openrouter?: string[];
  };
}

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  button_text: string;
  destination_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  click_action: 'product' | 'category' | 'flash_sale' | 'campaign';
}

export interface SearchSuggestion {
  id: string;
  keyword: string;
  keyword_bn?: string;
  hits: number;
  is_trending: boolean;
}

export interface FlashSale {
  id: string;
  name: string;
  name_bn?: string;
  product_ids: string[];
  discount_percentage: number;
  end_time: string;
  is_active: boolean;
}

export interface CampaignPage {
  id: string;
  name: string;
  name_bn?: string;
  slug: string;
  subtitle: string;
  subtitle_bn?: string;
  description: string;
  description_bn?: string;
  banner_image: string;
  product_ids: string[];
  is_active: boolean;
}

