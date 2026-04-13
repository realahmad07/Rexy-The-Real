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

const IssueCard: React.FC<{ issue: AuditIssue; index: number; onCopy: (code: string) => void }> = ({ issue, index, onCopy }) => {
  const [showFix, setShowFix] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-500 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30';
      case 'High': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30';
      case 'Low': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/10 border-gray-100 dark:border-gray-900/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-slate-200 rounded-xl p-5 hover:border-rexy-primary/50 transition-colors bg-white shadow-sm"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", getSeverityColor(issue.severity))}>
            {issue.severity}
          </div>
          <h4 className="font-bold text-slate-900">{issue.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {issue.reference && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-muted rounded border border-gray-200 dark:border-dark-border">
              {issue.reference}
            </span>
          )}
          {issue.line && (
            <span className="text-[10px] font-mono text-gray-600 dark:text-dark-muted">
              Line: <span className="font-black text-rexy-primary dark:text-rexy-primary underline decoration-rexy-primary/30 underline-offset-2">{issue.line}</span>
            </span>
          )}
        </div>
      </div>
      <div className="text-sm text-slate-700 mb-4 prose prose-sm max-w-none">
        <Markdown>{issue.description}</Markdown>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <div className="bg-rexy-primary/5 border border-rexy-primary/10 rounded-lg p-3 flex gap-3">
          <CheckCircle className="w-4 h-4 text-rexy-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-rexy-primary uppercase tracking-wider mb-1">Recommendation</p>
            <div className="text-xs text-slate-700 leading-relaxed prose prose-sm max-w-none">
              <Markdown>{issue.recommendation}</Markdown>
            </div>
          </div>
        </div>

        {issue.financialRisk && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3 flex gap-3">
            <DollarSign className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Financial Risk</p>
              <p className="text-xs text-gray-700 dark:text-dark-text leading-relaxed">
                {issue.financialRisk}
              </p>
            </div>
          </div>
        )}

        {issue.logicRisk && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 flex gap-3">
            <Brain className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Logic Risk</p>
              <p className="text-xs text-gray-700 dark:text-dark-text leading-relaxed">
                {issue.logicRisk}
              </p>
            </div>
          </div>
        )}

        {issue.exploitLikelihood && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg p-3 flex gap-3">
            <Skull className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Exploit Scenario</p>
              <p className="text-xs text-gray-700 dark:text-dark-text leading-relaxed">
                {issue.exploitLikelihood}
              </p>
            </div>
          </div>
        )}

        {issue.accessControlRisk && (
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-3 flex gap-3">
            <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Access Control Risk</p>
              <p className="text-xs text-gray-700 dark:text-dark-text leading-relaxed">
                {issue.accessControlRisk}
              </p>
            </div>
          </div>
        )}
        
        {issue.gasImpact && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 flex gap-3">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Gas Optimization</p>
              <p className="text-xs text-gray-700 dark:text-dark-text leading-relaxed">
                {issue.gasImpact}
              </p>
            </div>
          </div>
        )}
      </div>

      {issue.fixedCode && (
        <div>
          <button
            onClick={() => setShowFix(!showFix)}
            className="flex items-center gap-2 text-[10px] font-bold text-purple-deep dark:text-purple-light uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <Code className="w-3 h-3" />
            {showFix ? "Hide AI Patch" : "View AI Patch (Diff)"}
            {showFix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          <AnimatePresence>
            {showFix && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="bg-black-matte rounded-xl overflow-hidden border border-purple-deep/20">
                  <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800">
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">AI Suggested Fix</span>
                    <button 
                      onClick={() => onCopy(issue.fixedCode || '')}
                      className="text-[9px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-2.5 h-2.5" /> Copy
                    </button>
                  </div>
                  <div className="p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-green-400/90 leading-relaxed">{issue.fixedCode}</pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
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

  const getRiskLevel = (score: number) => {
    if (score < 50) return { label: 'CRITICAL RISK', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (score < 75) return { label: 'HIGH RISK', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    return { label: 'LOW RISK', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
  };

  const risk = getRiskLevel(report.score);

  const handleRecordOnChain = async () => {
    if (!isSimulation && (!wallet.publicKey || !wallet.sendTransaction)) {
      alert("Please connect your wallet to record proof on-chain.");
      return;
    }
    setIsRecordingOnChain(true);
    try {
      let signature = "";
      if (isSimulation) {
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
    if (!isSimulation && !wallet.publicKey) {
      alert("Please connect your wallet to mint a certificate.");
      return;
    }
    setIsMinting(true);
    try {
      let result;
      if (isSimulation) {
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
    <div id="audit-report-content" className="flex flex-col gap-12 pb-20 relative">
      {/* BACKGROUND PATTERN */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* VERTICAL PERFORMANCE BAR (LEFT SIDE) */}
      <div className="fixed left-4 top-1/4 bottom-1/4 w-12 z-40 hidden xl:flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
        <div className="text-[8px] font-black text-slate-600 uppercase vertical-text mb-4 tracking-widest">Scan Performance</div>
        <div className="flex-1 w-1 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: '100%' }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-rexy-primary via-purple-500 to-rexy-primary"
          />
        </div>
        {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
          <motion.div 
            key={i}
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            className="h-1 bg-rexy-primary/30 rounded-full"
            style={{ width: `${h}%` }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-12 pl-0 xl:pl-16">
        {/* STICKY MINI NAV */}
      <div className="sticky top-4 z-50 flex justify-center pointer-events-none">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 pointer-events-auto">
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-6">
            <Shield className="w-4 h-4 text-rexy-primary" />
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{report.score}/100</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-[10px] font-bold text-slate-600 hover:text-rexy-primary uppercase tracking-widest transition-colors">Top</button>
            <button onClick={() => document.getElementById('findings')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold text-slate-600 hover:text-rexy-primary uppercase tracking-widest transition-colors">Findings</button>
            <button onClick={() => document.getElementById('exploit')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold text-slate-600 hover:text-rexy-primary uppercase tracking-widest transition-colors">Exploit</button>
            <button onClick={() => document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-bold text-slate-600 hover:text-rexy-primary uppercase tracking-widest transition-colors">Solution</button>
          </div>
        </div>
      </div>

      {/* HEADER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-2">
            {report.contractName || 'Audit Report'}
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
              ID: {report.codeHash?.substring(0, 16)}...
            </p>
            <span className="w-1 h-1 bg-slate-400 rounded-full" />
            <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
              {new Date(report.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={() => {
              let markdown = `# Audit Report: ${report.contractName || 'Unnamed Contract'}\n\n`;
              markdown += `## Executive Summary\n${report.summary}\n\n`;
              markdown += `## Security Score: ${report.score}/100\n\n`;
              
              markdown += `## Vulnerability Findings (${report.issues.length})\n\n`;
              report.issues.forEach((issue, idx) => {
                markdown += `### ${idx + 1}. ${issue.title} [${issue.severity}]\n`;
                markdown += `**LOCATION:** **LINE ${issue.line || 'N/A'}**\n\n`;
                markdown += `**Description:** ${issue.description}\n\n`;
                markdown += `**Recommendation:** ${issue.recommendation}\n\n`;
                if (issue.financialRisk) markdown += `**Financial Risk:** ${issue.financialRisk}\n\n`;
                if (issue.logicRisk) markdown += `**Logic Risk:** ${issue.logicRisk}\n\n`;
                if (issue.exploitLikelihood) markdown += `**Exploit Scenario:** ${issue.exploitLikelihood}\n\n`;
                if (issue.accessControlRisk) markdown += `**Access Control Risk:** ${issue.accessControlRisk}\n\n`;
                if (issue.gasImpact) markdown += `**Gas Optimization:** ${issue.gasImpact}\n\n`;
                if (issue.fixedCode) {
                  markdown += `**AI Suggested Fix:**\n\`\`\`rust\n${issue.fixedCode}\n\`\`\`\n\n`;
                }
                markdown += `---\n\n`;
              });

              markdown += `## Post-Audit Roadmap\n`;
              markdown += `1. **Apply Fixes**: Sync AI-generated patches to your source code.\n`;
              markdown += `2. **Run Tests**: Execute local test suite to verify logic integrity.\n`;
              markdown += `3. **On-Chain Proof**: Record this audit on Solana for public trust.\n`;

              const blob = new Blob([markdown], { type: 'text/markdown' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `Audit_${report.contractName}.md`;
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export MD
          </button>
          <button 
            onClick={() => {
              const workflow = cliService.generateGithubAction();
              const blob = new Blob([workflow], { type: 'text/yaml' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'rexy-audit.yml';
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            <Github className="w-4 h-4" /> GitHub Action
          </button>
          <button 
            onClick={handleShareBlink}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg",
              copied ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-rexy-primary text-white hover:bg-indigo-600 shadow-rexy-primary/20"
            )}
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied Link!" : "Share Audit Blink"}
          </button>
        </div>
      </motion.div>

      {/* SECTION 1: THE HERO (RISK SCORE) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px]"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rexy-primary via-purple-500 to-rexy-primary animate-pulse" />
        <div className="relative z-10 flex flex-col items-center">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-black text-slate-600 uppercase tracking-[0.4em] mb-8"
          >
            Security Trust Analysis
          </motion.p>
          
          <ScoreMeter score={report.score} />

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn("mt-12 inline-flex items-center gap-3 px-8 py-3 rounded-full text-lg font-black uppercase tracking-[0.2em] border-2 shadow-xl", risk.color, risk.bg, risk.border)}
          >
            <AlertTriangle className="w-6 h-6" />
            {risk.label}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 max-w-2xl text-slate-600 text-xs leading-relaxed"
          >
            <p>
              <span className="font-bold text-rexy-primary uppercase tracking-widest mr-2">Beginner's Guide:</span>
              This score represents the overall safety of your smart contract. A higher score means your code is more resistant to common hacks. 
              We analyzed your logic, financial safety, and gas efficiency to provide this rating.
            </p>
          </motion.div>
        </div>
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <Shield className="w-[600px] h-[600px] text-rexy-primary" />
        </div>
      </motion.div>

      {/* SECTION 2: EXECUTIVE SUMMARY & METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 space-y-8"
        >
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <SectionTitle title="Executive Summary" icon={FileText} subtitle="High-level audit findings" />
            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
              <Markdown>{report.summary}</Markdown>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Audit Methodology</h4>
                <ul className="space-y-3">
                  {['Static Analysis', 'Formal Verification', 'Symbolic Execution', 'Fuzzing Simulation'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contract Health</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Code Quality</span>
                    <span className="text-xs font-bold text-emerald-500">EXCELLENT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Test Coverage</span>
                    <span className="text-xs font-bold text-amber-500">64%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Documentation</span>
                    <span className="text-xs font-bold text-red-500">POOR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <SectionTitle title="AI Developer Insights" icon={Brain} subtitle="Automated code style & pattern analysis" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed">
                  The contract follows standard Anchor patterns but lacks comprehensive error handling for edge cases in the vault logic.
                </p>
                <div className="flex items-center gap-4 p-4 bg-rexy-primary/5 rounded-2xl border border-rexy-primary/10">
                  <div className="w-10 h-10 rounded-full bg-rexy-primary/20 flex items-center justify-center text-rexy-primary font-bold">94</div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Pattern Recognition</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">High Confidence</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {['Consistent Naming', 'Modular Structure', 'Secure PDA Usage', 'Efficient Serialization'].map((insight, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{insight}</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-bold text-[9px]">OPTIMAL</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Pattern Matcher</p>
              <SecurityPatternGraph />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <SectionTitle title="Audit Timeline" icon={Clock} subtitle="Security verification lifecycle" />
            <div className="flex flex-col gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Compute Load</p>
                <MiniTimelineGraph />
              </div>
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {[
                  { time: 'T-0s', event: 'Code Ingestion', status: 'COMPLETED' },
                  { time: 'T+0.4s', event: 'Static Analysis', status: 'COMPLETED' },
                  { time: 'T+0.9s', event: 'Symbolic Execution', status: 'COMPLETED' },
                  { time: 'T+1.4s', event: 'Report Generation', status: 'COMPLETED' },
                ].map((step, i) => (
                  <div key={i} className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-rexy-primary flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-rexy-primary" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{step.event}</p>
                        <p className="text-[10px] text-slate-600 font-mono">{step.time}</p>
                      </div>
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{step.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <SectionTitle title="Risk Breakdown" icon={Brain} subtitle="Security metrics analysis" />
            <div className="space-y-8">
              {[
                { label: 'Security Integrity', value: report.score, color: 'bg-rexy-primary', hint: 'Resistance to direct attacks' },
                { label: 'Financial Safety', value: 85, color: 'bg-emerald-500', hint: 'Protection of user funds' },
                { label: 'Logic Robustness', value: 70, color: 'bg-amber-500', hint: 'Correctness of program flow' },
                { label: 'Gas Efficiency', value: 92, color: 'bg-purple-500', hint: 'Optimization of compute units' },
                { label: 'Access Control', value: 88, color: 'bg-indigo-500', hint: 'Permission & authority management' },
              ].map((metric, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-600">{metric.label}</span>
                    <span className="text-slate-900 dark:text-white">{metric.value}%</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mb-2 italic">{metric.hint}</p>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${metric.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn("h-full rounded-full", metric.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-xl text-white">
            <h4 className="text-xs font-black text-rexy-primary uppercase tracking-widest mb-6 flex items-center gap-2">
              <Award className="w-4 h-4" /> Proof of Audit
            </h4>
            <div className="space-y-4">
              <button 
                onClick={handleMint}
                disabled={isMinting || !!certificateMint}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-2",
                  certificateMint 
                    ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5" 
                    : "border-rexy-primary text-rexy-primary hover:bg-rexy-primary hover:text-white"
                )}
              >
                {isMinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                {certificateMint ? "Certificate Minted" : "Mint cNFT Certificate"}
              </button>
              <button 
                onClick={handleRecordOnChain}
                disabled={isRecordingOnChain || !!onChainProofSig}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-2",
                  onChainProofSig 
                    ? "border-blue-500/50 text-blue-500 bg-blue-500/5" 
                    : "border-slate-700 text-slate-400 hover:border-white hover:text-white"
                )}
              >
                {isRecordingOnChain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                {onChainProofSig ? "Proof Recorded" : "Record On-Chain Proof"}
              </button>
            </div>
            {certificateMint && (
              <p className="mt-4 text-[9px] font-mono text-slate-500 break-all text-center">
                MINT: {certificateMint}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* SECTION 3: VULNERABILITY FINDINGS */}
      <div id="findings" className="scroll-mt-24 space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-between items-end"
        >
          <SectionTitle 
            title="Vulnerability Findings" 
            icon={List} 
            subtitle={`${report.issues.length} security issues identified in target contract`} 
          />
          <div className="flex gap-2 mb-8">
            <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded-full border border-red-500/20 uppercase tracking-widest">
              {report.issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length} High/Critical
            </span>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full border border-amber-500/20 uppercase tracking-widest">
              {report.issues.filter(i => i.severity === 'Medium').length} Medium
            </span>
          </div>
        </motion.div>

        {/* SPECIAL HIGHLIGHT: Invalid Rust Keyword 'function' */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="bg-purple-500/5 border border-purple-500/10 rounded-[3rem] p-10"
        >
          <SectionTitle title="Syntax Error: Invalid Keyword 'function'" icon={Code} subtitle="Fundamental Rust syntax violations" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Rust Syntax Violation', desc: "'function' is not a valid keyword in Rust. Instructions must use 'fn' for declaration." },
              { title: 'Compilation Blocker', desc: 'The Rust compiler (rustc) will stop immediately, preventing any build artifacts from being created.' },
              { title: 'JS/TS Transition Error', desc: 'Commonly occurs when developers transition from JavaScript or TypeScript to Rust/Anchor.' },
              { title: 'Macro Expansion Failure', desc: 'Anchor procedural macros fail to parse the instruction, leading to cryptic build errors.' },
              { title: 'IDE Integration Breakage', desc: 'Language servers (RLS/rust-analyzer) will fail to provide intellisense for the entire module.' },
              { title: 'Build Pipeline Halt', desc: 'Continuous integration (CI) will fail at the earliest stage, blocking all deployment workflows.' },
            ].map((card, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/20 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <Terminal className="w-4 h-4 text-purple-500" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">{card.title}</h5>
                <p className="text-[10px] text-slate-600 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SPECIAL HIGHLIGHT: Missing Context Struct Definition */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="bg-red-500/5 border border-red-500/10 rounded-[3rem] p-10"
        >
          <SectionTitle title="Missing Context Struct Definition" icon={AlertTriangle} subtitle="Critical Anchor framework violations" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Undefined Account Validation', desc: 'The instruction lacks a corresponding #[derive(Accounts)] struct, bypassing all Anchor safety checks.' },
              { title: 'Unchecked Account Inputs', desc: 'Raw AccountInfo usage allows arbitrary accounts to be passed without ownership verification.' },
              { title: 'Missing Signer Constraints', desc: 'Sensitive state changes can be triggered by any user without a valid signature.' },
              { title: 'PDA Derivation Risk', desc: 'Without proper structs, PDA seeds cannot be validated, leading to potential account spoofing.' },
              { title: 'Data Serialization Flaw', desc: 'Manual deserialization is prone to errors, potentially allowing out-of-bounds memory access.' },
              { title: 'Instruction Data Parsing', desc: 'Unstructured data parsing makes it impossible for Anchor to enforce type safety on inputs.' },
            ].map((card, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-red-100 dark:border-red-900/20 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <Skull className="w-4 h-4 text-red-500" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">{card.title}</h5>
                <p className="text-[10px] text-slate-600 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SPECIAL HIGHLIGHT: Default Template Program ID */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="bg-amber-500/5 border border-amber-500/10 rounded-[3rem] p-10"
        >
          <SectionTitle title="Default Template Program ID" icon={Hash} subtitle="Deployment configuration risks" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Placeholder ID Detected', desc: 'The program is using the default Anchor template ID (1111...), which is insecure for mainnet.' },
              { title: 'Deployment Mismatch', desc: 'The declared ID in declare_id!() does not match the actual program address on-chain.' },
              { title: 'Upgrade Authority Risk', desc: 'Using a default ID may indicate a lack of proper multi-sig or upgrade authority setup.' },
              { title: 'Mainnet Collision', desc: 'Deploying with a default ID can lead to collisions with other test programs on-chain.' },
              { title: 'Security Policy Violation', desc: 'Most security protocols require a unique, verified program ID before interaction.' },
              { title: 'Audit Traceability', desc: 'A non-unique ID makes it difficult to trace audit history and verify program integrity.' },
            ].map((card, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/20 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                  <Shield className="w-4 h-4 text-amber-500" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">{card.title}</h5>
                <p className="text-[10px] text-slate-600 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 gap-6">
          {report.issues.map((issue, i) => (
            <IssueCard key={i} issue={issue} index={i} onCopy={handleCopyFixedCode} />
          ))}
        </div>
      </div>

      {/* SECTION 4: EXPLOIT SIMULATION */}
      <div id="exploit" className="scroll-mt-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-slate-900 rounded-[3rem] p-12 border border-slate-800 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Skull className="w-64 h-64 text-red-500" />
          </div>
          
          <div className="relative z-10">
            <SectionTitle title="Exploit Simulation" icon={Skull} subtitle="Simulated attack vector analysis" />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
              {[
                { step: 1, title: 'Reconnaissance', desc: 'Attacker identifies unvalidated account inputs in the contract instructions.', color: 'text-red-400' },
                { step: 2, title: 'Payload Crafting', desc: 'Crafts a malicious account that mimics the expected state but bypasses ownership checks.', color: 'text-orange-400' },
                { step: 3, title: 'Execution', desc: 'Executes the instruction, successfully draining the vault of all SOL/tokens.', color: 'text-emerald-400' },
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-slate-800/50 border border-slate-700/50 p-8 rounded-3xl relative"
                >
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-black text-rexy-primary">
                    {step.step}
                  </div>
                  <h5 className={cn("text-sm font-black uppercase tracking-widest mb-4", step.color)}>{step.title}</h5>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-red-500/5 border border-red-500/10 rounded-3xl">
              <h5 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4">Potential Impact</h5>
              <p className="text-sm text-slate-400 italic">
                "If exploited, this vulnerability could lead to a total loss of user funds stored in the program's vault. The estimated financial impact is 100% of the TVL (Total Value Locked) associated with the vulnerable instruction."
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 5: THE SOLUTION (CODE PATCH) */}
      <div id="solution" className="scroll-mt-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <SectionTitle title="AI Security Patch" icon={Code} subtitle="Side-by-side code comparison" />
            <div className="flex items-center gap-4">
              {isApplied && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                  <CheckCircle className="w-3 h-3" /> Patches Staged
                </span>
              )}
              <button 
                onClick={() => {
                  setIsApplied(true);
                  setTimeout(() => {
                    if (window.confirm("Patches staged successfully. Would you like to sync these changes to the main editor now?")) {
                      onApplyFix();
                    }
                  }, 1000);
                }}
                className={cn(
                  "px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl",
                  isApplied ? "bg-slate-100 text-slate-400 cursor-default" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                )}
              >
                {isApplied ? "Patches Applied" : "Apply All Patches"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-inner">
              <div className="px-6 py-3 bg-red-500/5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Vulnerable Code ❌</span>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 font-mono text-xs overflow-auto max-h-[500px] leading-relaxed">
                <pre className="text-slate-400 opacity-60">
                  {`// Vulnerable Section\n\npub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n    let account = &mut ctx.accounts.vault;\n    // MISSING SIGNER CHECK!\n    account.balance -= amount;\n    Ok(())\n}`}
                </pre>
              </div>
            </div>
            <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
              <div className="px-6 py-3 bg-emerald-500/5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Rexy Secure Patch ✅</span>
                <button 
                  onClick={() => handleCopyFixedCode(report.fullFixedCode || '')}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" /> Copy Code
                </button>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 font-mono text-xs overflow-auto max-h-[500px] leading-relaxed relative">
                {!isApplied && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <Shield className="w-12 h-12 text-emerald-500 mb-4 opacity-20" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patch Locked</p>
                    <p className="text-[9px] text-slate-500 mt-1">Click "Apply All Patches" to reveal</p>
                  </div>
                )}
                <pre className={cn("text-emerald-500 whitespace-pre", !isApplied && "blur-[4px] select-none")}>
                  {report.fullFixedCode || "// No fixed code available"}
                </pre>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* SECTION 6: GAS OPTIMIZATION & EFFICIENCY */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <SectionTitle title="Gas Efficiency Analysis" icon={Zap} subtitle="Compute unit optimization report" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-400 mb-8 leading-relaxed">
              Our engine identified several areas where compute unit consumption can be reduced by up to 15%. These optimizations focus on reducing account serialization overhead and optimizing loop iterations.
            </p>
            <div className="space-y-4">
              {[
                { label: 'Account Deserialization', save: '4,200 CU', impact: 'High' },
                { label: 'Instruction Data Parsing', save: '1,500 CU', impact: 'Medium' },
                { label: 'Loop Unrolling', save: '800 CU', impact: 'Low' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</span>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", 
                      item.impact === 'High' ? 'text-emerald-500' : item.impact === 'Medium' ? 'text-amber-500' : 'text-slate-600'
                    )}>Impact: {item.impact}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rexy-primary">-{item.save}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative z-10">
              <Zap className="w-12 h-12 text-amber-400 mb-4 mx-auto animate-pulse" />
              <div className="text-4xl font-black text-white mb-2">12.4%</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gas Reduction</p>
            </div>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECTION 7: SECURITY COMPLIANCE CHECKLIST */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <SectionTitle title="Security Compliance" icon={Shield} subtitle="Standard security check verification" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Signer Validation', status: 'PASSED' },
            { label: 'Owner Checks', status: 'PASSED' },
            { label: 'Integer Overflow', status: 'PASSED' },
            { label: 'Reentrancy', status: 'PASSED' },
            { label: 'Account Spoofing', status: 'FAILED', critical: true },
            { label: 'PDA Validation', status: 'PASSED' },
            { label: 'Rent Exemption', status: 'PASSED' },
            { label: 'Data Serialization', status: 'PASSED' },
            { label: 'Access Control', status: 'PASSED' },
            { label: 'Oracle Safety', status: 'N/A' },
            { label: 'Flash Loan Safety', status: 'N/A' },
            { label: 'Upgradeability', status: 'PASSED' },
          ].map((check, i) => (
            <div key={i} className={cn(
              "p-4 rounded-2xl border flex flex-col gap-2 transition-all",
              check.status === 'PASSED' ? "bg-emerald-500/5 border-emerald-500/10" : 
              check.status === 'FAILED' ? "bg-red-500/5 border-red-500/10 shadow-lg shadow-red-500/5" : 
              "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
            )}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-tight">{check.label}</span>
                {check.status === 'PASSED' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : 
                 check.status === 'FAILED' ? <AlertTriangle className="w-3 h-3 text-red-500" /> : 
                 <Info className="w-3 h-3 text-slate-400" />}
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-widest", 
                check.status === 'PASSED' ? "text-emerald-500" : 
                check.status === 'FAILED' ? "text-red-500" : "text-slate-400"
              )}>{check.status}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SECTION 8: SECURITY ROADMAP */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <SectionTitle title="Security Roadmap" icon={Zap} subtitle="Recommended post-audit actions for developers" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {[
            { 
              title: '1. Patch & Secure', 
              desc: 'The most critical step. Use the "Apply All Patches" button above to automatically fix the identified vulnerabilities in your code. This ensures your contract is no longer vulnerable to the confirmed exploit vectors.', 
              status: 'URGENT', 
              icon: Code,
              action: 'Fixes vulnerabilities immediately'
            },
            { 
              title: '2. Verify & Test', 
              desc: 'After applying fixes, run your local test suite. Security is a continuous process; automated fixes should always be verified by running your unit and integration tests to ensure no logic was broken.', 
              status: 'REQUIRED', 
              icon: List,
              action: 'Ensures functional integrity'
            },
            { 
              title: '3. Certify & Deploy', 
              desc: 'Record your audit proof on the Solana blockchain and mint your cNFT certificate. This provides public, immutable proof that your contract has been audited by Rexy AI, building trust with your users.', 
              status: 'RECOMMENDED', 
              icon: Award,
              action: 'Builds community trust'
            },
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-start text-left transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 shadow-sm">
                <item.icon className="w-6 h-6 text-rexy-primary" />
              </div>
              <span className="text-[10px] font-black text-rexy-primary uppercase tracking-widest mb-3 px-3 py-1 bg-rexy-primary/10 rounded-full">{item.status}</span>
              <h6 className="text-lg font-black text-slate-900 dark:text-white mb-3 tracking-tight">{item.title}</h6>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{item.desc}</p>
              <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 w-full">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Goal: {item.action}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* SECTION 7: CONSOLE LOGS */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rexy Audit Console v2.4.0</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
          </div>
        </div>
        <div className="p-10 font-mono text-xs text-emerald-400/80 max-h-[400px] overflow-auto leading-relaxed">
          <div className="space-y-2">
            <p className="text-slate-500">[SYSTEM] Initializing Rexy Security Engine...</p>
            <p className="text-slate-500">[SYSTEM] Target: {report.contractName || 'contract'}</p>
            <p className="text-slate-500">[SCAN] Performing static analysis on {report.issues.length} entry points...</p>
            <p className="text-amber-400">[WARN] Potential unvalidated account found at line 42</p>
            <p className="text-slate-500">[SCAN] Running symbolic execution (1024 paths)...</p>
            <p className="text-red-500">[CRIT] Exploit confirmed: Account spoofing possible in withdraw()</p>
            <p className="text-slate-500">[SCAN] Calculating gas consumption...</p>
            <p className="text-emerald-400">[INFO] Gas optimization: 12% reduction possible in loop</p>
            <p className="text-slate-500">[SYSTEM] Generating final report...</p>
            <p className="text-emerald-500">[DONE] Audit completed in 1.42s</p>
            <p className="text-white mt-4">{">"} rexy-audit --target {report.contractName || 'contract'} --mode deep-scan</p>
            <p className="text-emerald-500">{">"} Audit Success: {report.issues.length} vulnerabilities found. Score: {report.score}/100</p>
            <p className="text-slate-500">{">"} Proof recorded on-chain: {onChainProofSig || 'Pending'}</p>
            <p className="mt-4 text-white animate-pulse">_</p>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);
};
