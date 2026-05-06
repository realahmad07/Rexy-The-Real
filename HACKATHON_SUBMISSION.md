# Rexy AI Auditor - Solana Colosseum Hackathon Submission

## 🛡️ Project Overview
Rexy is an AI-powered smart contract security layer designed to provide real-time vulnerability detection, automated patching, AI-assisted copilot discussions, and on-chain verification for the **Solana (Anchor/Rust)** ecosystem. It bridges the gap between complex security audits and rapid development by providing production-ready fixes and immutable on-chain proofs.

## 🚀 Key Features (Hackathon "Win Factors")
- **Double Layer Security Architecture**: Rexy employs a rigorous two-step verification process. Every contract first runs against our custom **Solana Vulnerability Library** (static analysis rules) to catch known exploits instantly, before being passed to **Groq Llama-3** for deep semantic reasoning.
- **Secure Full-Stack Architecture**: Rexy uses a **Secure Backend Proxy** to handle AI requests, protecting sensitive API keys and safely evaluating AI inputs.
- **Groq Llama-3 Driven**: Massive speed and reasoning capabilities allowing the engine to parse Anchor projects and detect logical exploits beyond simple linting.
- **On-Chain Audit Proofs & Certificate Staking**: Every audit result is recorded on the Solana blockchain. Users can mint **Compressed NFTs** as verified badges, and further **Stake their verification** into an on-chain registry, creating a zero-trust network of audited contract proofs.
- **Interactive AI Copilot**: A built-in chat agent powered by Gemini, allowing developers to converse with their code, ask about specific patches, or request post-quantum migration strategies.
- **Real Transactions (No "Demo" Toggles)**: A strict commitment to authentic blockchain interaction. Users "Pay AND Start" their audit, interacting with Phantom wallet immediately rather than relying on mocked flows.
- **Audit by Address**: UX-first approach allowing users to fetch contract source code directly from a Solana address via RPC/Helius.
- **AI-Powered Patching**: One-click "Apply All Fixes" feature that generates secure, production-ready code with syntax-highlighted diffs.

## 👩‍⚖️ Access Instructions for Judges
If you do not wish to connect a real Solana wallet, you can use the **Auditor Credentials** access:
- **Button**: Click "Access with Auditor Credentials" on the login screen.
- **Username**: `judge`
- **Password**: `rexy-2026`
*(Note: Guest access provides full AI auditing simulation but disables actual on-chain transaction signing)*.

## 🛠️ Technical Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Zustand/Context API.
- **AI Engine**: Groq Llama-3 (Deep Brain Engine) & Google Gemini 1.5 Pro.
- **Blockchain**: Solana Web3.js, @solana/wallet-adapter, @solana-developers/helpers, Phantom Wallet.
- **Data & Auth**: Firebase (Firestore/Auth) for user audit history tracking.

## 💰 Integrated Payment Flow
- **Pay AND Start**: Users seamlessly connect their Phantom wallet and pay a transaction fee up front to authorize the audit and record intent on-chain.
- **cNFT Minting & Staking**: Interactions with our smart contracts for minting compressed NFTs or staking proofs are charged standard network operations fees, preserving a highly scalable business model.

## 📖 How to Run the Demo
1. **Connect Wallet**: Click "Connect Wallet" in the header. Connect your **Phantom** wallet.
2. **Fetch or Paste Code**: Enter a Solana address to fetch code or paste your Rust/Anchor program directly.
3. **Pay AND Start**: Click "Pay AND Start". This triggers a real transaction to record your audit intent securely via Phantom.
4. **Chat with Copilot**: While analyzing, ask Rexy about security practices.
5. **Record & Mint**: Once the audit is done, click "Record Proof On-Chain" and "Mint Certificate" to receive your badge.
6. **Stake the Proof**: Finalize by staking the audit hash onto the blockchain registry for public verification.

## 🏆 Hackathon Submission Details (Colosseum)
- **Project Name**: Rexy AI Auditor
- **Category**: Infrastructure & Tooling / Security / AI / Developer Tools
- **Submission Link**: [Your Hackathon URL]
- **Demo Video**: [Link to your Loom/YouTube demo]
- **GitHub Repository**: [Link to your repo]

## 📝 Future Roadmap (Elite Rexy V2)
- **Phase 1 (Current)**: High-Depth AI Audits, AI Copilot, cNFT Certificates, Staking, and On-Chain Proofs.
- **Phase 2 (Late 2026)**: **Rexy Sentinel Agents** – 24/7 autonomous threat monitoring for deployed mainnet contracts actively tracing transactions.
- **Phase 3 (2027)**: **The Verification Marketplace** – Connecting AI reasoning with top-tier human security researchers for "Human-Certified" stamps.
- **Phase 4 (2028)**: **ZK-Proof of Inference** – Bringing absolute mathematical certainty to AI-driven security results.

---
*Built with ❤️ for Solana Colosseum*
