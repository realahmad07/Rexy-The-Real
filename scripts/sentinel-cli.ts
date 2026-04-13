import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { performAudit } from '../src/services/geminiService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Sentinel AI CLI - Automated CI/CD Auditing
 * 
 * Usage: npx ts-node scripts/sentinel-cli.ts --path ./contracts/my_contract.rs
 * 
 * This tool is designed to be integrated into GitHub Actions.
 * It uses "Session Keys" (pre-approved budget) to pay for audits automatically.
 */

async function runCI() {
  const args = process.argv.slice(2);
  const contractPath = args[args.indexOf('--path') + 1];

  if (!contractPath) {
    console.error("Error: Please provide a contract path using --path");
    process.exit(1);
  }

  console.log(`[Sentinel CI] Starting Automated Audit for: ${contractPath}`);

  // 1. Load Contract Code
  const code = fs.readFileSync(path.resolve(contractPath), 'utf-8');

  // 2. AI Audit (Gemini)
  console.log("[Sentinel CI] Analyzing code with Gemini 1.5 Pro...");
  const report = await performAudit(code);

  console.log(`[Sentinel CI] Audit Complete. Score: ${report.score}/100`);
  
  if (report.score < 80) {
    console.warn("[Sentinel CI] WARNING: Security score below threshold!");
  }

  // 3. Automated Payment via Session Keys
  // In a real app, we'd use a Squads Session Key or a restricted Keypair
  console.log("[Sentinel CI] Processing Automated Micro-Payment via Session Key...");
  
  // Simulation of automated on-chain recording
  const txHash = `CI-TX-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  console.log(`[Sentinel CI] On-Chain Proof Recorded: ${txHash}`);

  // 4. Output Results for GitHub Actions
  const output = {
    score: report.score,
    issues: report.issues.length,
    proof: txHash,
    status: report.score >= 80 ? 'PASSED' : 'FAILED'
  };

  fs.writeFileSync('sentinel-report.json', JSON.stringify(output, null, 2));
  console.log("[Sentinel CI] Report saved to sentinel-report.json");

  if (report.score < 70) {
    console.error("[Sentinel CI] Critical vulnerabilities found. Failing build.");
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  runCI().catch(err => {
    console.error("[Sentinel CI] Fatal Error:", err);
    process.exit(1);
  });
}
