import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
// Inline blink service to keep server.js pure for "node server.js" without tsx
const BLINK_CONFIG = {
  icon: 'https://picsum.photos/seed/sentinel-blink/400/400',
  title: 'Sentinel AI Audit',
  description: 'Instantly audit any Solana Smart Contract directly from your feed.',
  label: 'Audit Now',
};

function generateAuditBlink(contractAddress) {
  return {
    icon: BLINK_CONFIG.icon,
    title: BLINK_CONFIG.title,
    description: contractAddress 
      ? `Audit contract: ${contractAddress}` 
      : BLINK_CONFIG.description,
    label: BLINK_CONFIG.label,
    links: {
      actions: [
        {
          label: 'Run AI Audit (Free + Gas)',
          href: `/api/actions/audit?address={address}`,
          parameters: [
            {
              name: 'address',
              label: 'Smart Contract Address',
              required: true,
            }
          ]
        }
      ]
    }
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "8080", 10);

  app.use(cors());
  app.use(express.json());

  // Gemini API Routes (Secure Backend)
  app.post("/api/gemini/audit", async (req, res) => {
    try {
      const { contractCode, isQuantumAttack } = req.body;
      if (!contractCode) {
        return res.status(400).json({ error: "contractCode is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Server GEMINI_API_KEY varies" });
      }

      // First pass: Static analysis based on vulnerability library
      // Because we lack the frontend imports here, let's just use the AI for the analysis.
      const quantumPromptAddition = isQuantumAttack 
        ? `\n\n🚨 QUANTUM Q-DAY SIMULATION ACTIVE 🚨\nAssume the primary admin/owner private keys have been mathematically broken by a quantum computer running Shor's Algorithm. Perform a threat model focusing on:\n- Blast Radius: What can the attacker drain/destroy instantly?\n- PQC Readiness: Does the contract lack time-locks, multi-sigs, or upgradeability to mitigate sudden key compromise?\n- Hardcoded Crypto: Are there manual secp256k1 or ed25519 signature verifications that need post-quantum cryptographic (PQC) upgrades?\n\nCRITICAL DIRECTIVE: The 'fullFixedCode' MUST contain REAL mitigation code. Do not just fix normal bugs. You MUST inject Post-Quantum Cryptography (PQC) / Q-Day defenses: Add emergency freeze/pause multi-sigs, time-locks for critical state changes, and explicitly comment on areas replacing legacy signatures with PQC-ready verifications. Explicitly state in your summary how the quantum risk was neutralized.` 
        : `\n\n🔍 Q-Day Readiness Assessment: Analyze the contract for Post-Quantum readiness (hardcoded crypto, blast radius of key compromise, time-locks, upgradeability).`;

      const ai = new (await import("@google/genai")).GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following smart contract code:\n\n${contractCode}${quantumPromptAddition}`,
        config: {
          systemInstruction: `You are Rexy, a world-class Smart Contract Security Researcher and multi-chain expert. 
Your mission is to perform deep security audits on smart contracts using a multi-stage analysis engine.

⛔ CRITICAL FORMATTING RULES:
1. You MUST return valid JSON.
2. For 'fixedCode' and 'fullFixedCode' fields, do NOT include markdown code blocks (like \`\`\`rust). Use raw string content with properly escaped newlines (\\n).
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
            type: (await import("@google/genai")).Type.OBJECT,
            properties: {
              contractName: { type: (await import("@google/genai")).Type.STRING },
              summary: { type: (await import("@google/genai")).Type.STRING },
              score: { type: (await import("@google/genai")).Type.NUMBER },
              quantumReadinessScore: { type: (await import("@google/genai")).Type.NUMBER },
              quantumReadinessSummary: { type: (await import("@google/genai")).Type.STRING },
              issues: {
                type: (await import("@google/genai")).Type.ARRAY,
                items: {
                  type: (await import("@google/genai")).Type.OBJECT,
                  properties: {
                    severity: { type: (await import("@google/genai")).Type.STRING, enum: ["Critical", "High", "Medium", "Low", "Informational"] },
                    title: { type: (await import("@google/genai")).Type.STRING },
                    description: { type: (await import("@google/genai")).Type.STRING },
                    recommendation: { type: (await import("@google/genai")).Type.STRING },
                    fixedCode: { type: (await import("@google/genai")).Type.STRING },
                    line: { type: (await import("@google/genai")).Type.NUMBER },
                    gasImpact: { type: (await import("@google/genai")).Type.STRING },
                    reference: { type: (await import("@google/genai")).Type.STRING },
                    financialRisk: { type: (await import("@google/genai")).Type.STRING },
                    logicRisk: { type: (await import("@google/genai")).Type.STRING },
                    exploitLikelihood: { type: (await import("@google/genai")).Type.STRING },
                    accessControlRisk: { type: (await import("@google/genai")).Type.STRING }
                  },
                  required: ["severity", "title", "description", "recommendation", "financialRisk", "logicRisk", "exploitLikelihood", "accessControlRisk"]
                }
              },
              fullFixedCode: { type: (await import("@google/genai")).Type.STRING },
              gasOptimizationSummary: { type: (await import("@google/genai")).Type.STRING }
            },
            required: ["summary", "score", "issues"]
          }
        }
      });

      const reportData = JSON.parse(response.text || "{}");
      res.json(reportData);
    } catch (error) {
      console.error("Server Audit Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Server GEMINI_API_KEY is missing" });
      }

      const ai = new (await import("@google/genai")).GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: "You are Rexy Copilot, a highly advanced Smart Contract Security Engineer and Web3 expert, specifically focused on the Solana ecosystem. You are witty, sharp, and slightly cheeky but always incredibly accurate. You help developers find bugs, write secure Anchor (Rust) code, and understand post-quantum cryptography mitigation. Keep responses concise unless coding is required. Provide perfectly formatted markdown for any code snippets.",
          temperature: 0.7,
        },
      });

      let response;
      if (history && history.length > 0) {
        // Just send message; GoogleGenAI client chats typically manage conversation history
        // if instantiated differently. For this single stateless endpoint, we pass the message.
        // In a strictly correct scenario, we should recreate history or use generateContent.
        // For simplicity, if history is provided we just run generateContent with formatted history
        const formattedContents = history.map((msg) => ({
          role: msg.role,
          parts: msg.parts
        }));
        formattedContents.push({ role: "user", parts: [{ text: message }] });
        
        response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: formattedContents,
          config: {
            systemInstruction: "You are Rexy Copilot, a highly advanced Smart Contract Security Engineer... You are witty, sharp, and slightly cheeky but always incredibly accurate. You help developers find bugs, write secure Anchor (Rust) code, and understand post-quantum cryptography mitigation. Keep responses concise unless coding is required. Provide perfectly formatted markdown for any code snippets.",
            temperature: 0.7,
          }
        });
      } else {
        response = await chat.sendMessage({ message });
      }

      res.json({ text: response.text });
    } catch (error) {
      console.error("Server Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Public Goods Registry API (from publicGoodsApi.js)
  app.get("/api/audit/:programId", async (req, res) => {
     // I will need to import/implement the logic from publicGoodsApi.js here
     // For now, I will add a placeholder note or implement the simple query
     res.status(501).send("Not fully configured yet");
  });

  // Solana Actions (Blinks)
  app.get("/api/actions/audit", (req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Encoding, Accept-Encoding",
      "Content-Type": "application/json",
      "X-Blockchain-Ids": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
    });
    res.json(generateAuditBlink(req.query.address));
  });

  app.post("/api/actions/audit", (req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Encoding, Accept-Encoding",
      "X-Blockchain-Ids": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
    });
    res.json({
      message: "Audit request received for " + req.query.address,
      transaction: "TODO_BASE64_TRANSACTION"
    });
  });

  app.options("/api/actions/audit", (req, res) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Encoding, Accept-Encoding",
    });
    res.sendStatus(200);
  });

  // Handle production vs development
  const distPath = path.resolve(process.cwd(), "dist");
  
  const isProduction = process.env.NODE_ENV === "production" || 
                       process.env.NODE_ENV === "prod" ||
                       process.env.VITE_USER_NODE_ENV === "production";
  
  console.log(`Environment variables: NODE_ENV=${process.env.NODE_ENV}, VITE_USER_NODE_ENV=${process.env.VITE_USER_NODE_ENV}`);
  console.log(`Checking architecture: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Expected dist path: ${distPath}`);
  console.log(`Dist folder exists: ${fs.existsSync(distPath)}`);

  if (isProduction) {
    if (fs.existsSync(distPath)) {
      console.log(`✅ Serving static files from ${distPath}`);
      app.use(express.static(distPath));
      
      // SPA Fallback
      app.use((req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
          return next();
        }
        
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error(`❌ index.html not found at ${indexPath}`);
          res.status(404).send("Application not initialized (index.html missing)");
        }
      });
    } else {
      console.error(`❌ dist directory NOT found at ${distPath}. Build likely failed or directory is in wrong place.`);
      app.use((req, res) => {
        res.status(500).send("Server configured for production but build artifacts (dist/) are missing.");
      });
    }
  } else {
    // Vite middleware for development
    try {
      const dotenv = await import("dotenv");
      dotenv.config();
    } catch {
      // Ignored if dotenv is not available
    }

    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      define: {
        'process.env.VITE_HELIUS_API_KEY': JSON.stringify(process.env.VITE_HELIUS_API_KEY || ""),
        'process.env.VITE_TREASURY_ADDRESS': JSON.stringify(process.env.VITE_TREASURY_ADDRESS || ""),
      }
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=========================================`);
    console.log(`🚀 Rexy AI Auditor Server is LIVE`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🛠️  Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🔒 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Configured' : 'MISSING'}`);
    console.log(`=========================================`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
