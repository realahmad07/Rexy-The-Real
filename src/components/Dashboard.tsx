import React, { useState, useEffect } from 'react';
import { KPISection } from './KPISection';
import { LiveBlockchainGraph } from './LiveBlockchainGraph';
import { VulnerabilityFeed } from './VulnerabilityFeed';
import { motion } from 'motion/react';
import { Shield, Zap, Activity, Users } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AuditReport } from '../types';

const Dashboard: React.FC = () => {
  const [recentAudits, setRecentAudits] = useState<AuditReport[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'audits'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const audits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditReport));
      setRecentAudits(audits);
    }, (error) => {
      console.error("Firestore Error in Dashboard audits listener:", error);
      if (error.message.includes('permission')) {
        try {
          handleFirestoreError(error, OperationType.LIST, 'audits');
        } catch (e) {
          // Handled
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <KPISection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-rexy-card border border-rexy-border rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <Shield className="w-48 h-48 text-rexy-primary" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Phase 1: Active</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Welcome to Rexy AI Auditor</h2>
              <p className="text-base text-slate-600 max-w-xl mb-8 leading-relaxed">
                The world's first real-time AI security layer for the Solana ecosystem. 
                We combine formal verification with advanced LLM reasoning to protect your protocols.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-rexy-primary/10 rounded-xl border border-rexy-primary/20">
                  <Zap className="w-4 h-4 text-rexy-primary" />
                  <span className="text-xs font-bold text-rexy-primary uppercase tracking-widest">Real-time Scanning</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">On-Chain Proofs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[400px] bg-rexy-card border border-rexy-border rounded-2xl overflow-hidden shadow-xl">
            <LiveBlockchainGraph />
          </div>
        </div>

        <div className="h-[600px] lg:h-auto bg-rexy-card border border-rexy-border rounded-2xl overflow-hidden shadow-xl">
          <VulnerabilityFeed />
        </div>
      </div>

      <div className="bg-rexy-card border border-rexy-border rounded-2xl p-8 shadow-xl">
        <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-rexy-primary" />
          Recent Audit Activity
        </h3>
        <div className="space-y-3">
          {recentAudits.length === 0 ? (
            <div className="text-center py-12 bg-rexy-bg/30 rounded-2xl border border-rexy-border border-dashed">
              <Shield className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
              <p className="text-slate-500 text-sm italic">No audits recorded yet. Start your first audit to see it here!</p>
            </div>
          ) : (
            recentAudits.map((audit, i) => (
              <motion.div 
                key={audit.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-5 bg-rexy-bg/50 rounded-2xl border border-rexy-border hover:border-rexy-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-rexy-primary/10 rounded-xl flex items-center justify-center text-rexy-primary font-black text-xl group-hover:scale-110 transition-transform shadow-inner">
                    {audit.contractName ? audit.contractName[0].toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">{audit.contractName || 'Smart Contract'}</div>
                    <div className="text-xs text-slate-500 font-medium">
                      {new Date(audit.timestamp).toLocaleTimeString()} • {audit.codeHash?.slice(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Security Score</div>
                    <div className="text-xl font-black text-rexy-primary">{audit.score}%</div>
                  </div>
                  <div className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border shadow-lg ${
                    audit.score >= 80 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10" 
                      : audit.score >= 50 
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10"
                      : "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10"
                  }`}>
                    {audit.score >= 80 ? 'Secure' : audit.score >= 50 ? 'Warning' : 'Critical'}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
