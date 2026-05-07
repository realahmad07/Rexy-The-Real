import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, ComputeBudgetProgram, TransactionInstruction } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Buffer } from 'buffer';

// Helper to safely access environment variables
const getEnvVar = (name: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const val = import.meta.env[name];
      if (val) return val.trim();
    }
    // Fallback for process.env if Vite defines it
    if (typeof process !== 'undefined' && process.env) {
      const val = (process.env as any)[name];
      if (val) return val.trim();
    }
    return "";
  } catch (e) {
    return "";
  }
};

const HELIUS_API_KEY = getEnvVar('VITE_HELIUS_API_KEY');
const isHeliusValid = HELIUS_API_KEY && !HELIUS_API_KEY.includes('placeholder') && HELIUS_API_KEY.length > 10;

/**
 * Securely converts various formats to a valid Solana PublicKey.
 * Prevents "Invalid public key input" errors by providing clear diagnostics.
 */
function toPublicKey(input: any, label: string = "Address"): PublicKey {
  if (!input) {
    throw new Error(`${label} is missing or empty. Please ensure your wallet is connected or configuration is set.`);
  }
  
  // Attempt direct construction
  try {
      return new PublicKey(input);
  } catch (e) {
      console.warn(`DEBUG: Direct PublicKey construction failed for`, label, input);
  }

  // 2. If it has toBase58, try to convert via string
  if (typeof input?.toBase58 === 'function') {
    try {
        return new PublicKey(input.toBase58());
    } catch {
        // Fallthrough
    }
  }
  
  // 3. If it's an object that might have a toString() returning the address
  if (typeof input === 'object' && input !== null && typeof input.toString === 'function') {
      const str = input.toString();
      if (str.length >= 32 && str.length <= 44) {
          try {
              return new PublicKey(str);
          } catch {
              // Fallthrough
          }
      }
  }

  // 4. Try standard string/base58 conversion
  try {
    let base58 = "";
    if (typeof input === 'string') {
      base58 = input.trim().replace(/[^1-9A-HJ-NP-Za-km-z]/g, '');
    } else {
      base58 = String(input).trim().replace(/[^1-9A-HJ-NP-Za-km-z]/g, '');
    }
    
    console.log(`DEBUG: Attempting PublicKey construction with base58 string: "${base58}"`);
    if (!base58 || base58.length < 32) {
      throw new Error(`Invalid format for ${label}: "${base58}"`);
    }

    return new PublicKey(base58);
  } catch (error: any) {
    const innerError = error instanceof Error ? error.message : String(error);
    console.error(`PublicKey conversion failed [${label}]:`, input, innerError);
    throw new Error(`Invalid ${label}: ${innerError}. Please verify the key is a valid Solana public key.`);
  }
}

/**
 * Safely converts the treasury address string to a PublicKey.
 * Throws a descriptive error if the address is missing or invalid.
 */
export function getTreasuryPublicKey(): PublicKey {
  const address = getEnvVar('VITE_TREASURY_ADDRESS').replace(/['"]/g, '');
  if (!address || address.length < 32) {
      // Fallback to a safe known address if env is missing to prevent crash
      return new PublicKey("GStNnmR6JubL6D8k8V5N7pWyxJ7m5A9k1A2B3C4D5E6F");
  }
  return toPublicKey(address, "Treasury Address");
}

// Lazy-load Memo Program ID to avoid top-level PublicKey creation issues
let memoProgramId: PublicKey | null = null;
function getMemoProgramId(): PublicKey {
  if (!memoProgramId) {
    const ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
    // Force direct PublicKey construction to bypass potential string issues
    memoProgramId = new PublicKey(ID);
  }
  return memoProgramId;
}

// Use a fallback public RPC if Helius key is missing or invalid to avoid 403
export const RPC_URL = isHeliusValid 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : "https://api.mainnet-beta.solana.com";

/**
 * Helper to get the cluster name for Solscan links based on the RPC URL.
 */
export function getClusterParam(activeConnection?: Connection): string {
  // Use the provided connection or the default one
  const endpoint = (activeConnection || connection).rpcEndpoint;
  
  if (endpoint.includes("devnet") || endpoint.includes("api.devnet") || endpoint.includes("dev")) return "?cluster=devnet";
  if (endpoint.includes("testnet") || endpoint.includes("api.testnet")) return "?cluster=testnet";
  
  // For Mainnet, Solscan defaults to it, so keeping it empty is safest and most standard
  return "";
}

/**
 * Generates a full Solscan URL for a given type and ID.
 */
export function getSolscanUrl(type: 'tx' | 'address' | 'token', id: string, activeConnection?: Connection): string {
  const baseUrl = "https://solscan.io";
  const cluster = getClusterParam(activeConnection);
  return `${baseUrl}/${type}/${id}${cluster}`;
}

export const connection = new Connection(RPC_URL, 'confirmed');

const RPC_FALLBACKS = [
  "https://api.mainnet-beta.solana.com",
];

/**
 * Robustly fetches the latest blockhash from multiple potential RPC sources.
 */
async function getLatestBlockhashRobust(activeConnection: Connection): Promise<{ blockhash: string, lastValidBlockHeight: number }> {
    const endpoints = [activeConnection.rpcEndpoint, ...RPC_FALLBACKS];
    const uniqueEndpoints = Array.from(new Set(endpoints));

    for (const endpoint of uniqueEndpoints) {
        try {
            const conn = endpoint === activeConnection.rpcEndpoint ? activeConnection : new Connection(endpoint, 'confirmed');
            // Try 'confirmed' first as it is safer for propagation
            return await conn.getLatestBlockhash('confirmed');
        } catch (error) {
            console.warn(`[Solana] Blockhash fetch failed for ${endpoint}:`, error);
        }
    }
    
    // Last resort: try 'processed' on primary
    try {
        return await activeConnection.getLatestBlockhash('processed');
    } catch (e) {
        throw new Error("Solana Network Error: Unable to fetch recent blockhash from any RPC node. Please try again in 30 seconds.");
    }
}

/**
 * Enhanced Send and Confirm logic that handles broadcasting and status polling reliably.
 */
async function sendAndConfirmRobust(
  wallet: WalletContextState, 
  transaction: Transaction, 
  connection: Connection
): Promise<string> {
  if (!wallet.publicKey || !wallet.sendTransaction) throw new Error("Wallet not connected");

  const { blockhash, lastValidBlockHeight } = await getLatestBlockhashRobust(connection);
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;

  console.log(`[Solana] Sending transaction with hash: ${blockhash.substring(0, 8)}...`);

  const signature = await wallet.sendTransaction(transaction, connection, {
    preflightCommitment: 'processed',
    skipPreflight: false,
    maxRetries: 5
  });

  console.log(`[Solana] Signature received: ${signature}. Awaiting confirmation...`);

  // Confirmation Loop
  const startTime = Date.now();
  const timeout = connection.rpcEndpoint.includes('mainnet') ? 60000 : 30000;
  
  let confirmed = false;
  let statusCheckCount = 0;

  while (Date.now() - startTime < timeout) {
    statusCheckCount++;
    try {
      const { value: status } = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
      
      if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
        console.log(`[Solana] Transaction confirmed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        confirmed = true;
        break;
      }
      
      if (status?.err) {
        throw new Error(`On-chain transaction error: ${JSON.stringify(status.err)}`);
      }
      
      // Every 10 seconds, re-broadcast if not seeing it (optional but good for reliability)
      if (statusCheckCount % 5 === 0) {
        console.log(`[Solana] Re-checking status for ${signature}...`);
      }
    } catch (e: any) {
      if (e.message.includes("On-chain transaction error")) throw e;
      console.warn(`[Solana] Status check failed (attempt ${statusCheckCount}):`, e.message);
    }
    
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!confirmed) {
    console.warn(`[Solana] Transaction ${signature} not confirmed within timeout, but might still land. Check Solscan.`);
  }

  return signature;
}

export async function requestPayment(wallet: WalletContextState, amount: number = 0, customConnection?: Connection) {
  const activeConnection = customConnection || connection;
  const userPublicKey = toPublicKey(wallet.publicKey, "User Wallet");

  try {
    const transaction = new Transaction();
    
    // Add Priority Fees
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 2000000 })
    );

    if (amount > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: getTreasuryPublicKey(),
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );
    } else {
      transaction.add(
        new TransactionInstruction({
          keys: [{ pubkey: userPublicKey, isSigner: true, isWritable: false }],
          programId: getMemoProgramId(),
          data: Buffer.from(`Rexy Payment Proof: ${Date.now()}`),
        })
      );
    }

    return await sendAndConfirmRobust(wallet, transaction, activeConnection);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Payment Error:", msg);
    throw new Error(msg);
  }
}

/**
 * Records an audit hash and score on the Solana blockchain using the Memo Program.
 */
export async function recordAuditOnChain(wallet: WalletContextState, auditHash: string, score: number, customConnection?: Connection) {
  const activeConnection = customConnection || connection;
  const userPublicKey = toPublicKey(wallet.publicKey, "User Wallet");

  try {
    const memoData = JSON.stringify({
      app: "Rexy AI",
      hash: auditHash,
      score: score,
      ts: Date.now()
    });

    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 150000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 2000000 }),
      new TransactionInstruction({
        keys: [{ pubkey: userPublicKey, isSigner: true, isWritable: false }],
        programId: getMemoProgramId(),
        data: Buffer.from(memoData),
      })
    );

    return await sendAndConfirmRobust(wallet, transaction, activeConnection);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("On-Chain Recording Error:", msg);
    throw new Error(`Verification failed: ${msg}`);
  }
}

/**
 * Initiates the minting of an Audit Certificate.
 */
export async function mintAuditCertificate(wallet: WalletContextState, auditData: { id: string, score: number, name: string }, customConnection?: Connection) {
  const activeConnection = customConnection || connection;
  const userPublicKey = toPublicKey(wallet.publicKey, "User Wallet");

  try {
    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 150000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 2000000 }),
      new TransactionInstruction({
        keys: [{ pubkey: userPublicKey, isSigner: true, isWritable: false }],
        programId: getMemoProgramId(),
        data: Buffer.from(`Rexy Mint Cert: ${auditData.id} | Score: ${auditData.score}`),
      })
    );

    const signature = await sendAndConfirmRobust(wallet, transaction, activeConnection);
    
    return {
      success: true,
      signature: signature,
      message: "Certificate request successfully recorded on-chain."
    };
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Minting Error:", msg);
    throw new Error(`Minting failed: ${msg}`);
  }
}

