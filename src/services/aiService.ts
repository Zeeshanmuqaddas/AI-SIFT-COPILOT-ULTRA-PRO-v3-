import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface InvestigationState {
  logs: string;
  triage?: any;
  malware?: any;
  network?: any;
  memory?: any;
  correlation?: any;
  final?: any;
  timeline?: any[];
  report?: string;
  isComplete: boolean;
  currentStep: string;
}

export async function triageAgent(logs: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze these logs and classify the severity of the incident. Logs:\n${logs}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
          reasoning: { type: Type.STRING }
        },
        required: ["severity", "reasoning"]
      }
    }
  });
  return JSON.parse(response.text.trim());
}

export async function malwareAgent(logs: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Detect suspicious scripts, payloads, or execution patterns in these logs:\n${logs}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          malwareDetected: { type: Type.BOOLEAN },
          suspectProcesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          analysis: { type: Type.STRING }
        },
        required: ["malwareDetected", "suspectProcesses", "analysis"]
      }
    }
  });
  return JSON.parse(response.text.trim());
}

export async function networkAgent(logs: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Detect exfiltration, C2 communication, or lateral movement from these logs:\n${logs}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          networkRisk: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" },
          anomalies: { type: Type.ARRAY, items: { type: Type.STRING } },
          analysis: { type: Type.STRING }
        },
        required: ["networkRisk", "anomalies", "analysis"]
      }
    }
  });
  return JSON.parse(response.text.trim());
}

export async function memoryAgent(logs: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Detect process injection or abnormal memory behavior from these logs (assume MCP tool analysis if explicitly mentioned):\n${logs}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          memoryAnomaliesDetected: { type: Type.BOOLEAN },
          details: { type: Type.STRING }
        },
        required: ["memoryAnomaliesDetected", "details"]
      }
    }
  });
  return JSON.parse(response.text.trim());
}

export function correlate(state: Partial<InvestigationState>) {
  const conflicts = [];
  let riskScore = "LOW";
  
  const triageSev = state.triage?.severity;
  const netRisk = state.network?.networkRisk;
  const malDet = state.malware?.malwareDetected;

  if (netRisk === "HIGH" && triageSev === "LOW") {
    conflicts.push("Network risk is HIGH but triage severity is LOW.");
  }
  if (malDet && triageSev === "LOW") {
    conflicts.push("Malware detected but triage severity is LOW.");
  }

  if (netRisk === "HIGH" || malDet || state.memory?.memoryAnomaliesDetected) {
    riskScore = "HIGH";
  } else if (triageSev === "MEDIUM" || netRisk === "MEDIUM") {
    riskScore = "MEDIUM";
  }

  return { conflicts, risk_score: riskScore };
}

export function selfCorrect(state: Partial<InvestigationState>) {
  const hasConflicts = state.correlation?.conflicts?.length > 0;
  
  if (hasConflicts) {
    return {
      final_verdict: "RE-ANALYSIS REQUIRED",
      confidence: 0.4
    };
  } else {
    return {
      final_verdict: "CONFIRMED INCIDENT",
      confidence: 0.9
    };
  }
}

export async function buildTimeline(logs: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Extract time-based events, sort chronologically, and map attacker progression from these logs:\n${logs}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING, description: "e.g. T+0, T+2m, or actual timestamp" },
            event: { type: Type.STRING }
          },
          required: ["time", "event"]
        }
      }
    }
  });
  return JSON.parse(response.text.trim());
}
