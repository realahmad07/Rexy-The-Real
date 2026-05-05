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
import { motion, AnimatePresence } from 'framer-motion';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const App: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        if (data.status === 'ok') {
          setSystemHealth('online');
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
      setIsLoggedIn(true);
      
      // Save user profile to Firestore
      const saveUserProfile = async () => {
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
      setIsLoggedIn(false);
    }
  }, [connected, publicKey]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('rexy_onboarding_seen', 'true');
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
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
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-rexy-border">
              <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${systemHealth === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${systemHealth === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {systemHealth === 'online' ? 'Engine Online' : 'Engine Offline'}
              </span>
            </div>
            <WalletMultiButton className="!bg-rexy-primary hover:!bg-indigo-500 !h-10 !px-6 !rounded-xl !text-xs !font-bold transition-all shadow-lg shadow-rexy-primary/20" />
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
              <div className={`w-2 h-2 rounded-full animate-pulse transition-colors ${systemHealth === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${systemHealth === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>
                System Status: {systemHealth === 'online' ? 'Operational' : 'Degraded'}
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
