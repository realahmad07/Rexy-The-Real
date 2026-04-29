import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShieldCheck, Settings, LogOut, Search, Activity, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'audit', label: 'AI Audit', icon: ShieldCheck },
    { id: 'copilot', label: 'Rexy Copilot', icon: Activity },
    { id: 'info', label: 'Info', icon: Info },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-4">
          <div className="w-full h-full bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400 font-bold text-4xl">
            R
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tighter text-indigo-400">Rexy</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">The Real AI Auditor</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === item.id
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            )}
          >
            <item.icon size={20} className={clsx(
              "transition-transform duration-200",
              activeTab === item.id ? "scale-110" : "group-hover:scale-110"
            )} />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-bold text-sm">{item.label}</span>
              {item.id === 'copilot' && (
                <span className="mt-1 px-1.5 py-0.5 bg-amber-400 text-slate-900 text-[8px] font-black uppercase tracking-[0.15em] rounded shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  Live
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
