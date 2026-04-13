# Rexy AI Auditor: Smart Contract Security Layer (Solana Hackathon Edition)

Rexy AI Auditor is a cutting-edge, blockchain-verified security auditing platform designed specifically for the Solana ecosystem. It combines the power of Large Language Models (LLMs) with the immutability of the Solana blockchain to provide transparent, tamper-proof, and highly accurate security audits for smart contracts.

## 🚀 Core Features

### 1. AI-Driven Security Engine
- **Model**: Powered by **Google Gemini 1.5 Pro**, optimized for high-depth code analysis and vulnerability detection.
- **Security Architecture**: AI audits are processed via a **Secure Backend Proxy** (Express/Node.js). This hides sensitive API keys from the client and allows for server-side validation and rate limiting.
- **Support**: Deep support for **Anchor (Rust)** and **Solidity** (EVM compatibility).
- **Analysis**: Detects reentrancy, integer overflows, access control flaws, and gas optimization opportunities.
- **AI Patching**: Automatically generates "AI Security Patches" (diffs) that users can apply directly to their source code.

### 2. Blockchain-Verified Audit Protocol
- **On-Chain Proof**: Every audit generates a cryptographic SHA-256 hash of the source code. This hash, along with the audit score and timestamp, is recorded on the Solana blockchain using the **Solana Memo Program**.
- **cNFT Certificates**: Successful audits can mint a **Rexy Audit cNFT Certificate**. This compressed NFT serves as a portable, verifiable "Verified" badge of security for developers to showcase.
- **Immutable History**: Audits are persisted to **Firebase Firestore** and linked to the user's Solana wallet address, creating a permanent security track record.
- **Gas Optimization**: Transactions are optimized with minimal **Compute Budget** (e.g., 5,000 - 10,000 units) to minimize user fees while ensuring fast confirmation.

### 3. Pricing Model
- **Initial AI Audit**: **FREE** (User only pays the standard Solana network gas fee via the Memo Program).
- **cNFT Audit Certificate**: **0.05 SOL** (The fee for minting the "Verified" status badge).

### 4. Advanced Security Visualization
- **Live Blockchain Graph**: A real-time D3.js visualization of network activity and audit propagation.
- **Vulnerability Feed**: A live stream of global security threats and common Solana attack vectors.
- **Telemetry Console**: A terminal-like interface showing the step-by-step progress of the AI security scan.

---

## 🛠 How to Use Rexy AI Auditor

1. **Connect Wallet**: Click the "Connect Wallet" button in the header to link your **Phantom** wallet (Devnet).
2. **Login**: Authenticate via Google or Web3 Session to enable cloud history.
3. **Input Code**: Paste your Anchor (Rust) or Solidity code into the high-performance code editor.
4. **Pay Gas & Audit**: Click "Pay Gas & Start Audit". A transaction for the network fee (0 SOL + gas) will be triggered using the Memo Program.
5. **Review Results**:
   - **Score**: View your overall security score (0-100).
   - **Issues**: Expand issues to see descriptions, recommendations, and gas impacts.
   - **Apply Fixes**: Click "Apply AI Patch" to automatically fix vulnerabilities in your editor.
6. **Verify On-Chain**: Click the "Record Proof On-Chain" or "Mint Certificate" buttons to view the immutable audit records on **Solscan**.

---

## 🏆 Solana Hackathon Strategy: How to Win

Rexy AI Auditor is positioned as a **Infrastructure & Tooling** track contender. To maximize winning potential, we have implemented the following "Hackathon Winning" criteria:

### Why It Wins:
1. **Real Utility**: Addresses the #1 problem in DeFi/Web3: Security.
2. **Technical Depth**: Uses real Solana programs (Memo), real compressed NFT minting, and real-time on-chain verification.
3. **AI Integration**: Leverages Gemini 1.5 Pro for a feature that is impossible with traditional static analysis tools.
4. **Polished UI/UX**: A "Bento-box" inspired dark mode UI that feels professional and production-ready.

---

## 📦 Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
- **Blockchain**: `@solana/web3.js`, `@solana/wallet-adapter`.
- **AI**: `@google/genai` (Gemini 1.5 Pro).
- **Backend**: Express.js, Firebase Auth & Firestore.
- **Visuals**: D3.js (Blockchain Graph), Lucide-React (Icons).

---
*Rexy AI Auditor - Securing the Future of Solana, One Block at a Time.*
