import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, ArrowRight, Loader2, CheckCircle2, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
  amount: number;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSuccess, amount }) => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateTxHash = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let hash = '';
    for (let i = 0; i < 44; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  const handleConfirm = async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet first.");
      return;
    }

    setStep('processing');
    setError(null);

    try {
      // Real Transaction Integration
      const treasury = new PublicKey("94XERPmgthDeS8gkAZDJ7sqKteEATJjvTgXB17BqovDG"); 
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasury,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash
      }, 'confirmed');
      
      setTxHash(signature);
      setStep('success');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Payment failed:", errorMessage);
      setError(errorMessage || "Transaction failed. Please try again.");
      setStep('confirm');
    }
  };

  const handleFinalize = () => {
    onSuccess(txHash);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-dark-border transition-all"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-deep dark:text-purple-light" />
            <h3 className="font-bold text-gray-800 dark:text-dark-text">Confirm Transaction</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between p-4 bg-purple-light/10 dark:bg-purple-deep/10 rounded-2xl border border-purple-light/20 dark:border-purple-deep/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-deep rounded-xl flex items-center justify-center shadow-lg shadow-purple-deep/20">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-dark-muted font-bold">Network</p>
                      <p className="text-sm font-mono font-bold text-gray-700 dark:text-dark-text">Solana Devnet</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 dark:text-dark-border" />
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-dark-muted font-bold">Amount</p>
                    <p className="text-sm font-mono font-bold text-purple-deep dark:text-purple-light">{amount} SOL</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-muted">Service</span>
                    <span className="font-bold text-gray-800 dark:text-dark-text">AI Security Audit</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-muted">Amount</span>
                    <span className="font-bold text-purple-deep dark:text-purple-light">{amount} SOL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-dark-muted">Network Fee</span>
                    <span className="text-gray-400 dark:text-dark-muted/60">~0.000005 SOL</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full py-4 bg-purple-deep text-white rounded-2xl font-bold shadow-xl shadow-purple-deep/20 hover:shadow-purple-deep/40 transition-all active:scale-[0.98]"
                >
                  Confirm & Pay
                </button>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-purple-light/20 dark:border-purple-deep/20 rounded-full" />
                  <Loader2 className="w-20 h-20 text-purple-deep dark:text-purple-light animate-spin absolute inset-0" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-2">Transaction Processing</h4>
                <p className="text-sm text-gray-500 dark:text-dark-muted max-w-[240px]">
                  Waiting for blockchain confirmation. This usually takes 10-15 seconds.
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100 dark:shadow-green-900/20">
                  <CheckCircle2 className="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-2">Transaction Confirmed!</h4>
                <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-4 w-full mb-6 border border-gray-100 dark:border-dark-border">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-dark-muted font-bold mb-2">Transaction Hash</p>
                  <p className="text-[11px] font-mono text-gray-600 dark:text-dark-text break-all">{txHash}</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => window.open(`https://solscan.io/tx/${txHash}?cluster=devnet`, '_blank')}
                    className="flex-1 py-3 border border-gray-200 dark:border-dark-border rounded-xl text-xs font-bold text-gray-600 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3 h-3" /> Solscan
                  </button>
                  <button
                    onClick={handleFinalize}
                    className="flex-1 py-3 bg-purple-deep text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-deep/20 hover:shadow-purple-deep/40 transition-all"
                  >
                    Back to Console
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
