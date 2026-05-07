import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Send, Cpu, Zap, Activity, Shield, Code, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithRexy } from '../services/aiService';
import { cn } from '../lib/utils';
import { useAppState, ChatMessage } from '../contexts/AppStateContext';

interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  }
}

export default function CopilotView() {
  const { copilotMessages: messages, setCopilotMessages: setMessages } = useAppState();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prices, setPrices] = useState<PriceData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Live Prices via CoinGecko
  useEffect(() => {
    const fetchPrices = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        console.log("Fetching live prices from proxy...");
        const res = await fetch('/api/prices?ids=solana,raydium,jupiter-exchange-solana,jito-governance-token,bonk', {
            signal: controller.signal
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
           setPrices(data);
        } else {
           throw new Error("Empty or invalid price data received");
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
            console.warn("Price fetch timed out. Using cached or fallback data.");
        } else {
            // Silence frequent fetch errors to prevent console spam
            if (process.env.NODE_ENV === 'development') {
              console.warn("Price fetch unavailable, using internal fallback.");
            }
            
            // Fallback mock prices if real API fails to keep UI alive
            setPrices({
              "solana": { "usd": 156.42, "usd_24h_change": 1.25 },
              "bonk": { "usd": 0.0000258, "usd_24h_change": -0.42 },
              "jupiter-exchange-solana": { "usd": 1.08, "usd_24h_change": 2.15 },
              "raydium": { "usd": 1.62, "usd_24h_change": 5.10 },
              "jito-governance-token": { "usd": 3.12, "usd_24h_change": -1.20 }
            });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);


  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    
    // Check if last message was offline
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'model' && lastMsg.content.includes('[OFFLINE MODE]')) {
      setIsOfflineMode(true);
    } else if (lastMsg && lastMsg.role === 'model') {
      setIsOfflineMode(false);
    }
  }, [messages]);


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setIsLoading(true);
    
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: Date.now().toString(), role: 'user', content: userMsg, timestamp: Date.now() }
    ];
    setMessages(newMessages);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const response = await chatWithRexy(userMsg, history);
      
      setMessages(prev => [
        ...prev,
        { id: (Date.now()+1).toString(), role: 'model', content: response, timestamp: Date.now() }
      ]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now()+1).toString(), role: 'model', content: `⚠️ Error communicating with Rexy Core: ${error.message}`, timestamp: Date.now() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const tokens = [
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'jupiter-exchange-solana', name: 'Jupiter', symbol: 'JUP' },
    { id: 'raydium', name: 'Raydium', symbol: 'RAY' },
    { id: 'jito-governance-token', name: 'Jito', symbol: 'JTO' },
    { id: 'bonk', name: 'Bonk', symbol: 'BONK' },
  ];

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* LEFT PORTION: Real-Time Ecosystem Prices */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl overflow-hidden relative group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-32 h-32 text-indigo-500" />
          </div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-emerald-400" />
            Live Market
          </h2>
          
          <div className="space-y-4 relative z-10">
            {tokens.map(token => {
              const data = prices?.[token.id];
              const isUp = (data?.usd_24h_change || 0) >= 0;
              
              return (
                <div key={token.id} className="flex flex-col gap-1 border-b border-slate-800/50 pb-3 last:border-0 p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-sm">{token.symbol}</span>
                    {data ? (
                      <span className="font-mono text-white text-sm">${data.usd.toFixed(2)}</span>
                    ) : (
                      <span className="w-10 h-4 bg-slate-800 animate-pulse rounded" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{token.name}</span>
                    {data ? (
                      <span className={cn("text-[10px] font-black tracking-wider", isUp ? "text-emerald-400" : "text-red-400")}>
                        {isUp ? '+' : ''}{data.usd_24h_change.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="w-8 h-3 bg-slate-800 animate-pulse rounded" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-rexy-primary/10 border border-rexy-primary/20 rounded-3xl p-6">
           <h3 className="text-xs font-black text-rexy-primary uppercase tracking-widest mb-2 flex items-center gap-2">
             <Shield className="w-3 h-3" /> Copilot Status
           </h3>
           <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
             Connected to Groq Llama 3.3 70B (Deep Brain Engine). Layered with Gemini 3.1 Pro for deep semantic reasoning.
           </p>
        </div>
      </div>

      {/* RIGHT PORTION: Chat Interface */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rexy-primary/10 rounded-xl flex items-center justify-center">
              <Terminal className="w-4 h-4 text-rexy-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-widest uppercase">Rexy Copilot</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Web3 Security Operations</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-500",
            isOfflineMode 
              ? "bg-amber-500/10 border-amber-500/20" 
              : "bg-emerald-500/10 border-emerald-500/20"
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              isOfflineMode ? "bg-amber-500" : "bg-emerald-500"
            )} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              isOfflineMode ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {isOfflineMode ? 'Offline Knowledge' : 'Cloud Sync Active'}
            </span>
          </div>

        </div>

        {/* Message View */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex max-w-[85%]",
                  msg.role === 'user' ? "ml-auto justify-end" : "mr-auto justify-start"
                )}
              >
                <div className={cn(
                  "rounded-2xl p-4 shadow-sm",
                  msg.role === 'user' 
                    ? "bg-rexy-primary text-white rounded-br-sm" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700"
                )}>
                  {msg.role === 'model' ? (
                     <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:border-slate-800 prose-pre:border prose-a:text-rexy-primary">
                       <ReactMarkdown>{msg.content}</ReactMarkdown>
                     </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex max-w-[85%] mr-auto justify-start"
              >
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                   <Loader2 className="w-4 h-4 animate-spin text-rexy-primary" />
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rexy is analyzing...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="relative flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Rexy a security question or paste code snippet..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-rexy-primary/50 transition-colors resize-none min-h-[50px] max-h-[150px]"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-12 h-12 bg-rexy-primary hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-rexy-primary text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-rexy-primary/20"
            >
              <Send className="w-5 h-5 -ml-1" />
            </button>
          </div>
          <div className="mt-2 text-center">
             <span className="text-[10px] text-slate-400 font-medium">Shift + Enter for new line. AI can make mistakes. Always verify security insights.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
