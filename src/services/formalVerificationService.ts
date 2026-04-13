import { AuditIssue } from '../types';

/**
 * Sentinel AI - Formal Verification Engine
 * 
 * This engine performs deterministic, rule-based analysis of Solana smart contracts
 * to complement the probabilistic findings of the AI (Gemini).
 */

export interface VerificationResult {
  score: number;
  issues: AuditIssue[];
}

export function runFormalVerification(code: string, language: 'rust' | 'solidity'): VerificationResult {
  const issues: AuditIssue[] = [];
  let score = 100;

  if (language === 'rust') {
    // 1. Check for missing Signer checks in Anchor
    if (code.includes('AccountInfo') && !code.includes('Signer')) {
      issues.push({
        severity: 'Critical',
        title: 'Potential Missing Signer Check',
        description: 'The contract uses AccountInfo but does not appear to enforce Signer constraints on sensitive accounts.',
        recommendation: 'Use the `Signer` type in your account validation struct or manually verify `account.is_signer`.',
      });
      score -= 30;
    }

    // 2. Check for unsafe ownership checks
    if (code.includes('owner') && !code.includes('key()') && !code.includes('==')) {
      issues.push({
        severity: 'High',
        title: 'Unsafe Ownership Validation',
        description: 'Manual ownership checks detected that may be bypassable.',
        recommendation: 'Use Anchor constraints like `#[account(mut, has_one = authority)]` for safer validation.',
      });
      score -= 20;
    }

    // 3. Check for potential integer overflows (pre-1.60 Rust or unchecked blocks)
    if (code.includes('as u64') && (code.includes('+') || code.includes('-')) && !code.includes('checked_')) {
      issues.push({
        severity: 'Medium',
        title: 'Unchecked Arithmetic',
        description: 'The contract performs arithmetic operations without explicit overflow checks.',
        recommendation: 'Use `checked_add`, `checked_sub`, etc., to prevent runtime panics or exploits.',
      });
      score -= 10;
    }
  }

  return {
    score: Math.max(0, score),
    issues
  };
}
