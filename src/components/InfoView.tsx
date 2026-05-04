import React from 'react';
import { motion } from 'motion/react';
import { Info, Cpu, Zap, Shield, User, Github, Twitter, Globe, Code2, Rocket, Activity, Users, Lock, ChevronRight, Award, Wallet, Search, CheckCircle, Database } from 'lucide-react';

const InfoView: React.FC = () => {
  const roadmap = [
    {
      phase: "Phase 1",
      status: "Current",
      title: "Multi-Stage AI Audits",
      description: "Static analysis, rule-based detection, and attack simulations for Solana & Solidity.",
      icon: Shield,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      phase: "Phase 2",
      status: "Under Dev",
      title: "Rexy Sentinel Agents",
      description: "24/7 autonomous monitoring for deployed mainnet contracts.",
      icon: Activity,
      color: "text-rexy-primary",
      bgColor: "bg-rexy-primary/10"
    },
    {
      phase: "Phase 3",
      status: "Q4 2026",
      title: "Verification Marketplace",
      description: "Connecting AI reasoning with top-tier human security researchers.",
      icon: Users,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      phase: "Phase 4",
      status: "2027",
      title: "ZK-Proof of Inference",
      description: "Absolute mathematical certainty for AI-driven security.",
      icon: Lock,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className="bg-rexy-card border border-rexy-border rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Info className="w-64 h-64 text-rexy-primary" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rexy-primary/10 rounded-full border border-rexy-primary/20 mb-6">
              <Rocket className="w-4 h-4 text-rexy-primary" />
              <span className="text-[10px] font-black text-rexy-primary uppercase tracking-widest">About Rexy AI</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
              The Future of <span className="text-rexy-primary">Smart Contract</span> Security.
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Rexy is a next-generation AI auditor built specifically for the high-speed, high-stakes world of Solana. 
              By combining advanced Large Language Models with formal verification patterns, we provide developers 
              with a real-time security layer that doesn't just find bugs—it fixes them.
            </p>
          </div>

          <div className="flex flex-col gap-6 w-full h-full justify-center">
            {/* Video 1: Platform Overview */}
            <div className="relative group w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-rexy-primary to-rexy-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black border border-rexy-border rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <div className="px-4 py-3 border-b border-rexy-border/50 bg-slate-900 flex items-center justify-between z-10 relative">
                  <span className="text-[10px] font-black text-rexy-primary uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Platform Overview
                  </span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                  </div>
                </div>
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  preload="auto"
                  className="w-full aspect-video object-cover"
                >
                  <source src="/Backend.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Features and Engine Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* App Features */}
        <div className="bg-rexy-card border border-rexy-border rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            App Features
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Search className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Instant Code Audits</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Paste your Solana (Rust/Anchor) code and receive immediate AI-powered vulnerability scans, highlighting potential exploits.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Activity className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Interactive Fixes</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Rexy doesn't just list issues; it generates patched code with syntax-highlighted diffs that you can copy in one click.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">On-Chain Proofs & cNFTs</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Hash your audited contract and securely record its proof onto the Solana blockchain. Mint standard cNFTs to verify security compliance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Engine We Are Using */}
        <div className="bg-rexy-card border border-rexy-border rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-indigo-500" />
            The AI Engine
          </h3>
          <div className="space-y-6">
            <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/20">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-900">Gemini 1.5 Pro</h4>
                <span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase rounded-lg">Core Backend</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                We leverage Google's state-of-the-art Gemini 1.5 Pro model for deep static analysis. With its massive 1M+ token context window, it can review massive codebases in a single pass, understanding the relationships between thousands of files at once.
              </p>
            </div>
            <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-900">Custom System Prompts</h4>
                <span className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-black uppercase rounded-lg">Fine-tuned</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                The engine is heavily injected with custom prompt constraints focusing exclusively on the Solana Sealevel execution environment, Anchor frameworks, and known PDA/Signer exploits.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Why Solana Section */}
        <div className="bg-rexy-card border border-rexy-border rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Zap className="w-6 h-6 text-rexy-primary" />
            Why Solana?
          </h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Parallel Processing</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Solana's Sealevel runtime allows for parallel transaction execution. Rexy is designed to handle the complexity of account-based concurrency.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-rexy-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-rexy-primary" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">High Throughput & Low Fees</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  With 65k+ TPS and fractions of a cent in fees, security must be scalable. Solana allows us to record audit proofs securely and mint cNFTs extremely cheaply.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Anchor Framework Ready</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  We provide deep support for Anchor/Rust, detecting common pitfalls like missing signer checks and PDA validation errors native to Solana development.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Phantom Section */}
        <div className="bg-rexy-card border border-rexy-border rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
            <Wallet className="w-48 h-48 text-purple-500" />
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-purple-500" />
            Why Phantom?
          </h3>
          
          <div className="space-y-6 relative z-10">
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              We exclusively chose Phantom Wallet because it's widely adopted as the most trusted, secure, and user-friendly wallet for the Solana ecosystem.
            </p>
            <div className="p-6 bg-purple-500/5 rounded-2xl border border-purple-500/20">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-900">Seamless Authentication</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect once to unlock the full potential of Rexy. Pay standard minimum gas fees seamlessly from Phantom without leaving the app.
              </p>
            </div>

            <div className="p-6 bg-purple-500/5 rounded-2xl border border-purple-500/20">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-900">Secure Audit Signing</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use Phantom to mathematically sign your smart contract audit proofs. The wallet ensures you're authorizing exactly what you see.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Developer Section */}
        <div className="bg-rexy-card border border-rexy-border rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 opacity-[0.05] pointer-events-none">
            <Code2 className="w-48 h-48 text-rexy-primary" />
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <User className="w-6 h-6 text-rexy-primary" />
            Meet the Developer
          </h3>
          
          <div className="flex flex-col items-center text-center py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-rexy-primary/20 blur-xl rounded-full"></div>
              {/* Using standard img tag. For the user: Just upload your real developer image locally or use link. Using the provided pic context. */}
              <img 
                src="/developer-dp.jpg" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad';
                }}
                alt="Ahmad Hassan" 
                className="relative w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-rexy-primary/30 shadow-2xl z-10 bg-slate-100"
              />
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-1">Ahmad Hassan</h4>
            <p className="text-rexy-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Visionary Full-Stack Blockchain Engineer</p>
            
            <p className="text-sm text-slate-600 max-w-lg mb-8 leading-relaxed">
              Ahmad is a passionate developer focused on building secure, robust, and scalable infrastructure for the decentralized web. 
              As the sole creator of the Rexy platform, he combined deep expertise in Rust and frontend engineering to empower the next generation of Solana builders. 
            </p>
            
            <div className="flex gap-4 relative z-10">
              <button className="p-3 bg-slate-100 hover:bg-rexy-primary hover:text-white rounded-xl transition-all text-slate-600">
                <Github className="w-5 h-5" />
              </button>
              <button className="p-3 bg-slate-100 hover:bg-rexy-primary hover:text-white rounded-xl transition-all text-slate-600">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="p-3 bg-slate-100 hover:bg-rexy-primary hover:text-white rounded-xl transition-all text-slate-600">
                <Globe className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap Section */}
      <div className="bg-rexy-card border border-rexy-border rounded-3xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">The Road to "Elite Rexy V2"</h3>
            <p className="text-sm text-slate-500 font-medium">Our vision for the future of Solana security.</p>
          </div>
          <div className="px-4 py-2 bg-rexy-primary/10 rounded-xl border border-rexy-primary/20 flex items-center gap-2">
            <div className="w-2 h-2 bg-rexy-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-rexy-primary uppercase tracking-widest">Active Development</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
          
          {roadmap.map((item, i) => (
            <motion.div 
              key={item.phase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative z-10 bg-rexy-bg border border-rexy-border rounded-2xl p-6 hover:border-rexy-primary/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${i === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}>
                  {item.status}
                </span>
              </div>
              <h4 className="text-[10px] font-black text-rexy-primary uppercase tracking-[0.2em] mb-1">{item.phase}</h4>
              <h5 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h5>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
              
              {i < roadmap.length - 1 && (
                <div className="lg:hidden mt-6 flex justify-center">
                  <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-rexy-primary/5 border border-rexy-primary/10 rounded-3xl p-8 text-center">
        <h3 className="text-sm font-black text-rexy-primary uppercase tracking-[0.3em] mb-4">Our Mission</h3>
        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed italic mb-8">
          "To make smart contract security accessible, automated, and immutable for every developer on the planet, 
          starting with the most performant blockchain in existence."
        </p>
        <div className="pt-8 border-t border-rexy-primary/10">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Legal & Compliance</h4>
          <p className="text-xs text-slate-500 max-w-xl mx-auto text-justify leading-relaxed">
            Rexy AI Auditor operates under the **Global Decentralized Security Standards of 2026**. All audits are performed in isolated environments. We do not retain source code after analysis. By using this platform, you agree to our immutable terms of service recorded on the Solana ledger.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoView;
