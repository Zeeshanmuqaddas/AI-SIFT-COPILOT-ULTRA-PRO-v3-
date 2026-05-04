/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  triageAgent, 
  malwareAgent, 
  networkAgent, 
  memoryAgent, 
  correlate, 
  selfCorrect, 
  buildTimeline,
  InvestigationState
} from './services/aiService';
import { ShieldAlert, Activity, Cpu, Network, FileTerminal, Download, LayoutDashboard, BrainCircuit, RefreshCw } from 'lucide-react';

export default function App() {
  const [logs, setLogs] = useState<string>("2023-10-25T14:22:11Z LOGIN FAILED username=admin source_ip=192.168.1.100\n2023-10-25T14:23:05Z LOGIN SUCCESS username=admin source_ip=192.168.1.100\n2023-10-25T14:23:10Z PROCESS STARTED parent=explorer.exe child=powershell.exe args=\"-enc JABz...\"\n2023-10-25T14:24:00Z NETWORK CONNECTION source=192.168.1.100 destination=104.28.9.11 port=443\n2023-10-25T14:26:15Z FILE MODIFIED path=C:\\Windows\\System32\\drivers\\etc\\hosts\n");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!logs.trim()) return;
    
    setIsProcessing(true);
    setResults(null);
    let state: Partial<InvestigationState> = { logs };

    try {
      setActiveStep("triage");
      state.triage = await triageAgent(logs);

      setActiveStep("malware");
      state.malware = await malwareAgent(logs);

      setActiveStep("network");
      state.network = await networkAgent(logs);

      setActiveStep("memory");
      state.memory = await memoryAgent(logs);

      setActiveStep("correlation");
      state.correlation = correlate(state);

      setActiveStep("self_correction");
      state.final = selfCorrect(state);

      setActiveStep("timeline");
      state.timeline = await buildTimeline(logs);

      // Final structured output
      const finalOutput = {
        triage: state.triage,
        malware: state.malware,
        network: state.network,
        memory: state.memory,
        correlation: state.correlation,
        final: state.final,
        timeline: state.timeline,
        report: "pdf_generated" // placeholder as per prompt
      };

      setResults(finalOutput);
      setActiveStep(null);
    } catch (err) {
      console.error(err);
      alert("Error during analysis. Check console.");
      setActiveStep(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      <header className="flex items-center justify-between border-b border-[#333] pb-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-orange-500" />
          <h1 className="text-2xl font-mono tracking-tighter uppercase font-bold text-white">AI SIFT COPILOT <span className="text-orange-500 text-xs tracking-widest align-top">ULTRA PRO (v3)</span></h1>
        </div>
        <div className="flex gap-4">
          <div className="text-xs uppercase tracking-widest text-[#888] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            System Online
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Input and Execution Flow */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <div className="panel p-4 flex flex-col h-[400px]">
            <div className="flex justify-between flex-wrap mb-4 items-center">
              <h2 className="text-sm uppercase tracking-widest opacity-60 flex items-center gap-2 font-mono">
                <FileTerminal className="w-4 h-4" />
                Raw Security Logs
              </h2>
              <button 
                onClick={handleAnalyze}
                disabled={isProcessing}
                className="bg-orange-600 hover:bg-orange-500 text-white text-xs uppercase tracking-wider font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? <RefreshCw className="animate-spin w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                {isProcessing ? "Analyzing..." : "Run AI Pipeline"}
              </button>
            </div>
            <textarea 
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              className="flex-1 bg-black border border-[#333] rounded p-4 font-mono text-xs text-green-400 focus:outline-none focus:border-orange-500 transition-colors resize-none overflow-auto"
              spellCheck={false}
            />
          </div>

          <div className="panel p-4 flex-1">
            <h2 className="text-sm uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2 font-mono">
              <LayoutDashboard className="w-4 h-4" />
              Multi-Agent Orchestrator
            </h2>
            <div className="flex flex-col gap-4 font-mono text-xs">
              <AgentStep name="Triage Agent" status={getStepStatus("triage", activeStep, results)} icon={<Activity className="w-4 h-4" />} />
              <AgentStep name="Malware Analysis" status={getStepStatus("malware", activeStep, results)} icon={<FileTerminal className="w-4 h-4" />} />
              <AgentStep name="Network Analysis" status={getStepStatus("network", activeStep, results)} icon={<Network className="w-4 h-4" />} />
              <AgentStep name="Memory Forensics" status={getStepStatus("memory", activeStep, results)} icon={<Cpu className="w-4 h-4" />} />
              <div className="h-4 border-l border-[#444] ml-2.5"></div>
              <AgentStep name="Correlation Engine" status={getStepStatus("correlation", activeStep, results)} icon={<BrainCircuit className="w-4 h-4 text-orange-500" />} />
              <AgentStep name="Self-Correction Engine" status={getStepStatus("self_correction", activeStep, results)} icon={<ShieldAlert className="w-4 h-4" />} />
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          <div className="panel p-4 flex-1 flex flex-col">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-sm uppercase tracking-widest opacity-60 font-mono">Forensic Verdict Output (STRICT JSON)</h2>
               {results && <button className="border border-[#444] hover:bg-[#333] px-3 py-1.5 rounded text-xs uppercase tracking-wider font-mono flex items-center gap-2 transition-colors text-[#ccc]">
                 <Download className="w-4 h-4" /> Export PDF Report
               </button>}
             </div>
             
             <div className="flex-1 bg-black border border-[#333] rounded p-4 overflow-auto relative">
               {!results && !isProcessing && (
                 <div className="absolute inset-0 flex items-center justify-center text-[#555] font-mono text-sm uppercase tracking-widest">
                   System Standby
                 </div>
               )}
               {isProcessing && (
                 <div className="absolute inset-0 flex items-center justify-center text-orange-500 font-mono text-sm uppercase tracking-widest animate-pulse">
                   Executing Neuro-Security Graph...
                 </div>
               )}
               {results && (
                 <pre className="font-mono text-[11px] text-[#ddd] leading-relaxed">
                   {JSON.stringify(results, null, 2)}
                 </pre>
               )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getStepStatus(stepId: string, activeStep: string | null, results: any) {
  if (results) return "complete";
  if (activeStep === stepId) return "running";
  
  const stepOrder = ["triage", "malware", "network", "memory", "correlation", "self_correction", "timeline"];
  const currentIndex = activeStep ? stepOrder.indexOf(activeStep) : -1;
  const thisIndex = stepOrder.indexOf(stepId);
  
  if (currentIndex === -1) return "idle";
  if (thisIndex < currentIndex) return "complete";
  return "idle";
}

function AgentStep({ name, status, icon }: { name: string, status: "idle" | "running" | "complete", icon: React.ReactNode }) {
  let statusColor = "text-[#555]";
  let pulseClass = "";
  let iconColor = "text-[#555]";

  if (status === "running") {
    statusColor = "text-orange-500";
    pulseClass = "animate-pulse";
    iconColor = "text-orange-500";
  } else if (status === "complete") {
    statusColor = "text-green-500";
    iconColor = "text-green-500";
  }

  return (
    <div className={`flex items-center gap-3 p-2 rounded bg-black/50 border ${status === "running" ? "border-orange-500/30" : "border-[#222]"}`}>
      <div className={`${iconColor} ${pulseClass}`}>
        {icon}
      </div>
      <div className={`flex-1 ${statusColor} ${pulseClass} uppercase tracking-wider`}>
        {name}
      </div>
      <div className={`text-[10px] uppercase tracking-widest ${statusColor} ${pulseClass}`}>
        {status === "running" ? "[ PROCESSING ]" : status === "complete" ? "[ OK ]" : "[ IDLE ]"}
      </div>
    </div>
  );
}
