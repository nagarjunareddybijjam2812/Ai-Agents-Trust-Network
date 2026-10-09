import React from 'react';
import type { WorkflowRun, Disagreement } from '../types/trust.js';
import { AlertOctagon, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  runs: WorkflowRun[];
  onSelectRun: (runId: string) => void;
}

export const DisagreementsPage: React.FC<Props> = ({ runs, onSelectRun }) => {
  // Aggregate all disagreements across runs
  const allDisagreements: Array<Disagreement & { question: string; runId: string }> = [];

  for (const r of runs) {
    if (r.disagreements) {
      for (const d of r.disagreements) {
        allDisagreements.push({ ...d, question: r.question, runId: r.id });
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertOctagon className="text-rose-400" />
          Cross-Agent Contradiction Matrix & Disagreement Inspector
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Detecting when models contradict each other or established literature. Agreement between models
          does not prove truth, but material contradictions always trigger safety reviews or abstention.
        </p>
      </div>

      {/* Philosophy Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Non-Consensus Epistemology
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Traditional multi-agent systems rely on majority voting or LLM judges, which fall victim to
          shared training bias and common myths (e.g. "Great wall visible from moon", "10% brain myth").
          Our Consistency Agent performs atomic polarity parsing and penalizes unverified consensus.
        </p>
      </div>

      {/* Disagreements List */}
      <div className="space-y-4">
        {allDisagreements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500/40 mb-2" />
            No unresolved contradictions currently logged across recorded runs.
          </div>
        ) : (
          allDisagreements.map((d) => (
            <div
              key={d.id}
              className="p-6 rounded-2xl bg-slate-900/80 border border-rose-500/30 shadow-xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold ${
                      d.severity === 'HIGH'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : d.severity === 'MEDIUM'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    [{d.severity} Priority Contradiction]
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Disposition: <strong className="text-white">{d.resolutionStatus}</strong>
                  </span>
                </div>

                <button
                  onClick={() => onSelectRun(d.runId)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
                >
                  Inspect Associated Run →
                </button>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-500 uppercase block">Underlying Inquiry</span>
                <p className="text-sm font-semibold text-white mt-0.5">"{d.question}"</p>
              </div>

              {/* Conflicting Pair Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-indigo-400">
                      Model A: {d.conflictingClaimA.agentId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{d.conflictingClaimA.text}"
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-sky-400">
                      Model B: {d.conflictingClaimB.agentId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{d.conflictingClaimB.text}"
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                <strong className="text-white font-mono uppercase text-[11px] block mb-1">
                  Analysis & Impact on Policy:
                </strong>
                {d.explanation}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
