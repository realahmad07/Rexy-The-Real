import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

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
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // AI API Routes (Secure Backend)
  app.post("/api/ai/audit", async (req, res) => {
    try {
      const { contractCode, isQuantumAttack } = req.body;
      if (!contractCode) {
        return res.status(400).json({ error: "contractCode is required" });
      }

    const clean = (k) => typeof k === 'string' ? k.trim().replace(/^["']|["']$/g, '') : k;
    const groqKey = clean(process.env.GROQ_API_KEY || process.env.GROQ || process.env.VITE_GROQ_API_KEY);
    const geminiKey = clean(process.env.GEMINI_API_KEY || process.env.GEMINI || process.env.VITE_GEMINI_API_KEY);

    const isValidGroqKey = (k) => k && typeof k === 'string' && (k.startsWith("gsk_") || k.length > 30);
    const isValidGeminiKey = (k) => k && typeof k === 'string' && (k.startsWith("AIza") || k.length > 20);

      const systemInstruction = `You are Rexy, a world-class Smart Contract Security Researcher and multi-chain expert. 
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

📊 SCORING ALGORITHM:
- Start at 100 points.
- Critical: -30 points each.
- High: -15 points each.
- Medium: -10 points each.
- Low: -3 points each.
- Informational: -1 point each.
- If NO Critical or High issues exist, the score SHOULD be 90 or higher.
- Consistency Rule: If the code is already secure, you MUST return 100/100 and an empty 'issues' array.

The 'summary' field MUST be a comprehensive, multi-paragraph executive summary (at least 200 words). It should cover:
1. Overall security posture and architecture review.
2. Detailed breakdown of the most critical vulnerabilities found.
3. Concluding statement on the contract's readiness for mainnet.

For every issue, provide a clear 'fixedCode' snippet. Crucially, you MUST also provide a 'fullFixedCode' field containing the ENTIRE smart contract with ALL security improvements and vulnerabilities patched.`;

      const quantumPromptAddition = isQuantumAttack 
        ? `\n\n🚨 QUANTUM Q-DAY SIMULATION ACTIVE 🚨\nAssume the primary admin/owner private keys have been mathematically broken by a quantum computer running Shor's Algorithm. Perform a threat model focusing on:\n- Blast Radius: What can the attacker drain/destroy instantly?\n- PQC Readiness: Does the contract lack time-locks, multi-sigs, or upgradeability to mitigate sudden key compromise?\n- Hardcoded Crypto: Are there manual secp256k1 or ed25519 signature verifications that need post-quantum cryptographic (PQC) upgrades?\n\nCRITICAL DIRECTIVE: The 'fullFixedCode' MUST contain REAL mitigation code. Do not just fix normal bugs. You MUST inject Post-Quantum Cryptography (PQC) / Q-Day defenses: Add emergency freeze/pause multi-sigs, time-locks for critical state changes, and explicitly comment on areas replacing legacy signatures with PQC-ready verifications. Explicitly state in your summary how the quantum risk was neutralized.` 
        : `\n\n🔍 Q-Day Readiness Assessment: Analyze the contract for Post-Quantum readiness (hardcoded crypto, blast radius of key compromise, time-locks, upgradeability).`;

      const prompt = `Analyze the following smart contract code:\n\n${contractCode}${quantumPromptAddition}`;

      // Calculate code hash for audit integrity
      const crypto = await import("node:crypto");
      const codeHash = crypto.createHash('sha256').update(contractCode).digest('hex');

      const auditWithGroq = async (key) => {

        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey: key });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.1
        });
        return JSON.parse(completion.choices[0].message.content || "{}");
      };

      const auditWithGemini = async (key) => {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: [systemInstruction, prompt],
          config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
      };

      const runStaticAudit = (code) => {
        console.log("Running Static Fallback Audit Engine...");
        const issues = [];
        let score = 100;
        
        // 1. Check for missing Signer in instructions (Solana/Anchor)
        if (code.includes("AccountInfo") && !code.includes("Signer<") && code.includes("Instruction")) {
          issues.push({
            id: "S001",
            title: "Potential Missing Signer Validation",
            severity: "High",
            description: "Some instructions appear to use AccountInfo without explicit Signer validation. This could allow unauthorized users to trigger instructions that should be restricted.",
            remediation: "Replace AccountInfo with Signer<'info> in your accounts struct for administrative or sensitive instructions.",
            impact: "High",
            category: "Access Control",
            fixedCode: "// Suggested change:\n// pub signer: Signer<'info>"
          });
          score -= 15;
        }

        // 2. Check for unsafe arithmetic
        const unsafeArithmetic = /\s[\+\-\*\/]\s/g;
        if (unsafeArithmetic.test(code) && !code.includes("checked_") && !code.includes("safe_math")) {
          issues.push({
            id: "S002",
            title: "Integer Overflow/Underflow Risk",
            severity: "Medium",
            description: "Direct arithmetic operators (+, -, *, /) detected without safety checks. Solana/Rust can panic on overflow in debug mode or wrap in release mode.",
            remediation: "Use checked_add, checked_sub, or safe_math libraries to handle arithmetic operations securely.",
            impact: "Medium",
            category: "Arithmetic",
            fixedCode: "// Use checked math:\n// let result = a.checked_add(b).ok_or(error!(MyError::Overflow))?;"
          });
          score -= 10;
        }

        // 3. Check for arbitrary account loading
        if (code.includes("from_account_info") && !code.includes("owner =")) {
          issues.push({
            id: "S003",
            title: "Insecure Account Loading",
            severity: "High",
            description: "Detected account loading from raw account info without explicit owner checks. This may allow an attacker to pass in a spoofed account belonging to a different program.",
            remediation: "Always verify the owner of an account using the #[account(owner = program_id)] constraint in Anchor.",
            impact: "High",
            category: "Security",
            fixedCode: "#[account(owner = *program_id)]\npub my_account: Account<'info, MyData>"
          });
          score -= 20;
        }

        // 4. Check for reentrancy (Solidity pattern)
        if (code.includes(".call{") && code.includes("value:")) {
          issues.push({
            id: "S004",
            title: "Reentrancy Vulnerability",
            severity: "Critical",
            description: "External call with value found. If the recipient is a contract, it can fallback and call back into your function before state is updated.",
            remediation: "Implement the Checks-Effects-Interactions pattern or use a ReentrancyGuard.",
            impact: "Critical",
            category: "Logic",
            fixedCode: "nonReentrant modifier or CEI pattern"
          });
          score -= 30;
        }

        return {
          score: Math.max(0, score),
          summary: "AI Audit agents were unavailable, so the Rexy Static Engine performed a heuristic security scan of your contract. This fallback scan identifies common patterns associated with Solana and Solidity vulnerabilities. Note that static analysis may not catch complex business logic flaws that the AI Engine typically detects.",
          issues,
          provider: "rexy-static-fallback",
          fullFixedCode: code // In fallback mode we return original as we can't fully rebuild it perfectly without AI
        };
      };

      let reportData;
      let usedProvider = "none";

      // 1. Try Groq first
      if (isValidGroqKey(groqKey)) {
        try {
          console.log("Attempting audit with Groq...");
          reportData = await auditWithGroq(groqKey);
          usedProvider = "groq";
        } catch (e) {
          console.error("Groq Audit failed, falling back to Gemini:", e.message);
        }
      }

      // 2. Fallback to Gemini if Groq failed or wasn't configured
      if (!reportData && isValidGeminiKey(geminiKey)) {
        try {
          console.log("Attempting audit with Gemini (Failover)...");
          reportData = await auditWithGemini(geminiKey);
          usedProvider = "gemini";
        } catch (e) {
          console.error("Gemini Audit fallback failed:", e.message);
        }
      }

      // 3. Last Resort: STATIC FALLBACK (Always works)
      if (!reportData) {
        console.warn("CRITICAL: Both AI providers failed. Using Rexy Static Fallback Engine.");
        reportData = runStaticAudit(contractCode);
        usedProvider = "rexy-static-fallback";
      }

      if (reportData) {
        // Ensure critical fields exist
        reportData.codeHash = codeHash;
        reportData.score = reportData.score || 0;
        reportData.summary = reportData.summary || "No summary provided.";
        reportData.issues = reportData.issues || [];
        reportData.provider = usedProvider;
        
        // Artificial delay for realism (approx 5-8 seconds total with AI processing)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return res.json(reportData);
      }

      return res.status(502).json({ 
        error: "All AI providers failed. Verification could not be completed.",
        details: "Please check your API keys and quotas for both Groq and Gemini."
      });
    } catch (error) {
      console.error("Server Audit Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
    const clean = (k) => typeof k === 'string' ? k.trim().replace(/^["']|["']$/g, '') : k;
    const geminiKey = clean(process.env.GEMINI_API_KEY || process.env.GEMINI || process.env.VITE_GEMINI_API_KEY);
    const groqKey = clean(process.env.GROQ_API_KEY || process.env.GROQ || process.env.VITE_GROQ_API_KEY);

    const isValidGeminiKey = (k) => k && typeof k === 'string' && (k.startsWith("AIza") || k.length > 20);
    const isValidGroqKey = (k) => k && typeof k === 'string' && (k.startsWith("gsk_") || k.length > 30);

      const systemInstruction = "You are Rexy Copilot, a highly advanced Smart Contract Security Engineer and Web3 expert, specifically focused on the Solana ecosystem. You are witty, sharp, and slightly cheeky but always incredibly accurate. You help developers find bugs, write secure Anchor (Rust) code, and understand post-quantum cryptography mitigation. Keep responses concise unless coding is required. Provide perfectly formatted markdown for any code snippets.";

      const chatWithGemini = async (key) => {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: key });
        const chat = ai.chats.create({
          model: "gemini-3.1-pro-preview",
          config: { systemInstruction: systemInstruction },
          history: history.map(h => ({
            role: h.role === "model" ? "model" : "user",
            parts: [{ text: h.parts[0].text }]
          })),
        });
        const result = await chat.sendMessage(message);
        return result.text;
      };

      const chatWithGroq = async (key) => {
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({ apiKey: key });
        const messages = history.map((msg) => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.parts[0].text
        }));
        messages.push({ role: "user", content: message });

        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemInstruction },
            ...messages
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7
        });
        return completion.choices[0].message.content;
      };

      let responseText;

      // 1. Try Gemini first
      if (isValidGeminiKey(geminiKey)) {
        try {
          console.log("Attempting chat with Gemini...");
          responseText = await chatWithGemini(geminiKey);
        } catch (e) {
          console.error("Gemini Chat failed, falling back to Groq:", e.message);
        }
      }

      // 2. Fallback to Groq
      if (!responseText && isValidGroqKey(groqKey)) {
        try {
          console.log("Attempting chat with Groq (Failover)...");
          responseText = await chatWithGroq(groqKey);
        } catch (e) {
          console.error("Groq Chat fallback failed:", e.message);
        }
      }

      if (responseText) {
        return res.json({ text: responseText });
      }

      return res.status(502).json({ 
        error: "Copilot is currently unavailable. No AI provider responded.",
        details: "Please check your Groq and Gemini API keys."
      });
    } catch (error) {
      console.error("Server Chat Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Prices Proxy
  app.get("/api/prices", async (req, res) => {
    try {
      const ids = req.query.ids || "solana,raydium,jupiter-exchange-solana,jito-governance-token,bonk";
      
      const axios = (await import("axios")).default;
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
        params: {
          ids,
          vs_currencies: "usd",
          include_24hr_change: "true"
        },
        headers: {
          "User-Agent": "Rexy-AI-Auditor/1.0"
        },
        timeout: 8000
      });
      
      res.json(response.data);
    } catch (error) {
      console.error("Price Proxy Error:", error.message);
      res.status(500).json({ error: "Failed to fetch prices", details: error.message });
    }
  });

  // API routes
  app.get("/api/health", (req, res) => {
    const rawGroqKey = process.env.GROQ_API_KEY || process.env.GROQ || process.env.VITE_GROQ_API_KEY;
    const rawGeminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI || process.env.VITE_GEMINI_API_KEY;
    
    // Clean keys (trim spaces, handle common copy-paste errors)
    const clean = (k) => typeof k === 'string' ? k.trim().replace(/^["']|["']$/g, '') : k;
    
    const groqKey = clean(rawGroqKey);
    const geminiKey = clean(rawGeminiKey);
    
    // Robust validation
    const isValidGroqKey = (k) => k && typeof k === 'string' && (k.startsWith("gsk_") || k.length > 30);
    const isValidGeminiKey = (k) => k && typeof k === 'string' && (k.startsWith("AIza") || k.length > 20);

    const hasValidKey = isValidGroqKey(groqKey) || isValidGeminiKey(geminiKey);
    
    // Log for Vercel debugging (masked)
    console.log(`[HealthCheck] Groq: ${groqKey ? (groqKey.substring(0, 8) + '...') : 'NULL'}, Gemini: ${geminiKey ? (geminiKey.substring(0, 8) + '...') : 'NULL'}`);
    console.log(`[HealthCheck] Status: ${hasValidKey ? 'OK' : 'RESTRICTED'}`);

    res.json({ 
      status: hasValidKey ? "ok" : "restricted", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      debug: {
        groqConfigured: !!groqKey,
        geminiConfigured: !!geminiKey,
        groqValid: isValidGroqKey(groqKey),
        geminiValid: isValidGeminiKey(geminiKey),
        nodeEnv: process.env.NODE_ENV
      },
      providers: {
        audit: {
          name: "Groq Llama-3",
          configured: !!groqKey,
          status: isValidGroqKey(groqKey) ? "connected" : "missing"
        },
        copilot: {
          name: "Gemini 1.5 Pro",
          configured: !!geminiKey,
          status: isValidGeminiKey(geminiKey) ? "connected" : "missing"
        }
      }
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
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      define: {
        'process.env.VITE_HELIUS_API_KEY': JSON.stringify(process.env.VITE_HELIUS_API_KEY || process.env.HELIUS || ""),
        'process.env.VITE_TREASURY_ADDRESS': JSON.stringify(process.env.VITE_TREASURY_ADDRESS || process.env.TREASURY || ""),
      }
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=========================================`);
    console.log(`🚀 Rexy AI Auditor Server is LIVE`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🛠️  Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`🧠 Audit Engine (Groq): ${process.env.GROQ_API_KEY ? 'Configured' : 'MISSING'}`);
    console.log(`🤖 Copilot (Gemini): ${process.env.GEMINI_API_KEY ? 'Configured' : 'MISSING'}`);
    console.log(`=========================================`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
