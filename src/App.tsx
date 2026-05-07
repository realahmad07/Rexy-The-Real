import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AuditView from './components/AuditView';
import CopilotView from './components/CopilotView';
import InfoView from './components/InfoView';
import OnboardingModal from './components/OnboardingModal';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAppState } from './contexts/AppStateContext';
import { cn } from './lib/utils';
import { ShieldCheck, Database, Globe, Network, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const [isWalletLoggedIn, setIsWalletLoggedIn] = useState(false);
  const [isGuestLoggedIn, setIsGuestLoggedIn] = useState(false);
  const { firebaseConnected, setFirebaseConnected } = useAppState();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'online' | 'offline' | 'restricted'>('online');

  const isLoggedIn = isWalletLoggedIn || isGuestLoggedIn;

  useEffect(() => {
    const checkFirebaseHealth = async () => {
      try {
        const { getDocFromServer, doc } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'test', 'connection'));
        setFirebaseConnected(true);
      } catch (err) {
        setFirebaseConnected(false);
        console.warn("Firestore connection check failed. Client may be offline.");
      }
    };

    checkFirebaseHealth();
    const interval = setInterval(checkFirebaseHealth, 60000); // Check once a minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.status === 'ok') {
          setSystemHealth('online');
        } else if (data.status === 'restricted') {
          setSystemHealth('restricted');
        } else {
          setSystemHealth('offline');
        }
      } catch (err) {
        setSystemHealth('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (connected && publicKey) {
      setIsWalletLoggedIn(true);
      
      // Save user profile to Firestore
      const saveUserProfile = async () => {
        if (!firebaseConnected) {
          console.warn("Database offline: skipping user profile sync.");
          return;
        }
        const uid = publicKey.toString();
        const userRef = doc(db, 'users', uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // New user
            await setDoc(userRef, {
              uid: uid,
              walletAddress: uid,
              createdAt: serverTimestamp(),
              role: 'user',
              lastActive: serverTimestamp()
            });
          } else {
            // Existing user - only update lastActive to avoid breaking createdAt immutability rule
            await updateDoc(userRef, {
              lastActive: serverTimestamp()
            });
          }
        } catch (error) {
          console.error("Error saving user profile:", error);
          // Only handle if it's a permission error or similar
          if (error instanceof Error && error.message.includes('permission')) {
            try {
              handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
            } catch (e) {
              // Error is already logged and re-thrown by handleFirestoreError
            }
          }
        }
      };
      
      saveUserProfile();

      // Check for first-time login
      const hasSeenOnboarding = localStorage.getItem('rexy_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    } else {
      setIsWalletLoggedIn(false);
    }
  }, [connected, publicKey]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('rexy_onboarding_seen', 'true');
  };

  const handleLogout = async () => {
    try {
      console.log("[Auth] Initiating logout process...");
      if (connected) {
        await disconnect().catch(err => {
          console.warn("[Auth] Wallet disconnect failed, proceeding with state reset:", err);
        });
      }
    } catch (err) {
      console.warn("[Auth] Logout error:", err);
    } finally {
      setIsWalletLoggedIn(false);
      setIsGuestLoggedIn(false);
      // Ensure session persistence is handled if any
      localStorage.removeItem('rexy_session_active'); 
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsGuestLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-rexy-bg text-slate-900 font-sans selection:bg-rexy-primary/30">
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
      
      {/* Live Security Ticker */}
      <div className="bg-rexy-primary/10 border-b border-rexy-border py-2 overflow-hidden relative z-[60]">
        <div className="flex items-center whitespace-nowrap animate-marquee">
          {[1, 2, 3, 4, 5].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Live Audit:</span>
                <span className="text-[9px] font-mono text-slate-500">0x{Math.random().toString(16).substring(2, 10)}... Secure (98%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Vulnerability Blocked:</span>
                <span className="text-[9px] font-mono text-slate-500">Reentrancy Attack on DEX 0x{Math.random().toString(16).substring(2, 8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rexy-primary rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-rexy-primary">New Certificate:</span>
                <span className="text-[9px] font-mono text-slate-500">cNFT Minted for 0x{Math.random().toString(16).substring(2, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-rexy-card/80 backdrop-blur-xl border-b border-rexy-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="w-10 h-10 bg-rexy-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rexy-primary/20 group-hover:scale-110 transition-transform">
              R
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">REXY</h1>
              <p className="text-[8px] uppercase tracking-[0.3em] text-rexy-primary font-bold mt-1">AI Auditor</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-rexy-bg/50 p-1 rounded-xl border border-rexy-border">
            {['dashboard', 'audit', 'copilot', 'info'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? "bg-rexy-primary text-white shadow-lg shadow-rexy-primary/30" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-rexy-card"
                }`}
              >
                {tab === 'copilot' ? 'Rexy Copilot' : tab}
              </button>
            ))}
          </div>


          <div className="flex items-center gap-4">
            {/* User Profile Badge */}
            {isWalletLoggedIn && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-white/10 shadow-2xl">
                <div className="w-6 h-6 rounded-lg bg-rexy-primary/20 flex items-center justify-center text-rexy-primary font-black text-[10px]">
                  {publicKey?.toString().slice(0, 1).toUpperCase()}
                </div>
                <div className="flex flex-col -space-y-0.5">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider leading-none">
                    {publicKey?.toString() === "247280@students.au.edu.pk" || isWalletLoggedIn ? "Verified Auditor" : "Analyst"}
                  </span>
                  <span className="text-[7px] font-mono text-slate-500 uppercase tracking-tighter">
                    {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                  </span>
                </div>
              </div>
            )}
            
            <div className="hidden lg:flex items-center gap-3">
              {/* System Health Badge */}
              <div className={cn(
                "flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-300 shadow-sm",
                systemHealth === 'online' 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" 
                  : systemHealth === 'restricted'
                    ? "bg-amber-500/5 border-amber-500/20 text-amber-500 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]"
                    : "bg-rose-500/5 border-rose-500/20 text-rose-500 shadow-[0_0_15px_-5px_rgba(244,63,94,0.2)]"
              )}>
                <div className="relative flex items-center justify-center">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full border-2 border-white/20",
                    systemHealth === 'online' ? "bg-emerald-500" : systemHealth === 'restricted' ? "bg-amber-500" : "bg-rose-500"
                  )} />
                  {systemHealth === 'online' && (
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping bg-emerald-500/40" />
                  )}
                </div>
                <div className="flex flex-col -space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">AI Engine</span>
                  <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest leading-none">
                    {systemHealth === 'online' ? 'Active' : systemHealth === 'restricted' ? 'Restricted' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Network / Firebase Badge */}
              <div className={cn(
                "flex items-center gap-2.5 px-4 py-2 rounded-2xl border transition-all duration-300 shadow-sm",
                firebaseConnected 
                  ? "bg-rexy-primary/5 border-rexy-primary/20 text-rexy-primary" 
                  : "bg-amber-500/5 border-amber-500/20 text-amber-500"
              )}>
                <div className="relative flex items-center justify-center text-current">
                   {firebaseConnected ? <Globe className="w-3.5 h-3.5" /> : <Network className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col -space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">Network</span>
                  <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest leading-none">
                    {firebaseConnected ? 'Synced' : 'Local Node'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-10 w-[1px] bg-rexy-border/50 hidden lg:block mx-1" />
            
            <div className="flex items-center gap-2">
              <WalletMultiButton className="!bg-rexy-primary hover:!bg-indigo-500 !h-12 !px-8 !rounded-2xl !text-[10px] !font-black !transition-all !border-none shadow-xl shadow-rexy-primary/20 uppercase tracking-widest active:scale-95" />
              <button 
                onClick={handleLogout}
                className="p-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 transition-all flex items-center justify-center group"
                title="Logout / Disconnect"
              >
                <LogOut size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'audit' && <AuditView />}
            {activeTab === 'copilot' && <CopilotView />}
            {activeTab === 'info' && <InfoView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mini Footer / Health Bar */}
      <footer className="mt-auto border-t border-rexy-border bg-rexy-card/30 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
              © 2026 Rexy Security Labs • All Audit Hash Proofs are Immutable on Solana
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-rexy-border shadow-sm">
              <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${firebaseConnected ? 'bg-indigo-500' : 'bg-amber-500'}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${firebaseConnected ? 'text-indigo-600' : 'text-amber-600'}`}>
                Database: {firebaseConnected ? 'Connected' : 'Sync Pending'}
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              v1.0.4-beta
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
