import { Buffer } from "buffer";
import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport } from "../types";
import { analyzeWithVulnLibrary } from "../lib/solanaVulnerabilities";

let aiInstance: GoogleGenAI | null = null;

function getAi(apiKey: string) {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function performAudit(contractCode: string, isQuantumAttack: boolean = false): Promise<AuditReport | null> {
  // Check multiple sources for the API key to handle different deployment environments
  const apiKey = 
    (typeof window !== "undefined" && (window as any).__ENV__?.GEMINI_API_KEY) ||
    process.env.GEMINI_API_KEY || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    console.error("GEMINI_API_KEY is missing from the environment.");
    throw new Error(
      "Gemini AI integration is not configured. \n\n" +
      "1. AI Studio Settings: Go to Settings -> API Keys and ensure GEMINI_API_KEY is set.\n" +
      "2. Local Development: Ensure your .env file contains GEMINI_API_KEY.\n" +
      "3. Production (Netlify/Vercel): Add GEMINI_API_KEY to your platform's Environment Variables."
    );
  }

  // Debug log (masked) to verify key presence in production
  console.log(`Using API Key starting with: ${apiKey.substring(0, 6)}...`);

  const ai = getAi(apiKey);

  // First pass: Static analysis based on vulnerability library
  const staticAnalysis = analyzeWithVulnLibrary(contractCode);

  const quantumPromptAddition = isQuantumAttack 
    ? `\n\n🚨 QUANTUM Q-DAY SIMULATION ACTIVE 🚨\nAssume the primary admin/owner private keys have been mathematically broken by a quantum computer running Shor's Algorithm. Perform a threat model focusing on:\n- Blast Radius: What can the attacker drain/destroy instantly?\n- PQC Readiness: Does the contract lack time-locks, multi-sigs, or upgradeability to mitigate sudden key compromise?\n- Hardcoded Crypto: Are there manual secp256k1 or ed25519 signature verifications that need post-quantum cryptographic (PQC) upgrades?\n\nCRITICAL DIRECTIVE: The 'fullFixedCode' MUST contain REAL mitigation code. Do not just fix normal bugs. You MUST inject Post-Quantum Cryptography (PQC) / Q-Day defenses: Add emergency freeze/pause multi-sigs, time-locks for critical state changes, and explicitly comment on areas replacing legacy signatures with PQC-ready verifications. Explicitly state in your summary how the quantum risk was neutralized.` 
    : `\n\n🔍 Q-Day Readiness Assessment: Analyze the contract for Post-Quantum readiness (hardcoded crypto, blast radius of key compromise, time-locks, upgradeability).`;

  // Refine prompt based on static analysis findings
  const staticFindingsPrompt = staticAnalysis.findings.length > 0 
    ? `\n\n⚠️ PRELIMINARY STATIC ANALYSIS FINDINGS (These MUST be verified and expanded upon):\n${JSON.stringify(staticAnalysis.findings)}`
    : "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following smart contract code:\n\n${contractCode}${quantumPromptAddition}${staticFindingsPrompt}`,
      config: {
        systemInstruction: `You are Rexy, a world-class Smart Contract Security Researcher and multi-chain expert. 
Your mission is to perform deep security audits on smart contracts using a multi-stage analysis engine.

⛔ CRITICAL FORMATTING RULES:
1. You MUST return valid JSON.
2. For 'fixedCode' and 'fullFixedCode' fields, do NOT include markdown code blocks (like \`\`\`rust). Use raw string content with properly escaped newlines (\n).
3. Ensure all generated code is perfectly indented and follows language-specific best practices (Anchor/Rust for Solana, Solidity for Ethereum).

2️⃣ STATIC ANALYSIS ENGINE
Scan code for language-specific vulnerabilities:
- Solana: Missing Signer<'info>, Missing has_one / constraints, Missing PDA (seeds, bump), Unsafe lamports manipulation, Arbitrary account injection, Missing ownership validation.
- Solidity: Reentrancy vulnerabilities, Unsafe external calls (call, delegatecall), Missing access modifiers, tx.origin misuse, Integer overflow/underflow, Unchecked return values.

3️⃣ SECURITY RULE ENGINE
Implement rule-based detection for critical patterns:
- IF: balance updated WITHOUT transfer -> Flag "Fake Deposit" (Critical)
- IF: withdraw WITHOUT ownership check -> Flag "Unauthorized Access" (High)
- IF: direct lamports modification -> Flag "Unsafe Transfer" (High)

4️⃣ LOGIC FLOW ANALYZER
Simulate contract behavior and track state transitions:
- Track deposit → balance → withdraw flow.
- Detect inconsistencies: Can user withdraw without deposit? Can balance be manipulated? Does state become inconsistent?

5️⃣ ATTACK SIMULATION ENGINE (IMPORTANT)
Simulate specific attacker behaviors to verify exploitability:
- Unauthorized withdrawal, Reentrancy (Solidity), Passing fake accounts (Solana), Overflow attacks, Calling functions in wrong sequence.
- For every issue, you MUST return:
  1. Whether an exploit is possible.
  2. A step-by-step attack explanation.

For every vulnerability found, you MUST also provide:
1. Financial Risk: The potential monetary loss or impact on treasury/user funds.
2. Logic Risk: How the flaw breaks the intended business logic or state machine.
3. Access Control Risk: The risk associated with unauthorized access to sensitive instructions or state.

Provide a detailed report in JSON format. Be critical but constructive. 

📊 SCORING ALGORITHM:
- Start at 100 points.
- Critical: -30 points each.
- High: -20 points each.
- Medium: -10 points each.
- Low: -3 points each.
- Informational: -1 point each.
- If NO Critical or High issues exist, the score MUST be 95 or higher.
- Consistency Rule: If the code is already secure, you MUST return 100/100 and an empty 'issues' array.

The 'summary' field MUST be a comprehensive, multi-paragraph executive summary (at least 200 words). It should cover:
1. Overall security posture and architecture review.
2. Detailed breakdown of the most critical vulnerabilities found.
3. Impact analysis on user funds and protocol integrity.
4. Strategic recommendations for long-term security.
5. A concluding statement on the contract's readiness for mainnet.

For every issue, provide a clear 'fixedCode' snippet. Crucially, you MUST also provide a 'fullFixedCode' field containing the ENTIRE smart contract with ALL security improvements and vulnerabilities patched.`,
        responseMimeType: "application/json",
        temperature: 0.1,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contractName: { type: Type.STRING },
            summary: { type: Type.STRING },
            score: { type: Type.NUMBER },
            quantumReadinessScore: { type: Type.NUMBER },
            quantumReadinessSummary: { type: Type.STRING },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low", "Informational"] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  fixedCode: { type: Type.STRING },
                  line: { type: Type.NUMBER },
                  gasImpact: { type: Type.STRING },
                  reference: { type: Type.STRING },
                  financialRisk: { type: Type.STRING },
                  logicRisk: { type: Type.STRING },
                  exploitLikelihood: { type: Type.STRING },
                  accessControlRisk: { type: Type.STRING }
                },
                required: ["severity", "title", "description", "recommendation", "financialRisk", "logicRisk", "exploitLikelihood", "accessControlRisk"]
              }
            },
            fullFixedCode: { type: Type.STRING },
            gasOptimizationSummary: { type: Type.STRING }
          },
          required: ["summary", "score", "issues"]
        }
      }
    });

    const reportData = JSON.parse(response.text || "{}");
    
    return {
      ...reportData,
      timestamp: Date.now(),
      codeHash: Buffer.from(contractCode).toString('base64').substring(0, 16)
    };
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
}

export async function chatWithRexy(message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []): Promise<string> {
  const apiKey = 
    (typeof window !== "undefined" && (window as any).__ENV__?.GEMINI_API_KEY) ||
    process.env.GEMINI_API_KEY || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    (import.meta as any).env?.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error("Gemini AI integration is not configured. Missing API Key.");
  }

  const ai = getAi(apiKey);
  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction: "You are Rexy Copilot, a highly advanced Smart Contract Security Engineer and Web3 expert, specifically focused on the Solana ecosystem. You are witty, sharp, and slightly cheeky but always incredibly accurate. You help developers find bugs, write secure Anchor (Rust) code, and understand post-quantum cryptography mitigation. Keep responses concise unless coding is required. Provide perfectly formatted markdown for any code snippets.",
      temperature: 0.7,
    },
  });

  try {
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts.map(p => ({ text: p.text }))
    }));
    
    const response = await chat.sendMessage({
      message: message
    });
    
    return response.text || "I was unable to formulate a response.";
  } catch (error) {
    console.error("Rexy Chat Error:", error);
    throw error;
  }
}
