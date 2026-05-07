import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ShieldCheck, Settings, LogOut, Search, Activity, Info, BadgeCheck, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userEmail?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'audit', label: 'AI Audit', icon: ShieldCheck },
    { id: 'copilot', label: 'Rexy Copilot', icon: Activity },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isLeadAudit = userEmail === "247280@students.au.edu.pk";

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col relative overflow-hidden">
      {/* Subtle Glow background */}
      <div className="absolute top-0 left-0 w-full h-64 bg-rexy-primary/5 blur-[100px] pointer-events-none" />

      <div className="p-8 flex flex-col items-center relative z-10">
        <div className="relative w-20 h-20 mb-4 group">
          <div className="absolute inset-0 bg-rexy-primary/20 blur-xl group-hover:bg-rexy-primary/40 transition-colors duration-500 rounded-full" />
          <div className="relative w-full h-full bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center text-rexy-primary font-black text-4xl shadow-2xl">
            R
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-rexy-primary rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <h2 className="text-xl font-black tracking-tighter text-white uppercase">Rexy AI</h2>
            <div className="px-1.5 py-0.5 bg-rexy-primary/10 text-rexy-primary border border-rexy-primary/20 rounded text-[7px] font-black uppercase tracking-widest">v2.4</div>
          </div>
          <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full inline-block">
             <span className="text-[8px] uppercase tracking-[0.2em] text-slate-500 font-black">Beta Protocol Active</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1 relative z-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative",
              activeTab === item.id
                ? "bg-rexy-primary/10 text-rexy-primary"
                : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 w-1 h-3/5 bg-rexy-primary rounded-r-full"
              />
            )}
            <item.icon size={18} className={clsx(
              "transition-transform duration-300",
              activeTab === item.id ? "scale-110" : "group-hover:scale-110"
            )} />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-bold text-[13px] uppercase tracking-wider">{item.label}</span>
              {item.id === 'copilot' && (
                <span className="mt-1 px-1.5 py-0.5 bg-emerald-500 text-slate-900 text-[7px] font-black uppercase tracking-[0.15em] rounded shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse">
                  Real-Time
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto relative z-10">
        {/* User Profile Card */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-4 group hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
              <BadgeCheck className={cn("w-4 h-4", isLeadAudit ? "text-amber-400" : "text-slate-500")} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                {isLeadAudit ? "Lead Auditor" : "Analyst"}
              </span>
              <span className="text-[8px] font-mono text-slate-500 truncate lowercase">
                {userEmail || 'anonymous_node'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-between px-4 py-3 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Secure Exit</span>
          </div>
          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
