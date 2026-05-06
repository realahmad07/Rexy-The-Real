import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, User, Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'judge' && password === 'rexy-2026') {
      onLogin();
    } else if (username.trim() && password.trim()) {
      // Fallback for any credentials if they just want to test the flow
      onLogin();
    } else {
      setError('Please enter both username and password.');
    }
  };

  return (
    <div className="min-h-screen bg-rexy-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rexy-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-rexy-card/50 backdrop-blur-xl border border-rexy-border p-10 rounded-3xl text-center relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-24 h-24 mb-6 group">
            <div className="w-full h-full bg-rexy-primary rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-rexy-primary/20 group-hover:scale-110 transition-transform">
              R
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg border-2 border-rexy-bg">
              <Shield size={16} />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase">Rexy</h1>
          <p className="text-[10px] text-rexy-primary font-black tracking-[0.3em] uppercase">AI Security Auditor</p>
        </div>

        <AnimatePresence mode="wait">
          {!showCredentials ? (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <p className="text-slate-600 mb-8 leading-relaxed text-sm">
                Connect your Phantom wallet to access the most advanced smart contract security auditor on Solana.
              </p>

              <div className="flex justify-center">
                <WalletMultiButton className="!bg-rexy-primary hover:!bg-indigo-500 !h-14 !px-10 !rounded-2xl !text-sm !font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rexy-primary/30 uppercase tracking-widest" />
              </div>

              <div className="pt-6 border-t border-rexy-border">
                <button
                  onClick={() => setShowCredentials(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rexy-primary transition-colors flex items-center gap-2 mx-auto"
                >
                  <Key size={12} />
                  Access with Auditor Credentials
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white/50 border border-rexy-border rounded-2xl text-sm focus:ring-2 focus:ring-rexy-primary outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-white/50 border border-rexy-border rounded-2xl text-sm focus:ring-2 focus:ring-rexy-primary outline-none transition-all"
                  />
                </div>
                {error && <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{error}</p>}
                <button
                  type="submit"
                  className="w-full h-14 bg-rexy-primary hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-rexy-primary/30"
                >
                  Authenticate <ArrowRight size={16} />
                </button>
              </form>

              <button
                onClick={() => setShowCredentials(false)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rexy-primary transition-colors"
              >
                Back to Wallet Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Login;
