/**
 * Frontend API client for AI Trust Architecture.
 * Interacts with the backend REST routes on /api.
 */

import type {
  WorkflowRun,
  ConfiguredAgentMeta,
  WorkflowEvent,
  BenchmarkResult,
  DecisionStatus,
} from '../types/trust.js';

export async function submitQuestion(question: string): Promise<{ runId: string; questionId: string; status: string; pollUrl: string }> {
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Submission failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getWorkflowRun(runId: string): Promise<WorkflowRun> {
  const res = await fetch(`/api/runs/${encodeURIComponent(runId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch run ${runId}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function getWorkflowRunEvents(runId: string): Promise<{ events: WorkflowEvent[]; total: number }> {
  const res = await fetch(`/api/runs/${encodeURIComponent(runId)}/events`);
  if (!res.ok) {
    throw new Error(`Failed to fetch events for run ${runId}`);
  }
  return res.json();
}

export async function listWorkflowRuns(params?: {
  status?: string;
  decisionStatus?: DecisionStatus;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ runs: WorkflowRun[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.decisionStatus) query.set('decisionStatus', params.decisionStatus);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));

  const res = await fetch(`/api/runs?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to list workflow runs: HTTP ${res.status}`);
  }
  return res.json();
}

export async function getAgentsList(): Promise<{ agents: ConfiguredAgentMeta[] }> {
  const res = await fetch('/api/agents');
  if (!res.ok) {
    throw new Error('Failed to fetch agents list');
  }
  return res.json();
}

export async function getTrustOverview(): Promise<{
  totalRuns: number;
  decisions: {
    accepted: number;
    needsReview: number;
    abstained: number;
    acceptanceRate: number;
  };
  averageTrustScore: number;
  verifiedSamplesCount: number;
  calibrationStatus: string;
  agentsSummary: Array<{
    id: string;
    name: string;
    state: string;
    historicalAccuracyEstimate: number;
    sampleSize: number;
  }>;
}> {
  const res = await fetch('/api/trust/overview');
  if (!res.ok) {
    throw new Error('Failed to fetch trust overview');
  }
  return res.json();
}

export async function getConfigStatus(): Promise<any> {
  const res = await fetch('/api/config/status');
  if (!res.ok) {
    throw new Error('Failed to fetch config status');
  }
  return res.json();
}

export async function getBenchmarkResults(): Promise<BenchmarkResult> {
  const res = await fetch('/api/benchmark/results');
  if (!res.ok) {
    throw new Error('Failed to fetch benchmark results');
  }
  return res.json();
}

export async function runBenchmarkSuite(): Promise<BenchmarkResult> {
  const res = await fetch('/api/benchmark/run', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to execute benchmark suite');
  }
  return res.json();
}

export async function getSystemHealth(): Promise<any> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new Error('Failed to fetch health');
  }
  return res.json();
}
