import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuditReport } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

interface AppStateContextType {
  // Audit View State
  auditCode: string;
  setAuditCode: (val: string) => void;
  auditAddress: string;
  setAuditAddress: (val: string) => void;
  auditReport: AuditReport | null;
  setAuditReport: (val: AuditReport | null) => void;
  isSimulation: boolean;
  setIsSimulation: (val: boolean) => void;
  isQuantumSimulation: boolean;
  setIsQuantumSimulation: (val: boolean) => void;

  // Copilot View State
  copilotMessages: ChatMessage[];
  setCopilotMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [auditCode, setAuditCode] = useState('');
  const [auditAddress, setAuditAddress] = useState('');
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [isSimulation, setIsSimulation] = useState(false);
  const [isQuantumSimulation, setIsQuantumSimulation] = useState(false);

  const [copilotMessages, setCopilotMessages] = useState<ChatMessage[]>([{
    id: 'intro',
    role: 'model',
    content: "Hey there! I'm Rexy, your AI Solana Security Copilot. Need help patching an Anchor vulnerability, understanding post-quantum mitigation, or analyzing a smart contract snippet? Drop it below.",
    timestamp: Date.now()
  }]);

  return (
    <AppStateContext.Provider value={{
      auditCode, setAuditCode,
      auditAddress, setAuditAddress,
      auditReport, setAuditReport,
      isSimulation, setIsSimulation,
      isQuantumSimulation, setIsQuantumSimulation,
      copilotMessages, setCopilotMessages
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
