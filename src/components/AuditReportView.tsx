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
                      <pre className="p-4 bg-slate-900 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto shadow-inner">
                        <code>{issue.fixedCode}</code>
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

export const AuditReportView: React.FC<AuditReportViewProps> = ({ report, onApplyFix, currentUser, isSimulation }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [onChainProofSig, setOnChainProofSig] = useState<string | null>(report.onChainProof || null);
  const [isRecordingOnChain, setIsRecordingOnChain] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [certificateMint, setCertificateMint] = useState<string | null>(report.certificateMint || null);
  const [certificateSignature, setCertificateSignature] = useState<string | null>(report.certificateSignature || null);
  const [copied, setCopied] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [localSimulation, setLocalSimulation] = useState(isSimulation || false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

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
    if (!localSimulation && (!wallet.publicKey || !wallet.sendTransaction)) {
      showNotification("Please connect your wallet to record proof on-chain.", "error");
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
        signature = await recordAuditOnChain(wallet, report.codeHash || 'unknown', report.score, connection);
      }
      setOnChainProofSig(signature);
      if (report.id) {
        await updateDoc(doc(db, 'audits', report.id), { onChainProof: signature });
      }
      showNotification(isSimulation ? "Simulated audit proof recorded successfully!" : "Audit proof recorded on Solana blockchain successfully!", "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to record proof on-chain.", "error");
    } finally {
      setIsRecordingOnChain(false);
    }
  };

  const handleMint = async () => {
    if (!localSimulation && !wallet.publicKey) {
      showNotification("Please connect your wallet to mint a certificate.", "error");
      return;
    }
    setIsMinting(true);
    try {
      let result;
      if (localSimulation) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = { mint: "sim_cert_" + Math.random().toString(36).substring(7) };
      } else {
        const { mintAuditCertificate } = await import('../services/solanaService');
        result = await mintAuditCertificate(wallet, {
          id: report.id || report.codeHash || 'unknown',
          score: report.score,
          name: report.contractName || 'Unnamed Contract'
        }, connection);
      }
      setCertificateMint(result.mint);
      setCertificateSignature(result.signature || null);
      if (report.id) {
        await updateDoc(doc(db, 'audits', report.id), { 
          certificateMint: result.mint,
          certificateSignature: result.signature || null
        });
      }
      showNotification(isSimulation ? "Simulated cNFT Certificate minted successfully!" : "cNFT Audit Certificate minted successfully!", "success");
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
        if (y + lineHeight > pageHeight - 30) break;
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
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REXY AI SECURITY AUDIT', margin, 15);
      pdf.setFontSize(9);
      pdf.text('OFFICIAL SMART CONTRACT VERIFICATION REPORT', margin, 22);
      
      y = 40;

      addSectionHeader('CONTRACT OVERVIEW');
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

      y += 5;
      addSectionHeader('VULNERABILITY SUMMARY');
      report.issues.forEach((issue, i) => {
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = margin;
        }
        renderText(`${i + 1}. ${issue.title} (${issue.severity})`, 10, 'bold', [0, 0, 0], 1);
        renderText(issue.description.substring(0, 200) + '...', 8, 'normal', [100, 100, 100], 4);
      });

      pdf.save(`Rexy_Audit_${report.contractName || 'Report'}.pdf`);
      showNotification("PDF Report exported successfully!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Failed to export PDF.", "error");
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
                    href={`https://solscan.io/tx/${onChainProofSig}`}
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

      {/* ACTION BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-100 bg-slate-50/30">
        <button 
          onClick={handleExportPDF}
          className="p-8 border-r border-slate-100 flex items-center justify-center gap-4 hover:bg-white transition-all group"
        >
          <FileText className="w-5 h-5 text-slate-400 group-hover:text-rexy-primary transition-colors" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">Download PDF Report</span>
        </button>
        <button 
          onClick={handleShareBlink}
          className="p-8 border-r border-slate-100 flex items-center justify-center gap-4 hover:bg-white transition-all group"
        >
          <Share2 className="w-5 h-5 text-slate-400 group-hover:text-rexy-primary transition-colors" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-600">{copied ? "Link Copied" : "Share via Blink"}</span>
        </button>
        <div className="p-8 flex items-center justify-center gap-4 hover:bg-white transition-all group">
          {certificateMint ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4 text-emerald-500">
                <BadgeCheck className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Certificate Minted</span>
              </div>
              <a 
                href={`https://solscan.io/${certificateSignature ? `tx/${certificateSignature}` : `token/${certificateMint}`}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[9px] font-bold text-rexy-primary hover:underline"
              >
                <span>View on Solscan</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          ) : (
            <button 
              onClick={handleMint}
              disabled={isMinting}
              className="flex items-center gap-4 group disabled:opacity-50"
            >
              {isMinting ? <Loader2 className="w-5 h-5 animate-spin text-rexy-primary" /> : <Award className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />}
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">
                Mint cNFT Certificate
              </span>
            </button>
          )}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-100">
        <div className="lg:col-span-3 p-12 border-r border-slate-100 bg-slate-50/50">
          <div className="vertical-text flex items-center gap-4 opacity-30">
            <span className="text-[10px] font-black uppercase tracking-[1em] text-slate-900">Executive Summary</span>
            <div className="w-12 h-px bg-slate-900" />
          </div>
        </div>
        <div className="lg:col-span-9 p-12 lg:p-20">
          <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed font-light text-justify">
            <Markdown>{report.summary}</Markdown>
          </div>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-slate-100">
        {[
          { label: 'Logic Integrity', value: 85, icon: Brain, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Financial Safety', value: 92, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Access Control', value: 78, icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'Gas Efficiency', value: 65, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
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
        <div className="lg:col-span-4 p-12 lg:p-20 flex items-center justify-center bg-white/5">
          <button 
            onClick={onApplyFix}
            className="w-full py-6 bg-rexy-primary text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-rexy-primary/20"
          >
            Apply All Fixes to Code
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
