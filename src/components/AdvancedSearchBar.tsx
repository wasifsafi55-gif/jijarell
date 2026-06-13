import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Folder, Sparkles, Tag, ArrowRight, Mic } from 'lucide-react';
import { Product, Category } from '../types';
import { useLanguage } from './LanguageContext';

interface AdvancedSearchBarProps {
  products: Product[];
  categories: Category[];
  onNavigate: (path: string) => void;
  setActiveCategory: (catId: string) => void;
  setAiMatchedIds: (ids: string[] | null) => void;
  setAiSearchExplanation: (text: string | null) => void;
}

export default function AdvancedSearchBar({
  products,
  categories,
  onNavigate,
  setActiveCategory,
  setAiMatchedIds,
  setAiSearchExplanation,
}: AdvancedSearchBarProps) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Instantly apply search query on typing to main page collection grid
  useEffect(() => {
    if (!query.trim()) {
      setAiMatchedIds(null);
      setAiSearchExplanation(null);
      return;
    }

    const timer = setTimeout(() => {
      const results = getFilteredResults();
      setAiMatchedIds(results.map(p => p.id));
      setAiSearchExplanation(
        lang === 'bn' 
          ? `ইনস্ট্যান্ট অনুসন্ধান ফিল্টার: "${query}"` 
          : `Instant search filters for: "${query}"`
      );
    }, 150); // Debounce lightly

    return () => clearTimeout(timer);
  }, [query]);

  // Web Speech API Integration
  const [isListening, setIsListening] = useState(false);
  const [speechSupportError, setSpeechSupportError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechSupportError(null);
      };

      recognition.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        if (speechToText) {
          setQuery(speechToText);
          setIsOpen(true);
          
          // Auto filter products based on speech search input
          const matched = products.filter((p) => {
            if (!p.is_active) return false;
            return p.name.toLowerCase().includes(speechToText.toLowerCase()) ||
                   p.brand.toLowerCase().includes(speechToText.toLowerCase());
          });
          if (matched.length > 0) {
            setAiMatchedIds(matched.map((p) => p.id));
            setAiSearchExplanation(
              lang === 'bn' 
                ? `ভয়েস অনুসন্ধান: "${speechToText}"` 
                : `Voice Search: "${speechToText}"`
            );
          } else {
            setAiMatchedIds([]);
            setAiSearchExplanation(
              lang === 'bn' 
                ? `ভয়েস অনুসন্ধান: "${speechToText}" (কোনো পণ্য পাওয়া যায়নি)` 
                : `Voice Search: "${speechToText}" (No products found)`
            );
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechSupportError(
            lang === 'bn' 
              ? "মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি।" 
              : "Microphone permission denied."
          );
        } else if (event.error === 'no-speech') {
          setSpeechSupportError(
            lang === 'bn' 
              ? "কোনো শব্দ শোনা যায়নি। আবার চেষ্টা করুন।" 
              : "No voice heard. Please try again."
          );
        } else {
          setSpeechSupportError(
            lang === 'bn' 
              ? `ভয়েস ইনপুট ত্রুটি: ${event.error}` 
              : `Voice input error: ${event.error}`
          );
        }
        setTimeout(() => setSpeechSupportError(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [products, setAiMatchedIds, setAiSearchExplanation, lang]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupportError(
        lang === 'bn' 
          ? "এই ব্রাউজারে ভয়েস অনুসন্ধান সমর্থন করে না।" 
          : "Speech recognition is not supported in this browser."
      );
      setTimeout(() => setSpeechSupportError(null), 5000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Failed to start speech recognition:", err);
        }
      }
    }
  };

  // Popular searches from DB
  const popularSearches = ['Tourbillon', 'Oxford', 'Duffle', 'Gold', 'Titanium'];

  // Toggle dropdown on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Levenshtein distance for Typo Tolerance keyword matching
  const isTypoTolerantMatch = (word: string, target: string): boolean => {
    const w = word.toLowerCase().trim();
    const t = target.toLowerCase().trim();

    // Direct substring or exact match is always true is preferred
    if (t.includes(w) || w.includes(t)) return true;
    if (w.length < 3) return false; // Ignore short typos

    // Levenshtein Matrix formulation
    const matrix = Array.from({ length: w.length + 1 }, (_, i) =>
      Array.from({ length: t.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );

    for (let i = 1; i <= w.length; i++) {
      for (let j = 1; j <= t.length; j++) {
        if (w[i - 1] === t[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    const distance = matrix[w.length][t.length];
    // Allow 1 typo for length <= 5, 2 typos for longer words
    return distance <= (w.length <= 5 ? 1 : 2);
  };

  const getFilteredResults = (): Product[] => {
    if (!query.trim()) return [];

    const searchWords = query.toLowerCase().trim().split(/\s+/);
    return products.filter((p) => {
      if (!p.is_active) return false;

      // Find if any word in the search matches product properties with typo tolerance
      return searchWords.every((word) => {
        // Direct checks
        const nameLower = p.name.toLowerCase();
        const brandLower = p.brand.toLowerCase();
        const descLower = p.description.toLowerCase();
        const skuLower = p.sku.toLowerCase();

        if (nameLower.includes(word)) return true;
        if (brandLower.includes(word)) return true;
        if (descLower.includes(word)) return true;
        if (skuLower.includes(word)) return true;

        // Resolve Category Name
        const categoryName = categories.find((c) => c.id === p.category_id)?.name || '';
        const catLower = categoryName.toLowerCase();
        if (catLower.includes(word)) return true;

        // Special semantic routing for common searches
        // Men / Mens / Gentlemen / Male queries
        if (word === 'men' || word === 'mens' || word === "men's" || word === 'male' || word === 'gent' || word === 'gents') {
          // Check if category name represents shoes, boots, tourbillons or specific watches
          if (catLower.includes('watch') || catLower.includes('shoe') || catLower.includes('footwear') || nameLower.includes('oxford') || nameLower.includes('tourbillon') || descLower.includes('men') || descLower.includes('male') || descLower.includes('classic')) {
            return true;
          }
        }

        // Women / Womens / Ladies / Lady / girls / handbag queries
        if (word === 'women' || word === 'womens' || word === "women's" || word === 'lady' || word === 'ladies' || word === 'girl' || word === 'girls' || word === 'female') {
          if (catLower.includes('bag') || catLower.includes('leather') || nameLower.includes('bag') || nameLower.includes('duffle') || nameLower.includes('tote') || nameLower.includes('clutch') || descLower.includes('women') || descLower.includes('lady') || descLower.includes('ladies')) {
            return true;
          }
        }

        // Watches queries
        if (word === 'watch' || word === 'watches' || word === 'clock' || word === 'time' || word === 'quartz' || word === 'automatic') {
          if (catLower.includes('watch') || nameLower.includes('watch') || descLower.includes('dial') || descLower.includes('tourbillon') || descLower.includes('bezel') || descLower.includes('movement') || descLower.includes('chronograph')) {
            return true;
          }
        }

        // Bags / luggage / duffle queries
        if (word === 'bag' || word === 'bags' || word === 'duffle' || word === 'leather' || word === 'tote' || word === 'holdall' || word === 'luggage') {
          if (catLower.includes('bag') || catLower.includes('leather') || nameLower.includes('bag') || nameLower.includes('duffle') || nameLower.includes('oxford') || descLower.includes('strap') || descLower.includes('tanned') || descLower.includes('zipper')) {
            return true;
          }
        }

        // Typo tolerance checks (on space-split words in names/brands/categories)
        const nameWords = p.name.split(/\s+/);
        const brandWords = p.brand.split(/\s+/);
        const catWords = categoryName.split(/\s+/);

        const matchInName = nameWords.some((nw) => isTypoTolerantMatch(word, nw));
        const matchInBrand = brandWords.some((bw) => isTypoTolerantMatch(word, bw));
        const matchInCat = catWords.some((cw) => isTypoTolerantMatch(word, cw));

        return matchInName || matchInBrand || matchInCat;
      });
    });
  };

  const filtered = getFilteredResults();

  // Suggestions for empty results
  const getSuggestions = () => {
    // Similar/Popular products as fallback
    const popularProducts = products.filter((p) => p.featured && p.is_active).slice(0, 3);
    const relatedCats = categories.slice(0, 3);
    return { popularProducts, relatedCats };
  };

  const { popularProducts, relatedCats } = getSuggestions();

  const handleSelectProduct = (p: Product) => {
    setQuery('');
    setIsOpen(false);
    onNavigate(`/product/${p.slug}`);
  };

  const handlePopularSearchClick = (term: string) => {
    setQuery(term);
    setIsOpen(true);
  };

  const handleCategoryClick = (catId: string) => {
    setQuery('');
    setIsOpen(false);
    setActiveCategory(catId);
    setAiMatchedIds(null);
    setAiSearchExplanation(null);
    const catalogElement = document.getElementById('catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Apply live filter to main catalogue grid
    const matchedIds = filtered.map((p) => p.id);
    setAiMatchedIds(matchedIds);
    setAiSearchExplanation(`Instant filters matching search of: "${query}"`);
    setIsOpen(false);

    const catalogElement = document.getElementById('catalog-section');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm md:max-w-md mx-2 select-text">
      {/* Voice Warning Banner */}
      {speechSupportError && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-stone-900 border border-stone-850 text-[#C5A880] px-4 py-2 rounded-xl text-[10px] font-bold shadow-xl z-50 flex items-center gap-2 whitespace-nowrap leading-none transition-all duration-300 animate-bounce">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping shrink-0" />
          <span>{speechSupportError}</span>
        </div>
      )}

      {/* Input container */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center bg-stone-50 border border-stone-200 hover:border-stone-300 focus-within:bg-white focus-within:border-[#C5A880] rounded-xl transition-all shadow-2xs">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={lang === 'bn' ? "ঘড়ি, জুতো, চামড়া খুঁজুন..." : "Search watches, footwear, leather..."}
            className="w-full bg-transparent text-stone-900 py-2.5 pl-10 pr-20 text-xs focus:outline-none placeholder-stone-400 font-medium select-text"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 select-none pointer-events-none" />
          
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setAiMatchedIds(null);
                  setAiSearchExplanation(null);
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-stone-250/85 text-stone-500 transition-all select-none cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleListening();
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                isListening 
                  ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' 
                  : 'bg-stone-200/60 hover:bg-stone-200 text-stone-500 active:scale-90 hover:text-stone-800'
              }`}
              title={isListening ? "Listening... click to end" : "Voice Search"}
            >
              <Mic className="w-3.5 h-3.5" />
              {isListening && (
                <span className="absolute -inset-1 rounded-full border-2 border-red-500/30 animate-ping pointer-events-none" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Instant Dropdown results Overlay */}
      {isOpen && (
        <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-stone-200/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[420px] select-none scale-100 transition-all">
          <div className="overflow-y-auto p-4 space-y-4">
            
            {/* Listening Visual Feedback Equalizer */}
            {isListening && (
              <div className="flex flex-col items-center justify-center py-6 bg-stone-50/50 rounded-xl border border-stone-150 space-y-3">
                <div className="flex items-end gap-1 justify-center h-8">
                  <span className="w-1 h-3 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-6 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-4 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-7 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                  <span className="w-1 h-3 bg-[#C5A880] rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-stone-800">
                    {lang === 'bn' ? 'আপনার কথা শোনা হচ্ছে...' : 'Listening to your voice...'}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {lang === 'bn' 
                      ? 'দয়া করে কোনো ব্র্যান্ড, কালেকশন, অলঙ্কার বা উপাদানের নাম বলুন' 
                      : 'Please name a brand, collection, ornament or material'}
                  </p>
                </div>
              </div>
            )}
            
            {/* If Query exists & there are matches */}
            {query.trim() && filtered.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block border-b border-stone-100 pb-1">
                  Matching boutique artifacts ({filtered.length})
                </span>
                <div className="space-y-1.5">
                  {filtered.map((p) => {
                    const catName = categories.find((c) => c.id === p.category_id)?.name || 'Artifacts';
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="flex items-center gap-3 p-2 hover:bg-stone-50 cursor-pointer rounded-xl transition-all"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg border border-stone-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-mono text-[#C5A880] font-black uppercase tracking-wider">{p.brand}</p>
                          <h4 className="text-xs font-bold text-stone-900 leading-snug truncate">{p.name}</h4>
                          <span className="text-[10px] text-stone-400 block font-light leading-none">{catName}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-stone-900 font-serif whitespace-nowrap">
                            {(p.sale_price || p.price).toLocaleString()} BDT
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If Query exists but NO matching results */}
            {query.trim() && filtered.length === 0 && (
              <div className="space-y-4 py-2">
                <div className="text-center py-2">
                  <p className="text-xs font-bold text-stone-800">"No matching products found"</p>
                  <p className="text-[11px] text-stone-400 font-mono mt-1">Please try standard typos, different collection terms, or select below</p>
                </div>

                {/* Suggestions: Similar/Popular Products */}
                {popularProducts.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block border-b border-stone-100 pb-1">
                      Similar Products
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {popularProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="flex items-center gap-3 p-1.5 hover:bg-stone-50 cursor-pointer rounded-lg transition-all"
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-8 h-8 object-cover rounded-md shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[11px] font-bold text-stone-800 truncate">{p.name}</h5>
                            <span className="text-[9px] text-[#C5A880] font-mono uppercase">{p.brand}</span>
                          </div>
                          <span className="text-[11px] font-serif font-black text-stone-900">
                            {(p.sale_price || p.price).toLocaleString()} BDT
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions: Related Categories */}
                {relatedCats.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block border-b border-stone-100 pb-1">
                      Related Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {relatedCats.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryClick(cat.id)}
                          className="px-2.5 py-1 text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold uppercase rounded-full transition-all cursor-pointer flex items-center gap-1 border border-stone-200/50"
                        >
                          <Folder className="w-2.5 h-2.5 text-stone-500" />
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions: Popular Searches */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest block border-b border-stone-100 pb-1">
                    Popular Searches
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handlePopularSearchClick(term)}
                        className="px-2.5 py-1 text-[9px] bg-amber-50 border border-amber-100 hover:bg-amber-100 text-[#C5A880] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* If Query is empty, show default search panel */}
            {!query.trim() && (
              <div className="space-y-4">
                {/* Popular searches suggestions */}
                <div className="space-y-2">
                  <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block border-b border-stone-100 pb-1 flex items-center gap-1 select-none">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Popular Searches
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handlePopularSearchClick(term)}
                        className="px-3 py-1.5 text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono font-bold rounded-lg transition-all cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* All categories shortcuts */}
                <div className="space-y-2">
                  <span className="text-[9px] font-extrabold text-stone-400 uppercase tracking-widest block border-b border-stone-100 pb-1 select-none">
                    Browse Collections
                  </span>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.id)}
                        className="w-full text-left p-2 hover:bg-stone-50 cursor-pointer rounded-xl flex items-center justify-between text-xs text-stone-700 font-bold transition-all border border-transparent hover:border-stone-100"
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="w-3.5 h-3.5 text-stone-400" />
                          <span>{cat.name}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
