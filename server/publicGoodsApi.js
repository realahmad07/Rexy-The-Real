// publicGoodsApi.js
// Rexy AI Auditor — Public Goods API
// A free, open queryable registry of Solana program audits
// Place at: server/publicGoodsApi.js
// Run with: node server/publicGoodsApi.js
// Install deps: npm install express cors @coral-xyz/anchor @solana/web3.js dotenv

import express from "express";
import cors from "cors";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl("mainnet-beta");
const PROGRAM_ID = process.env.REXY_PROGRAM_ID || "REXYregistryXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

// Readonly connection — no wallet needed for reads
const connection = new Connection(RPC_URL, "confirmed");

// ─── Inline IDL (same as frontend) ───────────────────────────────────────────
// Replace with: import IDL from "../src/idl/rexy_registry.json" assert { type: "json" };
const IDL = { /* paste your IDL here */ };

function getProgram() {
  const provider = new AnchorProvider(
    connection,
    { publicKey: PublicKey.default, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
    { commitment: "confirmed" }
  );
  return new Program(IDL, new PublicKey(PROGRAM_ID), provider);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/audit/:programId
 * Lookup all audit records for a given Solana program address.
 * 
 * Example: GET /api/audit/9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
 */
app.get("/api/audit/:programId", async (req, res) => {
  try {
    const { programId } = req.params;
    new PublicKey(programId); // validates the address

    const program = getProgram();

    // Fetch all audit accounts filtered by the programIdAudited field
    const accounts = await program.account.auditRecord.all([
      {
        memcmp: {
          offset: 8 + 32, // skip discriminator + auditor pubkey
          bytes: new PublicKey(programId).toBase58(),
        },
      },
    ]);

    const records = accounts.map(({ publicKey, account }) => ({
      pda: publicKey.toBase58(),
      auditor: account.auditor.toBase58(),
      programIdAudited: account.programIdAudited.toBase58(),
      score: account.score,
      vulnerabilityCount: account.vulnerabilityCount,
      criticalCount: account.criticalCount,
      highCount: account.highCount,
      timestamp: new Date(account.timestamp.toNumber() * 1000).toISOString(),
      slot: account.slot.toNumber(),
      isExploited: account.isExploited,
      stakeActive: account.stakeActive,
      stakeAmountSol: account.stakeAmount.toNumber() / 1e9,
      stakeExpiresAt: account.stakeExpiresAt.toNumber() > 0
        ? new Date(account.stakeExpiresAt.toNumber() * 1000).toISOString()
        : null,
      certified: account.score >= 85 && account.stakeActive,
      reportHashHex: Buffer.from(account.reportHash).toString("hex"),
    }));

    // Sort by most recent first
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      programId,
      auditCount: records.length,
      latestScore: records[0]?.score ?? null,
      certified: records.some((r) => r.certified),
      audits: records,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/audits/recent?limit=20
 * Get the most recently registered audit records across all programs.
 */
app.get("/api/audits/recent", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const program = getProgram();

    const accounts = await program.account.auditRecord.all();

    const records = accounts
      .map(({ publicKey, account }) => ({
        pda: publicKey.toBase58(),
        programIdAudited: account.programIdAudited.toBase58(),
        auditor: account.auditor.toBase58(),
        score: account.score,
        criticalCount: account.criticalCount,
        highCount: account.highCount,
        timestamp: new Date(account.timestamp.toNumber() * 1000).toISOString(),
        certified: account.score >= 85 && account.stakeActive,
        isExploited: account.isExploited,
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      count: records.length,
      audits: records,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/stats
 * Global stats for the Rexy registry — useful for dashboards.
 */
app.get("/api/stats", async (req, res) => {
  try {
    const program = getProgram();
    const accounts = await program.account.auditRecord.all();

    const total = accounts.length;
    const certified = accounts.filter(
      (a) => a.account.score >= 85 && a.account.stakeActive
    ).length;
    const exploited = accounts.filter((a) => a.account.isExploited).length;
    const avgScore =
      total > 0
        ? Math.round(
            accounts.reduce((s, a) => s + a.account.score, 0) / total
          )
        : 0;
    const totalStakedSol =
      accounts.reduce(
        (s, a) =>
          s + (a.account.stakeActive ? a.account.stakeAmount.toNumber() : 0),
        0
      ) / 1e9;

    res.json({
      success: true,
      stats: {
        totalAudits: total,
        certifiedPrograms: certified,
        exploitedPrograms: exploited,
        averageScore: avgScore,
        totalStakedSol: totalStakedSol.toFixed(2),
        cleanRate:
          total > 0
            ? (((total - exploited) / total) * 100).toFixed(1) + "%"
            : "N/A",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/verify/:pda
 * Verify a specific audit record by its PDA address.
 * Used by third parties to verify a certificate.
 */
app.get("/api/verify/:pda", async (req, res) => {
  try {
    const { pda } = req.params;
    const program = getProgram();
    const record = await program.account.auditRecord.fetch(new PublicKey(pda));

    const isValid =
      record.score >= 85 &&
      record.stakeActive &&
      !record.isExploited;

    res.json({
      success: true,
      valid: isValid,
      pda,
      programIdAudited: record.programIdAudited.toBase58(),
      auditor: record.auditor.toBase58(),
      score: record.score,
      certified: isValid,
      stakeActive: record.stakeActive,
      isExploited: record.isExploited,
      auditedAt: new Date(record.timestamp.toNumber() * 1000).toISOString(),
      stakeExpiresAt: record.stakeExpiresAt.toNumber() > 0
        ? new Date(record.stakeExpiresAt.toNumber() * 1000).toISOString()
        : null,
      explorerUrl: `https://explorer.solana.com/address/${pda}`,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      valid: false,
      error: "Audit record not found",
    });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    program: PROGRAM_ID,
    network: RPC_URL.includes("mainnet") ? "mainnet-beta" : "devnet",
    timestamp: new Date().toISOString(),
    docs: "https://github.com/yourrepo/rexy-auditor#public-api",
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔐 Rexy Public Goods API running on port ${PORT}`);
  console.log(`   Registry: ${PROGRAM_ID}`);
  console.log(`   Network:  ${RPC_URL.includes("mainnet") ? "mainnet-beta" : "devnet"}`);
  console.log(`\n   Endpoints:`);
  console.log(`   GET /api/audit/:programId`);
  console.log(`   GET /api/audits/recent`);
  console.log(`   GET /api/stats`);
  console.log(`   GET /api/verify/:pda\n`);
});

export default app;
