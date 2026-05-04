import { triageAgent, correlate, selfCorrect, InvestigationState } from './src/services/aiService.js';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * CI Test for AI SIFT COPILOT ULTRA PRO (v3)
 * Tests accuracy of signal detection and conflict resolution.
 */
async function runTests() {
  console.log("🚀 Starting CI Accuracy Tests...");
  let passed = 0;
  let failed = 0;

  // Mocking agent states for correlation test
  const mockStateConflicts: Partial<InvestigationState> = {
    logs: "Mock logs",
    triage: { severity: "LOW", reasoning: "Basic failed login" },
    network: { networkRisk: "HIGH", anomalies: ["Suspicious C2 traffic"], analysis: "Traffic detected" }
  };

  try {
    console.log("🧪 Test 1: Testing Correlation Engine (Contradiction Detection)");
    const result = correlate(mockStateConflicts);
    if (result.conflicts.length > 0 && result.risk_score === "HIGH") {
      console.log("✅ Passed: Detected conflict between HIGH network risk and LOW triage severity.");
      passed++;
    } else {
      console.error("❌ Failed: Did not properly correlate conflicts.", result);
      failed++;
    }

    console.log("🧪 Test 2: Testing Self Correction Engine (Re-Analysis Required)");
    const selfCorrectResult = selfCorrect({ correlation: result });
    if (selfCorrectResult.final_verdict === "RE-ANALYSIS REQUIRED" && selfCorrectResult.confidence === 0.4) {
      console.log("✅ Passed: Self-correction triggered RE-ANALYSIS correctly.");
      passed++;
    } else {
      console.error("❌ Failed: Self-correction did not lower confidence on conflict.");
      failed++;
    }

    console.log("🧪 Test 3: Live LLM Verification (Requires GEMINI_API_KEY)");
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ Skipping Live LLM Test: GEMINI_API_KEY not found.");
    } else {
      const logs = "2023-10-25T14:22:11Z LOGIN FAILED username=admin source_ip=192.168.1.100\n2023-10-25T14:23:05Z LOGIN SUCCESS username=admin source_ip=192.168.1.100";
      const triage = await triageAgent(logs);
      if (triage.severity) {
         console.log("✅ Passed: Live LLM Agent returned structured output:", triage);
         passed++;
      } else {
         console.error("❌ Failed: Live LLM Agent did not return valid schema.");
         failed++;
      }
    }

  } catch (err) {
    console.error("💥 Critical Failure during testing:", err);
    failed++;
  }

  console.log(`\n📊 CI Test Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
