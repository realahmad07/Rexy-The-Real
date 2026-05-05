import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, CheckCircle, ArrowRight, X, Info, Lock } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white border border-rexy-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-rexy-border flex items-center justify-between bg-rexy-bg/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rexy-primary/10 rounded-xl flex items-center justify-center text-rexy-primary">
                {step === 1 && <BookOpen className="w-5 h-5" />}
                {step === 2 && <Shield className="w-5 h-5" />}
                {step === 3 && <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {step === 1 && "How to use Rexy AI"}
                  {step === 2 && "Privacy Policy 2026"}
                  {step === 3 && "Terms & Security"}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Step {step} of {totalSteps}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="text-slate-600 text-sm leading-relaxed text-justify">
                      Welcome to Rexy AI Auditor, the most advanced security layer for Solana. To get started, follow these simple steps:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-rexy-primary/5 rounded-2xl border border-rexy-primary/10">
                        <div className="font-bold text-rexy-primary text-xs uppercase mb-2">1. Connect Wallet</div>
                        <p className="text-xs text-slate-500 text-justify">Use the button in the header to connect your Phantom or Solflare wallet. Ensure you are on Devnet for testing.</p>
                      </div>
                      <div className="p-4 bg-rexy-primary/5 rounded-2xl border border-rexy-primary/10">
                        <div className="font-bold text-rexy-primary text-xs uppercase mb-2">2. Upload Code</div>
                        <p className="text-xs text-slate-500 text-justify">Paste your Anchor/Rust or Solidity code into the editor. You can also fetch code directly from a Solana address.</p>
                      </div>
                      <div className="p-4 bg-rexy-primary/5 rounded-2xl border border-rexy-primary/10">
                        <div className="font-bold text-rexy-primary text-xs uppercase mb-2">3. Run Audit</div>
                        <p className="text-xs text-slate-500 text-justify">Click 'Pay & Start AI Audit'. A small fee is required to process the deep security analysis on-chain.</p>
                      </div>
                      <div className="p-4 bg-rexy-primary/5 rounded-2xl border border-rexy-primary/10">
                        <div className="font-bold text-rexy-primary text-xs uppercase mb-2">4. Record Proof</div>
                        <p className="text-xs text-slate-500 text-justify">Once analyzed, record your audit hash on the Solana blockchain and mint your cNFT certificate.</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-slate-600 text-sm leading-relaxed text-justify">
                      Your privacy is our priority. As of 2026, Rexy AI operates under a strict "Zero-Knowledge" metadata policy:
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-600 text-justify"><strong>Code Privacy:</strong> We do not store your smart contract source code on our servers. Analysis is performed in a transient environment and purged immediately after the report is generated.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-600 text-justify"><strong>Wallet Data:</strong> We only track public wallet addresses to associate audit history and on-chain proofs. No personal identifiable information (PII) is ever collected.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-600 text-justify"><strong>On-Chain Transparency:</strong> Audit hashes recorded on Solana are public. By using this service, you acknowledge that security proofs are immutable and visible on the ledger.</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="text-slate-600 text-sm leading-relaxed text-justify">
                      By using Rexy AI, you agree to the following terms of service for the 2026 operational year:
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                      <div className="text-xs text-slate-500 text-justify leading-relaxed">
                        1. <strong>AI Limitations:</strong> While Rexy uses hybrid Groq Llama-3 and Gemini 1.5 Pro models, AI audits are not a substitute for manual peer reviews. Use at your own risk.
                      </div>
                      <div className="text-xs text-slate-500 text-justify leading-relaxed">
                        2. <strong>Fees:</strong> Audit fees are non-refundable as they cover computational costs and on-chain transaction priority fees.
                      </div>
                      <div className="text-xs text-slate-500 text-justify leading-relaxed">
                        3. <strong>Liability:</strong> Rexy AI and its developers are not liable for any losses resulting from contract exploits, even if the contract was marked as "Secure".
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <Info className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">I acknowledge that security is a shared responsibility.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-rexy-border bg-rexy-bg/30 flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${step === i ? "w-8 bg-rexy-primary" : "w-2 bg-slate-200"}`} />
              ))}
            </div>
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-rexy-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all shadow-lg shadow-rexy-primary/20 flex items-center gap-2 group"
            >
              {step === totalSteps ? "Get Started" : "Next"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
