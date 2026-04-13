import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = () => {
  return (
    <div className="min-h-screen bg-rexy-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rexy-primary/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-rexy-card/50 backdrop-blur-xl border border-rexy-border p-10 rounded-3xl text-center relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-32 h-32 mb-6 group">
            <div className="w-full h-full bg-rexy-primary/10 rounded-3xl flex items-center justify-center text-rexy-primary font-black text-6xl shadow-2xl shadow-rexy-primary/20 group-hover:scale-110 transition-transform">
              R
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase">Rexy</h1>
          <p className="text-[10px] text-rexy-primary font-black tracking-[0.3em] uppercase">The Real AI Auditor</p>
        </div>

        <p className="text-slate-600 mb-10 leading-relaxed text-sm">
          Connect your wallet to access the most advanced multi-chain smart contract security auditor.
        </p>

        <div className="flex justify-center">
          <WalletMultiButton className="!bg-rexy-primary hover:!bg-indigo-500 !h-14 !px-8 !rounded-2xl !text-lg !font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rexy-primary/20 uppercase tracking-widest" />
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
