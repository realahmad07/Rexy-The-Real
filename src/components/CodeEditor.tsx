import React, { useRef } from 'react';
import { Upload, Code2, Play, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  onAudit: () => void;
  isAuditing: boolean;
  isLocked?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode, onAudit, isAuditing, isLocked }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCode(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl overflow-hidden shadow-sm flex flex-col h-[500px] relative transition-all">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-gray-50/50 dark:bg-dark-bg/50">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-purple-deep dark:text-purple-light" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-text">Source Code Input</h3>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".sol,.rs,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLocked}
            className="text-xs font-medium text-gray-500 dark:text-dark-muted hover:text-purple-deep dark:hover:text-purple-light flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-purple-light/10 transition-all disabled:opacity-30"
          >
            <Upload className="w-3 h-3" /> Upload .sol / .rs
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste your smart contract here..."
          disabled={isLocked}
          className={cn(
            "w-full h-full p-6 font-mono text-sm bg-transparent resize-none focus:outline-none text-gray-800 dark:text-dark-text placeholder:text-gray-300 dark:placeholder:text-dark-border transition-all",
            isLocked && "blur-[2px] grayscale opacity-50 select-none"
          )}
        />
        
        {isLocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 dark:bg-dark-bg/60 backdrop-blur-[1px] p-8 text-center">
            <div className="p-4 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border mb-4">
              <Lock className="w-8 h-8 text-purple-deep dark:text-purple-light" />
            </div>
            <h4 className="text-lg font-bold text-black-matte dark:text-dark-text mb-1">Audit Console Locked</h4>
            <p className="text-sm text-gray-500 dark:text-dark-muted max-w-[240px]">
              Please provide a valid Solana transaction hash in the sidebar to unlock AI auditing.
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50 flex justify-end">
        <motion.button
          whileHover={!isLocked ? { scale: 1.02 } : {}}
          whileTap={!isLocked ? { scale: 0.98 } : {}}
          onClick={onAudit}
          disabled={isAuditing || !code.trim() || isLocked}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
            isAuditing || !code.trim() || isLocked
              ? "bg-gray-200 dark:bg-dark-border text-gray-400 dark:text-dark-muted cursor-not-allowed shadow-none"
              : "bg-purple-deep text-white shadow-purple-deep/20 hover:shadow-purple-deep/40"
          )}
        >
          {isAuditing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {isAuditing ? "AUDITING..." : "INITIATE AI AUDIT"}
        </motion.button>
      </div>
    </div>
  );
};
