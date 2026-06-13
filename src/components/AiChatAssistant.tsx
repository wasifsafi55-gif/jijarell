import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, MapPin, Search, Compass, Info, Terminal, RefreshCw, 
  Copy, Check, AlertCircle, Sliders, Map, Globe, MapPinned, User, Cpu, X 
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[] | null;
}

interface AiChatAssistantProps {
  onClose: () => void;
}

export default function AiChatAssistant({ onClose }: AiChatAssistantProps) {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Welcome to JIJARELL Luxury Lounge. I am your JIJARELL Assistant.\n\nAsk about **Haute Horlogerie**, **artisanal calves leather crafting**, or track your unique luxury orders. I provide precise and verified information directly from our database lists."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Copy code helper
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
  };



  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsg = inputValue;
    setInputValue('');
    setErrorMsg(null);
    setLoading(true);

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: userMsg
    };

    const hist = messages.filter(m => m.id !== 'welcome').map(m => ({
      role: m.role,
      text: m.text
    }));

    setMessages(prev => [...prev, newMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: hist,
          systemInstruction: "You are the JIJARELL Assistant, the official shopping assistant for the JIJARELL Genève premium marketplace. Support English and Bangla languages fluidly."
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error communicating with Gemini.');

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        text: data.text,
        groundingChunks: data.groundingChunks
      }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with AI services.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white max-w-xl border-l border-stone-200 shadow-2xl relative">
      {/* Header bar */}
      <div className="p-4 border-b border-stone-200 bg-stone-900 text-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#C5A880] text-stone-950 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">{t('ai_assistant')}</h3>
            <span className="text-[9px] text-[#C5A880] tracking-widest font-mono uppercase">Interactive Concierge</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grounding tools widget list deleted - completely shutdown */}

      {/* Message canvas */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/50">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-[#C5A880] shrink-0 text-xs">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex flex-col max-w-[85%]">
                <div className={`p-3.5 rounded-xl text-xs leading-relaxed border shadow-xs ${
                  isUser 
                    ? 'bg-stone-900 border-stone-800 text-stone-100 rounded-tr-none' 
                    : 'bg-white border-stone-200 text-stone-850 rounded-tl-none'
                }`}>
                  <p className="font-sans whitespace-pre-wrap select-text">{m.text}</p>
                </div>

                {/* Citations block */}
                {!isUser && m.groundingChunks && m.groundingChunks.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {m.groundingChunks.map((chunk, cIdx) => {
                      const linkObj = chunk.web || chunk.maps;
                      if (!linkObj) return null;
                      return (
                        <a 
                          key={cIdx} 
                          href={linkObj.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-amber-50 text-amber-900 hover:underline px-2 py-0.5 rounded border border-amber-200/50"
                        >
                          <MapPinned className="w-3 h-3" />
                          <span>{linkObj.title}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-[#C5A880] flex items-center justify-center text-stone-900 shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-stone-100 border border-stone-200 px-3.5 py-2.5 rounded-xl text-[11px] text-stone-600 flex items-center gap-1.5 font-medium animate-pulse">
              <span>AI Concierge is weaving thoughts...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset suggestions */}
      <div className="px-3 py-2 border-t border-stone-150 bg-white flex gap-1.5 overflow-x-auto scrollbar-none select-none">
        <button 
          onClick={() => {
            setInputValue("Can you recommend a premium swiss model tourbillon timepiece watch from the catalog?");
          }}
          className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200 hover:bg-stone-200 shrink-0 cursor-pointer"
        >
          ⌚ Chrono Tourbillon
        </button>
        <button 
          onClick={() => setInputValue("Help me track my active orders, what is the verification process?")}
          className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200 hover:bg-stone-200 shrink-0 cursor-pointer"
        >
          📦 Track My Orders
        </button>
        <button 
          onClick={() => {
            setInputValue("What makes Aurelia Sovereigns better than other luxury calf leather oxfords?");
          }}
          className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200 hover:bg-stone-200 shrink-0 cursor-pointer"
        >
          👞 Oxford Leather details
        </button>
      </div>

      {/* Text submission input */}
      <form onSubmit={handleSendMessage} className="p-3 bg-stone-50 border-t border-stone-200 flex gap-2">
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="Ask luxury concierge..."
          className="flex-1 bg-white border border-stone-250 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 select-text"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || loading}
          className="bg-stone-900 border border-stone-850 hover:bg-stone-800 text-white font-bold p-2 rounded-lg disabled:opacity-40 transition-opacity cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
