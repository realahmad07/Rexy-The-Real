import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Zap, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface FixationTerminalProps {
  code: string;
  stage: 'payment' | 'static' | 'ai' | 'blockchain' | 'idle';
  isQuantum?: boolean;
}

const LOG_MESSAGES = {
  payment: [
    "[WALLET] Interface initialized. Waiting for signature...",
    "[SOLANA] Transaction pending: 0.00001 SOL + Memo instruction.",
    "[WALLET] User approved transaction. Propagating to cluster...",
    "[RPC] Confirmation received. Blockheight: 284192031",
    "[SYSTEM] Resource lock acquired. Starting deep analysis."
  ],
  quantum: [
    "[QUANTUM] Initiating Post-Quantum Cryptography check...",
    "[QUANTUM] Analyzing Shor's Algorithm vulnerability surface...",
    "[QUANTUM] CRITICAL: Quantum search complexity detected (Grover).",
    "[QUANTUM] STAGE 1: Entanglement verification complete.",
    "[QUANTUM] STAGE 2: Qubit stability confirmed at 99.8%.",
    "[QUANTUM] OVERLOAD: Quantum Compute isolation required...",
    "[QUANTUM] WARNING: Decoherence levels spiking!",
    "[QUANTUM] STABILIZING: Adjusting lattice-based parameters...",
    "[QUANTUM] FIXATION: Re-mapping logic to PQC primitives...",
    "[QUANTUM] STAGE 3: Quantum Logic mapping complete.",
    "[QUANTUM] READY: Proceeding to multi-dimensional AI pass."
  ],
  static: [
    "[SYSTEM] Initiating Layer 1: Solana Vulnerability Library...",
    "[SOL-001] Checking for Missing Signer validation...",
    "[SOL-002] Scanning for Integer Overflow/Underflow risks...",
    "[SOL-003] Verifying Account Data Ownership...",
    "[SOL-004] Checking for Reentrancy vectors...",
    "[SOL-005] Validating Program Derived Addresses...",
    "[LAYER1] Pattern matching complete. 0 critical structural flaws found."
  ],
  ai: [
    "[AI] Deep Brain Engine Online. Initiating Neural Audit...",
    "[NEURAL] Tokenizing Anchor program logic...",
    "[NEURAL] Modeling state transitions for potential race conditions...",
    "[FIXATION] Logic anomaly detected in instruction 'process_bet'...",
    "[FIXATION] Simulating exploit: Flash-loan price manipulation...",
    "[FIXATION] Recommended remediation: Implement constant product invariant.",
    "[FIXATION] Patching logic flow in memory...",
    "[NEURAL] Formal verification of fix confirmed.",
    "[AI] Audit complete. Generating comprehensive report..."
  ],
  blockchain: [
    "[CRYPTO] Generating SHA-256 integrity hash...",
    "[SOLANA] Requesting blockspace for audit provenance...",
    "[MEMO] Recording proof: rexy_audit_v1_0...",
    "[BLOCKCHAIN] Immutable proof secured successfully."
  ]
};

export const FixationTerminal: React.FC<FixationTerminalProps> = ({ code, stage, isQuantum }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [highlightedLine, setHighlightedLine] = useState(0);
  const [isOverloading, setIsOverloading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = code.split('\n').slice(0, 15); // Show first 15 lines for context

  useEffect(() => {
    if (stage === 'idle') {
      setLogs([]);
      setIsOverloading(false);
      return;
    }

    let messages = LOG_MESSAGES[stage as keyof typeof LOG_MESSAGES] || [];
    
    // If it's the start of AI phase and Quantum is enabled, mix quantum logs
    // We check if we are just entering AI phase
    if (stage === 'ai' && isQuantum) {
       // Prepend quantum logs if they aren't already there in the recent history
       messages = [...LOG_MESSAGES.quantum, ...messages];
    }

    let currentIdx = 0;

    const logInterval = setInterval(() => {
      if (currentIdx < messages.length) {
        const currentLog = messages[currentIdx];
        
        if (currentLog.includes('OVERLOAD')) {
            setIsOverloading(true);
            setTimeout(() => setIsOverloading(false), 2000);
        }

        setLogs(prev => {
          const next = [...prev, currentLog];
          return next.slice(-50); // Keep last 50 logs for performance
        });
        currentIdx++;
        
        // Randomly shift code highlight during AI phase
        if (stage === 'ai' || stage === 'static') {
          setHighlightedLine(Math.floor(Math.random() * lines.length));
        }
      } else {
        // For long-running stages or when messages run out, add generic progress logs
        const genericLogsMap = {
          payment: [
            "[SOLANA] Awaiting cluster confirmation...",
            "[RPC] Polling blockhash status...",
            "[SYSTEM] Validating signature integrity..."
          ],
          static: [
            "[SYSTEM] Analyzing instruction boundary conditions...",
            "[SYSTEM] Verifying account ownership validation depth...",
            "[SYSTEM] Heuristic check: Instruction count vs Reentrancy risk..."
          ],
          ai: [
            "[REXY] Deep-tracing cross-program invocation paths...",
            "[REXY] Simulating adversarial state transitions...",
            "[REXY] Layer 2 Neural logic pass in progress...",
            "[AI] Refining formal verification proofs..."
          ],
          blockchain: [
            "[BLOCKCHAIN] Compacting proof for on-chain storage...",
            "[BLOCKCHAIN] Verifying ledger finality..."
          ]
        };

        const currentGenericLogs = genericLogsMap[stage as keyof typeof genericLogsMap] || [];
        if (currentGenericLogs.length > 0) {
          const randomLog = currentGenericLogs[Math.floor(Math.random() * currentGenericLogs.length)];
          setLogs(prev => {
            const next = [...prev, randomLog];
            return next.slice(-50);
          });
          
          if (stage === 'ai') {
            setHighlightedLine(Math.floor(Math.random() * lines.length));
          }
        }
      }
    }, 600);

    return () => clearInterval(logInterval);
  }, [stage, lines.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div id="fixation-terminal" className="w-full h-full bg-slate-950 rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl relative">
      {/* Terminal Header */}
      <div className="bg-white/5 border-b border-white/10 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            Rexy Deep Audit v1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-rexy-primary animate-pulse" />
             <span className="text-[8px] font-black text-rexy-primary uppercase tracking-tighter">Live Scan</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-px bg-white/5">
        {/* Code Visualization */}
        <div className="p-6 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-950 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950 to-transparent z-10" />
          
          <div className="space-y-1 font-mono text-[10px]">
            {lines.map((line, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex gap-4 transition-all duration-300",
                  highlightedLine === i ? "bg-rexy-primary/10 text-rexy-primary scale-[1.02] py-0.5 px-1 -mx-1 rounded" : "opacity-40"
                )}
              >
                <span className="w-4 text-slate-700 text-right">{i + 1}</span>
                <span className="truncate">{line || "// empty"}</span>
                {highlightedLine === i && stage === 'ai' && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto text-[8px] font-black bg-rexy-primary/20 px-1.5 rounded flex items-center gap-1"
                  >
                    <Zap className="w-2 h-2 fill-current" />
                    FIXING
                  </motion.span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-black/40 p-6 overflow-y-auto no-scrollbar" ref={scrollRef}>
          <div className="space-y-3 font-mono text-[10px]">
            <AnimatePresence mode="popLayout">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-3",
                    log && log.includes('[QUANTUM]') ? "text-purple-400" :
                    log && log.includes('[FIXATION]') ? "text-amber-400" : 
                    log && log.includes('[AI]') ? "text-rexy-primary" : 
                    log && log.includes('[BLOCKCHAIN]') ? "text-emerald-400" :
                    "text-slate-400"
                  )}
                >
                  <span className="shrink-0 opacity-30">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  <p className="leading-tight break-words">{log}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="w-1.5 h-3 bg-rexy-primary animate-pulse inline-block align-middle ml-1" />
          </div>
        </div>
      </div>
      
      {/* Quantum Overload Overlay */}
      <AnimatePresence>
        {isOverloading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0.8, 1, 0],
              x: [0, -10, 10, -5, 5, 0],
              filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
            }}
            transition={{ duration: 0.5, repeat: 4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none bg-rexy-primary/20 backdrop-blur-[3px] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
               <div className="flex gap-4">
                  {[1, 2, 3].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ 
                        scale: [1, 2, 0.5, 1.5, 1],
                        rotate: [0, 180, -180, 360, 0],
                        opacity: [0.5, 1, 0.3, 1, 0.5]
                      }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                      className="w-16 h-16 border-2 border-rexy-primary rounded-lg flex items-center justify-center text-rexy-primary shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                    >
                      <Atom className="w-10 h-10 animate-spin" />
                    </motion.div>
                  ))}
               </div>
               <span className="text-sm font-black text-white bg-rexy-primary px-4 py-1 rounded uppercase tracking-[1em] animate-pulse">SYSTEM OVERLOAD</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Glitch Effect during Quantum */}
      {isQuantum && stage === 'ai' && (
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.3, 0.1, 0.4, 0.1],
            backgroundColor: ["rgba(79,70,229,0)", "rgba(79,70,229,0.1)", "rgba(168,85,247,0.1)", "rgba(79,70,229,0)"]
          }}
          transition={{ duration: 0.2, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" 
        />
      )}
    </div>
  );
};

const Atom: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <ellipse cx="12" cy="12" rx="10" ry="4" strokeDasharray="4 4" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" strokeDasharray="4 4" />
    <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" strokeDasharray="4 4" />
  </svg>
);
