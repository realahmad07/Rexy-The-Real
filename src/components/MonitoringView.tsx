import React from 'react';
import { motion } from 'motion/react';
import { Shield, Bell, Zap, Activity, Eye, Lock, Rocket, Server, Globe, Cpu, Network } from 'lucide-react';
import { cn } from '../lib/utils';

const MonitoringView: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* HERO SECTION */}
      <div className="relative bg-slate-900 rounded-[3rem] p-12 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64 text-rexy-primary animate-pulse" />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-rexy-primary/20 rounded-full border border-rexy-primary/30 mb-6"
          >
            <Rocket className="w-4 h-4 text-rexy-primary" />
            <span className="text-xs font-black text-rexy-primary uppercase tracking-widest">Phase 2 Preview: Under Development</span>
          </motion.div>
          
          <h1 className="text-5xl font-black text-white mb-6 tracking-tighter leading-none">
            Autonomous <span className="text-rexy-primary">Mainnet</span> <br />
            Threat Monitoring
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Moving beyond static audits. Rexy Sentinel is our upcoming 24/7 autonomous watchdog system designed to protect deployed Solana programs in real-time.
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Development in Progress</span>
            </div>
            <div className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl flex items-center gap-3">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target: Q3 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIDEO PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-[2.5rem] overflow-hidden border border-slate-800 bg-black aspect-video relative group shadow-2xl"
        >
          <video 
            src="/Live.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-6 flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-widest">Sentinel Alpha v0.1.2</span>
          </div>
        </motion.div>

        <div className="space-y-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">How it Works</h2>
          
          <div className="space-y-6">
            {[
              { icon: Network, title: 'Helius Webhook Integration', desc: 'Direct connection to Solana RPC nodes via high-speed webhooks. Every instruction sent to your program is captured in milliseconds.' },
              { icon: Cpu, title: 'Real-Time AI Inference', desc: 'Our specialized watchdog model analyzes transaction data on-the-fly to detect malicious patterns (Reentrancy, Unauthorized Ownership, Drainers).' },
              { icon: Bell, title: 'Instant Alerting System', desc: 'Automated notifications via Telegram, Discord, or SMS the moment a high-severity threat is detected.' },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-rexy-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-rexy-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ROADMAP / FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: Shield, 
            title: 'Autonomous Defense', 
            desc: 'Future versions will include "Circuit Breakers" that can automatically pause your program if a critical exploit is confirmed.',
            status: 'Research'
          },
          { 
            icon: Globe, 
            title: 'Cross-Chain Support', 
            desc: 'Expanding monitoring capabilities to Ethereum, Base, and Arbitrum to provide a unified security dashboard.',
            status: 'Planned'
          },
          { 
            icon: Server, 
            title: 'On-Chain Proofs', 
            desc: 'Every security event and alert will be hashed and recorded on-chain for immutable auditing history.',
            status: 'Prototyping'
          }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] relative group hover:border-rexy-primary/50 transition-colors"
          >
            <div className="absolute top-6 right-6 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black uppercase tracking-widest text-slate-500">
              {feature.status}
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-rexy-primary/10 transition-colors">
              <feature.icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-rexy-primary transition-colors" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{feature.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* UNDER DEVELOPMENT OVERLAY FOR INTERACTIVE PARTS */}
      <div className="relative">
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-950/40 backdrop-blur-md rounded-[3rem] border border-dashed border-rexy-primary/30">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-2xl mb-4 border border-slate-200 dark:border-slate-800">
            <Lock className="w-8 h-8 text-rexy-primary" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Interactive Dashboard Locked</h3>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Coming soon in Phase 2 Release</p>
        </div>

        <div className="opacity-20 pointer-events-none filter grayscale">
          <div className="bg-rexy-card border border-rexy-border rounded-[3rem] p-12 flex gap-8 items-center">
            <div className="flex-1 space-y-4">
              <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            </div>
            <div className="w-48 h-12 bg-rexy-primary/20 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringView;
