import React from 'react';
import type { ConfiguredAgentMeta, WorkflowRun } from '../types/trust.js';
import { Cpu, ShieldCheck, Zap, Activity, Clock, DollarSign } from 'lucide-react';

interface Props {
  agents: ConfiguredAgentMeta[];
  recentRuns: WorkflowRun[];
  onSelectRun: (runId: string) => void;
}

export const AgentComparisonPage: React.FC<Props> = ({
  agents,
  recentRuns,
  onSelectRun,
}) => {
  const latestRun = recentRuns[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu className="text-indigo-400" />
          Independent Agent Architecture & Comparative Diagnostics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Inspect candidate model configurations, empirical track records, latency profiles,
          and self-reported confidence vs. calibrated accuracy.
        </p>
      </div>

      {/* Agents Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {agent.provider}
                </span>
                <span
                  className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                    agent.state === 'AVAILABLE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : agent.state === 'TEST_DOUBLE'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {agent.state}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">{agent.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Model: {agent.model}</p>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">{agent.stateReason}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Empirical Accuracy:
                </span>
                <span className="font-bold text-emerald-400">
                  {agent.historicalAccuracyEstimate}%{' '}
                  <span className="text-slate-500 text-[10px]">(N={agent.historicalSampleSize})</span>
                </span>
              </div>

              {agent.costPer1kTokens !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <DollarSign size={14} className="text-slate-400" /> Approx Cost / 1k:
                  </span>
                  <span className="text-white">${agent.costPer1kTokens.toFixed(4)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Latest Run Side-by-Side Comparison */}
      {latestRun && latestRun.answerAgents && latestRun.answerAgents.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Live Head-to-Head Comparison on Latest Question
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Question: "{latestRun.question}"
              </p>
            </div>
            <button
              onClick={() => onSelectRun(latestRun.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 cursor-pointer"
            >
              View Full Run Inspection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {latestRun.answerAgents.map((ans) => (
              <div
                key={ans.agentId}
                className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <span className="font-bold text-sm text-white">
                      {ans.provider} ({ans.model})
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Latency: {ans.latencyMs}ms
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">
                    {ans.answerText}
                  </p>

                  {/* Claims List */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Extracted Claims:
                    </span>
                    {ans.claims?.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-200"
                      >
                        • {c.claimText}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 text-xs font-mono text-slate-400 space-y-1">
                  <div>
                    Self-Reported Confidence:{' '}
                    <span className="text-amber-400 font-bold">{ans.selfReportedConfidence}%</span> (Uncalibrated)
                  </div>
                  <div>
                    Declared Uncertainty: <span className="text-slate-300">{ans.uncertaintyDeclared}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
