import { Buffer } from "buffer";
import { GoogleGenAI, Type } from "@google/genai";
import { AuditReport } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAi(apiKey: string) {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function performAudit(contractCode: string): Promise<AuditReport | null> {
  // Check multiple sources for the API key to handle different deployment environments
  const apiKey = 
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Analyze the following smart contract code:\n\n${contractCode}`,
      config: {
        systemInstruction: `You are Rexy, a world-class Smart Contract Security Researcher and multi-chain expert. 
Your mission is to perform deep security audits on smart contracts using a multi-stage analysis engine.

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

The 'summary' field MUST be a comprehensive, multi-paragraph executive summary (at least 200 words). It should cover:
1. Overall security posture and architecture review.
2. Detailed breakdown of the most critical vulnerabilities found.
3. Impact analysis on user funds and protocol integrity.
4. Strategic recommendations for long-term security.
5. A concluding statement on the contract's readiness for mainnet.

For every issue, provide a clear 'fixedCode' snippet. Crucially, you MUST also provide a 'fullFixedCode' field containing the ENTIRE smart contract with ALL security improvements and vulnerabilities patched.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contractName: { type: Type.STRING },
            summary: { type: Type.STRING },
            score: { type: Type.NUMBER },
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
