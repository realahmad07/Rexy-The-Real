declare module '../lib/solanaVulnerabilities' {
  export const SOLANA_VULNERABILITIES: any[];
  export function analyzeWithVulnLibrary(code: string, baseScore?: number): any;
  export function getSeverityColor(severity: string): string;
  export function getVulnsBySeverity(severity: string): any[];
}
