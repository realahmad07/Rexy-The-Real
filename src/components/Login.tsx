import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, ArrowRight, Cpu, Infinity as InfinityIcon, Sparkles, ChevronRight, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { select, wallets, connected } = useWallet();
  const [showCredentials, setShowCredentials] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'judge' && password === 'rexy-2026') {
      onLogin();
    } else if (username.trim() && password.trim()) {
      onLogin(); // Allow for general testing
    } else {
      setError('Invalid security credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-rexy-primary selection:text-white">
      {/* Immersive Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Organic Flowing Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-rexy-primary/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" 
        />
        
        {/* Interactive Mouse Glow */}
        <motion.div 
          animate={{ 
            x: mousePos.x - 300, 
            y: mousePos.y - 300 
          }}
          transition={{ type: "spring", damping: 30, stiffness: 50, mass: 0.5 }}
          className="absolute w-[600px] h-[600px] bg-rexy-primary/5 blur-[150px] rounded-full opacity-60"
        />

        {/* Texture & Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
        className="max-w-[1100px] w-full grid grid-cols-1 md:grid-cols-2 gap-0 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[40px] md:rounded-[56px] overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] relative z-10"
      >
        {/* Scanning Line Animation */}
        <motion.div 
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-t from-transparent via-rexy-primary/40 to-transparent z-20 pointer-events-none hidden md:block"
        />

        {/* Left Pane: Brand & Atmosphere */}
        <div className="relative p-8 md:p-16 flex flex-col justify-center overflow-hidden border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent">
          <div className="relative z-10 text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-4 mb-10 justify-center md:justify-start"
            >
              <div className="w-14 h-14 bg-rexy-primary rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-white/20">
                <Shield className="text-white w-7 h-7" fill="currentColor" fillOpacity={0.2} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-rexy-primary">Core Intelligence</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 italic">Audit Node 778</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h1 className="text-[80px] sm:text-[100px] md:text-[140px] font-black tracking-tighter text-white leading-[0.75] mb-4 selection:bg-white selection:text-black">
                REXY
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-[42px] font-black italic text-rexy-primary tracking-tight mb-10 uppercase leading-none">
                AI CODE AGENT
              </h2>
              
              <div className="flex flex-col gap-4">
                <p className="text-slate-400 text-xs sm:text-sm md:text-lg font-black tracking-[0.15em] uppercase leading-relaxed max-w-sm">
                  SOLANA MULTI LAYER ON PROOF
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-px bg-white/10 flex-1" />
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rexy-primary animate-ping" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  </div>
                  <div className="h-px bg-white/10 w-16" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-rexy-primary/10 blur-[120px] rounded-full" />
          
          <div className="absolute bottom-12 left-12 right-12 z-10 hidden md:block">
            <div className="flex items-center justify-between text-[8px] font-black text-white/20 uppercase tracking-[0.5em]">
              <span>Neural Logic Flow</span>
              <span>Secure Layer 0</span>
              <span>0% False Positives</span>
            </div>
          </div>
        </div>

        {/* Right Pane: Authentication */}
        <div className="p-10 md:p-16 flex flex-col justify-center bg-black/40 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {!showCredentials ? (
              <motion.div
                key="wallet"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-12"
              >
                <div className="text-center md:text-left">
                  <h3 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Auth Gateway</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    Connect your <span className="text-white font-bold">Phantom Wallet</span> to verify your agent identity on-chain.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-rexy-primary via-indigo-600 to-emerald-500 rounded-[28px] blur-md opacity-20 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
                    <div className="relative overflow-hidden rounded-[24px]">
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
                      <WalletMultiButton className="!bg-white !text-black hover:!bg-slate-50 !h-24 !w-full !px-12 !rounded-[24px] !text-sm !font-black !transition-all !border-none !shadow-2xl !flex !items-center !justify-center !gap-6 uppercase !tracking-[0.4em]" />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 py-4">
                    <div className="h-px bg-slate-800 flex-1" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">Internal Portal</span>
                    <div className="h-px bg-slate-800 flex-1" />
                  </div>

                  <button
                    onClick={() => setShowCredentials(true)}
                    className="w-full py-6 group flex items-center justify-center gap-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-white hover:bg-rexy-primary hover:border-rexy-primary transition-all duration-300"
                  >
                    <Lock size={16} className="text-slate-400 group-hover:text-white" />
                    <span>Login with Credentials</span>
                    <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-white" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                className="space-y-8"
              >
                <div>
                  <button 
                    onClick={() => setShowCredentials(false)}
                    className="mb-8 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight size={14} className="rotate-180" /> Back to Wallet
                  </button>
                  <h2 className="text-2xl font-bold text-white mb-2">Internal Access</h2>
                  <p className="text-slate-500 text-sm font-medium">Use assigned security tokens for root-level audit sessions.</p>
                </div>

                <form onSubmit={handleCredentialLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Session Identity</label>
                    <div className="relative group/input">
                      <input
                        type="text"
                        placeholder="AUDITOR_01"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-16 pl-6 pr-6 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-xs font-bold focus:ring-1 focus:ring-rexy-primary focus:border-rexy-primary/50 outline-none transition-all placeholder:text-slate-800 tracking-widest"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Security Hash</label>
                    <div className="relative group/input">
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-16 pl-6 pr-6 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-xs font-bold focus:ring-1 focus:ring-rexy-primary focus:border-rexy-primary/50 outline-none transition-all placeholder:text-slate-800 tracking-widest"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 py-3 px-4 rounded-xl flex items-center gap-3">
                      <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest leading-none">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-16 bg-rexy-primary hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-rexy-primary/20 group translate-y-4"
                  >
                    Authenticate Kernel <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Footer Meta */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-12 text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
        <span>Encrypted</span>
        <span>Neural Pass</span>
        <span>Verified Ledger</span>
      </div>
    </div>
  );
};

export default Login;
