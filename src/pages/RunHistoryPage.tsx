import React, { useState } from 'react';
import type { WorkflowRun, DecisionStatus } from '../types/trust.js';
import { DecisionBadge } from '../components/DecisionBadge.js';
import { History, Search, Filter, Clock, ArrowRight } from 'lucide-react';

interface Props {
  runs: WorkflowRun[];
  onSelectRun: (runId: string) => void;
}

export const RunHistoryPage: React.FC<Props> = ({ runs, onSelectRun }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredRuns = runs.filter((r) => {
    const matchesSearch =
      r.question.toLowerCase().includes(search.toLowerCase()) ||
      r.finalAnswer.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && r.decisionStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="text-indigo-400" />
          Persistent Workflow Audit Log & Run History
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete immutable record of all submitted questions, model outputs, evidence provenance,
          and final decision verdicts.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by question, answer text, or run ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:border-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {['ALL', 'ACCEPTED', 'NEEDS_REVIEW', 'ABSTAINED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Runs Table */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        {filteredRuns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No workflow runs match the specified filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="pb-3 pl-2">Decision</th>
                  <th className="pb-3">Question</th>
                  <th className="pb-3">Trust Score</th>
                  <th className="pb-3">Claims</th>
                  <th className="pb-3">Sources</th>
                  <th className="pb-3">Latency</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pl-2">
                      <DecisionBadge status={run.decisionStatus} size="sm" />
                    </td>
                    <td className="py-3.5 font-sans text-slate-200 max-w-sm truncate font-medium">
                      {run.question}
                    </td>
                    <td className="py-3.5 font-bold text-white">
                      {run.trustScore?.overallScore}/100
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {run.claimEvaluations?.length || 0}
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {run.evidenceSources?.length || 0}
                    </td>
                    <td className="py-3.5 text-slate-400">
                      {run.totalLatencyMs}ms
                    </td>
                    <td className="py-3.5 text-slate-500 text-[11px]">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={() => onSelectRun(run.id)}
                        className="px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
