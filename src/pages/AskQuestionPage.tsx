import React, { useState, useEffect } from 'react';
import type { WorkflowRun } from '../types/trust.js';
import { submitQuestion, getWorkflowRun } from '../api/client.js';
import { DecisionBadge } from '../components/DecisionBadge.js';
import { ScoreGauge } from '../components/ScoreGauge.js';
import { LangGraphViewer } from '../components/LangGraphViewer.js';
import {
  Send,
  Loader2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Props {
  initialRunId?: string;
  onRunCreated?: (runId: string) => void;
}

const PRESET_QUESTIONS = [
  {
    label: 'Moon Myth',
    text: 'Is the Great Wall of China visible from the Moon with the naked eye?',
    category: 'Misconception Trap',
  },
  {
    label: 'Vaccine Link',
    text: 'Do childhood vaccines cause autism according to peer-reviewed medicine?',
    category: 'Medical Science',
  },
  {
    label: 'ML Theory',
    text: 'What is the fundamental difference between supervised and unsupervised learning?',
    category: 'Computer Science',
  },
  {
    label: 'Speed of Light',
    text: 'What is the exact speed of light in a vacuum in metres per second?',
    category: 'Physical Constants',
  },
  {
    label: 'Brain 10% Myth',
    text: 'Do humans only use 10% of their brain capacity?',
    category: 'Neuroscience Myth',
  },
  {
    label: 'AGI Forecast Trap',
    text: 'Will Artificial General Intelligence (AGI) be achieved on October 14, 2027?',
    category: 'Epistemic Uncertainty',
  },
];

export const AskQuestionPage: React.FC<Props> = ({ initialRunId, onRunCreated }) => {
  const [questionText, setQuestionText] = useState('');
  const [activeRunId, setActiveRunId] = useState<string | null>(initialRunId || null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'answer' | 'agents' | 'claims' | 'evidence' | 'disagreements' | 'events'>('answer');

  // Load initial run if provided
  useEffect(() => {
    if (initialRunId) {
      setActiveRunId(initialRunId);
      loadRun(initialRunId);
    }
  }, [initialRunId]);

  // Polling loop for active run
  useEffect(() => {
    if (!activeRunId) return;

    let isCancelled = false;
    const pollInterval = setInterval(async () => {
      try {
        const data = await getWorkflowRun(activeRunId);
        if (!isCancelled) {
          setRun(data);
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 1200);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [activeRunId]);

  const loadRun = async (runId: string) => {
    try {
      const data = await getWorkflowRun(runId);
      setRun(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load run');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setRun(null);

    try {
      const res = await submitQuestion(questionText.trim());
      setActiveRunId(res.runId);
      if (onRunCreated) onRunCreated(res.runId);
      // Immediate first fetch
      await loadRun(res.runId);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPreset = (text: string) => {
    setQuestionText(text);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title & Description */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="text-indigo-400" />
          Verify AI Question with Multi-Agent Trust Architecture
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Submit any complex or contested factual question. Independent models generate candidate answers in parallel,
          evidence is crawled and verified with SSRF protection, contradictions are isolated, and a policy-governed
          verdict is delivered.
        </p>
      </div>

      {/* Preset Quick-Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Preset Verification Benchmark Questions:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((pq) => (
            <button
              key={pq.label}
              type="button"
              onClick={() => handleSelectPreset(pq.text)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="font-semibold text-indigo-400">{pq.label}:</span>
              <span className="truncate max-w-[200px]">{pq.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Enter Research Question or Factual Assertion
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            placeholder="e.g. Does the Great Wall of China appear visible from the Moon with the unaided eye?"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-sm resize-none transition-all outline-hidden"
            disabled={isSubmitting || (run?.status === 'RUNNING')}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500 font-mono">
            {questionText.length}/1000 characters
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !questionText.trim() || run?.status === 'RUNNING'}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isSubmitting || run?.status === 'RUNNING' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Evaluating Trust Graph...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Execute Trust Verification</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Live Graph Visualizer */}
      {run && (
        <LangGraphViewer
          events={run.events || []}
          currentStatus={run.status}
          reviewIterations={run.reviewIterations}
        />
      )}

      {/* Execution Results Section */}
      {run && run.status === 'COMPLETED' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Decision Verdict Banner */}
          <div
            className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              run.decisionStatus === 'ACCEPTED'
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : run.decisionStatus === 'NEEDS_REVIEW'
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <div>
              <div className="flex items-center gap-3">
                <DecisionBadge status={run.decisionStatus} size="lg" />
                <span className="font-mono text-xs text-slate-400">
                  Run ID: {run.id} • Latency: {run.totalLatencyMs}ms
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-2">
                Policy Verdict: {run.decisionStatus}
              </h2>
              <p className="text-sm mt-1 text-slate-300 leading-relaxed max-w-3xl">
                {run.decisionRationale}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 font-mono block">Overall Trust Index</span>
              <span className="text-3xl font-extrabold font-mono text-white">
                {run.trustScore?.overallScore}/100
              </span>
            </div>
          </div>

          {/* Two-Column Top: Score Gauge + Verified Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ScoreGauge trustScore={run.trustScore} />
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-base mb-3 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-400" size={18} />
                  Synthesized Answer & Verified Disposition
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                  {run.finalAnswer}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
                <span>Claims Analyzed: {run.claimEvaluations?.length || 0}</span>
                <span>Sources Cited: {run.evidenceSources?.length || 0}</span>
                <span>Contradictions: {run.disagreements?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Deep-Dive Inspection Tabs */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
            <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-3">
              {[
                { id: 'answer', label: 'Verified Output' },
                { id: 'agents', label: `Candidate Agents (${run.answerAgents?.length || 0})` },
                { id: 'claims', label: `Atomic Claims (${run.claimEvaluations?.length || 0})` },
                { id: 'evidence', label: `Evidence Sources (${run.evidenceSources?.length || 0})` },
                { id: 'disagreements', label: `Contradictions (${run.disagreements?.length || 0})` },
                { id: 'events', label: `Workflow Events (${run.events?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Final Answer Preview */}
            {activeTab === 'answer' && (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Primary Output Text
                  </h4>
                  <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {run.finalAnswer}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Candidate Agents Side-by-Side */}
            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {run.answerAgents.map((agent) => (
                  <div
                    key={agent.agentId}
                    className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">
                          {agent.provider} ({agent.model})
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                            agent.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {agent.isTestDouble ? 'TEST_DOUBLE' : agent.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-6 leading-relaxed mb-4">
                        {agent.answerText || 'No answer generated.'}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 font-mono">
                        <div>
                          Uncertainty: <span className="text-slate-200">{agent.uncertaintyDeclared}</span>
                        </div>
                        <div>
                          Self-Reported Confidence:{' '}
                          <span className="text-amber-400">{agent.selfReportedConfidence}% (Uncalibrated)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Latency: {agent.latencyMs}ms</span>
                      <span>Tokens: {agent.tokenUsage?.totalTokens || '--'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Atomic Claims */}
            {activeTab === 'claims' && (
              <div className="space-y-3">
                {run.claimEvaluations.map((claim) => (
                  <div
                    key={claim.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                            claim.verificationStatus === 'SUPPORTED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : claim.verificationStatus === 'CONTRADICTED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : claim.verificationStatus === 'PARTIALLY_SUPPORTED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {claim.verificationStatus}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {claim.agentId} • {claim.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-200 font-medium">{claim.claimText}</p>
                      {claim.rationale && (
                        <p className="text-xs text-slate-400">{claim.rationale}</p>
                      )}
                    </div>

                    <div className="text-right text-xs font-mono text-slate-500 shrink-0">
                      <span>Confidence: {claim.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Evidence Sources */}
            {activeTab === 'evidence' && (
              <div className="space-y-3">
                {run.evidenceSources.map((source) => (
                  <div
                    key={source.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{source.publisher}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono">
                          Authority: {source.domainAuthority}/100
                        </span>
                        {source.ssrfSafe && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                            SSRF Safe
                          </span>
                        )}
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                      >
                        Source Link <ExternalLink size={12} />
                      </a>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-200">{source.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 italic">
                      "{source.excerpt}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Provider: {source.provider}</span>
                      <span>Reliability: {source.reliabilityScore}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 5: Disagreements */}
            {activeTab === 'disagreements' && (
              <div className="space-y-3">
                {run.disagreements.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No material factual contradictions detected between candidate models.
                  </div>
                ) : (
                  run.disagreements.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-rose-400 uppercase">
                          [{d.severity} Priority Contradiction]
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Status: {d.resolutionStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                          <span className="font-semibold text-indigo-400 block mb-1">
                            {d.conflictingClaimA.agentId}:
                          </span>
                          <p className="text-slate-300">"{d.conflictingClaimA.text}"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                          <span className="font-semibold text-sky-400 block mb-1">
                            {d.conflictingClaimB.agentId}:
                          </span>
                          <p className="text-slate-300">"{d.conflictingClaimB.text}"</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400">{d.explanation}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 6: Workflow Events */}
            {activeTab === 'events' && (
              <div className="space-y-2">
                {run.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-400 uppercase font-semibold">
                        {evt.stage}
                      </span>
                      <span className="text-slate-300">{evt.details?.message}</span>
                    </div>
                    <div className="text-slate-500 text-right">
                      <span>{evt.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
