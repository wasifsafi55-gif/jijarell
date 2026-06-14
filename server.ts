import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';


dotenv.config();

// Production-ready SMTP Real-Email Dispatcher
async function sendEmailSMTP(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || 'jijarell.official@gmail.com';
  const pass = process.env.SMTP_PASS || 'ijjr zmdp ocqr xaxw';

  if (!pass || pass === 'YOUR_GMAIL_APP_PASSWORD_HERE' || pass === 'YOUR_SECRET_HERE' || pass === '') {
    console.log(`[SMTP Sandbox Mode] Active for requested address: ${to}. Simulating delivery.`);
    throw new Error('SMTP authenticating offline (sandbox mode)');
  }

  // Determine user domain for Message-ID and EHLO name mapping to avoid @localhost hostname warnings
  const userDomain = user.includes('@') ? user.split('@')[1] : 'gmail.com';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 587,
    auth: {
      user,
      pass
    },
    name: userDomain // Set FQDN for SMTP EHLO/HELO to match SMTP_USER domain
  });

  // Extract clean plain text alternative content from HTML payload
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Create highly authenticated FQDN Message-ID matching sender's domain
  const randPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const messageId = `<${randPart}${Date.now()}@${userDomain}>`;

  const mailOptions = {
    from: `"JIJARELL Genève" <${user}>`,
    to,
    replyTo: user,
    subject,
    text,
    html,
    messageId,
    envelope: {
      from: user,
      to: [to]
    },
    headers: {
      'X-Priority': '1', // 1 = High, 3 = Normal, 5 = Low
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  await transporter.sendMail(mailOptions);
}


// @ts-ignore
const resolvedFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath((import.meta as any).url || 'file:///index.js');
// @ts-ignore
const resolvedDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(resolvedFilename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// JSON DB Persistence setup
const DB_FILE = path.join(process.cwd(), 'db.json');

// Types duplicated here for type safety on backend without import issues
interface BackendProduct {
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
  variants: any[];
  rating: number;
  reviewsCount: number;
}

interface BackendOrder {
  id: string;
  user_id?: string;
  customer_email?: string;
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
  items: any[];
  created_at: string;
  delivered_at?: string;
}

interface BackendNotification {
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

interface BackendEmail {
  id: string;
  to: string;
  subject: string;
  bodyHtml: string;
  customer_phone: string;
  created_at: string;
}

interface BackendDB {
  products: BackendProduct[];
  categories: any[];
  orders: BackendOrder[];
  coupons: any[];
  reviews: any[];
  blogs: any[];
  users: any[];
  banners?: any[];
  notifications?: BackendNotification[];
  emails?: BackendEmail[];
  audit_logs?: any[];
  settings: {
    whatsapp_number: string;
    bkash_number: string;
    announcement_text: string;
    promo_text: string;
    promo_countdown_end: string;
    language: 'en' | 'bn';
    admin_password?: string;
    corporate_address?: string;
    corporate_email?: string;
    whatsapp_link?: string;
    instagram_link?: string;
    facebook_link?: string;
    delivery_contact_number?: string;
    api_keys?: {
      gemini?: string[];
      deepseek?: string[];
      openrouter?: string[];
    };
  };
}

// Seed Initial Premium Products
const SEED_DATA: BackendDB = {
  products: [
    {
      id: "prod-1",
      name: "Onyx Chrono-Tourbillon",
      slug: "onyx-chrono-tourbillon",
      sku: "JJ-WAT-001",
      description: "An absolute masterpiece of Haute Horlogerie. Featuring a hand-wound mechanical tourbillon cage at 6 o'clock, real obsidian Dial background, and a matte black brushed titanium casing with luxury alligator stitching strap. Chronograph sweeps flawlessly with sub-dial indices.",
      price: 245000,
      sale_price: 220000,
      stock: 4,
      featured: true,
      is_active: true,
      category_id: "cat-1",
      brand: "JIJARELL Genève",
      images: [
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop"
      ],
      type3d: "watch",
      variants: [
        { id: "v1-1", size: "42mm Titanium", color: "Obsidian Black", price: 220000, stock: 2, sku: "JJ-WAT-001-A" },
        { id: "v1-2", size: "40mm Rose Gold", color: "Royal Crimson", price: 240000, stock: 2, sku: "JJ-WAT-001-B" }
      ],
      rating: 4.9,
      reviewsCount: 16
    },
    {
      id: "prod-2",
      name: "Aurelia Sovereign Oxford",
      slug: "aurelia-sovereign-oxford",
      sku: "JJ-SHO-002",
      description: "Handmade master footwear. Crafted from grade-A full-grain French calfskin with hand-burnished finishing. Traditional Goodyear welt design with robust leather soles. Styled with refined closed lacing for the quintessential gentleman's evening wardrobe.",
      price: 48000,
      sale_price: null,
      stock: 12,
      featured: true,
      is_active: true,
      category_id: "cat-2",
      brand: "JIJARELL L'Artisan",
      images: [
        "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?q=80&w=600&auto=format&fit=crop"
      ],
      type3d: "shoe",
      variants: [
        { id: "v2-1", size: "EU 42", color: "Cognac Brown", price: 48000, stock: 5, sku: "JJ-SHO-002-A" },
        { id: "v2-2", size: "EU 43", color: "Cognac Brown", price: 48000, stock: 4, sku: "JJ-SHO-002-B" },
        { id: "v2-3", size: "EU 44", color: "Classic Onyx", price: 49500, stock: 3, sku: "JJ-SHO-002-C" }
      ],
      rating: 4.8,
      reviewsCount: 22
    },
    {
      id: "prod-3",
      name: "Elysian Monarch Duffle",
      slug: "elysian-monarch-duffle",
      sku: "JJ-BAG-003",
      description: "Generous volumes, absolute sophistication. Features robust hand-stitched pebbled Italian leather, double zippers with padlocks, inside canvas satin lining, and detachable shoulder sling. Finished with solid polished brass hardware representing JIJARELL standards.",
      price: 110000,
      sale_price: 95000,
      stock: 6,
      featured: true,
      is_active: true,
      category_id: "cat-3",
      brand: "JIJARELL Atelier",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=600&auto=format&fit=crop"
      ],
      type3d: "bag",
      variants: [
        { id: "v3-1", size: "Classic 48L", color: "Espresso Brown", price: 95000, stock: 3, sku: "JJ-BAG-003-A" },
        { id: "v3-2", size: "Classic 48L", color: "Onyx Charcoal", price: 95000, stock: 3, sku: "JJ-BAG-003-B" }
      ],
      rating: 5.0,
      reviewsCount: 8
    },
    {
      id: "prod-4",
      name: "Vanguard Marine Diver",
      slug: "vanguard-marine-diver",
      sku: "JJ-WAT-004",
      description: "An authentic, high-precision diving tool built to sustain extreme depth conditions. Calibrated unidirectional rotating ceramic bezel, luminescent hour indicators, helium release mechanism, and solid titanium link straps. Self-winding mechanical calibre.",
      price: 185000,
      sale_price: null,
      stock: 8,
      featured: false,
      is_active: true,
      category_id: "cat-1",
      brand: "JIJARELL Genève",
      images: [
        "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop"
      ],
      type3d: "watch",
      variants: [
        { id: "v4-1", size: "44mm Titanium", color: "Deep Ocean Blue", price: 185000, stock: 8, sku: "JJ-WAT-004-A" }
      ],
      rating: 4.7,
      reviewsCount: 14
    },
    {
      id: "prod-5",
      name: "Velour Sport High-Top",
      slug: "velour-sport-high-top",
      sku: "JJ-SHO-005",
      description: "Unparalleled luxurious street expression. A pristine fusion of plush premium velvet paneling, breathable knit meshes, and lightweight custom sports vulcanized rubber soles. Embellished with 18k gold-toned hardware details.",
      price: 36000,
      sale_price: 32000,
      stock: 14,
      featured: false,
      is_active: true,
      category_id: "cat-2",
      brand: "JIJARELL L'Artisan",
      images: [
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop"
      ],
      type3d: "shoe",
      variants: [
        { id: "v5-1", size: "EU 41", color: "Crimson Velvet", price: 32000, stock: 7, sku: "JJ-SHO-005-A" },
        { id: "v5-2", size: "EU 42", color: "Crimson Velvet", price: 32000, stock: 7, sku: "JJ-SHO-005-B" }
      ],
      rating: 4.6,
      reviewsCount: 11
    },
    {
      id: "prod-6",
      name: "Prism Eclipse Tote",
      slug: "prism-eclipse-tote",
      sku: "JJ-BAG-006",
      description: "Architectural clean silhouettes designed for daytime transitions and evening galas. Handmade using premium textured saffiano calfskin, with unique solid geometric zinc fittings and long carrying cords.",
      price: 78000,
      sale_price: null,
      stock: 5,
      featured: false,
      is_active: true,
      category_id: "cat-3",
      brand: "JIJARELL Atelier",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop"
      ],
      type3d: "bag",
      variants: [
        { id: "v6-1", size: "Medium Wide", color: "Desert Sand", price: 78000, stock: 5, sku: "JJ-BAG-006-A" }
      ],
      rating: 4.8,
      reviewsCount: 9
    }
  ],
  categories: [
    { id: "cat-1", name: "Luxury Watches", slug: "luxury-watches", icon: "Clock", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop" },
    { id: "cat-2", name: "Artisanal Footwear", slug: "artisanal-footwear", icon: "Tag", image: "https://images.unsplash.com/photo-1495768852624-[60db060e1dcb?q=80&w=600&auto=format&fit=crop" },
    { id: "cat-3", name: "Elite Leather Bags", slug: "elite-leather-bags", icon: "Briefcase", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600&auto=format&fit=crop" }
  ],
  orders: [],
  coupons: [
    { id: "coup-1", code: "JIJARELL10", discount_type: "percentage", discount_value: 10, start_date: "2026-01-01", end_date: "2026-12-31" },
    { id: "coup-2", code: "LUXURY5000", discount_type: "fixed", discount_value: 5000, start_date: "2026-01-01", end_date: "2026-12-31" }
  ],
  reviews: [
    { id: "rev-1", product_id: "prod-1", user_name: "Tasnim Chowdhury", rating: 5, review: "A magnificent collector pieces. The tourbillon movement rotates so gracefully. Highly recommended for executive wear in Dhaka.", created_at: "2026-05-15T12:00:00Z" },
    { id: "rev-2", product_id: "prod-1", user_name: "Kamrul Karim", rating: 4.8, review: "Fantastic weight and feel on the titanium casing. Delivery took 2 days but custom packaging was extreme luxury standard.", created_at: "2026-05-28T09:30:00Z" },
    { id: "rev-3", product_id: "prod-2", user_name: "Nabil Rahman", rating: 5, review: "Premium Goodyear welt craftsmanship. Exceeds my requirements for black tie corporate dinners. Pure luxury leather.", created_at: "2026-06-01T15:20:00Z" }
  ],
  blogs: [
    {
      id: "blog-1",
      title: "The Legacy of Haute Horlogerie: Deciphering Tourbillon Aesthetics",
      slug: "legacy-of-haute-horlogerie",
      content: "Luxury wristwatches have transcended simple time-telling. Inside high luxury chambers of JIJARELL Genève, we handcraft custom mechanisms to bypass kinetic errors. A mechanical tourbillon rotates the complete balance wheel assembly on all spatial axes to neutralize local gravitational pull. Discover our new limited collector edition tourbillons inside the Geneva Collection.",
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=650&auto=format&fit=crop",
      seo_title: "High Luxury Tourbillon Movements Explained | JIJARELL Genève",
      seo_description: "Discover the heritage, structural micro-mechanisms, and precision engineering back of JIJARELL premium limited-edition tourbillon mechanical watches.",
      created_at: "2026-05-10T14:00:00Z"
    },
    {
      id: "blog-2",
      title: "French Calfskin vs. Shell Cordovan: The Master Shoe leather",
      slug: "french-calfskin-vs-shell-cordovan",
      content: "The selection of premium hide reflects your personal standards. French Calfskin is globally acknowledged for its fine grain, lightweight suppleness, and capacity to take mirror shines under beeswax treatment. In contrast, Shell Cordovan represents maximum durability, coming from key fibrous parts of equine hides. We compare their life expectancy, breathing rates, and aging patina.",
      image: "https://images.unsplash.com/photo-1475965894430-b05c9d13568a?q=80&w=650&auto=format&fit=crop",
      seo_title: "Calfskin Leather and Footwear Selection | JIJARELL Guide",
      seo_description: "An interactive editorial comparing structural leathers, shoe longevity, and hand-stitched Goodyear welting styles.",
      created_at: "2026-05-24T11:00:00Z"
    }
  ],
  settings: {
    whatsapp_number: "8801410624199",
    bkash_number: "01410625199",
    announcement_text: "✨ Exclusive Ramadhan Eid Collector Collection launched! View premium watches in virtual interactive 3D.",
    promo_text: "⚡ Limited Eid Flash Sale: Redeem code 'LUXURY5000' at Checkout.",
    promo_countdown_end: new Date(Date.now() + 3600000 * 48).toISOString(),
    language: "en",
    corporate_address: "Paschim Sholosahar, Chattogram, Chattogram Division, 4211, Bangladesh",
    corporate_email: "jijarell.official@gmail.com",
    whatsapp_link: "https://wa.me/8801410624199",
    instagram_link: "https://www.instagram.com/jijarell?igsh=NjA4MWhmbHlpZmpj",
    facebook_link: "https://www.facebook.com/share/18pNmHSeMr",
    delivery_contact_number: "01410625199"
  },
  banners: [
    {
      id: "banner-1",
      image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1200&auto=format&fit=crop",
      title: "The Art of Haute Horlogerie",
      subtitle: "Discover pure mechanical masterpieces, engineered and hand-assembled with Geneva standards.",
      button_text: "Explore Watches",
      destination_url: "cat-1",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 3600000 * 24 * 30).toISOString().split('T')[0],
      is_active: true,
      click_action: "category"
    },
    {
      id: "banner-2",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200&auto=format&fit=crop",
      title: "The Elite Leather Heritage",
      subtitle: "Handcrafted Italian pebbled leather and premium travel duffles crafted for a lifetime.",
      button_text: "View Elite Bags",
      destination_url: "cat-3",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 3600000 * 24 * 30).toISOString().split('T')[0],
      is_active: true,
      click_action: "category"
    }
  ],
  users: []
};

// ==========================================
// FIREBASE FIRESTORE SYNC AND PERSISTENCE ENGINE
// ==========================================
// Initialize Firebase
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const FIRESTORE_SYSTEM_TOKEN = "JIJARELL_SYSTEM_SECURE_TOKEN_2026";

// Cache systems to keep track of document states to save bandwidth and writes
const docHashCache = new Map<string, string>();
const collectionKeysCache = new Map<string, Set<string>>();

// Incremental Firestore synchronizer
async function saveToFirestore(data: BackendDB) {
  try {
    const saveDocIfChanged = async (collectionName: string, docId: string, payload: any) => {
      const cacheKey = `${collectionName}:${docId}`;
      const payloadWithToken = { ...payload, _sys_token: FIRESTORE_SYSTEM_TOKEN };
      const payloadStr = JSON.stringify(payloadWithToken);
      const cached = docHashCache.get(cacheKey);
      if (cached !== payloadStr) {
        await setDoc(doc(db, collectionName, docId), payloadWithToken);
        docHashCache.set(cacheKey, payloadStr);
      }
    };

    // 1. Settings
    if (data.settings) {
      await saveDocIfChanged('settings', 'store_settings', data.settings);
    }

    // 2. Collections
    const syncCollection = async (collectionName: string, items: any[]) => {
      const currentIds = new Set<string>();
      for (const item of items) {
        if (item.id) {
          currentIds.add(item.id);
          await saveDocIfChanged(collectionName, item.id, item);
        }
      }

      // Check for deletions
      const previousIds = collectionKeysCache.get(collectionName);
      if (previousIds) {
        for (const oldId of previousIds) {
          if (!currentIds.has(oldId)) {
            try {
              await deleteDoc(doc(db, collectionName, oldId));
              docHashCache.delete(`${collectionName}:${oldId}`);
            } catch (error) {
              console.error(`[Firestore] Failed to delete ${collectionName}/${oldId}:`, error);
            }
          }
        }
      }
      collectionKeysCache.set(collectionName, currentIds);
    };

    await syncCollection('products', data.products || []);
    await syncCollection('categories', data.categories || []);
    await syncCollection('banners', data.banners || []);
    await syncCollection('coupons', data.coupons || []);
    await syncCollection('blogs', data.blogs || []);
    await syncCollection('reviews', data.reviews || []);
    await syncCollection('users', data.users || []);
    await syncCollection('orders', data.orders || []);
    await syncCollection('notifications', data.notifications || []);
    await syncCollection('emails', data.emails || []);
    await syncCollection('audit_logs', data.audit_logs || []);

  } catch (error) {
    console.error('[Firestore] saveToFirestore error:', error);
  }
}

// Synchronizes the entire database from Firebase Firestore
async function syncFromFirestore(): Promise<BackendDB> {
  const newDB: BackendDB = {
    products: [],
    categories: [],
    orders: [],
    coupons: [],
    reviews: [],
    blogs: [],
    users: [],
    banners: [],
    notifications: [],
    emails: [],
    audit_logs: [],
    settings: {} as any
  };

  try {
    // 1. Load Settings
    const settingsDoc = await getDoc(doc(db, 'settings', 'store_settings'));
    if (settingsDoc.exists()) {
      const settingsData = settingsDoc.data() as any;
      const rawSettingsStr = JSON.stringify(settingsData);
      delete settingsData._sys_token;
      newDB.settings = settingsData;
      docHashCache.set('settings:store_settings', rawSettingsStr);
    }
  } catch (error) {
    console.error('[Firestore] syncFromFirestore general error:', error);
    return SEED_DATA;
  }
}

// Synchronous wrapper to update Firestore asynchronously
function saveDB(data: BackendDB) {
  saveToFirestore(data).then(() => {
    console.log('[Firestore] Incremental backend save completed.');
  }).catch(err => {
    console.error('[Firestore] Asynchronous saveDB error:', err);
  });
}

// Initial placeholder is set to SEED_DATA
let currentDB: BackendDB = SEED_DATA;

// Core Administrative Auditing Logger
function logAdminAction(action: string, details: string, req?: any) {
  if (!currentDB.audit_logs) {
    currentDB.audit_logs = [];
  }
  let ip = '127.0.0.1';
  let browser = 'Unknown Session Client';
  if (req) {
    ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '103.84.150.22';
    browser = req.headers['user-agent'] || 'Bespoke Client';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }
  }
  
  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    action,
    details,
    timestamp: new Date().toISOString(),
    ip,
    browser
  };
  
  currentDB.audit_logs.unshift(newLog);
  // Keep last 150 administrative trails
  if (currentDB.audit_logs.length > 150) {
    currentDB.audit_logs = currentDB.audit_logs.slice(0, 150);
  }
  saveDB(currentDB);
}

// ==========================================
// REDIS-LIKE HIGH-PERFORMANCE IN-MEMORY CACHE
// ==========================================
class RedisCacheServer {
  private store = new Map<string, { value: string; expiresAt: number }>();
  private hits = 0;
  private misses = 0;

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      console.log(`[Redis Cache] GET ${key} -> MISS`);
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      console.log(`[Redis Cache] GET ${key} -> EXPIRED`);
      return null;
    }
    this.hits++;
    console.log(`[Redis Cache] GET ${key} -> HIT (Latency: < 1ms)`);
    return entry.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000,
    });
    console.log(`[Redis Cache] SETEX ${key} (TTL: ${seconds}s) -> OK`);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key) ? 1 : 0;
    console.log(`[Redis Cache] DEL ${key} -> ${deleted}`);
    return deleted;
  }

  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 100;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: Number(hitRate.toFixed(1)),
      keys: Array.from(this.store.keys()),
    };
  }

  flushall() {
    this.store.clear();
    console.log(`[Redis Cache] FLUSHALL -> OK`);
  }
}

const redis = new RedisCacheServer();

// ==========================================
// SERVER-SENT EVENTS (SSE) REAL-TIME HUB
// ==========================================
interface SSEClient {
  id: string;
  phone?: string;
  response: any;
}

let sseClients: SSEClient[] = [];

function broadcastNotification(notification: any) {
  const payload = JSON.stringify(notification);
  console.log(`[SSE Broadcast] Sending to ${sseClients.length} clients -> ${notification.title}`);
  sseClients.forEach(client => {
    if (notification.customer_phone) {
      const cleanNotifPhone = notification.customer_phone.replace(/\D/g, '').slice(-10);
      if (client.phone && client.phone !== cleanNotifPhone) {
        return; // skip Targeted phone mismatch
      }
    }
    client.response.write(`data: ${payload}\n\n`);
  });
}


// Lazy initialize Gemini client to prevent crashing on startup when API key is missing.
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      throw new Error('GEMINI_API_KEY is not configured. Please add it in the Secrets panel in the Settings menu (top right).');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API Routes

// Store settings API
app.get('/api/settings', (req, res) => {
  res.json(currentDB.settings);
});

app.post('/api/settings', (req, res) => {
  currentDB.settings = { ...currentDB.settings, ...req.body };
  saveDB(currentDB);
  logAdminAction('Corporate Parameters Modified', 'CMS, Announcement Bar, or Redirection configs adjusted', req);
  res.json({ success: true, settings: currentDB.settings });
});

// Admin Terminal Authenticator & Session Manager
app.post('/api/admin/login', (req, res) => {
  const { password, role } = req.body;
  const correctPassword = (currentDB.settings as any).admin_password || 'wasif1234';
  if (password === correctPassword) {
    const sessionToken = 'jijarell_secure_hash_' + Math.floor(100000 + Math.random() * 900000);
    logAdminAction('Terminal Login Success', `Authorized session granted to administrative operator (Role: ${role || 'administrator'})`, req);
    res.json({ success: true, token: sessionToken, role: role || 'admin' });
  } else {
    // Production Mode - Serve prebuilt assets
    const distPath = path.join(__dirname, "dist");
    console.log("Serving static from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
});

app.post('/api/admin/logout', (req, res) => {
  logAdminAction('Terminal Session Closed', 'Admin operator closed terminal connection safely', req);
  res.json({ success: true });
});

// ==========================================
// CUSTOMER PURCHASE AUTHENTICATION SYSTEM
// ==========================================

const customerOTPs = new Map<string, { otp: string; expires: number }>();
const customerSessions = new Map<string, { userId: string; expires: number }>();

// 1. Dispatch authentic, real SMTP email OTP with robust local sandbox fallback
app.post('/api/customer/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please submit a valid email address.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  customerOTPs.set(normalizedEmail, { otp, expires: Date.now() + 1000 * 60 * 5 }); // 5 mins

  try {
    const htmlContent = `
      <div style="font-family:Arial;padding:20px">
        <h2>JIJARELL Genève Security OTP</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing:5px">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `;

    await sendEmailSMTP(normalizedEmail, '[JIJARELL Genève] Access Token Authorization OTP', htmlContent);
    res.json({ success: true, message: 'OTP sent successfully via SMTP!' });
  } catch (error: any) {
    console.log(`[SMTP Sandbox Mode] Sandbox bypass activated for address: ${normalizedEmail}. Simulation code generated.`);
    // Since this is a test or local development/preview environment, we gracefully fall back to local sandbox OTP mode
    res.json({
      success: true,
      message: 'SMTP mock delivery activated. Live simulation OTP has been generated for your sandbox environment.',
      dev_otp: otp,
      warning: 'Live sandbox active.'
    });
  }
});

// 2. Validate OTP and retrieve customer account/session
app.post('/api/customer/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP token are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = customerOTPs.get(normalizedEmail);
  if (!record) {
    return res.status(400).json({ error: 'No active verification sequence found.' });
  }

  if (record.expires < Date.now()) {
    customerOTPs.delete(normalizedEmail);
    return res.status(400).json({ error: 'This verification token has expired.' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Incorrect verification token code.' });
  }

  // Token is verified!
  customerOTPs.delete(normalizedEmail);

  // Retrieve or create customer user
  let user = currentDB.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    user = {
      id: 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(normalizedEmail)}`,
      wishlist: [],
      created_at: new Date().toISOString()
    };
    currentDB.users.push(user);
    saveDB(currentDB);
  }

  // Session Token Generation
  const sessionToken = 'cust_' + Math.floor(100000 + Math.random() * 900000) + '_' + Math.random().toString(36).substring(2, 15);
  customerSessions.set(sessionToken, { userId: user.id, expires: Date.now() + 1000 * 3600 * 24 * 30 }); // 30 Days

  res.json({ success: true, user, token: sessionToken });
});

// 3. Real Google Sign-In Verifier
app.post('/api/customer/auth/google', async (req, res) => {
  const { credential, accessToken } = req.body;
  if (!credential && !accessToken) {
    return res.status(400).json({ error: 'Google credential or access token is required.' });
  }

  try {
    let email = '';
    let name = '';
    let picture = '';

    if (credential) {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (!verifyRes.ok) {
        return res.status(400).json({ error: 'Failed to verify Google Identity credentials.' });
      }
      const payload = await verifyRes.json();
      if (!payload.email) {
        return res.status(400).json({ error: 'Email scope was not shared by Google token payload.' });
      }
      email = payload.email.toLowerCase().trim();
      name = payload.name || email.split('@')[0];
      picture = payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`;
    } else if (accessToken) {
      const verifyRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(accessToken)}`);
      if (!verifyRes.ok) {
        return res.status(400).json({ error: 'Failed to verify Google OAuthToken.' });
      }
      const payload = await verifyRes.json();
      if (!payload.email) {
        return res.status(400).json({ error: 'Email scope was not shared by Google profile.' });
      }
      email = payload.email.toLowerCase().trim();
      name = payload.name || email.split('@')[0];
      picture = payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`;
    }

    // Security Gate: Block administrator Gmail accounts from signing up as customers
    const adminEmails = ['wasifsafi55@gmail.com', 'wasifjafarsafi.edu@gmail.com'];
    if (adminEmails.includes(email.toLowerCase().trim())) {
      return res.status(403).json({ error: 'Administrative restriction: This email is reserved for administrators.' });
    }

    let user = currentDB.users.find((u: any) => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: 'usr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        email,
        name,
        avatar: picture,
        wishlist: [],
        created_at: new Date().toISOString()
      };
      currentDB.users.push(user);
      saveDB(currentDB);
    }

    // Session Token Generation
    const sessionToken = 'cust_' + Math.floor(100000 + Math.random() * 900000) + '_' + Math.random().toString(36).substring(2, 15);
    customerSessions.set(sessionToken, { userId: user.id, expires: Date.now() + 1000 * 3600 * 24 * 30 }); // 30 Days

    res.json({ success: true, user, token: sessionToken });
  } catch (err: any) {
    console.error('Google Auth validation error:', err);
    res.status(500).json({ error: 'Google authentication error: ' + err.message });
  }
});

// Authorized customer helper
function getAuthorizedCustomer(req: express.Request) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const session = customerSessions.get(token);
  if (!session || session.expires < Date.now()) return null;
  return currentDB.users.find((u: any) => u.id === session.userId) || null;
}

// 4. Retrieve Active Customer Session
app.get('/api/customer/auth/session', (req, res) => {
  const user = getAuthorizedCustomer(req);
  if (!user) {
    return res.status(401).json({ error: 'No active session or session expired.' });
  }
  res.json({ success: true, user });
});

// 5. Wishlist toggle
app.post('/api/customer/wishlist/toggle', (req, res) => {
  const user = getAuthorizedCustomer(req);
  if (!user) {
    return res.status(401).json({ error: 'Operation unauthorized.' });
  }

  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID is missing.' });

  user.wishlist = user.wishlist || [];
  const idx = user.wishlist.indexOf(productId);
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
  } else {
    // Production Mode - Serve prebuilt assets
    const distPath = path.join(__dirname, "dist");
    console.log("Serving static from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  saveDB(currentDB);
  res.json({ success: true, wishlist: user.wishlist });
});

// 6. Update Customer Profile properties
app.post('/api/customer/profile/update', (req, res) => {
  const user = getAuthorizedCustomer(req);
  if (!user) {
    return res.status(401).json({ error: 'Operation unauthorized.' });
  }

  const { name, phone, address } = req.body;
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.customer_phone = phone; // Aligning with orders schema
  if (address !== undefined) user.customer_address = address;

  saveDB(currentDB);
  res.json({ success: true, user });
});

// 7. Get Customer order history
app.get('/api/customer/orders', (req, res) => {
  const user = getAuthorizedCustomer(req);
  if (!user) return res.status(401).json({ error: 'Operation unauthorized.' });

  const orders = currentDB.orders.filter((o: any) => 
    o.user_id === user.id || 
    (o.customer_phone && o.customer_phone === user.customer_phone) || 
    (o.customer_email && o.customer_email === user.email)
  );
  res.json(orders);
});

// Store global memory active OTPs
let activeOTPs = { otp1: '', otp2: '', expires: 0 };

app.post('/api/admin/send-pw-otp', async (req, res) => {
  const { currentPassword, newPassword, confirmPassword, browserInfo, deviceInfo, ipAddress, location } = req.body;
  
  const correctPassword = (currentDB.settings as any).admin_password || 'wasif1234';
  if (currentPassword !== correctPassword) {
    return res.status(400).json({ error: 'Current password verification failed.' });
  }
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password selections must match exactly.' });
  }
  
  // Generate multi-channel OTPs
  const otp1 = Math.floor(100000 + Math.random() * 900000).toString();
  const otp2 = Math.floor(100000 + Math.random() * 900000).toString();
  
  activeOTPs = {
    otp1,
    otp2,
    expires: Date.now() + 10 * 60 * 1000 // 10 minutes from now
  };
  
  const userAgent = browserInfo || req.headers['user-agent'] || 'Mozilla/5.0';
  const clientIp = ipAddress || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '103.84.150.22';
  const locStr = location || 'Khulshi, Chattogram (Dhaka ISP Routing Terminal)';
  const timestamp = new Date().toISOString();
  
  logAdminAction('Password Change OTP Requested', `Operator initialized a credential rotation sequence. Real SMTP delivery initiated.`, req);
  
  const buildEmailHtml = (otpCode: string, stepNo: number, emailAddr: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ff3333; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background-color: #7f1d1d; padding: 24px; text-align: center; border-bottom: 2px solid #C5A880;">
        <p style="font-size: 21px; font-weight: 900; letter-spacing: 5px; color: #ffffff; text-transform: uppercase; margin: 0;">JIJARELL SECURITY ENVELOPE</p>
        <p style="font-size: 9px; letter-spacing: 3px; color: #a58e6c; text-transform: uppercase; margin: 4px 0 0 0;">CRITICAL SECOND-FACTOR AUTHENTICATION SERVICE</p>
      </div>
      <div style="padding: 32px 24px; color: #1c1917; line-height: 1.6;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1.5px; color: #7f1d1d; border-left: 3px solid #ff3333; padding-left: 10px;">CREDENTIAL KEY ROTATION REQUEST</h2>
        <p style="font-size: 13px; margin-bottom: 20px; color: #44403c;">An administrative credential modification request was submitted on JIJARELL Central Node. Complete authorization with the OTP below.</p>
        
        <div style="background-color: #fff5f5; border-left: 4px solid #ff3333; border-radius: 4px; padding: 18px; margin-bottom: 24px;">
          <p style="font-size: 11px; font-weight: bold; margin: 0 0 6px 0; color: #7f1d1d; uppercase; tracking-wider">ONE-TIME SECURITY KEY (KEY CARD ${stepNo} OF 2)</p>
          <p style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1c1917; margin: 10px 0; font-family: monospace;">${otpCode}</p>
          <p style="font-size: 10px; margin: 0; color: #78716c;">Exclusively authenticated to: <strong>${emailAddr}</strong>. Expires strictly in 10 minutes (600s).</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; background-color: #fafaf9; border-radius: 8px; border: 1px solid #f5f5f4;">
          <tr style="border-bottom: 1px solid #e7e5e4;">
            <td style="padding: 10px 14px; font-weight: bold; color: #78716c;">Verified Platform OS:</td>
            <td style="padding: 10px 14px; text-align: right; color: #1c1917;">${deviceInfo || 'Unknown Node'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e7e5e4;">
            <td style="padding: 10px 14px; font-weight: bold; color: #78716c;">Operator Client Signature:</td>
            <td style="padding: 10px 14px; text-align: right; color: #1c1917;">${userAgent}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e7e5e4;">
            <td style="padding: 10px 14px; font-weight: bold; color: #78716c;">Node Gateway IP:</td>
            <td style="padding: 10px 14px; text-align: right; font-family: monospace; font-weight: bold; color: #ff3333;">${clientIp}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e7e5e4;">
            <td style="padding: 10px 14px; font-weight: bold; color: #78716c;">Approximate Operator Location:</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: bold; color: #b45309;">${locStr}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: bold; color: #78716c;">System Event Stamp:</td>
            <td style="padding: 10px 14px; text-align: right; font-family: monospace; color: #1c1917;">${timestamp}</td>
          </tr>
        </table>
        
        <p style="font-size: 11px; color: #78716c;">This is a multi-factor authentication protocol. Access change credentials will be blocked unless keys are correctly input from both administrative channels simultaneously.</p>
      </div>
      <div style="background-color: #faf9f6; padding: 24px; text-align: center; font-size: 9px; color: #a8a29e; border-top: 1px solid #f5f5f4;">
        <p style="margin: 0; font-weight: bold; letter-spacing: 1px; color: #57534e;">JIJARELL SECURITY CENTER</p>
        <p style="margin: 4px 0 0 0;">This transmission is confidential. If you did not trigger this request, immediately verify credentials.</p>
      </div>
    </div>
  `;
  
  try {
    // Deliver Email 1 to wasifjafarsafi.edu@gmail.com
    await sendEmailSMTP(
      'wasifjafarsafi.edu@gmail.com',
      '[JIJARELL SECURITY] MFA verification code 1 of 2: Change Password',
      buildEmailHtml(otp1, 1, 'wasifjafarsafi.edu@gmail.com')
    );

    // Deliver Email 2 to wasifsafi55@gmail.com
    await sendEmailSMTP(
      'wasifsafi55@gmail.com',
      '[JIJARELL SECURITY] MFA verification code 2 of 2: Change Password',
      buildEmailHtml(otp2, 2, 'wasifsafi55@gmail.com')
    );

    logAdminAction('Password Change SMTP Dispatched', `Dual security channels successfully delivered via SMTP to registered recipients.`, req);

    res.json({
      success: true,
      message: 'MFA OTP security codes have been securely dispatched. Please check your actual email inboxes (wasifjafarsafi.edu@gmail.com and wasifsafi55@gmail.com) for Key 1 and Key 2.'
    });
  } catch (err: any) {
    console.log(`[SMTP Sandbox Mode] Sandbox bypass activated for admin channels. Simulation codes generated.`);
    logAdminAction('Password Change Sandbox Mode Active', 'SMTP bypassed. Sandbox developer duo-channel credentials generated.', req);
    
    // Graceful developer bypass fallback when SMTP configuration is invalid or missing
    res.json({
      success: true,
      message: 'SMTP system offline. Duo-channel security codes generated for your sandbox environment.',
      dev_otp1: otp1,
      dev_otp2: otp2,
      warning: 'Sandbox credential bypass active.'
    });
  }
});

app.post('/api/admin/verify-pw-change', (req, res) => {
  const { currentPassword, newPassword, confirmPassword, otp1, otp2 } = req.body;
  
  const correctPassword = (currentDB.settings as any).admin_password || 'wasif1234';
  if (currentPassword !== correctPassword) {
    return res.status(400).json({ error: 'Current password verification failed.' });
  }
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password confirmation does not match.' });
  }
  
  if (!activeOTPs.otp1 || !activeOTPs.otp2 || Date.now() > activeOTPs.expires) {
    return res.status(400).json({ error: 'The verification keys have expired. Please request a new security envelope.' });
  }
  
  if (activeOTPs.otp1 !== otp1) {
    return res.status(400).json({ error: 'Verification Key 1 is invalid (Email Channel 1 check failed).' });
  }
  
  if (activeOTPs.otp2 !== otp2) {
    return res.status(400).json({ error: 'Verification Key 2 is invalid (Email Channel 2 check failed).' });
  }
  
  // Update state password
  (currentDB.settings as any).admin_password = newPassword;
  saveDB(currentDB);
  
  // Expire active OTPs
  activeOTPs = { otp1: '', otp2: '', expires: 0 };
  
  logAdminAction('Credential Restructure Success', 'Administrative password updated following dual-OTP email auth flow confirmation', req);
  res.json({ success: true, message: 'Administrative credentials mutated successfully.' });
});

// Fetch Audit Trail Logs
app.get('/api/admin/logs', (req, res) => {
  res.json(currentDB.audit_logs || []);
});

// Banners API
app.get('/api/banners', async (req, res) => {
  const cacheKey = 'redis:banners';
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  const data = currentDB.banners || [];
  await redis.setex(cacheKey, 600, JSON.stringify(data));
  res.json(data);
});

app.post('/api/banners', (req, res) => {
  const banner = req.body;
  if (!banner.id) {
    banner.id = 'banner-' + Date.now();
  }
  if (!currentDB.banners) {
    currentDB.banners = [];
  }
  const idx = currentDB.banners.findIndex((b: any) => b.id === banner.id);
  if (idx > -1) {
    currentDB.banners[idx] = { ...currentDB.banners[idx], ...banner };
  } else {
    // Production Mode - Serve prebuilt assets
    const distPath = path.join(__dirname, "dist");
    console.log("Serving static from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  saveDB(currentDB);
  redis.del('redis:banners');
  logAdminAction('Save Banner', `Operator updated banner: "${banner.title || 'untitled'}" (Target: ${banner.destination_url || 'N/A'})`, req);
  res.json({ success: true, banner });
});

app.delete('/api/banners/:id', (req, res) => {
  if (currentDB.banners) {
    currentDB.banners = currentDB.banners.filter((b: any) => b.id !== req.params.id);
    saveDB(currentDB);
    redis.del('redis:banners');
    logAdminAction('Remove Banner', `Operator deleted banner sequence reference: ${req.params.id}`, req);
  }
  res.json({ success: true });
});

// Products API
app.get('/api/products', async (req, res) => {
  const cacheKey = 'redis:products';
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  const data = currentDB.products;
  await redis.setex(cacheKey, 600, JSON.stringify(data));
  res.json(data);
});

app.get('/api/products/:id', async (req, res) => {
  const pId = req.params.id;
  const cacheKey = `redis:product:${pId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  const p = currentDB.products.find(item => item.id === pId);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  await redis.setex(cacheKey, 600, JSON.stringify(p));
  res.json(p);
});

// Add / Update Product for admin dashboard CRUD
app.post('/api/products', (req, res) => {
  const productData = req.body;
  const isEdit = !!productData.id;
  if (!productData.id) {
    productData.id = 'prod-' + Date.now();
  }
  
  const existingIdx = currentDB.products.findIndex(p => p.id === productData.id);
  if (existingIdx > -1) {
    currentDB.products[existingIdx] = { ...currentDB.products[existingIdx], ...productData };
  } else {
    // Production Mode - Serve prebuilt assets
    const distPath = path.join(__dirname, "dist");
    console.log("Serving static from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  
  saveDB(currentDB);
  redis.del('redis:products');
  redis.del(`redis:product:${productData.id}`);
  redis.flushall(); // clear any cached searches
  logAdminAction(isEdit ? 'Product Revised' : 'Product Created', `Bespoke CRUD: Saved product "${productData.name}" (SKU: ${productData.sku || 'N/A'}, Price: ${productData.price} BDT)`, req);
  res.json({ success: true, product: productData });
});

app.delete('/api/products/:id', (req, res) => {
  const targetProd = currentDB.products.find(p => p.id === req.params.id);
  currentDB.products = currentDB.products.filter(p => p.id !== req.params.id);
  saveDB(currentDB);
  redis.del('redis:products');
  redis.del(`redis:product:${req.params.id}`);
  redis.flushall();
  logAdminAction('Product Purged', `Bespoke CRUD: Removed product item "${targetProd?.name || req.params.id}" (SKU: ${targetProd?.sku || 'N/A'})`, req);
  res.json({ success: true });
});

// Categories API
app.get('/api/categories', async (req, res) => {
  const cacheKey = 'redis:categories';
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  const data = currentDB.categories;
  await redis.setex(cacheKey, 600, JSON.stringify(data));
  res.json(data);
});

app.post('/api/categories', (req, res) => {
  const cat = req.body;
  const isEdit = !!cat.id;
  if (!cat.id) cat.id = 'cat-' + Date.now();
  const idx = currentDB.categories.findIndex(c => c.id === cat.id);
  if (idx > -1) currentDB.categories[idx] = cat;
  else currentDB.categories.push(cat);
  saveDB(currentDB);
  redis.del('redis:categories');
  logAdminAction(isEdit ? 'Category Modified' : 'Category Created', `Catalog structure: Saved category "${cat.name}"`, req);
  res.json({ success: true, category: cat });
});

app.delete('/api/categories/:id', (req, res) => {
  const targetCat = currentDB.categories.find(c => c.id === req.params.id);
  currentDB.categories = currentDB.categories.filter(c => c.id !== req.params.id);
  saveDB(currentDB);
  redis.del('redis:categories');
  logAdminAction('Category Purged', `Catalog structure: Removed category "${targetCat?.name || req.params.id}"`, req);
  res.json({ success: true });
});

// Verified sessions store
const verifiedSessions = new Map<string, { email: string; phone: string; expiresAt: number }>();

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return typeof phone === 'string' && cleanPhone.length >= 10 && cleanPhone.length <= 15;
}

const normalizePhone = (p: string) => p.replace(/\D/g, '');

const isPhoneMatch = (p1: string, p2: string) => {
  const n1 = normalizePhone(p1);
  const n2 = normalizePhone(p2);
  if (!n1 || !n2) return false;
  return n1 === n2 || n1.slice(-10) === n2.slice(-10);
};

// POST /verify-user and /api/verify-user
app.post(['/api/verify-user', '/verify-user'], (req, res) => {
  const { email, phone } = req.body || {};
  
  if (!email || !phone) {
    return res.status(400).json({ success: false, error: 'Email and Phone Number are required.' });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }
  
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid phone number (at least 10 digits).' });
  }
  
  // Find matching orders in database to prove user identity/order occupancy
  const cleanedEmail = email.trim().toLowerCase();
  const matched = currentDB.orders.some((ord: any) => 
    ord.customer_email && 
    ord.customer_email.trim().toLowerCase() === cleanedEmail &&
    isPhoneMatch(ord.customer_phone, phone)
  );
  
  if (!matched) {
    return res.status(404).json({ 
      success: false, 
      error: 'No registered orders found matching this Email and Phone combination.' 
    });
  }
  
  // Generate tracking session token
  const token = 'ses-' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  verifiedSessions.set(token, {
    email: cleanedEmail,
    phone: phone.trim(),
    expiresAt: Date.now() + 3600000 // 1 hour token validity
  });
  
  res.json({ success: true, token, email: cleanedEmail, phone: phone.trim() });
});

// GET /user-orders and /api/user-orders
app.get(['/api/user-orders', '/user-orders'], (req, res) => {
  const authHeader = req.headers.authorization || '';
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Production Mode - Serve prebuilt assets
    const distPath = path.join(__dirname, "dist");
    console.log("Serving static from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized access. Verification session token required.' });
  }
  
  const session = verifiedSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) verifiedSessions.delete(token); // Clean up expired
    return res.status(401).json({ success: false, error: 'Your tracking session has expired or is invalid. Please verify again.' });
  }
  
  // Retrieve orders matching session email + phone
  const matchedOrders = currentDB.orders.filter((ord: any) => 
    ord.customer_email && 
    ord.customer_email.trim().toLowerCase() === session.email &&
    isPhoneMatch(ord.customer_phone, session.phone)
  );
  
  res.json({ success: true, orders: matchedOrders });
});

// Orders API (GET /api/orders and GET /orders) with email+phone filtering and validation
app.get(['/api/orders', '/orders'], (req, res) => {
  const email = req.query.email as string;
  const phone = req.query.phone as string;
  
  if (email !== undefined || phone !== undefined) {
    if (!email || !phone) {
      return res.status(400).json({ success: false, error: 'Both email and phone query parameters must be provided.' });
    }
    
    if (!isValidEmail(email) || !isValidPhone(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid email or phone format.' });
    }
    
    const matched = currentDB.orders.filter((ord: any) => 
      ord.customer_email && 
      ord.customer_email.trim().toLowerCase() === email.trim().toLowerCase() &&
      isPhoneMatch(ord.customer_phone, phone)
    );
    
    return res.json(matched);
  }
  
  // Standard all orders list (internal/admin panel fallback)
  res.json(currentDB.orders);
});

// Create Order (bKash or WhatsApp redirect prep)
app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  const newOrder: BackendOrder = {
    id: 'ord-' + Math.floor(1000 + Math.random() * 9000),
    user_id: orderData.user_id || undefined,
    customer_email: orderData.customer_email || undefined,
    customer_name: orderData.customer_name || 'Anonymous Guest',
    customer_phone: orderData.customer_phone || '',
    customer_address: orderData.customer_address || '',
    status: orderData.status || 'pending',
    subtotal: Number(orderData.subtotal) || 0,
    discount: Number(orderData.discount) || 0,
    shipping: Number(orderData.shipping) || 200,
    total: Number(orderData.total) || 0,
    payment_status: orderData.payment_status || 'unpaid',
    payment_method: orderData.payment_method || 'whatsapp',
    transaction_id: orderData.transaction_id || '',
    proof_image: orderData.proof_image || '',
    items: orderData.items || [],
    created_at: new Date().toISOString()
  };

  currentDB.orders.unshift(newOrder);
  saveDB(currentDB);
  res.json({ success: true, order: newOrder });
});

// Update Order status / verification
app.post('/api/orders/:id/status', (req, res) => {
  const { status, payment_status } = req.body;
  const idx = currentDB.orders.findIndex(ord => ord.id === req.params.id);
  if (idx > -1) {
    const oldStatus = currentDB.orders[idx].status;
    const oldPaymentStatus = currentDB.orders[idx].payment_status;

    if (status) {
      currentDB.orders[idx].status = status;
      if (status === 'delivered') {
        currentDB.orders[idx].delivered_at = new Date().toISOString();
      }
    }
    if (payment_status) currentDB.orders[idx].payment_status = payment_status;
    
    saveDB(currentDB);
    logAdminAction('Order Status Modified', `Order pipeline: Updated Order #${req.params.id} -> Status: ${status || 'no change'}, Payment: ${payment_status || 'no change'}`, req);

    const updatedOrder = currentDB.orders[idx];
    const customerPhone = updatedOrder.customer_phone;
    const orderId = updatedOrder.id;

    // Check if anything actually modified to trigger notifications
    if ((status && oldStatus !== status) || (payment_status && oldPaymentStatus !== payment_status)) {
      if (!currentDB.notifications) {
        currentDB.notifications = [];
      }
      
      let title = '';
      let title_bn = '';
      let body = '';
      let body_bn = '';
      let notifType: 'order' | 'promotion' = 'order';

      if (status === 'confirmed') {
        title = `Order Confirmed: #${orderId}`;
        title_bn = `অর্ডার নিশ্চিত করা হয়েছে: #${orderId}`;
        body = `Your order #${orderId} has been successfully verified and confirmed.`;
        body_bn = `আপনার অর্ডার #${orderId} সফলভাবে নিশ্চিত করা হয়েছে।`;
      } else if (status === 'processing') {
        title = `Bespoke Tailoring Commenced: #${orderId}`;
        title_bn = `পণ্য প্রস্তুতি চলছে: #${orderId}`;
        body = `We are now preparing and wrapping your selected master artifacts.`;
        body_bn = `আপনার অর্ডারকৃত প্রিমিয়াম সামগ্রীটি যত্ন সহকারে প্রস্তুত ও প্যাকেজিং করা হচ্ছে।`;
      } else if (status === 'shipped') {
        title = `Artifacts Dispatched: #${orderId}`;
        title_bn = `অর্ডার শিপড করা হয়েছে: #${orderId}`;
        body = `Your order #${orderId} has been handed over to Secure Cargo Courier.`;
        body_bn = `আপনার অর্ডার #${orderId} আমাদের বিশেষ এক্সপ্রেস কুরিয়ারে শিপমেন্ট করা হয়েছে।`;
      } else if (status === 'delivered') {
        title = `Relics Hand-delivered Correctly: #${orderId}`;
        title_bn = `অর্ডার ডেলিভারি সম্পূর্ণ: #${orderId}`;
        body = `Exquisite delivery complete for Order #${orderId}. Welcome to the JIJARELL elite inner circle!`;
        body_bn = `অর্ডার #${orderId} সফলভাবে আপনার ঠিকানায় ডেলিভারি সম্পন্ন হয়েছে।`;
      } else if (status === 'cancelled') {
        title = `Order Cancelled/Voided: #${orderId}`;
        title_bn = `অর্ডার বাতিল করা হয়েছে: #${orderId}`;
        body = `Transaction sequence #${orderId} from JIJARELL network has been cancelled.`;
        body_bn = `আপনার সিকিউরড ট্রানজেকশন #${orderId} জেজারেল সিস্টেমে বাতিল করা হয়েছে।`;
      } else if (payment_status === 'paid' && oldPaymentStatus !== 'paid') {
        title = `bKash Payment Verified: #${orderId}`;
        title_bn = `বিকাশ পেমেন্ট ভেরিফাইড: #${orderId}`;
        body = `Ledger financial audit cleared for Order #${orderId}. Thank you for your payment.`;
        body_bn = `আপনার ট্রানজেকশন বিকাশ পেমেন্ট সঠিক পাওয়া গেছে এবং অর্ডারটি ভেরিফাই করা হয়েছে।`;
      }

      if (title) {
        const newNotification = {
          id: 'not-' + Date.now() + '-' + Math.floor(Math.random() * 100),
          type: notifType,
          title,
          title_bn,
          body,
          body_bn,
          is_global: false,
          customer_phone: customerPhone,
          created_at: new Date().toISOString()
        };
        currentDB.notifications.unshift(newNotification);
        broadcastNotification(newNotification);

        // Simulated Email Notification Generation
        if (!currentDB.emails) {
          currentDB.emails = [];
        }

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e2df; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="background-color: #111111; padding: 24px; text-align: center; border-bottom: 2px solid #C5A880;">
              <p style="font-size: 21px; font-weight: 900; letter-spacing: 5px; color: #ffffff; text-transform: uppercase; margin: 0;">JIJARELL</p>
              <p style="font-size: 9px; letter-spacing: 3px; color: #a58e6c; text-transform: uppercase; margin: 4px 0 0 0;">Geneva Premium Marketplace</p>
            </div>
            <div style="padding: 32px 24px; color: #1c1917; line-height: 1.6;">
              <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1.5px; color: #1c1917; border-left: 3px solid #C5A880; padding-left: 10px;">Security & Logistics Report</h2>
              <p style="font-size: 13px; margin-bottom: 20px; color: #44403c;">Dear <strong>${updatedOrder.customer_name}</strong>,</p>
              <p style="font-size: 13px; margin-bottom: 24px; color: #44403c;">Your high-value purchase order has been updated in our central ledger database.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; background-color: #fafaf9; border-radius: 8px; border: 1px solid #f5f5f4;">
                <tr style="border-bottom: 1px solid #e7e5e4;">
                  <td style="padding: 12px 16px; font-weight: bold; color: #78716c;">Order Reference:</td>
                  <td style="padding: 12px 16px; text-align: right; font-weight: bold; font-family: monospace; color: #1c1917;">#${orderId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e7e5e4;">
                  <td style="padding: 12px 16px; font-weight: bold; color: #78716c;">Logistics Status:</td>
                  <td style="padding: 12px 16px; text-align: right; font-weight: bold; text-transform: uppercase; color: #b45309;">${(status || updatedOrder.status).toUpperCase()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e7e5e4;">
                  <td style="padding: 12px 16px; font-weight: bold; color: #78716c;">Outstanding Ledger:</td>
                  <td style="padding: 12px 16px; text-align: right; font-weight: bold; color: #1c1917;">${updatedOrder.total.toLocaleString()} BDT</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: bold; color: #78716c;">Secured Dispatch Destination:</td>
                  <td style="padding: 12px 16px; text-align: right; font-size: 11px; color: #44403c;">${updatedOrder.customer_address}</td>
                </tr>
              </table>

              <div style="background-color: #f7f6f2; border-left: 4px solid #C5A880; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                <p style="font-size: 12px; font-weight: bold; margin: 0 0 6px 0; color: #1c1917;">${title}</p>
                <p style="font-size: 12px; margin: 0; color: #57534e;">${body}</p>
              </div>

              <p style="font-size: 12px; margin-bottom: 8px; color: #78716c;">This transmission updates your registered mobile record: <strong>${customerPhone}</strong>. You may log in directly to your client terminal using this phone number at any time to monitor dispatch status live.</p>
            </div>
            <div style="background-color: #faf9f6; padding: 24px; text-align: center; font-size: 10px; color: #a8a29e; border-top: 1px solid #f5f5f4;">
              <p style="margin: 0; font-weight: bold; letter-spacing: 1px; color: #57534e;">JIJARELL GENÈVE ENTERPRISE LOGISTICS</p>
              <p style="margin: 4px 0 0 0;">This is an automated production billing dispatch system check. Do not reply to this email.</p>
            </div>
          </div>
        `;

        const newEmail = {
          id: 'eml-' + Date.now() + '-' + Math.floor(Math.random() * 100),
          to: `${updatedOrder.customer_name.toLowerCase().replace(/[^a-z]+/g, '') || 'client'}@luxurymail.com`,
          subject: `[JIJARELL] Order Update notification - #${orderId}`,
          bodyHtml: emailHtml,
          customer_phone: customerPhone,
          created_at: new Date().toISOString()
        };
        currentDB.emails.unshift(newEmail);
      }
    }

    saveDB(currentDB);
    return res.json({ success: true, order: currentDB.orders[idx] });
  }
  res.status(404).json({ error: 'Order not found' });
});

// GET real-time SSE stream for notifications
app.get('/api/notifications/stream', (req, res) => {
  const phone = req.query.phone as string;
  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : undefined;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Client connected event pushes initial status immediately
  res.write(`data: ${JSON.stringify({ type: 'connected_handshake', timestamp: new Date().toISOString() })}\n\n`);

  const clientId = Date.now().toString() + Math.random().toString(36).substring(2, 5);
  const newClient = {
    id: clientId,
    phone: cleanPhone,
    response: res
  };

  sseClients.push(newClient);
  console.log(`[SSE Client connected] ID: ${clientId} tracking Phone: ${cleanPhone || 'ALL'}. Total clients: ${sseClients.length}`);

  const keepAliveInterval = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    sseClients = sseClients.filter(c => c.id !== clientId);
    console.log(`[SSE Client disconnected] ID: ${clientId}. Total clients: ${sseClients.length}`);
  });
});

app.get('/api/performance/stats', (req, res) => {
  res.json({
    cache: redis.getStats(),
    sseClientsCount: sseClients.length,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/performance/flush', (req, res) => {
  redis.flushall();
  res.json({ success: true, message: "Redis cache successfully flushed!" });
});

app.post('/api/performance/simulate-notif', (req, res) => {
  const { type, title, title_bn, body, body_bn } = req.body;
  if (!currentDB.notifications) {
    currentDB.notifications = [];
  }
  const simulated = {
    id: 'not-sim-' + Date.now() + '-' + Math.floor(Math.random() * 100),
    type: type || 'promotion',
    title: title || 'Simulated Exclusive Notification',
    title_bn: title_bn || 'সিমুলেটেড বিশেষ অফার',
    body: body || 'Enjoy bespoke crafted access on top catalog designs.',
    body_bn: body_bn || 'আমাদের প্রধান পণ্যসমূহে বিশেষ অফার উপভোগ করুন।',
    is_global: true,
    created_at: new Date().toISOString()
  };
  currentDB.notifications.unshift(simulated);
  saveDB(currentDB);
  broadcastNotification(simulated);
  res.json({ success: true, notification: simulated });
});

app.get('/api/search', async (req, res) => {
  const q = (req.query.q as string || '').trim().toLowerCase();
  if (!q) {
    return res.json([]);
  }

  const cacheKey = `redis:search:${q}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const words = q.split(/\s+/);
  const matched = currentDB.products.filter(p => {
    if (!p.is_active) return false;
    return words.every(word => 
      p.name.toLowerCase().includes(word) ||
      p.brand.toLowerCase().includes(word) ||
      p.description.toLowerCase().includes(word) ||
      p.sku.toLowerCase().includes(word)
    );
  });

  await redis.setex(cacheKey, 600, JSON.stringify(matched));
  res.json(matched);
});

// GET notifications list
app.get('/api/notifications', (req, res) => {
  const phone = req.query.phone as string;
  const list = currentDB.notifications || [];
  if (phone) {
    const cleanSearch = phone.replace(/\D/g, '').slice(-10);
    const filtered = list.filter(n => {
      if (n.is_global) return true;
      if (!n.customer_phone) return false;
      const cleanPhone = n.customer_phone.replace(/\D/g, '').slice(-10);
      return cleanSearch && cleanPhone && cleanPhone === cleanSearch;
    });
    return res.json(filtered);
  }
  res.json(list.filter(n => n.is_global));
});

// GET email simulation inbox
app.get('/api/emails', (req, res) => {
  const phone = req.query.phone as string;
  const list = currentDB.emails || [];
  if (phone) {
    const cleanSearch = phone.replace(/\D/g, '').slice(-10);
    const filtered = list.filter(e => {
      if (!e.customer_phone) return false;
      const cleanPhone = e.customer_phone.replace(/\D/g, '').slice(-10);
      return cleanSearch && cleanPhone && cleanPhone === cleanSearch;
    });
    return res.json(filtered);
  }
  res.json(list);
});

// Coupons API
app.get('/api/coupons', (req, res) => {
  res.json(currentDB.coupons);
});

app.post('/api/coupons', (req, res) => {
  const coup = req.body;
  const isEdit = !!coup.id;
  if (!coup.id) coup.id = 'coup-' + Date.now();
  const idx = currentDB.coupons.findIndex(c => c.id === coup.id);
  if (idx > -1) currentDB.coupons[idx] = coup;
  else currentDB.coupons.push(coup);
  saveDB(currentDB);
  logAdminAction(isEdit ? 'Coupon Modified' : 'Coupon Created', `Discounts: Saved coupon code "${coup.code}" (${coup.discount_value}${coup.discount_type === 'percentage' ? '%' : ' BDT'})`, req);
  res.json({ success: true, coupon: coup });
});

app.delete('/api/coupons/:id', (req, res) => {
  const targetCoup = currentDB.coupons.find(c => c.id === req.params.id);
  currentDB.coupons = currentDB.coupons.filter(c => c.id !== req.params.id);
  saveDB(currentDB);
  logAdminAction('Coupon Purged', `Discounts: Removed coupon code "${targetCoup?.code || req.params.id}"`, req);
  res.json({ success: true });
});

app.post('/api/coupons/validate', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Promo code is required' });
  const coupon = currentDB.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!coupon) return res.status(400).json({ error: 'Invalid coupon code.' });
  res.json({ success: true, coupon });
});

// Reviews API
app.get('/api/reviews', (req, res) => {
  const { product_id } = req.query;
  if (product_id) {
    const filtered = currentDB.reviews.filter(r => r.product_id === product_id);
    return res.json(filtered);
  }
  res.json(currentDB.reviews);
});

app.post('/api/reviews', (req, res) => {
  const r = req.body;
  const newRev = {
    id: r.id || 'rev-' + Date.now(),
    product_id: r.product_id,
    order_id: r.order_id || '',
    customer_phone: r.customer_phone || '',
    user_name: r.user_name || 'Verified Collector',
    rating: Number(r.rating) || 5,
    review: r.review || '',
    created_at: new Date().toISOString(),
    admin_reply: '',
    admin_reply_at: ''
  };
  
  if (!currentDB.reviews) {
    currentDB.reviews = [];
  }
  currentDB.reviews.unshift(newRev);

  // Recalculate average rating of associated product
  const prodRev = currentDB.reviews.filter(rev => rev.product_id === r.product_id);
  const avg = prodRev.reduce((acc, current) => acc + current.rating, 0) / prodRev.length;
  
  const pIdx = currentDB.products.findIndex(p => p.id === r.product_id);
  if (pIdx > -1) {
    currentDB.products[pIdx].rating = Number(avg.toFixed(1));
    currentDB.products[pIdx].reviewsCount = prodRev.length;
  }

  saveDB(currentDB);
  res.json({ success: true, review: newRev });
});

// Admin Review Reply API
app.post('/api/reviews/:id/reply', (req, res) => {
  const { reply } = req.body;
  const id = req.params.id;
  
  if (!reply) {
    return res.status(400).json({ error: 'Reply content is required' });
  }
  
  const idx = currentDB.reviews.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }
  
  currentDB.reviews[idx].admin_reply = reply;
  currentDB.reviews[idx].admin_reply_at = new Date().toISOString();
  
  // Trigger notification for customer if phone number is attached to the review or linked order
  const review = currentDB.reviews[idx];
  let parentOrder = null;
  if (review.order_id) {
    parentOrder = currentDB.orders.find(o => o.id === review.order_id);
  }
  
  const phone = review.customer_phone || (parentOrder ? parentOrder.customer_phone : '');
  
  if (phone) {
    if (!currentDB.notifications) {
      currentDB.notifications = [];
    }
    
    const newNotification = {
      id: 'not-' + Date.now() + '-' + Math.floor(Math.random() * 105),
      type: 'order' as const,
      title: 'Diamond Concierge Responded to Your Review',
      title_bn: 'আপনার পণ্য রিভিউ-এর উত্তর দেওয়া হয়েছে',
      body: `Review reply published: "${reply.slice(0, 60)}${reply.length > 60 ? '...' : ''}"`,
      body_bn: `রিভিউ উত্তর প্রকাশিত হয়েছে: "${reply.slice(0, 60)}${reply.length > 60 ? '...' : ''}"`,
      is_global: false,
      customer_phone: phone,
      created_at: new Date().toISOString()
    };
    currentDB.notifications.unshift(newNotification);
  }
  
  saveDB(currentDB);
  logAdminAction('Review Replied', `Diamond Concierge published reply to Review #${id}.`, req);
  res.json({ success: true, review: currentDB.reviews[idx] });
});

// Blogs API
app.get('/api/blogs', (req, res) => {
  res.json(currentDB.blogs);
});

app.post('/api/blogs', (req, res) => {
  const b = req.body;
  if (!b.id) b.id = 'blog-' + Date.now();
  const idx = currentDB.blogs.findIndex(x => x.id === b.id);
  if (idx > -1) currentDB.blogs[idx] = b;
  else currentDB.blogs.push(b);
  saveDB(currentDB);
  res.json({ success: true, blog: b });
});

app.delete('/api/blogs/:id', (req, res) => {
  if (currentDB.blogs) {
    currentDB.blogs = currentDB.blogs.filter((b: any) => b.id !== req.params.id);
    saveDB(currentDB);
    logAdminAction('Remove Journal Post', `Operator archived Luxury Journal article: ${req.params.id}`, req);
  }
  res.json({ success: true });
});

// ADVANCED AI SEARCH & MULTIMODAL CONTEXT ENDPOINT
app.post('/api/ai-search', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Search prompt is required" });

  const cacheKey = `redis:search_ai:${prompt.trim().toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  try {
    const ai = getGeminiClient();
    
    // Inject current active catalog as contextual grounding knowledge
    const productCatalogStr = currentDB.products
       .filter(p => p.is_active)
       .map(p => `ID: ${p.id}, Name: ${p.name}, Brand: ${p.brand}, Price: ${p.price} BDT, Sale Price: ${p.sale_price ? p.sale_price + ' BDT' : 'None'}, Stock: ${p.stock}, Description: ${p.description}, 3D Type: ${p.type3d}`)
       .join('\n---\n');

    const systemInstruction = `You are the JIJARELL Premium Shop Assistant. Below is our real-time luxury catalog of products:
${productCatalogStr}

The user is doing light natural language searching. Help them locate exactly the products they are asking for (e.g. matching sizes, brands, category types, price bounds). 
Analyze their price bounds carefully. Example: "under 50000" means search files pricing < 50000 BDT.
Provide a clear, brief greeting and list matching products.
ALWAYS return a valid JSON format in the final response (inside markdown block or as text) so the frontend can display matching item cards directly.
The JSON payload must look EXACTLY as follows:
{
  "explanation": "Brief human explanation why these matches relate to their criteria",
  "matchedProductIds": ["prod-1", "prod-2"]
}
Only output the JSON object structure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: `Search Criteria: ${prompt}` }] }],
      config: {
        systemInstruction,
        // Enforce returning a JSON
        responseMimeType: "application/json"
      }
    });

    const text = response.text || '{}';
    const resultObj = JSON.parse(text);
    await redis.setex(cacheKey, 1800, JSON.stringify(resultObj)); // 30 minutes
    res.json(resultObj);

  } catch (err: any) {
    console.error('AI Search Error:', err);
    // fallback keyword matching algorithm
    const keywordMatchIds: string[] = [];
    const lower = prompt.toLowerCase();
    currentDB.products.forEach(p => {
      if (
        lower.includes(p.name.toLowerCase()) || 
        lower.includes(p.brand.toLowerCase()) || 
        lower.includes(p.type3d.toLowerCase()) ||
        lower.includes(p.description.toLowerCase())
      ) {
        keywordMatchIds.push(p.id);
      }
    });
    
    const fallbackObj = {
      explanation: "I scanned our collections for standard metadata keywords matching your prompt.",
      matchedProductIds: keywordMatchIds
    };
    await redis.setex(cacheKey, 300, JSON.stringify(fallbackObj)); // cache fallback too for 5 mins
    res.json(fallbackObj);
  }
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message payload is required' });
    }

    // Prepare contents array with correct role properties for Gemini SDK
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const item of history) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Provide context of items to assist recommendations
    const itemsContext = currentDB.products
      .filter(p => p.is_active)
      .map(p => `- ${p.name} (Brand: ${p.brand}): Price: ${p.price} BDT. SKU: ${p.sku}. Stock: ${p.stock}.${p.sale_price ? ` Sale Price: ${p.sale_price} BDT.` : ''} Description: ${p.description}`)
      .join('\n');

    // Provide context of orders to answer order tracking
    const ordersContext = currentDB.orders
      .map(o => `- Order ID: ${o.id}, Customer: ${o.customer_name}, Phone: ${o.customer_phone}, Address: ${o.customer_address}, Status: ${o.status}, Subtotal: ${o.subtotal} BDT, Discount: ${o.discount} BDT, Shipping: ${o.shipping} BDT, Total: ${o.total} BDT, Payment: ${o.payment_status}, Payment Method: ${o.payment_method}, Items: ${JSON.stringify(o.items)}`)
      .join('\n');

    // Prepare settings/FAQ details
    const settingsContext = `
Corporate Details & Contacts:
- Corporate Address: ${currentDB.settings.corporate_address}
- Corporate Email: ${currentDB.settings.corporate_email}
- WhatsApp Number: ${currentDB.settings.whatsapp_number}
- Official Phone / bKash Number: ${currentDB.settings.bkash_number}
- Back-up Delivery Support: ${currentDB.settings.delivery_contact_number}
- WhatsApp Link: ${currentDB.settings.whatsapp_link}
- Facebook Link: ${currentDB.settings.facebook_link}
- Instagram Link: ${currentDB.settings.instagram_link}

Frequently Asked Questions (Shop Information):
1. What payment methods are supported?
Customers can pay securely using bkash personal send money (number: ${currentDB.settings.bkash_number}). Once done, they submit parent bKash Trx ID in the checkout. Alternatively, order via WhatsApp redirection checkout is fully supported for manual/direct transfers with our team (WhatsApp: ${currentDB.settings.whatsapp_number}).
2. What are the delivery times and shipping costs?
- Elite White-glove Shipping inside Dhaka and Bangladesh is flat 200 BDT.
- Order processing is 1 to 2 business days. Delivery represents premium, hyper-safe packaging.
3. How do I contact help/customer support?
- Support Hotline/bKash: ${currentDB.settings.bkash_number} or Delivery Hot: ${currentDB.settings.delivery_contact_number}
- WhatsApp chat line: ${currentDB.settings.whatsapp_number} / Link: ${currentDB.settings.whatsapp_link}
- Corporate Email: ${currentDB.settings.corporate_email}
- Administrative passwords/credential systems are exclusive to operator roles.
`;

    const fullInstruction = `You are JIJARELL Assistant, the official shopping assistant for the JIJARELL Genève premium marketplace. Support English, Bangla and Banglish languages fluidly.

CRITICAL BEHAVIOR FIX MANDATES:
1. PRIORITIZE KNOWLEDGE: You MUST strictly prioritize the official Shop FAQs, active Product Data, Order Data, and Corporate/Website Information provided below when formulating your response before using general AI knowledge.
2. ZERO HALLUCINATION RULES:
   - NEVER invent, synthesize, create, or assume any products, prices, variants, description, or characteristics that are not listed in the Product Catalog below.
   - NEVER invent, synthesize, or imagine any order reference numbers, order items, tracking statuses, or customer names that do not exist in the Customer Orders list below.
   - NEVER guess or invent company parameters, addresses, payment detail processes, phone numbers, or corporate contacts not present in the corporate settings.
3. ABSENCE OF INFORMATION FALLBACK: If a requested product, order info, tracking code, shipping rate, or corporate fact is unavailable or not present in the datasets below, politely inform the customer that the details are currently unavailable in our systems and immediately offer official customer support contacts instead of guessing, making up, or simulating answers.
   - Support Contacts: WhatsApp (${currentDB.settings.whatsapp_number}), bKash/Phone (${currentDB.settings.bkash_number}), or corporate email (${currentDB.settings.corporate_email}).
4. NO SEARCH GROUNDING: Under no circumstances should you reference Google Search Grounding, Google Search, or live search, as that function has been completely deleted and shutdown.

Official Product Catalog (Only recommend or discuss products below):
${itemsContext}

Official Active Customer Orders (Only reference existing orders below for tracking):
${ordersContext}

Official Corporate Information and Shop FAQs:
${settingsContext}`;

    // STAGE 1 & 2: FAQ & Database Search Matches (No API key needed)
    const lowerMsg = message.toLowerCase().trim();
    let isHandled = false;
    let responseText = '';

    // Payment Keywords
    const paymentKeywords = [
      'payment', 'pay', 'how to pay', 'bkash', 'send money', 'price', 'charge', 'fee', 'taka', 'cost',
      'পেমেন্ট', 'বিকাশ', 'টাকা', 'লেনদেন', 'পরিশোধ', 'টাকায়', 'দাম', 'বিকাশে',
      'pement', 'sendmoney', 'payment system', 'payment option', 'pay option'
    ];

    // Delivery Keywords
    const deliveryKeywords = [
      'delivery', 'shipping', 'shipped', 'delivery charge', 'delivery cost', 'when', 'how long', 'time',
      'ডেলিভারি', 'শিপিং', 'খরচ', 'সময়', 'চার্জ', 'কবে', 'পাঠানো',
      'dilivery', 'shippin', 'order ashte', 'kobe pabo', 'shipping cost', 'shipping charge'
    ];

    // Support Keywords
    const supportKeywords = [
      'support', 'help', 'contact', 'phone', 'email', 'whatsapp', 'address', 'location',
      'সাহায্য', 'হেল্প', 'যোগাযোগ', 'ফোন', 'ঠিকানা', 'অফিস', 'হোয়াটসঅ্যাপ',
      'support contact', 'help support', 'helpline', 'whatsapp link', 'email us', 'office location'
    ];

    if (paymentKeywords.some(kw => lowerMsg.includes(kw))) {
      isHandled = true;
      responseText = `**JIJARELL Assistant [Official Shop FAQ Mode]**
   
* **English:** JIJARELL Genève supports several secure payment channels. You can pay seamlessly via bKash Personal Send Money to our official number: **${currentDB.settings.bkash_number}**. After completed, please input your parent bKash Transaction ID (Trx ID) during Checkout. Redirection checkout via WhatsApp is also fully supported for manual authorization: **${currentDB.settings.whatsapp_number}**.
* **বাংলা:** জেজারেল জেনীভ-এ নিরাপদ পেমেন্ট সম্পন্ন করতে আমাদের অফিশিয়াল বিকাশ নম্বরে (**${currentDB.settings.bkash_number}**) সেন্ড মানি করুন। ট্রানজেকশন সফল হলে আপনার বিকাশ ট্রানজেকশন আইডিটি (Trx ID) চেকআউটে প্রদান করুন। এছাড়া সরাসরি আলোচনা ও ম্যানুয়াল অর্ডারের জন্য হোয়াটসঅ্যাপ ব্যবহার করতে পারেন।
* **Banglish:** Apni khub shohoje amader official bKash personal number **${currentDB.settings.bkash_number}**-e 'Send Money' korte paren. Send money completed hole Checkout-er somoy bKash Trx ID submit korun. Manual order ba extra queries features er jonno amader direct WhatsApp-e (${currentDB.settings.whatsapp_number}) knock korte paren.`;
    } else if (deliveryKeywords.some(kw => lowerMsg.includes(kw))) {
      isHandled = true;
      responseText = `**JIJARELL Assistant [Official Shop FAQ Mode]**
   
* **English:** We provide premium White-glove Shipping inside Dhaka and across entire Bangladesh at a flat fee of **200 BDT**. Standard order processing takes 1 to 2 business days. Shipping represents high-value premium packaging engineered to protect tourbillons and fine leathers.
* **বাংলা:** জেজারেল-এ সমগ্র বাংলাদেশে দ্রুত ও শতভাগ সুরক্ষিত ডেলিভারি চার্জ ফ্ল্যাট **২০০ টাকা**। ১-২ কার্যদিবসের মধ্যে প্রতিটি অর্ডার প্রসেস করা হয়ে থাকে। আভিজাত্য বজায় রাখতে অত্যন্ত প্রিমিয়াম প্যাকেজিংয়ের মাধ্যমে এটি আপনার ঠিকানায় পৌঁছে দেওয়া হয়।
* **Banglish:** Amader premium delivery check flat delivery speed/charge **200 BDT** shara Bangladesh-e. Order process hote sadharonoto 1 theke 2 working days somoy lage. Hyper-secure aesthetic packaging e amader products deliver kora hoy jate mechanical or leather parts intact thake.`;
    } else if (supportKeywords.some(kw => lowerMsg.includes(kw))) {
      isHandled = true;
      responseText = `**JIJARELL Assistant [Official Shop FAQ Mode]**
   
* **English:** For immediate human support and help, connect directly via registered channels:
  - WhatsApp Chat: **${currentDB.settings.whatsapp_number}**
  - Corporate Office: **${currentDB.settings.corporate_address}**
  - Official Help & bKash line: **${currentDB.settings.bkash_number}**
  - Administrative Backup Support: **${currentDB.settings.delivery_contact_number}**
  - Email: **${currentDB.settings.corporate_email}**
* **বাংলা:** যেকোনো তাৎক্ষণিক সাহায্য বা বুকিংয়ের জন্য আমাদের কাস্টমার কেয়ারের সাথে নিচের মাধ্যমগুলোতে যোগাযোগ করুন:
  - হোয়াটসঅ্যাপ: **${currentDB.settings.whatsapp_number}**
  - প্রধান কার্যালয়: **${currentDB.settings.corporate_address}**
  - অফিশিয়াল হেল্পলাইন: **${currentDB.settings.bkash_number}**
  - জেনুইন সাপোর্ট ইমেইল: **${currentDB.settings.corporate_email}**
* **Banglish:** Amader help desk 24/7 client concierge support line is ready. Jekono urgent assist-er jonno call ba message din:
  - WhatsApp: **${currentDB.settings.whatsapp_number}**
  - bKash/Phone: **${currentDB.settings.bkash_number}**
  - Corporate Mail: **${currentDB.settings.corporate_email}**`;
    }

    // STAGE 2: Direct Database Search (Order Tracking ID or Product matches)
    if (!isHandled) {
      const orderIdRegex = /ord-\d+/i;
      const regexMatch = lowerMsg.match(orderIdRegex);
      const isTrackingPrompt = lowerMsg.includes('track') || lowerMsg.includes('status') || lowerMsg.includes('কোথায়') || lowerMsg.includes('অর্ডার') || lowerMsg.includes('ট্র্যাক') || lowerMsg.includes('deliver');

      let foundOrder = null;
      if (regexMatch) {
        const matchedId = regexMatch[0].toLowerCase();
        foundOrder = currentDB.orders.find(o => o.id.toLowerCase() === matchedId);
      } else if (isTrackingPrompt) {
        const phoneRegex = /(01\d{9})/g;
        const phoneMatch = lowerMsg.match(phoneRegex);
        if (phoneMatch) {
          const ph = phoneMatch[0];
          const matchingOrders = currentDB.orders.filter(o => o.customer_phone.includes(ph));
          if (matchingOrders.length > 0) {
            foundOrder = matchingOrders[matchingOrders.length - 1]; // recent latest
          }
        }
      }

      if (foundOrder) {
        isHandled = true;
        const itemsStr = foundOrder.items.map((it: any) => `- ${it.name} (${it.variant_size || ''} / ${it.variant_color || ''}) x${it.quantity}`).join('\n');
        responseText = `**JIJARELL Assistant [Official Core Ledger Database Sync]**

* **English:** 
  - **Order Reference:** #${foundOrder.id.toUpperCase()}
  - **Logistics Dispatch Status:** ${foundOrder.status.toUpperCase()}
  - **Outstanding Ledger:** ${foundOrder.total} BDT
  - **Registered Customer:** ${foundOrder.customer_name}
  - **Phone Record:** ${foundOrder.customer_phone}
  - **Dispatch Destination:** ${foundOrder.customer_address}
  - **Payment Verification:** ${foundOrder.payment_status.toUpperCase()} (${foundOrder.payment_method})
  - **Included Items:**
${itemsStr}

If you need any active rerouting, delivery delay check, or secure cancellation, please contact the dispatch hotline: **${currentDB.settings.delivery_contact_number}**.

* **বাংলা (অর্ডার ট্র্যাকিং তথ্য):**
  - **অর্ডার রেফারেন্স:** #${foundOrder.id.toUpperCase()}
  - **ডেলিভারি স্থিতি ও অগ্রগতি:** ${foundOrder.status === 'confirmed' ? 'নিশ্চিত করা হয়েছে (CONFIRMED)' : foundOrder.status === 'processing' ? 'পণ্য প্রস্তুতি চলছে (PROCESSING)' : foundOrder.status === 'shipped' ? 'ডেলিভারির জন্য পাঠানো হয়েছে (SHIPPED)' : 'বাতিল করা হয়েছে (CANCELLED)'}
  - **মোট পরিশোধযোগ্য বিল:** ${foundOrder.total} টাকা
  - **গ্রাহকের নাম:** ${foundOrder.customer_name}
  - **হ্যান্ডসেট ফোন রেকর্ড:** ${foundOrder.customer_phone}
  - **গন্তব্য ঠিকানা:** ${foundOrder.customer_address}
  - **পেমেন্ট স্থিতি:** ${foundOrder.payment_status === 'paid' ? 'পরিশোধিত (PAID)' : 'অপেক্ষমান (PENDING)'}

যেকোনো দ্রুত লজিস্টিকস প্রসেসিং বা পরিবর্তনের জন্য আমাদের কাস্টমার কেয়ার হটলাইনে সরাসরি যোগাযোগ করুন: **${currentDB.settings.delivery_contact_number}**।`;
      }
    }

    // STAGE 3 & 4: AI & Backup AI with Automated Key-switching and Failovers
    if (!isHandled) {
      const keysConfig = currentDB.settings?.api_keys || {};
      const apiAttempts: { key: string; provider: 'gemini' | 'deepseek' | 'openrouter' }[] = [];

      // Collect all configured Gemini keys
      const geminiKeys = keysConfig.gemini || [];
      geminiKeys.forEach((k: string) => {
        if (k.trim()) apiAttempts.push({ key: k.trim(), provider: 'gemini' });
      });
      // Fallback to default ENV main key if not present
      const defaultGemini = process.env.GEMINI_API_KEY;
      if (defaultGemini && !geminiKeys.some((gk: string) => gk.trim() === defaultGemini.trim())) {
        apiAttempts.push({ key: defaultGemini.trim(), provider: 'gemini' });
      }

      // Collect all configured DeepSeek keys
      const deepseekKeys = keysConfig.deepseek || [];
      deepseekKeys.forEach((k: string) => {
        if (k.trim()) apiAttempts.push({ key: k.trim(), provider: 'deepseek' });
      });

      // Collect all configured OpenRouter keys
      const openrouterKeys = keysConfig.openrouter || [];
      openrouterKeys.forEach((k: string) => {
        if (k.trim()) apiAttempts.push({ key: k.trim(), provider: 'openrouter' });
      });

      let aiResponseText = '';

      // Execute sequential failover attempts across all keys and systems
      for (let i = 0; i < apiAttempts.length; i++) {
        const attempt = apiAttempts[i];
        try {
          if (attempt.provider === 'gemini') {
            const customAi = new GoogleGenAI({
              apiKey: attempt.key,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build'
                }
              }
            });
            const response = await customAi.models.generateContent({
              model: 'gemini-3.5-flash',
              contents,
              config: {
                systemInstruction: fullInstruction,
                temperature: 0.7
              }
            });
            aiResponseText = response.text || '';
            if (aiResponseText) break; // success!
          } else if (attempt.provider === 'deepseek') {
            const dsHistory = [];
            if (history && Array.isArray(history)) {
              for (const item of history) {
                dsHistory.push({
                  role: item.role === 'user' ? 'user' : 'assistant',
                  content: item.text
                });
              }
            }
            const response = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${attempt.key}`
              },
              body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                  { role: 'system', content: fullInstruction },
                  ...dsHistory,
                  { role: 'user', content: message }
                ],
                temperature: 0.7
              }),
              signal: AbortSignal.timeout(10000) // 10s timeout
            });
            if (response.ok) {
              const data: any = await response.json();
              aiResponseText = data.choices?.[0]?.message?.content || '';
              if (aiResponseText) break; // success!
            }
          } else if (attempt.provider === 'openrouter') {
            const orHistory = [];
            if (history && Array.isArray(history)) {
              for (const item of history) {
                orHistory.push({
                  role: item.role === 'user' ? 'user' : 'assistant',
                  content: item.text
                });
              }
            }
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${attempt.key}`,
                'HTTP-Referer': 'https://ai.studio/build',
                'X-Title': 'JIJARELL Genève'
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: fullInstruction },
                  ...orHistory,
                  { role: 'user', content: message }
                ]
              }),
              signal: AbortSignal.timeout(12000) // 12s timeout
            });
            if (response.ok) {
              const data: any = await response.json();
              aiResponseText = data.choices?.[0]?.message?.content || '';
              if (aiResponseText) break; // success!
            }
          }
        } catch (err) {
          // Never propagate key/token status errors to client. Fall back cleanly as designed.
          console.warn(`Failover AI try failed for provider ${attempt.provider} key #${i}:`, err);
        }
      }

      // STAGE 5: All AI fail, fallback to Human Support directly.
      if (!aiResponseText) {
        responseText = `**JIJARELL Assistant [Concierge Priority Channel]**

* **English:** Our elite AI assistant node is currently undergoing a standard system optimization. For seamless white-glove service, our manual concierges are standing by to process your cart, discuss mechanics, and track your ledger entries across WhatsApp, Email and bKash directly:
  - **WhatsApp Hotline:** **${currentDB.settings.whatsapp_number}** / [Click to Message](${currentDB.settings.whatsapp_link || '#'})
  - **Direct Call & bKash Support:** **${currentDB.settings.bkash_number}**
  - **Corporate Liaison Mail:** **${currentDB.settings.corporate_email}**
  - **Administrative Dispatch Support:** **${currentDB.settings.delivery_contact_number}**

* **বাংলা (মানব সাহায্য চ্যানেল):**
  আমাদের এআই সিস্টেমে এই মুহূর্তে সার্ভার রক্ষণাবেক্ষণ চলছে। দ্রুত সহায়তা পেতে আমাদের কাস্টমার কেয়ার টিম সরাসরি প্রস্তুত রয়েছে:
  - **হোয়াটসঅ্যাপ চ্যাট:** **${currentDB.settings.whatsapp_number}**
  - **সরাসরি ফোন ও বিকাশ হেল্পলাইন:** **${currentDB.settings.bkash_number}**
  - **অফিশিয়াল সাপোর্ট মেইল:** **${currentDB.settings.corporate_email}**
  - **লজিস্টিকস ও পরিবর্তন সহায়তা:** **${currentDB.settings.delivery_contact_number}**`;
      }
  } catch (err: any) {
    // Graceful error fallback for any other general unhandled issues without leakage
    console.error('Core Chat API Error:', err);
    res.json({
      text: `**JIJARELL Assistant [Security Offline Override]**

Our premium digital lounges are currently working offline. Please reach our master operators on WhatsApp (**${currentDB.settings.whatsapp_number}**) or Call our hotline (**${currentDB.settings.bkash_number}**) to finalize your orders smoothly in English, বাংলা, or Banglish.`,
      groundingChunks: null
    });
  }
});

// Serve frontend assets
async function startServer() {
  console.log("[Boot] Synchronizing memory cache with live Firestore...");
  currentDB = await syncFromFirestore();
  console.log("[Boot] Firestore sync complete!");

  if (process.env.NODE_ENV !== 'production') {
    // Developer Mode - Import and apply Vite dev server middleware
    const viteModule = await eval('import("vite")');
    const { createServer: createViteServer } = viteModule;
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.join(resolvedDirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production Mode - Serve prebuilt assets
    const distPath = path.join(__dirname, "dist");
    console.log("Serving static from:", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server on boot:", err);
});

// Serve frontend assets
async function startServer() {
  console.log("[Boot] Synchronizing memory cache with live Firestore...");
  currentDB = await syncFromFirestore();
  console.log("[Boot] Firestore sync complete!");

  // Production Mode - Serve prebuilt assets
  const distPath = path.join(__dirname, "dist");
  console.log("Serving static from:", distPath);
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server on boot:", err);
});
