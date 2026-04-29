// useRexyRegistry.js
// Rexy AI Auditor — React Hook for On-Chain Registry + Staked Certificates
// Place at: src/hooks/useRexyRegistry.js

import { useCallback, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { sha256 } from "js-sha256"; // npm install js-sha256

// ─── Replace with your deployed program ID ────────────────────────────────────
const PROGRAM_ID = new PublicKey(
  "REXYregistryXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
);

// ─── IDL — paste your generated IDL JSON here after `anchor build` ───────────
// import IDL from "../idl/rexy_registry.json";
// For now we'll use a minimal inline IDL shape — replace with full IDL post-build
const IDL = {
  version: "0.1.0",
  name: "rexy_registry",
  instructions: [
    {
      name: "registerAudit",
      accounts: [
        { name: "auditRecord", isMut: true, isSigner: false },
        { name: "auditor", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "programIdAudited", type: "publicKey" },
        { name: "reportHash", type: { array: ["u8", 32] } },
        { name: "score", type: "u8" },
        { name: "vulnerabilityCount", type: "u16" },
        { name: "criticalCount", type: "u8" },
        { name: "highCount", type: "u8" },
      ],
    },
    {
      name: "stakeCertificate",
      accounts: [
        { name: "auditRecord", isMut: true, isSigner: false },
        { name: "stakeVault", isMut: true, isSigner: false },
        { name: "auditor", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "reportExploit",
      accounts: [
        { name: "auditRecord", isMut: true, isSigner: false },
        { name: "stakeVault", isMut: true, isSigner: false },
        { name: "reporter", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "exploitTxSignature", type: "string" }],
    },
    {
      name: "reclaimStake",
      accounts: [
        { name: "auditRecord", isMut: true, isMut: true, isSigner: false },
        { name: "stakeVault", isMut: true, isSigner: false },
        { name: "auditor", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "AuditRecord",
      type: {
        kind: "struct",
        fields: [
          { name: "auditor", type: "publicKey" },
          { name: "programIdAudited", type: "publicKey" },
          { name: "reportHash", type: { array: ["u8", 32] } },
          { name: "score", type: "u8" },
          { name: "vulnerabilityCount", type: "u16" },
          { name: "criticalCount", type: "u8" },
          { name: "highCount", type: "u8" },
          { name: "timestamp", type: "i64" },
          { name: "slot", type: "u64" },
          { name: "isExploited", type: "bool" },
          { name: "stakeActive", type: "bool" },
          { name: "stakeAmount", type: "u64" },
          { name: "stakeExpiresAt", type: "i64" },
          { name: "exploitReportedAt", type: "i64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [],
};

// ─── Helper: Hash audit report to 32 bytes ───────────────────────────────────
export function hashReport(reportJson) {
  const hashHex = sha256(JSON.stringify(reportJson));
  return Array.from(Buffer.from(hashHex, "hex"));
}

// ─── Helper: Derive PDAs ──────────────────────────────────────────────────────
export async function deriveAuditPDA(auditorPubkey, programIdAudited) {
  const [pda, bump] = await PublicKey.findProgramAddress(
    [
      Buffer.from("audit"),
      auditorPubkey.toBuffer(),
      new PublicKey(programIdAudited).toBuffer(),
    ],
    PROGRAM_ID
  );
  return { pda, bump };
}

export async function deriveVaultPDA(auditRecordPubkey) {
  const [pda] = await PublicKey.findProgramAddress(
    [Buffer.from("vault"), auditRecordPubkey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
export function useRexyRegistry() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [txSignature, setTxSignature] = useState(null);
  const [error, setError] = useState(null);

  // Build Anchor program instance
  const getProgram = useCallback(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected");
    }
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
    return new Program(IDL, PROGRAM_ID, provider);
  }, [connection, wallet]);

  // ── Register Audit On-Chain ──────────────────────────────────────────────
  const registerAudit = useCallback(
    async ({ programIdAudited, reportData, score, findings }) => {
      setIsLoading(true);
      setError(null);
      setTxSignature(null);

      try {
        const program = getProgram();
        const auditorKey = wallet.publicKey;
        const targetProgramKey = new PublicKey(programIdAudited);

        const reportHash = hashReport(reportData);
        const { pda: auditRecord } = await deriveAuditPDA(
          auditorKey,
          targetProgramKey
        );

        const criticalCount = findings.filter(
          (f) => f.severity === "Critical"
        ).length;
        const highCount = findings.filter((f) => f.severity === "High").length;

        const tx = await program.methods
          .registerAudit(
            targetProgramKey,
            reportHash,
            score,
            findings.length,
            criticalCount,
            highCount
          )
          .accounts({
            auditRecord,
            auditor: auditorKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" });

        setTxSignature(tx);
        return {
          success: true,
          signature: tx,
          auditRecordPubkey: auditRecord.toBase58(),
          explorerUrl: `https://explorer.solana.com/tx/${tx}`,
        };
      } catch (err) {
        console.error("registerAudit error:", err);
        setError(err.message || "Transaction failed");
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [getProgram, wallet.publicKey]
  );

  // ── Stake Certificate ────────────────────────────────────────────────────
  const stakeCertificate = useCallback(
    async ({ programIdAudited }) => {
      setIsLoading(true);
      setError(null);

      try {
        const program = getProgram();
        const auditorKey = wallet.publicKey;

        const { pda: auditRecord } = await deriveAuditPDA(
          auditorKey,
          new PublicKey(programIdAudited)
        );
        const stakeVault = await deriveVaultPDA(auditRecord);

        const tx = await program.methods
          .stakeCertificate()
          .accounts({
            auditRecord,
            stakeVault,
            auditor: auditorKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" });

        setTxSignature(tx);
        return {
          success: true,
          signature: tx,
          explorerUrl: `https://explorer.solana.com/tx/${tx}`,
          message: "0.1 SOL staked as 90-day security bond ✅",
        };
      } catch (err) {
        console.error("stakeCertificate error:", err);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [getProgram, wallet.publicKey]
  );

  // ── Fetch Audit Record from Chain ────────────────────────────────────────
  const fetchAuditRecord = useCallback(
    async ({ auditorPubkey, programIdAudited }) => {
      try {
        const program = getProgram();
        const { pda } = await deriveAuditPDA(
          new PublicKey(auditorPubkey),
          new PublicKey(programIdAudited)
        );
        const record = await program.account.auditRecord.fetch(pda);
        return {
          success: true,
          record: {
            ...record,
            pdaAddress: pda.toBase58(),
            score: record.score,
            isExploited: record.isExploited,
            stakeActive: record.stakeActive,
            stakeAmount: record.stakeAmount?.toNumber() / 1e9,
            stakeExpiresAt: new Date(
              record.stakeExpiresAt?.toNumber() * 1000
            ).toLocaleDateString(),
            timestamp: new Date(
              record.timestamp?.toNumber() * 1000
            ).toLocaleString(),
          },
        };
      } catch (err) {
        return { success: false, error: "Audit record not found on-chain" };
      }
    },
    [getProgram]
  );

  // ── Report Exploit ───────────────────────────────────────────────────────
  const reportExploit = useCallback(
    async ({ auditorPubkey, programIdAudited, exploitTxSignature }) => {
      setIsLoading(true);
      setError(null);

      try {
        const program = getProgram();

        const { pda: auditRecord } = await deriveAuditPDA(
          new PublicKey(auditorPubkey),
          new PublicKey(programIdAudited)
        );
        const stakeVault = await deriveVaultPDA(auditRecord);

        const tx = await program.methods
          .reportExploit(exploitTxSignature)
          .accounts({
            auditRecord,
            stakeVault,
            reporter: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ commitment: "confirmed" });

        setTxSignature(tx);
        return { success: true, signature: tx };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [getProgram, wallet.publicKey]
  );

  return {
    registerAudit,
    stakeCertificate,
    fetchAuditRecord,
    reportExploit,
    isLoading,
    txSignature,
    error,
  };
}
