import React from 'react';
import { motion } from 'motion/react';
import { Activity, ShieldCheck, Zap, Globe } from 'lucide-react';

import { cn } from '../lib/utils';

import { AuditReport } from '../types';

interface KPISectionProps {
  report?: AuditReport | null;
}

export const KPISection: React.FC<KPISectionProps> = ({ report }) => {
  const kpis = [
    { label: report ? "Audit Score" : "Global Audits", value: report ? `${report.score}/100` : "14,208", delta: report ? "Current Code" : "+124 today", icon: Globe },
    { label: report ? "Issues Found" : "Vulnerabilities Patched", value: report ? report.issues.length.toString() : "3,892", delta: report ? "Security Risks" : "+12 this hour", icon: ShieldCheck },
    { label: "Solana Ecosystem", value: "Anchor & Rust", delta: "Hackathon Edition", icon: Zap },
    { label: "System Status", value: report?.onChainProof ? "Verified" : "Operational", delta: report?.onChainProof ? "On-Chain Proof" : "100% Uptime", icon: Activity },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-rexy-card border border-rexy-border rounded-2xl p-5 shadow-xl hover:shadow-rexy-primary/5 transition-all group overflow-hidden relative"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-rexy-primary/0 to-rexy-primary/0 group-hover:from-rexy-primary/[0.02] transition-all duration-500" />
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-rexy-primary/10 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative">
              <kpi.icon className="w-5 h-5 text-rexy-primary relative z-10" />
              <div className="absolute inset-0 bg-rexy-primary/20 rounded-xl animate-pulse blur-sm" />
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border shadow-sm",
              i === 3 ? "text-rexy-primary bg-rexy-primary/5 border-rexy-primary/10" : "text-emerald-500 bg-emerald-500/5 border-emerald-500/10"
            )}>
              {kpi.delta}
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-70">{kpi.label}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter group-hover:translate-x-1 transition-transform duration-300">{kpi.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
