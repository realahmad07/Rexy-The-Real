# Rexy AI Auditor - Solana Hackathon Submission

## 🛡️ Project Overview
Rexy is an AI-powered smart contract security layer designed to provide real-time vulnerability detection, automated patching, and on-chain verification for the **Solana (Anchor/Rust)** ecosystem. It bridges the gap between complex security audits and rapid development by providing production-ready fixes and immutable on-chain proofs.

## 🚀 Key Features (Hackathon "Win Factors")
- **Secure Full-Stack Architecture**: Unlike simple wrappers, Rexy uses a **Secure Backend Proxy** to handle AI requests, protecting sensitive API keys and enabling server-side validation.
- **Multi-Stage AI Analysis Engine**: Includes a Static Analysis Engine, Rule-Based Detection, Logic Flow Analyzer, and an **Attack Simulation Engine** that provides step-by-step exploit explanations.
- **Multi-Chain AI Auditor**: Rexy now automatically detects and audits both **Solana (Anchor/Rust)** and **Solidity (EVM)** smart contracts.
- **On-Chain Audit Proofs**: Every audit result is recorded on the Solana blockchain using the **Memo Program**, providing immutable, verifiable proof of security.
- **cNFT Audit Certificates**: Users can mint **Compressed NFTs** as "Verified" status badges for their contracts, leveraging Solana's unique scaling technology for ultra-low-cost, permanent trust signals.
- **Gas-Optimized Transactions**: Custom **Compute Budget** management ensures transactions are both cheap and reliable, even during network congestion.
- **Real-Time Threat Monitoring (Phase 2 Preview)**: Integrated with **Helius Webhooks** to monitor deployed contracts for suspicious transactions. Currently in **Beta (Under Development)** with a live system preview.
- **Audit by Address**: UX-first approach allowing users to fetch contract source code directly from a Solana address via RPC/Helius.
- **AI-Powered Patching**: One-click "Apply All Fixes" feature that generates secure, production-ready code using **Gemini 1.5 Pro**.

## 🛠️ Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion.
- **AI Engine**: Google Gemini 1.5 Pro (Optimized for deep code reasoning).
- **Blockchain**: Solana Web3.js, @solana/wallet-adapter, Memo Program, cNFTs.
- **Infrastructure**: Helius RPC & Digital Asset API, Firebase (Firestore/Auth).

## 💰 Pricing Model
- **Initial AI Audit**: **FREE** (User only pays the standard Solana network gas fee via the Memo Program).
- **cNFT Audit Certificate**: **0.05 SOL** (The fee for minting the "Verified" status badge).

## 📖 How to Run the Demo
1. **Connect Wallet**: Click "Select Wallet" in the header. Connect your **Phantom** wallet (set to **Devnet**).
2. **Fetch or Paste Code**: Enter a Solana address to fetch code or paste your Rust/Anchor program directly.
3. **Pay Gas & Audit**: Click "Pay Gas & Start AI Audit". This triggers a real transaction (0 SOL + gas) with **Priority Fees** to record your audit intent.
4. **Record Proof**: Once the audit is done, click "Record Proof On-Chain" to store the hash and score on Solana.
5. **Mint Certificate**: Click "Mint Certificate (0.05 SOL)" to receive your on-chain "Verified" security badge.

## 🏆 Hackathon Submission Details
- **Project Name**: Rexy AI Auditor
- **Category**: Infrastructure & Tooling / Security / AI
- **Submission Link**: [Your Hackathon URL]
- **Demo Video**: [Link to your Loom/YouTube demo]
- **GitHub Repository**: [Link to your repo]

## 📝 Future Roadmap (Elite Rexy V2)
- **Phase 1 (Current)**: Multi-Chain AI Audits (Solana & Solidity), cNFT Certificates, and On-Chain Proof of Intent.
- **Phase 2 (Q3 2026)**: **Rexy Sentinel Agents** – 24/7 autonomous monitoring for deployed mainnet contracts. (Currently in **Beta / Under Development**).
- **Phase 3 (Q4 2026)**: **The Verification Marketplace** – Connecting AI reasoning with top-tier human security researchers for "Human-Certified" stamps.
- **Phase 4 (2027)**: **ZK-Proof of Inference** – Bringing absolute mathematical certainty to AI-driven security.

---
*Built with ❤️ for the Solana Hackathon*
