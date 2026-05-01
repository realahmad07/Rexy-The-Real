import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
// Use .js extension for TS imports in ESM if needed, or rely on loader/runtime
import { generateAuditBlink } from "./src/services/blinkService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

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
    res.json(generateAuditBlink(req.query.address as string));
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
      app.get("*", (req, res, next) => {
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
      app.get("*", (req, res) => {
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
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ""),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ""),
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
