/**
 * Core domain types and API contracts for AI Trust Architecture.
 */

export type DecisionStatus = 'ACCEPTED' | 'NEEDS_REVIEW' | 'ABSTAINED';

export type ClaimVerificationStatus =
  | 'SUPPORTED'
  | 'CONTRADICTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNVERIFIED'
  | 'NOT_APPLICABLE'
  | 'ASSESSMENT_FAILED';

export type ContradictionSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type AgentId =
  | 'gemini_agent'
  | 'openai_agent'
  | 'evidence_agent'
  | 'consistency_agent'
  | 'trust_evaluator'
  | 'final_decision_agent';

export type ProviderState =
  | 'CONFIGURED'
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'TEST_DOUBLE';

export interface AgentClaim {
  id: string;
  claimText: string;
  category: 'factual' | 'assumption' | 'recommendation' | 'definition';
  agentId: AgentId;
  verificationStatus: ClaimVerificationStatus;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  confidence: number; // 0-100 self-reported, uncalibrated
  rationale?: string;
}

export interface AgentCandidateResponse {
  agentId: AgentId;
  provider: string;
  model: string;
  answerText: string;
  claims: AgentClaim[];
  uncertaintyDeclared: string;
  selfReportedConfidence: number; // 0-100, uncalibrated
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'RATE_LIMITED';
  latencyMs: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd?: number;
  error?: string;
  isTestDouble?: boolean;
}

export interface EvidenceSource {
  id: string;
  url: string;
  title: string;
  publisher: string;
  excerpt: string;
  retrievalTimestamp: string;
  publicationDate?: string;
  provider: 'web_search' | 'google_grounding' | 'curated_benchmark' | 'academic_archive';
  isAccessible: boolean;
  domainAuthority: number; // 0-100
  reliabilityScore: number; // 0-100
  reliabilityRationale: string;
  relevantClaimIds: string[];
  ssrfSafe: boolean;
}

export interface Disagreement {
  id: string;
  conflictingClaimA: {
    claimId: string;
    agentId: AgentId;
    text: string;
  };
  conflictingClaimB: {
    claimId: string;
    agentId: AgentId;
    text: string;
  };
  severity: ContradictionSeverity;
  explanation: string;
  resolutionStatus: 'RESOLVED' | 'UNRESOLVED' | 'PARTIAL';
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
}

export interface HistoricalAccuracyDimension {
  weight: number;
  rawScore: number; // 0-100
  sampleSize: number;
  priorAlpha: number;
  priorBeta: number;
  observedCorrect: number;
  observedIncorrect: number;
  posteriorMean: number;
  credibleInterval95: [number, number];
  status: 'MEASURED' | 'PRIOR_ESTIMATE' | 'INSUFFICIENT_HISTORY';
  explanation: string;
}

export interface EvidenceQualityDimension {
  weight: number;
  rawScore: number; // 0-100
  domainAuthorityAverage: number;
  corroborationFactor: number;
  contradictionDeduction: number;
  status: 'MEASURED' | 'UNAVAILABLE';
  explanation: string;
}

export interface ConsistencyDimension {
  weight: number;
  rawScore: number; // 0-100
  agreementRatio: number;
  contradictionPenalty: number;
  consensusIndependenceScore: number;
  status: 'MEASURED';
  explanation: string;
}

export interface CalibrationDimension {
  weight: number;
  rawScore: number; // 0-100
  brierScore?: number;
  ece?: number; // Expected Calibration Error
  status: 'CALIBRATED' | 'UNCALIBRATED' | 'INSUFFICIENT_HISTORY';
  explanation: string;
}

export interface TrustScoreDecomposition {
  overallScore: number; // 0-100 normalized
  normalizedCoverage: number; // 0.0 - 1.0
  measurementStatus: 'FULL' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  calculationVersion: string;
  timestamp: string;
  dimensions: {
    historicalAccuracy: HistoricalAccuracyDimension;
    evidenceQuality: EvidenceQualityDimension;
    consistency: ConsistencyDimension;
    uncertaintyCalibration: CalibrationDimension;
  };
  appliedWeights: {
    historical: number;
    evidence: number;
    consistency: number;
    calibration: number;
  };
  rationale: string;
}

export interface WorkflowEvent {
  id: string;
  runId: string;
  stage: string;
  eventType: 'START' | 'COMPLETE' | 'ERROR' | 'RETRY' | 'ROUTING';
  timestamp: string;
  durationMs: number;
  details?: Record<string, any>;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  questionId: string;
  question: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  decisionStatus: DecisionStatus;
  decisionRationale: string;
  finalAnswer: string;
  answerAgents: AgentCandidateResponse[];
  evidenceSources: EvidenceSource[];
  claimEvaluations: AgentClaim[];
  disagreements: Disagreement[];
  trustScore: TrustScoreDecomposition;
  reviewIterations: number;
  events: WorkflowEvent[];
  createdAt: string;
  completedAt?: string;
  totalLatencyMs: number;
  errorSummary?: string;
}

export interface ConfiguredAgentMeta {
  id: AgentId;
  name: string;
  provider: string;
  model: string;
  enabled: boolean;
  state: ProviderState;
  stateReason: string;
  historicalSampleSize: number;
  historicalAccuracyEstimate: number;
  costPer1kTokens?: number;
}

export interface VerifiedOutcome {
  id: string;
  agentId: AgentId;
  question: string;
  prediction: string;
  groundTruth: string;
  isCorrect: boolean;
  verificationSource: string;
  verificationTimestamp: string;
  datasetVersion: string;
  methodology: string;
  statedConfidence: number; // 0-100
}

export interface BenchmarkItem {
  id: string;
  category: 'factual_science' | 'common_misconception' | 'outdated_trap' | 'ambiguous_unresolved' | 'adversarial_trap';
  question: string;
  expectedDecision: DecisionStatus;
  groundTruth: string;
  knownContradiction?: string;
  keyClaims: string[];
}

export interface BenchmarkResult {
  runTimestamp: string;
  totalQuestions: number;
  singleAgentAccuracy: number;
  majorityVoteAccuracy: number;
  trustArchitectureAccuracy: number;
  trustSelectiveAccuracy: number; // accuracy on answered/accepted queries
  trustAbstentionRate: number;
  contradictionCatchRate: number;
  averageLatencyMs: {
    singleAgent: number;
    majorityVote: number;
    trustArchitecture: number;
  };
  detailedResults: Array<{
    benchmarkId: string;
    question: string;
    groundTruth: string;
    singleAgentAnswer: string;
    majorityVoteAnswer: string;
    trustArchitectureAnswer: string;
    decisionStatus: DecisionStatus;
    trustScore: number;
    correctness: {
      singleAgent: boolean;
      majorityVote: boolean;
      trustArchitecture: boolean;
    };
  }>;
}
