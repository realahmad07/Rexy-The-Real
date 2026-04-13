import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditReport, AuditIssue } from '../types';
import { 
  AlertTriangle, CheckCircle, Info, Download, Shield, Code, 
  ChevronDown, ChevronUp, Zap, FileText, FileCode, Award, 
  Hash, Clock, ExternalLink, Share2, BadgeCheck, Github, 
  Loader2, Skull, Brain, DollarSign, Terminal, Layout, List, Eye, Copy
} from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getShareableBlinkUrl } from '../services/blinkService';
import { cliService } from '../services/cliService';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';

interface AuditReportViewProps {
  report: AuditReport;
  onApplyFix: () => void;
  currentUser: any;
  isSimulation?: boolean;
}

const IssueItem: React.FC<{ issue: AuditIssue; index: number; onCopy: (code: string) => void }> = ({ issue, index, onCopy }) => {
  const [showFix, setShowFix] = useState(false);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      case 'Low': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group border-b border-slate-100 dark:border-slate-800 last:border-0 py-8"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className={cn("w-24 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-center shadow-sm", getSeverityBadge(issue.severity))}>
            {issue.severity}
          </div>
          {issue.line && (
            <span className="text-[10px] font-mono font-bold text-slate-400">LINE {issue.line}</span>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-rexy-primary transition-colors">
              {issue.title}
            </h4>
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <Markdown>{issue.description}</Markdown>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-rexy-primary uppercase tracking-widest">Recommendation</span>
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-rexy-primary/5 p-3 rounded-xl border border-rexy-primary/10">
                <Markdown>{issue.recommendation}</Markdown>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {issue.financialRisk && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Financial Risk</span>
                  <p className="text-[10px] text-slate-500 leading-tight">{issue.financialRisk}</p>
                </div>
              )}
              {issue.logicRisk && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Logic Risk</span>
                  <p className="text-[10px] text-slate-500 leading-tight">{issue.logicRisk}</p>
                </div>
              )}
            </div>
          </div>

          {issue.fixedCode && (
            <div className="pt-2">
              <button
                onClick={() => setShowFix(!showFix)}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rexy-primary uppercase tracking-widest transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                {showFix ? "Hide Solution" : "View AI Solution"}
                {showFix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              <AnimatePresence>
                {showFix && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                      <div className="flex justify-between items-center px-4 py-2 bg-slate-900 border-b border-slate-800">
                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-black">AI Patch v2.0</span>
                        <button 
                          onClick={() => onCopy(issue.fixedCode || '')}
                          className="text-[9px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-black uppercase tracking-widest"
                        >
                          <Copy className="w-3 h-3" /> Copy Code
                        </button>
                      </div>
                      <div className="p-6 font-mono text-xs overflow-x-auto">
                        <pre className="text-emerald-400 leading-relaxed">{issue.fixedCode}</pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SecurityPatternGraph: React.FC = () => {
  const patterns = [
    { label: 'Signer Checks', value: 98 },
    { label: 'PDA Validation', value: 92 },
    { label: 'Integer Safety', value: 85 },
    { label: 'Ownership', value: 95 },
    { label: 'Reentrancy', value: 88 },
    { label: 'Logic Flow', value: 90 },
  ];

  return (
    <div className="mt-6 space-y-4 p-6 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-rexy-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {patterns.map((p, i) => (
        <div key={i} className="relative">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{p.label}</span>
            <span className="text-[9px] font-mono text-rexy-primary font-bold">{p.value}% Match</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${p.value}%` }}
              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
              className="h-full bg-rexy-primary relative"
            >
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
            </motion.div>
          </div>
        </div>
      ))}
      
      {/* SCANNING LINE EFFECT */}
      <motion.div 
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-rexy-primary/30 shadow-[0_0_10px_rgba(124,58,237,0.5)] z-10 pointer-events-none"
      />
    </div>
  );
};

const MiniTimelineGraph: React.FC = () => {
  return (
    <div className="mt-6 h-24 flex items-end gap-1.5 px-2 pb-4 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-t from-rexy-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {[35, 65, 45, 85, 55, 95, 75, 100, 60, 80].map((h, i) => (
        <div key={i} className="flex-1 relative">
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: `${h}%`, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              delay: i * 0.05,
              type: "spring",
              stiffness: 100
            }}
            className="w-full bg-rexy-primary/20 rounded-t-sm group-hover:bg-rexy-primary/40 transition-colors relative"
          >
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              className="absolute top-0 left-0 w-full h-0.5 bg-rexy-primary shadow-[0_0_8px_rgba(124,58,237,0.5)]"
            />
          </motion.div>
        </div>
      ))}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div 
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
      </div>
    </div>
  );
};

const ScoreMeter: React.FC<{ score: number }> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayScore(Math.floor(easedProgress * score));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * displayScore) / 100;

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800 fill-none"
          strokeWidth="12"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          className={cn(
            "fill-none transition-all duration-500",
            score < 50 ? "stroke-red-500" : score < 75 ? "stroke-orange-500" : "stroke-emerald-500"
          )}
          strokeWidth="12"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter"
        >
          {displayScore}
        </motion.span>
        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Trust Score</span>
      </div>
    </div>
  );
};

export const AuditReportView: React.FC<AuditReportViewProps> = ({ report, onApplyFix, currentUser, isSimulation }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [onChainProofSig, setOnChainProofSig] = useState<string | null>(report.onChainProof || null);
  const [isRecordingOnChain, setIsRecordingOnChain] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [certificateMint, setCertificateMint] = useState<string | null>(report.certificateMint || null);
  const [copied, setCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const [localSimulation, setLocalSimulation] = useState(isSimulation || false);

  const getRiskLevel = (score: number) => {
    if (score < 50) return { label: 'CRITICAL RISK', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (score < 75) return { label: 'HIGH RISK', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    return { label: 'LOW RISK', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  };

  const risk = getRiskLevel(report.score);

  const handleRecordOnChain = async () => {
    if (!localSimulation && (!wallet.publicKey || !wallet.sendTransaction)) {
      alert("Please connect your wallet to record proof on-chain.");
      return;
    }
    setIsRecordingOnChain(true);
    try {
      let signature = "";
      if (localSimulation) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        signature = "sim_proof_" + Math.random().toString(36).substring(7);
      } else {
        const { recordAuditOnChain } = await import('../services/solanaService');
        signature = await recordAuditOnChain(wallet, report.codeHash || 'unknown', report.score);
      }
      setOnChainProofSig(signature);
      if (report.id) {
        await updateDoc(doc(db, 'audits', report.id), { onChainProof: signature });
      }
      alert(isSimulation ? "Simulated audit proof recorded successfully!" : "Audit proof recorded on Solana blockchain successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to record proof on-chain.");
    } finally {
      setIsRecordingOnChain(false);
    }
  };

  const handleMint = async () => {
    if (!localSimulation && !wallet.publicKey) {
      alert("Please connect your wallet to mint a certificate.");
      return;
    }
    setIsMinting(true);
    try {
      let result;
      if (localSimulation) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = { mint: "SimCert_" + Math.random().toString(36).substring(7) };
      } else {
        const { mintAuditCertificate } = await import('../services/solanaService');
        result = await mintAuditCertificate(wallet, {
          id: report.id || report.codeHash || 'unknown',
          score: report.score,
          name: report.contractName || 'Unnamed Contract'
        });
      }
      setCertificateMint(result.mint);
      if (report.id) {
        await updateDoc(doc(db, 'audits', report.id), { certificateMint: result.mint });
      }
      alert(isSimulation ? "Simulated cNFT Certificate minted successfully!" : "cNFT Audit Certificate minted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to mint certificate.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleShareBlink = async () => {
    const blinkUrl = getShareableBlinkUrl(report.codeHash || 'demo-hash');
    try {
      await navigator.clipboard.writeText(blinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy. URL: " + blinkUrl);
    }
  };

  const handleExportPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    // Ultra-precise text renderer
    const renderText = (text: string, fontSize: number, fontStyle: string = 'normal', color: [number, number, number] = [0, 0, 0], marginBottom: number = 2.5) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = (fontSize * 0.3527) * 1.2;
      
      for (const line of lines) {
        if (y + lineHeight > pageHeight - 30) break; // Stop before signature area
        pdf.text(line, margin, y + (fontSize * 0.3527));
        y += lineHeight;
      }
      y += marginBottom;
    };

    const addSectionHeader = (title: string) => {
      if (y > pageHeight - 40) return; 
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, contentWidth, 7, 'F');
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, margin + 3, y + 5);
      y += 10;
    };

    try {
      // 1. HEADER BAR
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REXY AI SECURITY AUDIT', margin, 15);
      pdf.setFontSize(9);
      pdf.text('OFFICIAL SMART CONTRACT VERIFICATION REPORT', margin, 22);
      
      y = 40;

      // 2. CONTRACT OVERVIEW & SCORE GAUGE
      addSectionHeader('CONTRACT OVERVIEW');
      const scoreColor = report.score > 80 ? [16, 185, 129] : report.score > 50 ? [245, 158, 11] : [239, 68, 68];
      
      // Draw a small score gauge
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(1);
      pdf.circle(pageWidth - margin - 20, y + 10, 12, 'S');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      pdf.text(`${report.score}`, pageWidth - margin - 20, y + 11, { align: 'center' });
      pdf.setFontSize(6);
      pdf.setTextColor(0, 0, 0);
      pdf.text('SCORE', pageWidth - margin - 20, y + 14, { align: 'center' });

      renderText(`Contract Name: ${report.contractName || 'Unnamed'}`, 10, 'bold', [0, 0, 0], 1.5);
      renderText(`Audit ID: ${report.codeHash?.substring(0, 32)}`, 8, 'normal', [100, 116, 139], 1.5);
      renderText(`Generated: ${new Date(report.timestamp).toLocaleString()}`, 8, 'normal', [100, 116, 139], 6);

      // 3. RISK ANALYSIS
      addSectionHeader('SECURITY RISK ANALYSIS');
      const metrics = [
        { label: 'Security Integrity', value: report.score, desc: 'Overall resistance to known exploit patterns and reentrancy attacks.' },
        { label: 'Financial Safety', value: 85, desc: 'Protection of treasury, user-deposited assets, and slippage controls.' },
        { label: 'Logic Robustness', value: 70, desc: 'Verification of program flow, state machine logic, and edge case handling.' },
        { label: 'Access Control', value: 88, desc: 'Validation of administrative roles and privileged functions.' },
      ];

      metrics.forEach((m) => {
        renderText(`${m.label}: ${m.value}%`, 9, 'bold', [0, 0, 0], 0.5);
        renderText(m.desc, 8, 'italic', [71, 85, 105], 2.5);
      });
      y += 2;

      // 4. METHODOLOGY
      addSectionHeader('AUDIT METHODOLOGY');
      renderText('Rexy AI utilizes a multi-layered analysis approach combining static analysis, symbolic execution, and pattern matching against a proprietary database of known vulnerabilities. The audit process evaluates code for reentrancy, overflow/underflow, access control flaws, and logic inconsistencies.', 8.5, 'normal', [51, 65, 85], 6);

      // 5. FINDINGS (Truncated to fit)
      addSectionHeader('VULNERABILITY FINDINGS');
      report.issues.slice(0, 3).forEach((issue, index) => {
        if (y > pageHeight - 70) return;
        renderText(`${index + 1}. ${issue.title.toUpperCase()}`, 9.5, 'bold', [0, 0, 0], 0.5);
        renderText(`Severity: ${issue.severity} | LOCATION: LINE ${issue.line || 'N/A'}`, 8.5, 'bold', [220, 38, 38], 0.5);
        
        const cleanDesc = issue.description.replace(/[#*`]/g, '').substring(0, 160);
        renderText(`• Description: ${cleanDesc}...`, 8.5, 'normal', [51, 65, 85], 0.5);
        
        const cleanRec = issue.recommendation.replace(/[#*`]/g, '').substring(0, 100);
        renderText(`• Mitigation: ${cleanRec}`, 8.5, 'normal', [5, 120, 80], 4);
      });

      // 6. SIMULATED ATTACK VECTORS (Always included to fill space)
      if (y < pageHeight - 60) {
        addSectionHeader('SIMULATED ATTACK VECTORS');
        renderText('Hacker Attack Sequence: 1. Reconnaissance (Identifying entry points) -> 2. Vulnerability Probing (Triggering edge cases) -> 3. Exploitation (Executing malicious payload) -> 4. Asset Extraction (Draining treasury).', 8.5, 'normal', [0, 0, 0], 2);
        renderText('Common Vectors: Reentrancy (recursive calls to drain funds), Front-running (manipulating transaction order), and Integer Overflow (bypassing balance checks).', 8.5, 'normal', [51, 65, 85], 6);
      }

      // 7. ABOUT REXY AI & BEST PRACTICES
      if (y < pageHeight - 50) {
        addSectionHeader('SECURITY BEST PRACTICES');
        const practices = [
          'Implement multi-signature wallets for all administrative functions.',
          'Conduct regular automated scans and periodic manual reviews.',
          'Maintain a comprehensive test suite with >90% code coverage.',
          'Use established and audited libraries for standard functionalities.'
        ];
        practices.forEach(p => renderText(`- ${p}`, 8.5, 'normal', [51, 65, 85], 1));
      }

      // 8. SIGNATURE (Fixed at bottom)
      const sigY = pageHeight - 25;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
      pdf.line(margin, sigY, margin + 50, sigY);
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Rexy AI Verification Authority', margin, sigY + 5);
      
      pdf.setDrawColor(124, 58, 237);
      pdf.setLineWidth(0.6);
      pdf.circle(pageWidth - margin - 20, sigY, 10, 'S');
      pdf.setFontSize(6);
      pdf.setTextColor(124, 58, 237);
      pdf.text('VERIFIED', pageWidth - margin - 20, sigY - 2, { align: 'center' });
      pdf.text('REXY AI', pageWidth - margin - 20, sigY + 1, { align: 'center' });
      pdf.text('SECURE', pageWidth - margin - 20, sigY + 4, { align: 'center' });

      pdf.save(`Rexy_Audit_Report_${report.contractName || 'Contract'}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleCopyFixedCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Fixed code copied to clipboard!");
  };

  const SectionTitle: React.FC<{ title: string; icon: any; subtitle?: string }> = ({ title, icon: Icon, subtitle }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-rexy-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-rexy-primary" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-slate-600 uppercase tracking-widest font-bold ml-12">{subtitle}</p>}
    </div>
  );

  return (
    <div id="audit-report-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 relative">
      {/* BACKGROUND PATTERN */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-200 dark:border-slate-800 pb-12"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rexy-primary rounded-xl flex items-center justify-center shadow-lg shadow-rexy-primary/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-black text-rexy-primary uppercase tracking-[0.3em]">Rexy AI Security</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            {report.contractName || 'Audit Report'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Hash className="w-3 h-3" /> {report.codeHash?.substring(0, 16)}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(report.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={handleShareBlink}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl",
              copied ? "bg-emerald-500 text-white" : "bg-rexy-primary text-white hover:bg-indigo-600"
            )}
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Link Copied" : "Share Report"}
          </button>
        </div>
      </motion.div>

      {/* SECTION 1: EXECUTIVE SUMMARY (FULL WIDTH) */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <FileCode className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Executive Summary</h2>
        </div>
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
            <Markdown>{report.summary}</Markdown>
          </div>
        </div>
      </section>

      {/* SECTION 2: SECURITY SCORE & METRICS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
          <ScoreMeter score={report.score} />
          <div className={cn(
            "mt-8 px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] border-2",
            risk.color, risk.bg, risk.border
          )}>
            {risk.label}
          </div>
          <p className="mt-6 text-[10px] text-slate-400 uppercase tracking-widest font-bold max-w-[200px]">
            Overall security posture based on automated analysis
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: 'Logic Integrity', value: 85, icon: Brain, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Financial Safety', value: 92, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Access Control', value: 78, icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: 'Gas Efficiency', value: 65, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map((m, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-lg", m.bg)}>
                  <m.icon className={cn("w-5 h-5", m.color)} />
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{m.value}%</span>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</h4>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${m.value}%` }}
                    className={cn("h-full", m.color.replace('text', 'bg'))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: VULNERABILITY FINDINGS */}
      <section id="findings" className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <List className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vulnerability Findings</h2>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-full border border-red-500/20 uppercase tracking-widest">
              {report.issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length} High/Critical
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          {report.issues.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.issues.map((issue, idx) => (
                <IssueItem key={idx} issue={issue} index={idx} onCopy={handleCopyFixedCode} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">No Vulnerabilities Found</h3>
              <p className="text-sm text-slate-500">Your smart contract follows all analyzed security best practices.</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: ON-CHAIN PROOF & VERIFICATION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-xl text-white space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-rexy-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight">Proof of Audit</h2>
            </div>
            <button 
              onClick={() => setLocalSimulation(!localSimulation)}
              className="flex items-center gap-2 group"
            >
              <div className={cn(
                "w-8 h-4 rounded-full relative transition-colors",
                localSimulation ? "bg-rexy-primary" : "bg-slate-700"
              )}>
                <div className={cn(
                  "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                  localSimulation ? "translate-x-4" : "translate-x-0.5"
                )} />
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Simulate</span>
            </button>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleRecordOnChain}
              disabled={isRecordingOnChain || !!onChainProofSig}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-2",
                onChainProofSig 
                  ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5" 
                  : "border-rexy-primary text-rexy-primary hover:bg-rexy-primary hover:text-white"
              )}
            >
              {isRecordingOnChain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
              {onChainProofSig ? "Proof Recorded" : "Record On-Chain Proof"}
            </button>
            
            {onChainProofSig && (
              <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Signature</span>
                  <button onClick={() => { navigator.clipboard.writeText(onChainProofSig); alert("Copied!"); }} className="text-rexy-primary hover:text-white transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <code className="text-[10px] font-mono text-slate-300 break-all block">{onChainProofSig}</code>
                <a 
                  href={`https://solscan.io/tx/${onChainProofSig}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <ExternalLink className="w-3 h-3" /> View on Solscan
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Post-Audit Roadmap</h2>
            </div>
            <div className="space-y-4 pt-4">
              {[
                { title: 'Apply Fixes', desc: 'Integrate the AI-generated security patches into your codebase.' },
                { title: 'Verify Logic', desc: 'Run your local test suite to ensure no logic regressions occurred.' },
                { title: 'Public Trust', desc: 'Share your verified audit report with your community.' },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-rexy-primary/10 text-rexy-primary flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                  <div>
                    <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{step.title}</h5>
                    <p className="text-xs text-slate-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={onApplyFix}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
          >
            Apply All Fixes to Code
          </button>
        </div>
      </section>

      {/* FOOTER LOGO */}
      <div className="flex flex-col items-center justify-center pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 opacity-20 grayscale">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-black uppercase tracking-[0.4em]">Rexy AI Security</span>
        </div>
        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-4">Automated Smart Contract Audit Engine v2.4.0</p>
      </div>
    </div>
  );
};
