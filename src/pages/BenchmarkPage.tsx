import React, { useState, useEffect } from 'react';
import type { BenchmarkResult } from '../types/trust.js';
import { runBenchmarkSuite, getBenchmarkResults } from '../api/client.js';
import { DecisionBadge } from '../components/DecisionBadge.js';
import { FlaskConical, Play, CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export const BenchmarkPage: React.FC = () => {
  const [report, setReport] = useState<BenchmarkResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const data = await getBenchmarkResults();
      setReport(data);
    } catch (err: any) {
      console.warn('Could not load cached benchmark:', err);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await runBenchmarkSuite();
      setReport(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Benchmark run failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="text-indigo-400" />
            Reproducible Empirical Benchmark Suite
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Empirical head-to-head comparison evaluating Single-Agent Baseline, Majority-Vote Consensus,
            and AI Trust Architecture against falsehood traps, physical constants, and epistemic limits.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Play size={16} className={isRunning ? 'animate-spin' : ''} />
          <span>{isRunning ? 'Executing Benchmark Suite...' : 'Run Benchmark Suite'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Head-to-Head Comparative Metric Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Baseline 1: Single Agent */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold">
                Baseline 1
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Single Frontier Agent</h3>
              <p className="text-xs text-slate-400 mt-1">
                Raw model output without external retrieval or contradiction checks.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <span className="font-bold text-white">{report.singleAgentAccuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Latency:</span>
                <span className="text-slate-300">{report.averageLatencyMs.singleAgent}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Abstention Rate:</span>
                <span className="text-slate-400">0% (Always answers)</span>
              </div>
            </div>
          </div>

          {/* Baseline 2: Majority Vote */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-sky-400 font-semibold">
                Baseline 2
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Majority-Vote Consensus</h3>
              <p className="text-xs text-slate-400 mt-1">
                Accepts majority agreement blindly. Fails on shared model training myths.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Accuracy:</span>
                <span className="font-bold text-white">{report.majorityVoteAccuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Latency:</span>
                <span className="text-slate-300">{report.averageLatencyMs.majorityVote}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Abstention Rate:</span>
                <span className="text-slate-400">0% (Vulnerable to myths)</span>
              </div>
            </div>
          </div>

          {/* AI Trust Architecture */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 shadow-2xl flex flex-col justify-between ring-1 ring-indigo-500/30">
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">
                Our System
              </span>
              <h3 className="text-lg font-bold text-white mt-1">AI Trust Architecture</h3>
              <p className="text-xs text-slate-300 mt-1">
                Multi-agent + Evidence crawling + Contradiction isolation + Policy abstention.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Overall Accuracy:</span>
                <span className="font-bold text-emerald-400">{report.trustArchitectureAccuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Selective Accuracy:</span>
                <span className="font-bold text-emerald-400">{report.trustSelectiveAccuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Abstention on Traps:</span>
                <span className="text-indigo-300">{report.trustAbstentionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Contradiction Catch:</span>
                <span className="text-emerald-400">{report.contradictionCatchRate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Benchmark Questions Table */}
      {report && report.detailedResults && report.detailedResults.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-semibold text-white text-base">
            Detailed Benchmark Test Cases Breakdown
          </h3>

          <div className="space-y-4">
            {report.detailedResults.map((item, idx) => (
              <div
                key={item.benchmarkId}
                className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-400 font-bold">
                      Case #{idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{item.question}</h4>
                  </div>
                  <DecisionBadge status={item.decisionStatus} size="sm" />
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs text-slate-300 font-mono">
                  <span className="text-emerald-400 font-bold uppercase block mb-0.5">
                    Ground Truth:
                  </span>
                  {item.groundTruth}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 font-mono block mb-1">Single Agent:</span>
                    <p className="text-slate-300 line-clamp-3">{item.singleAgentAnswer}</p>
                    <div className="mt-2 text-right">
                      {item.correctness.singleAgent ? (
                        <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ CORRECT</span>
                      ) : (
                        <span className="text-rose-400 font-mono text-[11px] font-bold">✗ INCORRECT</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 font-mono block mb-1">Majority Vote:</span>
                    <p className="text-slate-300 line-clamp-3">{item.majorityVoteAnswer}</p>
                    <div className="mt-2 text-right">
                      {item.correctness.majorityVote ? (
                        <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ CORRECT</span>
                      ) : (
                        <span className="text-rose-400 font-mono text-[11px] font-bold">✗ INCORRECT</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30">
                    <span className="text-indigo-300 font-mono block mb-1">Trust Architecture:</span>
                    <p className="text-slate-200 line-clamp-3">{item.trustArchitectureAnswer}</p>
                    <div className="mt-2 text-right">
                      {item.correctness.trustArchitecture ? (
                        <span className="text-emerald-400 font-mono text-[11px] font-bold">
                          ✓ {item.decisionStatus === 'ABSTAINED' ? 'ABSTAINED (SAFE)' : 'CORRECT'}
                        </span>
                      ) : (
                        <span className="text-rose-400 font-mono text-[11px] font-bold">✗ MISSED</span>
                      )}
                    </div>
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
