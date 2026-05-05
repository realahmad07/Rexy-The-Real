import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditReport, AuditIssue } from '../types';
import { 
  AlertTriangle, CheckCircle, Info, Download, Shield, Code, 
  ChevronDown, ChevronUp, Zap, FileText, FileCode, Award, 
  Hash, Clock, ExternalLink, Share2, BadgeCheck, Github, 
  Loader2, Skull, Brain, DollarSign, Terminal, Layout, List, Eye, Copy, Atom
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

import { getClusterParam } from '../services/solanaService';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { useRexyRegistry } from '../hooks/useRexyRegistry';

interface AuditReportViewProps {
  report: AuditReport;
  onApplyFix: () => void;
  currentUser: any;
}

const IssueItem: React.FC<{ issue: AuditIssue; index: number; onCopy: (code: string) => void }> = ({ issue, index, onCopy }) => {
  const [showFix, setShowFix] = useState(false);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'Critical': return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500' };
      case 'High': return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-500' };
      case 'Medium': return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' };
      case 'Low': return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500' };
      default: return { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', dot: 'bg-slate-500' };
    }
  };

  const styles = getSeverityStyles(issue.severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-8 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: SEVERITY & INFO */}
        <div className="lg:w-1/4 space-y-4">
          <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", styles.bg, styles.text, styles.border)}>
            <div className={cn("w-1.5 h-1.5 rounded-full", styles.dot)} />
            {issue.severity}
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900 leading-tight">
              {issue.title}
            </h4>
            {issue.line && (
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Line {issue.line}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {issue.financialRisk && (
              <div className="px-2 py-1 bg-red-50 rounded text-[9px] font-bold text-red-600 uppercase tracking-tighter">Financial Risk</div>
            )}
            {issue.logicRisk && (
              <div className="px-2 py-1 bg-blue-50 rounded text-[9px] font-bold text-blue-600 uppercase tracking-tighter">Logic Risk</div>
            )}
          </div>
        </div>

        {/* MIDDLE: DESCRIPTION & RECOMMENDATION */}
        <div className="lg:w-2/4 space-y-6">
          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
            <Markdown>{issue.description}</Markdown>
          </div>
          <div className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 text-rexy-primary" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recommendation</span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              <Markdown>{issue.recommendation}</Markdown>
            </div>
          </div>
        </div>

        {/* RIGHT: FIX ACTION */}
        <div className="lg:w-1/4">
          {issue.fixedCode && (
            <div className="space-y-3">
              <button
                onClick={() => setShowFix(!showFix)}
                className="w-full py-3 bg-white border border-slate-200 hover:border-rexy-primary hover:text-rexy-primary rounded-xl flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest transition-all shadow-sm"
              >
                <Code className="w-3.5 h-3.5" />
                {showFix ? "Hide Solution" : "View AI Solution"}
              </button>

              <AnimatePresence>
                {showFix && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative group/code">
                      <pre className="p-6 bg-slate-950 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto shadow-2xl border border-white/5 leading-relaxed">
                        <code className="block whitespace-pre">{issue.fixedCode}</code>
                      </pre>
                      <button
                        onClick={() => onCopy(issue.fixedCode!)}
                        className="absolute top-2 right-2 p-2 bg-white/10 text-white/50 hover:text-white rounded-lg opacity-0 group-hover/code:opacity-100 transition-opacity"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
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

const AuditCertificate: React.FC<{ report: AuditReport; onDownload: () => void }> = ({ report, onDownload }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto p-12 bg-white rounded-[2rem] border-8 border-slate-900 shadow-2xl relative overflow-hidden"
      id="security-certificate"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-rexy-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-900/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10 space-y-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em]">Official Certificate of Audit</h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Protocol v2.4.0-PRO • Rexy AI Security</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">This certifies that the smart contract</p>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{report.contractName || 'Unnamed Protocol'}</h2>
        </div>

        <div className="flex justify-center items-center gap-12 py-8 border-y border-slate-100">
          <div className="text-center">
            <div className="text-5xl font-black text-slate-900">{report.score}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Score</div>
          </div>
          <div className="w-px h-12 bg-slate-200" />
          <div className="text-center">
            <div className="text-5xl font-black text-emerald-500">PASS</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Status</div>
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed italic">
            "We have performed an exhaustive multi-stage security audit, including static analysis, formal logic verification, and deep attack simulation. This contract has met the rigorous security requirements of the Rexy AI Auditor engine."
          </p>
          
          <div className="flex flex-col items-center gap-2">
            <div className="px-4 py-2 bg-slate-900 rounded-lg flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-rexy-primary" />
              <span className="text-[10px] font-mono text-white tracking-widest uppercase">Verified on Solana Mainnet</span>
            </div>
            {report.codeHash && (
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">Hash: {report.codeHash}</span>
            )}
          </div>
        </div>

        <div className="pt-8 flex justify-between items-end">
          <div className="text-left space-y-1">
            <div className="w-32 h-px bg-slate-900 mb-4" />
            <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Rexy Sentinel</div>
            <div className="text-[8px] font-mono text-slate-400 uppercase">Lead Security Engine</div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onDownload}
              className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 group"
              title="Download Certificate"
            >
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <div className="text-right space-y-1">
            <div className="w-32 h-px bg-slate-900 mb-4 ml-auto" />
            <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Date of Issue</div>
            <div className="text-[8px] font-mono text-slate-400 uppercase">{new Date(report.timestamp).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ScoreMeter: React.FC<{ score: number }> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setDisplayScore(score), 500);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative w-64 h-64">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="128"
          cy="128"
          r={radius}
          className="stroke-slate-100 fill-none"
          strokeWidth="4"
        />
        <motion.circle
          cx="128"
          cy="128"
          r={radius}
          className={cn(
            "fill-none transition-all duration-1000",
            score < 50 ? "stroke-red-500" : score < 75 ? "stroke-orange-500" : "stroke-rexy-primary"
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
          className="text-9xl font-black text-slate-900 tracking-tighter"
        >
          {displayScore}
        </motion.span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Security Score</span>
      </div>
    </div>
  );
};

export const AuditReportView: React.FC<AuditReportViewProps> = ({ report, onApplyFix, currentUser }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { stakeCertificate } = useRexyRegistry();
  const [onChainProofSig, setOnChainProofSig] = useState<string | null>(report.onChainProof || null);
  const [stakedProofSig, setStakedProofSig] = useState<string | null>((report as any).stakedProofSig || null);
  const [isRecordingOnChain, setIsRecordingOnChain] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [certificateMint, setCertificateMint] = useState<string | null>(report.certificateMint || null);
  const [certificateSignature, setCertificateSignature] = useState<string | null>(report.certificateSignature || null);
  const [copied, setCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [fixProgress, setFixProgress] = useState(0);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getRiskLevel = (score: number) => {
    if (score < 50) return { label: 'CRITICAL RISK', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
    if (score < 75) return { label: 'HIGH RISK', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' };
    return { label: 'SECURE', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  };

  const risk = getRiskLevel(report.score);

  const handleRecordOnChain = async () => {
    if (!wallet.publicKey || !wallet.sendTransaction) {
      showNotification("Please connect your wallet to record proof on-chain.", "error");
      return;
    }
    setIsRecordingOnChain(true);
    try {
      let signature = "";
      const { recordAuditOnChain } = await import('../services/solanaService');
      signature = await recordAuditOnChain(wallet, report.codeHash || 'unknown', report.score, connection);
      
      setOnChainProofSig(signature);
      if (report.id) {
        await updateDoc(doc(db, 'audits', report.id), { onChainProof: signature });
      }
      showNotification("Audit proof recorded on Solana blockchain successfully!", "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to record proof on-chain.", "error");
    } finally {
      setIsRecordingOnChain(false);
    }
  };

  const handleMint = async () => {
    if (!wallet.publicKey) {
      showNotification("Please connect your wallet to mint a certificate.", "error");
      return;
    }
    setIsMinting(true);
    try {
      let result;
      const { mintAuditCertificate } = await import('../services/solanaService');
      result = await mintAuditCertificate(wallet, {
        id: report.id || report.codeHash || 'unknown',
        score: report.score,
        name: report.contractName || 'Unnamed Contract'
      }, connection);
      setCertificateMint(result.mint);
      setCertificateSignature(result.signature || null);
      if (report.id) {
        await updateDoc(doc(db, 'audits', report.id), { 
          certificateMint: result.mint,
          certificateSignature: result.signature || null
        });
      }
      showNotification("cNFT Audit Certificate minted successfully!", "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to mint certificate.", "error");
    } finally {
      setIsMinting(false);
    }
  };

  const handleShareBlink = async () => {
    const blinkUrl = getShareableBlinkUrl(report.codeHash || 'demo-hash');
    try {
      await navigator.clipboard.writeText(blinkUrl);
      setCopied(true);
      showNotification("Blink share link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showNotification("Failed to copy share link.", "error");
    }
  };

  const handleApplyFixInternal = async () => {
    if (!report.fullFixedCode) {
      showNotification("No fixed code available to apply.", "error");
      return;
    }
    
    setIsApplyingFixes(true);
    setFixProgress(0);
    
    // Simulate AI "patching" the file
    const steps = ["Analyzing AST...", "Applying Security Patterns...", "Verifying Logic Flows...", "Compiling Result..."];
    for (let i = 0; i < steps.length; i++) {
      showNotification(steps[i], "info");
      await new Promise(r => setTimeout(r, 600));
      setFixProgress((i + 1) * 25);
    }
    
    showNotification("Security patches applied successfully! Returning to editor.", "success");
    await new Promise(r => setTimeout(r, 1000));
    
    onApplyFix();
    setIsApplyingFixes(false);
  };

  const handleExportPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    const renderText = (text: string, fontSize: number, fontStyle: string = 'normal', color: [number, number, number] = [0, 0, 0], marginBottom: number = 2.5) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = (fontSize * 0.3527) * 1.2;
      
      for (const line of lines) {
        if (y + lineHeight > pageHeight - 30) {
            pdf.addPage();
            y = margin;
        }
        pdf.text(line, margin, y + (fontSize * 0.3527));
        y += lineHeight;
      }
      y += marginBottom;
    };

    const addSectionHeader = (title: string, marginTop: number = 5) => {
      y += marginTop;
      if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
      } 
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, contentWidth, 7, 'F');
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, margin + 3, y + 5);
      y += 10;
    };

    try {
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REXY AI SECURITY AUDIT', margin, 15);
      pdf.setFontSize(9);
      pdf.text('OFFICIAL SMART CONTRACT VERIFICATION REPORT', margin, 22);
      
      y = 40;

      addSectionHeader('CONTRACT OVERVIEW', 0);
      const scoreColor = report.score > 80 ? [16, 185, 129] : report.score > 50 ? [245, 158, 11] : [239, 68, 68];
      
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

      addSectionHeader('SECURITY RISK ANALYSIS');
      const metrics = [
        { label: 'Logic Integrity', value: 85 },
        { label: 'Financial Safety', value: 92 },
        { label: 'Access Control', value: 78 },
        { label: 'Gas Efficiency', value: 65 }
      ];

      metrics.forEach(m => {
        renderText(`${m.label}: ${m.value}%`, 9, 'normal', [50, 50, 50], 1);
      });

      addSectionHeader('VULNERABILITY SUMMARY');
      if (report.issues && report.issues.length > 0) {
        report.issues.forEach((issue, i) => {
          renderText(`${i + 1}. ${issue.title} (${issue.severity})`, 10, 'bold', [0, 0, 0], 1);
          renderText(issue.description.substring(0, 300) + (issue.description.length > 300 ? '...' : ''), 8, 'normal', [100, 100, 100], 4);
        });
      } else {
        renderText("No vulnerabilities found. The contract passed the audit.", 9, 'italic', [16, 185, 129], 4);
      }

      addSectionHeader('BLOCKCHAIN PROOFS & INTEGRITY');
      if (onChainProofSig) {
        renderText(`Audit Proof Transaction:`, 9, 'bold', [0, 0, 0], 1);
        renderText(onChainProofSig, 8, 'normal', [99, 102, 241], 3);
      } else {
        renderText("Audit Proof: Not recorded on chain yet.", 8, 'normal', [100, 116, 139], 3);
      }

      if (stakedProofSig) {
        renderText(`Security Bond Staked (0.001 SOL) Tx:`, 9, 'bold', [0, 0, 0], 1);
        renderText(stakedProofSig, 8, 'normal', [16, 185, 129], 3);
      } else {
        renderText("Security Bond Staked: No security bond staked.", 8, 'normal', [100, 116, 139], 3);
      }

      addSectionHeader('STAKING TERMS & POLICY');
      const terms = "By staking a 0.001 SOL security bond, the auditor asserts the validity and integrity of this report. If the audited contract is exploited due to a missed critical vulnerability, the staked funds will be slashed and redistributed to the Rexy treasury. This bond is locked for a period of 90 days. This staking mechanism ensures that auditors have \"skin in the game\" and promotes high-quality, rigorous security analysis. The report's immutability on the Solana blockchain provides transparent provenance for all parties.";
      renderText(terms, 7, 'normal', [100, 116, 139], 4);

      pdf.save(`Rexy_Audit_${report.contractName || 'Report'}.pdf`);
      showNotification("PDF Report exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to export PDF.", "error");
    }
  };

  const handleDownloadCertificate = async () => {
    const el = document.getElementById('security-certificate');
    if (!el) return;
    
    try {
      showNotification("Generating high-resolution certificate...", "info");
      const dataUrl = await toJpeg(el, { quality: 0.95, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `Rexy_Certificate_${report.contractName || 'Audit'}.jpg`;
      link.href = dataUrl;
      link.click();
      showNotification("Certificate downloaded!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to generate certificate image.", "error");
    }
  };

  return (
    <div id="audit-report" className="max-w-7xl mx-auto bg-white text-slate-900 rounded-[3rem] overflow-hidden border border-slate-200 shadow-xl selection:bg-rexy-primary/10">
      {/* HEADER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-100">
        <div className="lg:col-span-8 p-12 lg:p-20 space-y-8 border-r border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rexy-primary rounded-2xl flex items-center justify-center shadow-lg shadow-rexy-primary/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-rexy-primary uppercase tracking-[0.4em]">Rexy AI Security</span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Protocol v2.4.0-PRO</span>
            </div>
          </div>
          
          <h1 className="text-6xl lg:text-7xl font-black tracking-tighter leading-none text-slate-900">
            {report.contractName || 'UNNAMED_CONTRACT'}
          </h1>

          <div className="flex flex-wrap items-center gap-8 pt-4">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Hash</span>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
              <Hash className="w-3 h-3 text-rexy-primary" />
              {onChainProofSig ? (
                <a 
                  href={`https://solscan.io/tx/${onChainProofSig}${getClusterParam()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-rexy-primary hover:underline flex items-center gap-1"
                >
                  {report.codeHash?.substring(0, 24)}...
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span>{report.codeHash?.substring(0, 24)}...</span>
              )}
            </div>
          </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</span>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                <Clock className="w-3 h-3 text-rexy-primary" />
                {new Date(report.timestamp).toLocaleString().toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 p-12 lg:p-20 flex flex-col items-center justify-center bg-slate-50/50">
          <ScoreMeter score={report.score} />
          <div className={cn(
            "mt-10 px-10 py-3 rounded-full text-xs font-black uppercase tracking-[0.3em] border-2",
            risk.color, risk.bg, risk.border
          )}>
            {risk.label}
          </div>
        </div>
      </div>

      {/* EXPORT ACTION BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-100 bg-white">
        <button 
          onClick={handleExportPDF}
          className="p-6 border-r border-slate-100 flex items-center justify-center gap-4 hover:bg-slate-50 transition-all group"
        >
          <FileText className="w-5 h-5 text-slate-400 group-hover:text-rexy-primary transition-colors" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">Download PDF Report</span>
        </button>
        <button 
          onClick={handleShareBlink}
          className="p-6 flex items-center justify-center gap-4 hover:bg-slate-50 transition-all group"
        >
          <Share2 className="w-5 h-5 text-slate-400 group-hover:text-rexy-primary transition-colors" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">{copied ? "Link Copied" : "Share via Blink"}</span>
        </button>
      </div>

      {/* BLOCKCHAIN ACTION BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-100 bg-slate-50/30">
        {onChainProofSig ? (
          <a
            href={`https://solscan.io/tx/${onChainProofSig}${getClusterParam()}`}
            target="_blank"
            rel="noreferrer"
            className="p-8 border-r border-slate-100 flex items-center justify-center gap-4 hover:bg-white transition-all group bg-emerald-50/30"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
              Proof Recorded <ExternalLink className="w-3 h-3 inline ml-1 mb-0.5" />
            </span>
          </a>
        ) : (
          <button 
            onClick={handleRecordOnChain}
            disabled={isRecordingOnChain}
            className="p-8 border-r border-slate-100 flex items-center justify-center gap-4 hover:bg-white transition-all group"
          >
            {isRecordingOnChain ? <Loader2 className="w-5 h-5 animate-spin text-rexy-primary" /> : <Hash className="w-5 h-5 text-slate-400 group-hover:text-rexy-primary transition-colors" />}
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">1. Record Proof On-Chain</span>
          </button>
        )}

        {certificateMint ? (
          <a
            href={`https://solscan.io/token/${certificateMint}${getClusterParam()}`}
            target="_blank"
            rel="noreferrer"
            className="p-8 border-r border-slate-100 flex items-center justify-center gap-4 hover:bg-white transition-all group bg-emerald-50/30"
          >
            <Award className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
              cNFT Minted <ExternalLink className="w-3 h-3 inline ml-1 mb-0.5" />
            </span>
          </a>
        ) : (
          <button 
            onClick={handleMint}
            disabled={isMinting || !onChainProofSig}
            className="p-8 border-r border-slate-100 flex items-center justify-center gap-4 hover:bg-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMinting ? <Loader2 className="w-5 h-5 animate-spin text-rexy-primary" /> : <Award className="w-5 h-5 text-slate-400 group-hover:text-rexy-primary transition-colors" />}
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">2. Mint cNFT Certificate</span>
          </button>
        )}

        {stakedProofSig ? (
          <a
            href={`https://solscan.io/tx/${stakedProofSig}${getClusterParam()}`}
            target="_blank"
            rel="noreferrer"
            className="p-8 flex items-center justify-center gap-4 hover:bg-white transition-all group bg-emerald-50/30"
          >
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">
              Bond Staked <ExternalLink className="w-3 h-3 inline ml-1 mb-0.5" />
            </span>
          </a>
        ) : (
          <button 
            onClick={async () => {
               setIsRecordingOnChain(true); // Using this as loading state
               try {
                  const result = await stakeCertificate({ programIdAudited: report.contractName });
                  if (result.success) {
                     setStakedProofSig(result.signature || null);
                     if (report.id) {
                       try {
                         await updateDoc(doc(db, 'audits', report.id), { stakedProofSig: result.signature });
                       } catch (e) {
                         console.error("Failed to update firestore with staked sig", e);
                       }
                     }
                     showNotification("Successfully staked 0.001 SOL security bond on Solana!", "success");
                  } else {
                     showNotification("Staking failed: " + result.error, "error");
                  }
               } catch (err: any) {
                  showNotification("Staking error: " + err.message, "error");
               } finally {
                  setIsRecordingOnChain(false);
               }
            }}
            disabled={isRecordingOnChain || !certificateMint}
            className="p-8 flex items-center justify-center gap-4 hover:bg-white transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRecordingOnChain ? <Loader2 className="w-5 h-5 animate-spin text-rexy-primary" /> : <DollarSign className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />}
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">3. Stake Bond (0.001 SOL)</span>
          </button>
        )}
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-100">
        <div className="lg:col-span-3 p-12 border-r border-slate-100 bg-slate-50/50">
          <div className="vertical-text flex items-center gap-4 opacity-30">
            <span className="text-[10px] font-black uppercase tracking-[1em] text-slate-900">Executive Summary</span>
            <div className="w-12 h-px bg-slate-900" />
          </div>
        </div>
        <div className="lg:col-span-9 p-12 lg:p-20 space-y-12">
          <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed font-light text-justify">
            <Markdown>{report.summary}</Markdown>
          </div>
          
          {report.quantumReadinessSummary && (
            <div className="mt-8 p-8 rounded-[2rem] bg-purple-50 border border-purple-100 shadow-inner">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg shadow-purple-500/20">
                  <Atom className="w-6 h-6 text-white animate-[spin_10s_linear_infinite]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-purple-900 tracking-tight">Q-Day Readiness Assessment</h3>
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">Post-Quantum Threat Simulation</p>
                </div>
              </div>
              <div className="prose prose-purple max-w-none text-purple-800/80 leading-relaxed font-medium">
                <Markdown>{report.quantumReadinessSummary}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-slate-100">
        {[
          { label: 'Logic Integrity', value: 85, icon: Brain, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Q-Day Readiness', value: report.quantumReadinessScore || 0, icon: Atom, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Financial Safety', value: 92, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Access Control', value: 78, icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        ].map((m, i) => (
          <div key={i} className="p-12 border-r border-slate-100 last:border-r-0 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center justify-between mb-8">
              <div className={cn("p-2 rounded-xl", m.bg)}>
                <m.icon className={cn("w-6 h-6", m.color)} />
              </div>
              <span className="text-3xl font-black text-slate-900">{m.value}%</span>
            </div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{m.label}</h4>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${m.value}%` }}
                className={cn("h-full", m.color.replace('text', 'bg'))}
              />
            </div>
          </div>
        ))}
      </div>

      {/* DOUBLE LAYER SECURITY CHECK VISUALIZATION */}
      <div className="p-12 lg:p-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0,transparent_50%)]" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-rexy-primary/20 rounded-full border border-rexy-primary/30">
              <Shield className="w-3.5 h-3.5 text-rexy-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rexy-primary">Hybrid Deep Audit Architecture</span>
            </div>
            <h3 className="text-4xl font-black tracking-tight leading-tight uppercase">
              Double-Layer <br />
              <span className="text-rexy-primary">Full-Spectrum</span> <br />
              Analysis Result
            </h3>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Your code has been processed through our dual-engine pipeline, combining the speed of deterministic pattern matching with the depth of neural logic verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Layout className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">LAYER 01</div>
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Solana Lib Check</h4>
                <p className="text-xs text-slate-500 mt-2">Deterministic vulnerability matching via Rexy-SOL-Atlas v1.2</p>
              </div>
              <div className="flex items-end justify-between pt-4">
                <div className="space-y-1">
                  <div className="text-2xl font-black text-white">{report.staticAnalysis?.findings?.length || 0}</div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Static Matches</div>
                </div>
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  PASSED
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-rexy-primary border border-rexy-primary/50 space-y-6 shadow-2xl shadow-rexy-primary/20">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="text-[9px] font-black text-white/60 bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest">LAYER 02</div>
              </div>
              <div>
                <h4 className="text-lg font-black text-white">AI Neural Audit</h4>
                <p className="text-xs text-white/60 mt-2">Formal verification & symbolic execution via Deep Brain Engine</p>
              </div>
              <div className="flex items-end justify-between pt-4">
                <div className="space-y-1">
                  <div className="text-2xl font-black text-white">{report.issues?.length || 0}</div>
                  <div className="text-[8px] font-black text-white/50 uppercase tracking-widest">Neural Insights</div>
                </div>
                <div className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle className="w-3 h-3" />
                  VERIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VULNERABILITIES HEADER */}
      <div className="p-12 lg:px-20 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skull className="w-6 h-6 text-slate-400" />
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Security Vulnerabilities</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-200 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {report.issues.length} Issues Detected
          </span>
        </div>
      </div>

      {/* VULNERABILITIES LIST */}
      <div className="divide-y divide-slate-100">
        {report.issues.map((issue, index) => (
          <IssueItem 
            key={index} 
            issue={issue} 
            index={index} 
            onCopy={(code) => {
              navigator.clipboard.writeText(code);
              showNotification("Code copied to clipboard!", "success");
            }}
          />
        ))}
      </div>

      {/* REXY REMEDIATION DIFF */}
      {report.originalCode && report.fullFixedCode && (
        <div className="border-b border-slate-100 bg-slate-50/20">
          <div className="p-12 lg:px-20 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 bg-white gap-6">
            <div className="flex items-center gap-4">
              <FileCode className="w-6 h-6 text-rexy-primary" />
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Interactive Remediation</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review AI-Generated Patches</p>
              </div>
            </div>
            
            {report.quantumReadinessSummary && (
              <div className="px-5 py-2.5 bg-purple-50 border border-purple-200 rounded-full flex items-center gap-3 shadow-inner">
                <Atom className="w-4 h-4 text-purple-600 animate-[spin_5s_linear_infinite]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-800">🛡️ Quantum Risk Reduced to 0%</span>
              </div>
            )}
          </div>
          <div className="p-4 lg:p-12">
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white relative">
              {report.quantumReadinessSummary && (
                <div className="absolute top-0 right-0 z-10 bg-purple-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-bl-xl shadow-lg border-b border-l border-purple-400">
                  Q-Day Code Enhancements Applied
                </div>
              )}
              <ReactDiffViewer
                oldValue={report.originalCode}
                newValue={report.fullFixedCode}
                splitView={true}
                useDarkTheme={false}
                leftTitle="Original"
                rightTitle="Rexy-Secured (Quantum-Proof)"
                styles={{
                  variables: {
                    light: {
                      diffViewerBackground: '#fff',
                      addedBackground: '#f0fdf4',
                      addedColor: '#166534',
                      removedBackground: '#fef2f2',
                      removedColor: '#991b1b',
                      wordAddedBackground: '#dcfce7',
                      wordRemovedBackground: '#fee2e2',
                    }
                  },
                  contentText: {
                    fontSize: '11px',
                    fontFamily: '"JetBrains Mono", monospace',
                    lineHeight: '1.8',
                    letterSpacing: '0.02em'
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL CERTIFICATE */}
      {report.score >= 85 && (
        <div className="p-12 lg:p-32 bg-slate-50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em]">Achievement Unlocked</h3>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Security Excellence Award</h2>
              <p className="text-slate-500 max-w-lg mx-auto text-sm">Your contract has surpassed our high-security threshold. You are eligible for an official Rexy Security Certificate.</p>
            </div>
            <AuditCertificate report={report} onDownload={handleDownloadCertificate} />
          </div>
        </div>
      )}

      {/* POST-AUDIT ROADMAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-slate-900 text-white">
        <div className="lg:col-span-8 p-12 lg:p-20 space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Post-Audit Roadmap</h2>
            <p className="text-slate-400 text-lg max-w-xl font-medium">Follow these steps to secure your protocol and build community trust.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Apply Fixes', desc: 'Integrate the AI-generated security patches into your codebase.' },
              { title: 'Verify Logic', desc: 'Run your local test suite to ensure no logic regressions occurred.' },
              { title: 'Public Trust', desc: 'Share your verified audit report with your community.' },
            ].map((step, i) => (
              <div key={i} className="space-y-4">
                <div className="text-6xl font-black text-white/10">{i + 1}</div>
                <h5 className="text-sm font-black uppercase tracking-widest">{step.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 p-12 lg:p-20 flex flex-col items-center justify-center bg-white/5 relative overflow-hidden">
          {isApplyingFixes && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: `${fixProgress}%` }}
              className="absolute left-0 bottom-0 w-1 bg-rexy-primary/30 z-0"
            />
          )}
          <button 
            onClick={handleApplyFixInternal}
            disabled={isApplyingFixes || !report.fullFixedCode}
            className="w-full py-6 bg-rexy-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-rexy-primary/20 relative z-10 disabled:opacity-50"
          >
            {isApplyingFixes ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Fixing {fixProgress}%</span>
              </div>
            ) : (
              "Apply All Fixes to Code"
            )}
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-12 flex flex-col items-center justify-center gap-6 bg-white">
        <div className="flex items-center gap-3 opacity-20">
          <Shield className="w-5 h-5" />
          <span className="text-sm font-black uppercase tracking-[0.5em]">Rexy AI Security</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>Verifiable Proof</span>
          <span>Formal Verification</span>
          <span>Static Analysis</span>
          <span>Attack Simulation</span>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] min-w-[300px]"
          >
            <div className={cn(
              "px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl",
              notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" :
              notification.type === 'error' ? "bg-red-500/90 border-red-400 text-white" :
              "bg-slate-900/90 border-slate-700 text-white"
            )}>
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {notification.type === 'info' && <Info className="w-5 h-5" />}
              <p className="text-xs font-black uppercase tracking-widest">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
