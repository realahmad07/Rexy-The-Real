export interface AuditIssue {
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  title: string;
  description: string;
  recommendation: string;
  fixedCode?: string;
  line?: number;
  gasImpact?: string;
  reference?: string;
  financialRisk?: string;
  logicRisk?: string;
  exploitLikelihood?: string;
  accessControlRisk?: string;
}

export interface AuditReport {
  id?: string;
  summary: string;
  score: number; // 0-100
  issues: AuditIssue[];
  timestamp: number;
  codeHash?: string;
  contractName?: string;
  fullFixedCode?: string;
  originalCode?: string;
  gasOptimizationSummary?: string;
  nftAddress?: string;
  isCNFT?: boolean;
  onChainProof?: string;
  certificateMint?: string;
  certificateSignature?: string;
}

export interface AppState {
  code: string;
  isAuditing: boolean;
  report: AuditReport | null;
  txHash: string;
  isPaymentVerified: boolean;
  telemetryLog: string[];
  anomalyData: { name: string; value: number }[];
}
