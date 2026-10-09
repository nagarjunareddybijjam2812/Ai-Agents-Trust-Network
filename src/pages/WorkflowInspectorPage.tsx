import React, { useState } from 'react';
import type { WorkflowRun } from '../types/trust.js';
import { LangGraphViewer } from '../components/LangGraphViewer.js';
import { Layers, Clock, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  runs: WorkflowRun[];
  onSelectRun: (runId: string) => void;
}

export const WorkflowInspectorPage: React.FC<Props> = ({ runs, onSelectRun }) => {
  const [selectedRunId, setSelectedRunId] = useState<string>(runs[0]?.id || '');

  const activeRun = runs.find((r) => r.id === selectedRunId) || runs[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="text-indigo-400" />
          LangGraph Workflow Orchestration Inspector
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Inspect typed shared state transitions, node execution durations, retry loops,
          and conditional review branches in real-time.
        </p>
      </div>

      {/* Select Run Selector */}
      {runs.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-400">Select Workflow Run to Inspect:</span>
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-indigo-500 outline-hidden cursor-pointer"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.decisionStatus}] {r.question.slice(0, 50)}... ({r.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {activeRun ? (
        <div className="space-y-6">
          <LangGraphViewer
            events={activeRun.events || []}
            currentStatus={activeRun.status}
            reviewIterations={activeRun.reviewIterations}
          />

          {/* Node Lifecycle Events Table */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                Chronological Node Execution Events ({activeRun.events?.length || 0})
              </h3>
              <span className="font-mono text-xs text-slate-400">
                Total Latency: {activeRun.totalLatencyMs}ms
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="pb-3 pl-2">Stage</th>
                    <th className="pb-3">Event Type</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3 pr-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {activeRun.events?.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 pl-2 font-bold text-indigo-300 uppercase">
                        {evt.stage}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            evt.eventType === 'COMPLETE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : evt.eventType === 'START'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : evt.eventType === 'ROUTING'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {evt.eventType}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {evt.durationMs ? `${evt.durationMs}ms` : '--'}
                      </td>
                      <td className="py-2.5 font-sans text-slate-300 max-w-md">
                        {evt.details?.message}
                      </td>
                      <td className="py-2.5 pr-2 text-right text-slate-500 text-[11px]">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
          No workflow runs recorded yet.
        </div>
      )}
    </div>
  );
};
