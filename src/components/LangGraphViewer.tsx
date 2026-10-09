import React from 'react';
import type { WorkflowEvent } from '../types/trust.js';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  GitFork,
  RotateCw,
  Sparkles,
} from 'lucide-react';

interface Props {
  events: WorkflowEvent[];
  currentStatus: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  reviewIterations?: number;
}

interface GraphNode {
  id: string;
  name: string;
  stageName: string;
  description: string;
  icon: React.ReactNode;
}

export const LangGraphViewer: React.FC<Props> = ({
  events,
  currentStatus,
  reviewIterations = 0,
}) => {
  const nodes: GraphNode[] = [
    {
      id: 'init',
      name: 'Validate & Initialize',
      stageName: 'initialize',
      description: 'Typed shared state initialization & input length verification',
      icon: <CheckCircle2 size={16} />,
    },
    {
      id: 'parallel',
      name: 'Parallel Candidate Agents',
      stageName: 'parallel_agents',
      description: 'Independent concurrent execution of Gemini & OpenAI without shared context',
      icon: <GitFork size={16} />,
    },
    {
      id: 'evidence',
      name: 'Evidence Retrieval',
      stageName: 'evidence_retrieval',
      description: 'SSRF-validated multi-source crawling & domain authority evaluation',
      icon: <CheckCircle2 size={16} />,
    },
    {
      id: 'claims',
      name: 'Claim & Consistency Analysis',
      stageName: 'consistency_and_claims',
      description: 'Atomic claim extraction, polarity check, and contradiction detection',
      icon: <CheckCircle2 size={16} />,
    },
    {
      id: 'trust',
      name: 'Bayesian Trust Engine',
      stageName: 'trust_scoring',
      description: 'Beta-Binomial posterior update + 4-dimension normalized scoring',
      icon: <Sparkles size={16} />,
    },
    {
      id: 'routing',
      name: 'Decision Router',
      stageName: 'decision_routing',
      description: 'Deterministic policy evaluation (ACCEPTED / NEEDS_REVIEW / ABSTAINED)',
      icon: <ArrowRight size={16} />,
    },
    {
      id: 'review',
      name: 'Bounded Review Pass',
      stageName: 'bounded_review',
      description: 'Targeted secondary evidence retrieval for resolvable uncertainties',
      icon: <RotateCw size={16} />,
    },
    {
      id: 'synthesis',
      name: 'Final Answer Synthesis',
      stageName: 'final_synthesis',
      description: 'Evidence-governed synthesis citing verified claims and explicit caveats',
      icon: <CheckCircle2 size={16} />,
    },
  ];

  const getNodeStatus = (stageName: string) => {
    const stageEvents = events.filter((e) => e.stage === stageName);
    const hasComplete = stageEvents.some((e) => e.eventType === 'COMPLETE');
    const hasError = stageEvents.some((e) => e.eventType === 'ERROR');
    const hasStart = stageEvents.some((e) => e.eventType === 'START');

    if (hasError) return 'FAILED';
    if (hasComplete) return 'COMPLETED';
    if (hasStart && currentStatus === 'RUNNING') return 'RUNNING';
    return 'PENDING';
  };

  const getNodeDuration = (stageName: string): number | null => {
    const completeEvent = events.find((e) => e.stage === stageName && e.eventType === 'COMPLETE');
    return completeEvent?.durationMs || null;
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <div>
          <h3 className="font-semibold text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            LangGraph State Workflow Topology
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time state graph orchestrator with deterministic routing and bounded review cycles
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {reviewIterations > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Review Iterations: {reviewIterations}
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-md font-semibold ${
              currentStatus === 'COMPLETED'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : currentStatus === 'RUNNING'
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 animate-pulse'
                : currentStatus === 'FAILED'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {currentStatus}
          </span>
        </div>
      </div>

      {/* Interactive Visual Graph Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node, index) => {
          const status = getNodeStatus(node.stageName);
          const duration = getNodeDuration(node.stageName);
          const isReviewNode = node.stageName === 'bounded_review';
          const isReviewSkipped = isReviewNode && reviewIterations === 0 && currentStatus === 'COMPLETED';

          let statusBg = 'bg-slate-950/70 border-slate-800 text-slate-400';
          let statusBadge = 'bg-slate-800 text-slate-400';

          if (status === 'COMPLETED') {
            statusBg = 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300';
            statusBadge = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
          } else if (status === 'RUNNING') {
            statusBg = 'bg-indigo-950/30 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500';
            statusBadge = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse';
          } else if (status === 'FAILED') {
            statusBg = 'bg-rose-950/20 border-rose-500/40 text-rose-300';
            statusBadge = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
          } else if (isReviewSkipped) {
            statusBg = 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-60';
            statusBadge = 'bg-slate-900 text-slate-600';
          }

          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all duration-200 relative flex flex-col justify-between ${statusBg}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] text-slate-400">
                    Step 0{index + 1}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${statusBadge}`}>
                    {isReviewSkipped ? 'SKIPPED' : status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5 font-semibold text-sm text-white">
                  {node.icon}
                  <h4>{node.name}</h4>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {node.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-slate-500" />
                  {duration !== null ? `${duration}ms` : status === 'RUNNING' ? 'Running...' : '--'}
                </span>
                <span className="text-[10px] uppercase text-slate-400">
                  {node.stageName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
