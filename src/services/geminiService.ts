import { AuditReport } from "../types";
import { analyzeWithVulnLibrary } from "../lib/solanaVulnerabilities";
import { Buffer } from "buffer";

export async function performAudit(contractCode: string, isQuantumAttack: boolean = false): Promise<AuditReport | null> {
  const staticAnalysis = analyzeWithVulnLibrary(contractCode);
  
  try {
    const response = await fetch("/api/gemini/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractCode, isQuantumAttack })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process audit through backend");
    }

    const reportData = await response.json();

    return {
      ...reportData,
      timestamp: Date.now(),
      contractName: reportData.contractName || "UnknownContract",
      staticAnalysis
    };
  } catch (error) {
    console.error("Gemini Audit Error:", error);
    throw error;
  }
}

export async function chatWithRexy(message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []): Promise<string> {
  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to chat through backend");
    }

    const data = await response.json();
    return data.text || "I was unable to formulate a response.";
  } catch (error) {
    console.error("Rexy Chat Error:", error);
    throw error;
  }
}

