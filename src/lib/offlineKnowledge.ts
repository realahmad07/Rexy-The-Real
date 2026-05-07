
export interface OfflineEntry {
  keywords: string[];
  answer: string;
  category: 'security' | 'solana' | 'general' | 'help' | 'chat';
}

export const OFFLINE_KNOWLEDGE: OfflineEntry[] = [
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon'],
    category: 'chat',
    answer: "Hello! I'm Rexy, your AI Security Auditor. How can I assist you with your Solana smart contracts today?"
  },
  {
    keywords: ['how are you', 'hows it going', 'how are things'],
    category: 'chat',
    answer: "I'm functioning at peak efficiency! Ready to scan for vulnerabilities and secure the decentralized future. How are you doing today?"
  },
  {
    keywords: ['who are you', 'what are you', 'your name'],
    category: 'chat',
    answer: "I am Rexy, an Autonomous AI Security Layer designed specifically for the Solana ecosystem. I specialize in auditing Rust and Anchor-based smart contracts."
  },
  {
    keywords: ['thank you', 'thanks', 'ty'],
    category: 'chat',
    answer: "You're very welcome! Security is a collaborative effort. Let me know if you have more questions or need another scan."
  },
  {
    keywords: ['bye', 'goodbye', 'see ya', 'exit'],
    category: 'chat',
    answer: "Goodbye! Stay secure and keep building. Your audit reports are saved if you need them later."
  },
  {
    keywords: ['help', 'what can you do', 'features'],
    category: 'help',
    answer: "I can audit Solana programs, detect vulnerabilities (Signer checks, Overflow, etc.), provide fix suggestions, and chat about Web3 security best practices."
  },
  {
    keywords: ['life', 'daily', 'routine', 'advice', 'productivity'],
    category: 'general',
    answer: "In daily life, balance is key—just like in code. For productivity, try the Pomodoro technique: 25 minutes of deep focus (or auditing!) followed by a 5-minute break. Stay hydrated and keep your private keys safe."
  },
  {
    keywords: ['reentrancy', 'attack', 'recursive', 'loop'],
    category: 'security',
    answer: "Reentrancy is a vulnerability where an external call can call back into your contract before the first execution is finished. In Solana, this is less common due to the account-based model, but logic reentrancy still exists. Always update state before making external calls or use reentrancy guards."
  },
  {
    keywords: ['overflow', 'arithmetic', 'u64', 'math', 'checked'],
    category: 'security',
    answer: "Integer Overflow/Underflow occurs when an arithmetic operation exceeds the maximum or minimum value of a data type. Always use `checked_add`, `checked_sub`, and `checked_mul` in Rust/Solana to prevent program crashes or logical theft."
  },
  {
    keywords: ['signer', 'authorization', 'permission', 'unauthorized'],
    category: 'security',
    answer: "Instruction validation is critical. Ensure that every instruction verifies that the required signers have approved the transaction. In Anchor, use the `Signer<'info>` type instead of `AccountInfo<'info>` for accounts that must authorize the action."
  },
  {
    keywords: ['pda', 'program derived address', 'seeds', 'bump'],
    category: 'solana',
    answer: "PDAs (Program Derived Addresses) are addresses that the program can programmatically sign for. They are derived from seeds and a bump seed. They are essential for creating escrow accounts, user state, and vaults."
  },
  {
    keywords: ['anchor', 'framework', 'rust', 'v0.30'],
    category: 'solana',
    answer: "Anchor is the most popular framework for Solana development. It provides a suite of tools (CLI, eDSL, IDL) that make writing secure and maintainable Solana programs much easier. It handles serialization and account validation automatically."
  },
  {
    keywords: ['audit', 'scan', 'check', 'security', 'report'],
    category: 'general',
    answer: "Rexy AI performs deep logic scans of your smart contracts. It looks for common patterns like missing signer checks, unsafe math, arbitrary account loading, and ownership vulnerabilities. Simply paste your code in the Audit tab to start."
  },
  {
    keywords: ['phantom', 'wallet', 'connect', 'login'],
    category: 'help',
    answer: "To use Rexy, connect your Phantom wallet. This allows the system to verify your identity on the Solana blockchain. If you don't have a wallet, we provide an 'Internal Portal' login for authorized auditors."
  },
  {
    keywords: ['flash', 'loan', 'arbitrage', 'liquidity'],
    category: 'security',
    answer: "Flash loans allow users to borrow large amounts of capital for a single transaction. While useful for arbitrage, they are often used in exploits to manipulate oracle prices or trigger liquidations. Always use multi-source oracles and strict slippage checks."
  },
  {
    keywords: ['oracle', 'pyth', 'switchboard', 'price', 'feed'],
    category: 'solana',
    answer: "Oracles like Pyth and Switchboard provide off-chain data (like asset prices) to the blockchain. Secure integration requires checking for staleness, confidence intervals, and ensuring the price source isn't easily manipulated."
  },
  {
    keywords: ['spl', 'token', 'mint', 'transfer', 'account'],
    category: 'solana',
    answer: "SPL (Solana Program Library) tokens are the standard for fungible and non-fungible assets on Solana. Common security tasks include verifying the token mint and checking that associated token accounts are valid."
  },
  {
    keywords: ['rent', 'exempt', 'lamports', 'storage'],
    category: 'solana',
    answer: "Storage on Solana requires 'rent' paid in lamports. Most developers make accounts 'rent-exempt' by depositing enough lamports to cover storage forever. Use `Rent::get()?.minimum_balance(size)` to calculate this."
  },
  {
    keywords: ['ownership', 'owner', 'check', 'constraint'],
    category: 'security',
    answer: "Failing to check the owner of an account is a critical bug. An attacker can pass an account owned by a different program to spoof data. Anchor's `Account<'info, T>` check handles this for you automatically."
  },
  {
    keywords: ['deploy', 'program', 'id', 'keypair'],
    category: 'general',
    answer: "To deploy a Solana program, use `solana program deploy <PATH_TO_SO_FILE>`. Make sure your `DeclareId` in the code matches the public key of the deployment keypair."
  },
  {
    keywords: ['quantum', 'threat', 'ai', 'scanning'],
    category: 'security',
    answer: "Rexy's 'Quantum Scan' refers to our proprietary heuristic engine that simulates high-frequency state changes and 'dirty' transaction sequences to find vulnerabilities that traditional static analysis might miss."
  },
  {
    keywords: ['burn', 'supply', 'tokenomics'],
    category: 'general',
    answer: "Burning tokens reduces the total supply by sending them to an address from which they can never be recovered. This is often used to manage inflation or reward holders in various DeFi protocols."
  },
  {
    keywords: ['escrow', 'trustless', 'swap'],
    category: 'solana',
    answer: "Escrow programs allow two parties to trade assets without trusting each other. Usually, a PDA is used to hold the assets until both parties fulfill their requirements, ensuring a secure and atomic swap."
  },
  {
    keywords: ['governance', 'dao', 'voting', 'proposals'],
    category: 'solana',
    answer: "Governance on Solana is typically handled via tokens and DAOs. Protocols like SPL Governance allow users to vote on proposals and execute on-chain instructions based on the outcome."
  },
  {
    keywords: ['slippage', 'dex', 'trade', 'swap'],
    category: 'general',
    answer: "Slippage is the difference between the expected price of a trade and the price at which it's executed. High slippage can lead to 'sandwich attacks' by bots. DEX users should always set a maximum slippage tolerance."
  }
];

export function findOfflineResponse(query: string): string | null {
  const normalizedQuery = query.toLowerCase();
  
  // Basic keyword scoring
  let bestMatch: OfflineEntry | null = null;
  let highestScore = 0;

  for (const entry of OFFLINE_KNOWLEDGE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (normalizedQuery.includes(keyword)) {
        score++;
      }
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && highestScore > 0) {
    return bestMatch.answer;
  }

  return "I'm currently operating in Offline Mode and I couldn't find a specific answer to your query in my local database. Try asking about 'vulnerabilities', 'overflow', 'signers', or 'audit process'.";
}
