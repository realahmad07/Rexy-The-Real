import React, { useState } from 'react';
import { performAudit } from '../services/geminiService';
import { Loader2, ShieldAlert, AlertCircle, Code2, Wallet, ExternalLink } from 'lucide-react';
import { AuditReport } from '../types';
import { AuditReportView } from './AuditReportView';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { requestPayment, recordAuditOnChain } from '../services/solanaService';

const AuditView: React.FC = () => {
  const { connected } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCode, setFetchingCode] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchCode = async () => {
    if (!address.trim()) return;
    setFetchingCode(true);
    setError(null);
    try {
      // Simulate fetching code from Helius/Solscan
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll provide a sample vulnerable contract if they enter a "vulnerable" address
      if (address.toLowerCase().includes('hack')) {
        setCode(`// Vulnerable Solana Program\nuse anchor_lang::prelude::*;\n\ndeclare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");\n\n#[program]\npub mod vulnerable_contract {\n    use super::*;\n    pub function withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {\n        let account = &mut ctx.accounts.vault;\n        // MISSING SIGNER CHECK!\n        account.balance -= amount;\n        Ok(())\n    }\n}`);
      } else {
        setCode(`// Secure Solana Program\nuse anchor_lang::prelude::*;\n\ndeclare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");\n\n#[program]\npub mod secure_contract {\n    use super::*;\n    pub function initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}`);
      }
    } catch (err: any) {
      setError("Failed to fetch contract source. Is it verified on Solscan?");
    } finally {
      setFetchingCode(false);
    }
  };

  const handleAudit = async () => {
    let auditCode = code.trim();
    
    if (isSimulation && !auditCode) {
      auditCode = `// Rexy Simulation Contract\nuse anchor_lang::prelude::*;\n\ndeclare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");\n\n#[program]\npub mod simulation_contract {\n    use super::*;\n    pub function initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}`;
      setCode(auditCode);
    }

    if (!auditCode) return;
    if (!isSimulation && (!connected || !wallet.publicKey)) {
      setError("Please connect your Phantom wallet first.");
      return;
    }

    setError(null);
    setPaymentProcessing(true);
    
    try {
      let signature = "simulated_proof_" + Math.random().toString(36).substring(7);
      
      if (!isSimulation) {
        // Step 1: Request Payment (Minimal fee for Mainnet testing)
        console.log("Requesting audit payment (0.00001 SOL)...");
        signature = await requestPayment(wallet, 0.00001, connection);
        console.log("Payment successful:", signature);
      } else {
        // Simulate delay for simulation mode
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setPaymentProcessing(false);
      setLoading(true);
      setReport(null);

      // Step 2: Perform AI Audit
      const result = await performAudit(auditCode);
      if (result) {
        let finalSignature = signature;
        
        const reportWithOriginal = {
          ...result,
          originalCode: auditCode
        };

        // Step 3: Record Proof On-Chain (Real proof with hash)
        if (!isSimulation && connected && wallet.publicKey) {
          try {
            console.log("Recording audit proof on-chain...");
            const proofSignature = await recordAuditOnChain(wallet, result.id || "rexy_" + Date.now(), result.score, connection);
            finalSignature = proofSignature;
            console.log("On-chain proof recorded:", proofSignature);
          } catch (proofErr) {
            console.warn("Failed to record on-chain proof, falling back to payment signature:", proofErr);
          }
        }

        const auditData = {
          ...reportWithOriginal,
          userId: connected && wallet.publicKey ? wallet.publicKey.toString() : 'anonymous',
          timestamp: Date.now(),
          onChainProof: finalSignature,
          status: 'success'
        };

        // Save to Firestore if connected
        if (connected && wallet.publicKey) {
          try {
            const docRef = await addDoc(collection(db, 'audits'), {
              ...auditData,
              timestamp: serverTimestamp() // Use server timestamp for Firestore
            });
            auditData.id = docRef.id;
          } catch (fsErr) {
            console.error("Error saving audit to Firestore:", fsErr);
            if (fsErr instanceof Error && fsErr.message.includes('permission')) {
              try {
                handleFirestoreError(fsErr, OperationType.CREATE, 'audits');
              } catch (e) {
                // Already handled
              }
            }
          }
        }

        setReport(auditData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during the process.");
    } finally {
      setPaymentProcessing(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!report ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)]">
          <div className="flex flex-col space-y-4">
            <div className="flex-1 bg-rexy-card border border-rexy-border rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              <div className="px-6 py-4 border-b border-rexy-border flex justify-between items-center bg-rexy-bg/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-rexy-primary" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contract Code</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <input 
                      type="text"
                      placeholder="Solana Address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="px-3 py-1 bg-rexy-bg border border-rexy-border rounded-lg text-[10px] text-slate-900 focus:ring-1 focus:ring-rexy-primary outline-none w-40 font-mono"
                    />
                    <button 
                      onClick={handleFetchCode}
                      disabled={fetchingCode || !address}
                      className="px-2 py-1 bg-rexy-primary/10 text-rexy-primary hover:bg-rexy-primary hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-rexy-primary/20 transition-all disabled:opacity-50"
                    >
                      {fetchingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : "Fetch"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setCode('')}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your smart contract code here (Rust/Anchor or Solidity)..."
                className="flex-1 p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={isSimulation}
                    onChange={(e) => setIsSimulation(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${isSimulation ? 'bg-rexy-primary' : 'bg-slate-200'}`} />
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isSimulation ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-rexy-primary transition-colors">
                  Simulation Mode (No SOL Required)
                </span>
              </label>
              <div className="text-[9px] font-bold text-slate-400 italic">
                {isSimulation ? "Bypassing real transaction" : "Real on-chain proof"}
              </div>
            </div>

            <button
              onClick={handleAudit}
              disabled={loading || paymentProcessing || (!isSimulation && !code.trim())}
              className="w-full py-4 bg-rexy-primary hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-lg transition-all flex items-center justify-center space-x-2 shadow-lg shadow-rexy-primary/20 group uppercase tracking-widest"
            >
              {paymentProcessing ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>{isSimulation ? "Simulating Proof..." : "Processing Gas-Only Payment..."}</span>
                </>
              ) : loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Analyzing Contract...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={20} className="group-hover:scale-110 transition-transform" />
                  <span>{isSimulation ? "Start AI Audit (Simulated)" : "Pay Gas & Start Audit"}</span>
                </>
              )}
            </button>
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-2 text-red-400 text-sm animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} />
                  <p className="flex-1">{error}</p>
                </div>
                {error.includes("Insufficient SOL") && (
                  <a 
                    href="https://faucet.solana.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-7 text-[10px] font-black uppercase tracking-widest text-rexy-primary hover:underline flex items-center gap-1"
                  >
                    Go to Solana Faucet <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="bg-rexy-card border border-rexy-border rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-rexy-border bg-rexy-bg/50">
              <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">Audit Status</span>
            </div>
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-slate-500 space-y-6">
              <div className="relative">
                <AlertCircle size={80} strokeWidth={1} className="opacity-20" />
                {(loading || paymentProcessing) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-rexy-primary/20 border-t-rexy-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-slate-700">
                  {paymentProcessing ? "Waiting for transaction confirmation..." : loading ? "AI is scanning for vulnerabilities..." : "Ready for Analysis"}
                </p>
                <p className="text-sm max-w-xs mx-auto text-slate-600">
                  {paymentProcessing 
                    ? "Please approve the transaction in your wallet. You may see a security warning—this is normal when interacting with the Solana Memo program for the first time."
                    : loading 
                    ? "Our world-class security model is performing formal verification and pattern matching on your code."
                    : "Enter your contract code and start the audit to generate a comprehensive security report."}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => setReport(null)}
              className="text-sm text-rexy-primary hover:text-indigo-400 font-bold flex items-center gap-2 transition-colors uppercase tracking-widest"
            >
              ← Back to Editor
            </button>
          </div>
          <AuditReportView 
            report={report} 
            isSimulation={isSimulation}
            onApplyFix={() => {
              if (report.fullFixedCode) {
                setCode(report.fullFixedCode);
                setReport(null);
              }
            }}
            currentUser={auth.currentUser}
          />
        </div>
      )}
    </div>
  );
};

export default AuditView;
