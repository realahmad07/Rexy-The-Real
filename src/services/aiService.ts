import { AuditReport } from "../types";
import { analyzeWithVulnLibrary } from "../lib/solanaVulnerabilities";
import { Buffer } from "buffer";
import { findOfflineResponse } from "../lib/offlineKnowledge";

export async function performAudit(contractCode: string, isQuantumAttack: boolean = false): Promise<AuditReport | null> {
  const staticAnalysis = analyzeWithVulnLibrary(contractCode);
  
  try {
    const response = await fetch("/api/ai/audit", {
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
    console.error("AI Audit Error:", error);
    throw error;
  }
}


// Local Cache for AI responses
const chatCache: Record<string, string> = {};

export async function chatWithRexy(message: string, history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []): Promise<string> {
  // Check cache first for exact message
  if (chatCache[message]) {
    console.log("Serving response from local cache...");
    return chatCache[message];
  }

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to chat through backend");
    }

    const data = await response.json();
    const aiResponse = data.text || "I was unable to formulate a response.";
    
    // Save to cache on success
    chatCache[message] = aiResponse;
    
    return aiResponse;
  } catch (error) {
    console.warn("Primary AI engine failed, checking fallback:", error);
    
    try {
      const fallbackResponse = findOfflineResponse(message);
      return `[OFFLINE MODE] ${fallbackResponse}`;
    } catch (fallbackError) {
      console.error("Critical: Fallback engine failed too.", fallbackError);
      throw error; 
    }
  }
}


