/**
 * LangGraph Workflow Orchestration.
 * Implements typed state graph with parallel independent agents,
 * evidence retrieval, claim evaluation, consistency analysis,
 * Bayesian trust scoring, and conditional bounded review routing.
 */

import { GeminiAnswerAgent } from '../agents/gemini_agent.js';
import { OpenAIAnswerAgent } from '../agents/openai_agent.js';
import { EvidenceAgent } from '../evidence/provider.js';
import { ConsistencyAgent } from '../agents/consistency_agent.js';
import { MathematicalTrustKernel } from '../trust/mathematical_kernel.js';
import { DecisionPolicyEngine } from '../trust/decision_policy.js';
import { FinalDecisionAgent } from '../agents/final_decision_agent.js';
import { TrustRepository } from '../db/repository.js';
import type {
  WorkflowRun,
  WorkflowEvent,
  AgentCandidateResponse,
  EvidenceSource,
  AgentClaim,
  Disagreement,
  TrustScoreDecomposition,
  DecisionStatus,
} from '../../types/trust.js';

export interface WorkflowState {
  runId: string;
  questionId: string;
  question: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  decisionStatus: DecisionStatus;
  decisionRationale: string;
  candidateAnswers: AgentCandidateResponse[];
  evidenceSources: EvidenceSource[];
  claimEvaluations: AgentClaim[];
  disagreements: Disagreement[];
  trustScore?: TrustScoreDecomposition;
  finalAnswer: string;
  events: WorkflowEvent[];
  reviewIterations: number;
  maxReviewIterations: number;
  startTime: number;
  totalLatencyMs: number;
  errorSummary?: string;
}

export class TrustWorkflowGraph {
  private geminiAgent = new GeminiAnswerAgent();
  private openaiAgent = new OpenAIAnswerAgent();
  private evidenceAgent = new EvidenceAgent();
  private consistencyAgent = new ConsistencyAgent();
  private trustKernel = new MathematicalTrustKernel();
  private policyEngine = new DecisionPolicyEngine();
  private finalAgent = new FinalDecisionAgent();
  private repo = TrustRepository.getInstance();

  /**
   * Initializes and executes the complete multi-agent workflow graph.
   */
  public async executeWorkflow(
    runId: string,
    questionId: string,
    question: string
  ): Promise<WorkflowRun> {
    const state: WorkflowState = {
      runId,
      questionId,
      question,
      status: 'RUNNING',
      decisionStatus: 'NEEDS_REVIEW',
      decisionRationale: 'Workflow execution initiated.',
      candidateAnswers: [],
      evidenceSources: [],
      claimEvaluations: [],
      disagreements: [],
      finalAnswer: '',
      events: [],
      reviewIterations: 0,
      maxReviewIterations: 1,
      startTime: Date.now(),
      totalLatencyMs: 0,
    };

    // Save initial RUNNING state
    this.persistCurrentState(state);

    try {
      // Step 1: Validate & Initialize
      this.recordEvent(state, 'initialize', 'START', 'Initialized typed shared state graph');
      this.recordEvent(state, 'initialize', 'COMPLETE', 'Input validated');

      // Step 2: Parallel Independent Answer Generation
      await this.nodeParallelAgents(state);

      // Step 3: Evidence Retrieval
      await this.nodeRetrieveEvidence(state);

      // Step 4: Claim-Level & Consistency Evaluation
      await this.nodeConsistencyAndClaims(state);

      // Step 5: Mathematical Trust Scoring
      await this.nodeTrustEvaluation(state);

      // Step 6: Decision Routing & Conditional Bounded Review
      await this.nodeDecisionRouting(state);

      // Step 7: Final Synthesis
      await this.nodeFinalSynthesis(state);

      // Step 8: Persist & Finalize
      state.status = 'COMPLETED';
      state.totalLatencyMs = Date.now() - state.startTime;
      this.recordEvent(state, 'finalize', 'COMPLETE', 'Workflow completed successfully', {
        decisionStatus: state.decisionStatus,
        overallTrustScore: state.trustScore?.overallScore,
      });
    } catch (err: any) {
      console.error(`Workflow ${runId} execution encountered an error:`, err);
      state.status = 'FAILED';
      state.errorSummary = err?.message || 'Unknown workflow execution exception';
      state.totalLatencyMs = Date.now() - state.startTime;
      this.recordEvent(state, 'workflow', 'ERROR', 'Workflow exception occurred', undefined, state.errorSummary);
    }

    return this.persistCurrentState(state);
  }

  /**
   * Node 1: Executes candidate agents in parallel independently.
   */
  private async nodeParallelAgents(state: WorkflowState): Promise<void> {
    const stepStart = Date.now();
    this.recordEvent(state, 'parallel_agents', 'START', 'Dispatching Gemini and OpenAI answer agents concurrently');

    const [geminiResult, openaiResult] = await Promise.allSettled([
      this.geminiAgent.generateAnswer(state.question),
      this.openaiAgent.generateAnswer(state.question),
    ]);

    const answers: AgentCandidateResponse[] = [];

    if (geminiResult.status === 'fulfilled') {
      answers.push(geminiResult.value);
    } else {
      answers.push({
        agentId: 'gemini_agent',
        provider: 'Google GenAI',
        model: 'gemini-3.8-flash',
        answerText: '',
        claims: [],
        uncertaintyDeclared: 'High (Promise Rejected)',
        selfReportedConfidence: 0,
        status: 'FAILED',
        latencyMs: 0,
        error: geminiResult.reason?.message || 'Gemini promise rejected',
      });
    }

    if (openaiResult.status === 'fulfilled') {
      answers.push(openaiResult.value);
    } else {
      answers.push({
        agentId: 'openai_agent',
        provider: 'OpenAI',
        model: 'gpt-4o',
        answerText: '',
        claims: [],
        uncertaintyDeclared: 'High (Promise Rejected)',
        selfReportedConfidence: 0,
        status: 'FAILED',
        latencyMs: 0,
        error: openaiResult.reason?.message || 'OpenAI promise rejected',
      });
    }

    state.candidateAnswers = answers;

    const durationMs = Date.now() - stepStart;
    this.recordEvent(
      state,
      'parallel_agents',
      'COMPLETE',
      `Candidate agents executed in ${durationMs}ms`,
      {
        successfulAgents: answers.filter((a) => a.status === 'SUCCESS').map((a) => a.agentId),
        failedAgents: answers.filter((a) => a.status === 'FAILED').map((a) => a.agentId),
      },
      undefined,
      durationMs
    );
    this.persistCurrentState(state);
  }

  /**
   * Node 2: Evidence retrieval.
   */
  private async nodeRetrieveEvidence(state: WorkflowState): Promise<void> {
    const stepStart = Date.now();
    this.recordEvent(state, 'evidence_retrieval', 'START', 'Retrieving evidence sources with SSRF validation');

    const extractedClaimTexts = state.candidateAnswers.flatMap((a) =>
      a.claims ? a.claims.map((c) => c.claimText) : []
    );

    const sources = await this.evidenceAgent.retrieveEvidence(state.question, extractedClaimTexts);
    state.evidenceSources = sources;

    const durationMs = Date.now() - stepStart;
    this.recordEvent(
      state,
      'evidence_retrieval',
      'COMPLETE',
      `Retrieved ${sources.length} sources (${sources.filter((s) => s.isAccessible).length} accessible)`,
      { sourceCount: sources.length },
      undefined,
      durationMs
    );
    this.persistCurrentState(state);
  }

  /**
   * Node 3: Claim-level and consistency evaluation.
   */
  private async nodeConsistencyAndClaims(state: WorkflowState): Promise<void> {
    const stepStart = Date.now();
    this.recordEvent(state, 'consistency_and_claims', 'START', 'Evaluating cross-claim consistency and evidence support');

    const result = this.consistencyAgent.evaluate(state.candidateAnswers, state.evidenceSources);

    state.claimEvaluations = result.evaluatedClaims;
    state.disagreements = result.disagreements;

    const durationMs = Date.now() - stepStart;
    this.recordEvent(
      state,
      'consistency_and_claims',
      'COMPLETE',
      `Evaluated ${result.evaluatedClaims.length} claims; found ${result.disagreements.length} contradictions`,
      {
        agreementRatio: result.agreementRatio,
        disagreementCount: result.disagreements.length,
        supportedClaims: result.evaluatedClaims.filter((c) => c.verificationStatus === 'SUPPORTED').length,
      },
      undefined,
      durationMs
    );
    this.persistCurrentState(state);
  }

  /**
   * Node 4: Mathematical Trust Scoring (Beta-Binomial & 4 Dimensions).
   */
  private async nodeTrustEvaluation(state: WorkflowState): Promise<void> {
    const stepStart = Date.now();
    this.recordEvent(state, 'trust_scoring', 'START', 'Synthesizing Beta-Binomial posterior and 4D trust decomposition');

    // Retrieve historical verified outcomes from repository
    const historicalOutcomes = this.repo.getVerifiedOutcomes();

    const histDim = this.trustKernel.computeHistoricalAccuracy(historicalOutcomes);
    const evidDim = this.trustKernel.computeEvidenceQuality(state.evidenceSources, state.claimEvaluations);
    const agreementRatio = state.disagreements.length === 0 ? 0.95 : 0.65;
    const consDim = this.trustKernel.computeConsistency(state.disagreements, agreementRatio, 0);
    const calibDim = this.trustKernel.computeCalibration(historicalOutcomes);

    const trustScore = this.trustKernel.synthesizeTrustScore(histDim, evidDim, consDim, calibDim);
    state.trustScore = trustScore;

    const durationMs = Date.now() - stepStart;
    this.recordEvent(
      state,
      'trust_scoring',
      'COMPLETE',
      `Trust score synthesized: ${trustScore.overallScore}/100 (${trustScore.measurementStatus} coverage: ${(trustScore.normalizedCoverage * 100).toFixed(0)}%)`,
      {
        overallScore: trustScore.overallScore,
        historicalScore: histDim.rawScore,
        evidenceScore: evidDim.rawScore,
        consistencyScore: consDim.rawScore,
        calibrationScore: calibDim.rawScore,
      },
      undefined,
      durationMs
    );
    this.persistCurrentState(state);
  }

  /**
   * Node 5: Decision Routing and conditional review.
   */
  private async nodeDecisionRouting(state: WorkflowState): Promise<void> {
    const stepStart = Date.now();
    this.recordEvent(state, 'decision_routing', 'ROUTING', 'Evaluating policy invariants for ACCEPTED, NEEDS_REVIEW, or ABSTAINED');

    if (!state.trustScore) return;

    let decision = this.policyEngine.evaluateDecision(
      state.trustScore,
      state.claimEvaluations,
      state.disagreements,
      state.candidateAnswers
    );

    // Conditional Bounded Review Branch
    // If NEEDS_REVIEW and review iterations < maxReviewIterations, execute targeted review pass
    if (decision.status === 'NEEDS_REVIEW' && state.reviewIterations < state.maxReviewIterations) {
      state.reviewIterations++;
      this.recordEvent(
        state,
        'bounded_review',
        'START',
        `Initiating bounded review iteration ${state.reviewIterations}/${state.maxReviewIterations} to resolve material uncertainty`
      );

      // Targeted secondary evidence probe
      const secondarySources = await this.evidenceAgent.retrieveEvidence(
        `${state.question} scientific consensus review`,
        state.claimEvaluations.map((c) => c.claimText)
      );

      if (secondarySources.length > 0) {
        state.evidenceSources.push(...secondarySources);
        // Re-evaluate consistency & claims
        const recheck = this.consistencyAgent.evaluate(state.candidateAnswers, state.evidenceSources);
        state.claimEvaluations = recheck.evaluatedClaims;
        state.disagreements = recheck.disagreements;

        // Re-evaluate trust
        const historicalOutcomes = this.repo.getVerifiedOutcomes();
        const histDim = this.trustKernel.computeHistoricalAccuracy(historicalOutcomes);
        const evidDim = this.trustKernel.computeEvidenceQuality(state.evidenceSources, state.claimEvaluations);
        const consDim = this.trustKernel.computeConsistency(state.disagreements, 0.9, 0);
        const calibDim = this.trustKernel.computeCalibration(historicalOutcomes);

        state.trustScore = this.trustKernel.synthesizeTrustScore(histDim, evidDim, consDim, calibDim);

        // Re-evaluate policy decision
        decision = this.policyEngine.evaluateDecision(
          state.trustScore,
          state.claimEvaluations,
          state.disagreements,
          state.candidateAnswers
        );
      }

      this.recordEvent(
        state,
        'bounded_review',
        'COMPLETE',
        `Bounded review pass completed. Updated decision: ${decision.status}`,
        { updatedStatus: decision.status }
      );
    }

    state.decisionStatus = decision.status;
    state.decisionRationale = decision.rationale;

    const durationMs = Date.now() - stepStart;
    this.recordEvent(
      state,
      'decision_routing',
      'COMPLETE',
      `Decision finalized as ${decision.status}`,
      { decisionStatus: decision.status, unresolvedIssues: decision.unresolvedIssues },
      undefined,
      durationMs
    );
    this.persistCurrentState(state);
  }

  /**
   * Node 6: Final Answer Synthesis.
   */
  private async nodeFinalSynthesis(state: WorkflowState): Promise<void> {
    const stepStart = Date.now();
    this.recordEvent(state, 'final_synthesis', 'START', 'Synthesizing evidence-grounded final answer');

    if (!state.trustScore) return;

    const finalAnswer = await this.finalAgent.synthesize(
      state.question,
      state.decisionStatus,
      state.decisionRationale,
      state.candidateAnswers,
      state.evidenceSources,
      state.claimEvaluations,
      state.disagreements,
      state.trustScore
    );

    state.finalAnswer = finalAnswer;

    const durationMs = Date.now() - stepStart;
    this.recordEvent(
      state,
      'final_synthesis',
      'COMPLETE',
      'Final answer synthesized with citations and caveats',
      undefined,
      undefined,
      durationMs
    );
    this.persistCurrentState(state);
  }

  private recordEvent(
    state: WorkflowState,
    stage: string,
    eventType: WorkflowEvent['eventType'],
    message: string,
    details?: Record<string, any>,
    error?: string,
    durationMs = 0
  ): void {
    const event: WorkflowEvent = {
      id: `evt-${Date.now()}-${state.events.length + 1}`,
      runId: state.runId,
      stage,
      eventType,
      timestamp: new Date().toISOString(),
      durationMs,
      details: { message, ...details },
      error,
    };
    state.events.push(event);
  }

  private persistCurrentState(state: WorkflowState): WorkflowRun {
    const run: WorkflowRun = {
      id: state.runId,
      questionId: state.questionId,
      question: state.question,
      status: state.status,
      decisionStatus: state.decisionStatus,
      decisionRationale: state.decisionRationale,
      finalAnswer: state.finalAnswer,
      answerAgents: state.candidateAnswers,
      evidenceSources: state.evidenceSources,
      claimEvaluations: state.claimEvaluations,
      disagreements: state.disagreements,
      trustScore: state.trustScore || {
        overallScore: 0,
        normalizedCoverage: 0,
        measurementStatus: 'INSUFFICIENT_DATA',
        calculationVersion: 'v2.1',
        timestamp: new Date().toISOString(),
        dimensions: {
          historicalAccuracy: {
            weight: 0.4,
            rawScore: 0,
            sampleSize: 0,
            priorAlpha: 2,
            priorBeta: 2,
            observedCorrect: 0,
            observedIncorrect: 0,
            posteriorMean: 0.5,
            credibleInterval95: [0, 1],
            status: 'INSUFFICIENT_HISTORY',
            explanation: '',
          },
          evidenceQuality: {
            weight: 0.3,
            rawScore: 0,
            domainAuthorityAverage: 0,
            corroborationFactor: 0,
            contradictionDeduction: 0,
            status: 'UNAVAILABLE',
            explanation: '',
          },
          consistency: {
            weight: 0.2,
            rawScore: 0,
            agreementRatio: 0,
            contradictionPenalty: 0,
            consensusIndependenceScore: 0,
            status: 'MEASURED',
            explanation: '',
          },
          uncertaintyCalibration: {
            weight: 0.1,
            rawScore: 0,
            status: 'INSUFFICIENT_HISTORY',
            explanation: '',
          },
        },
        appliedWeights: { historical: 0.4, evidence: 0.3, consistency: 0.2, calibration: 0.1 },
        rationale: 'In progress',
      },
      reviewIterations: state.reviewIterations,
      events: state.events,
      createdAt: new Date(state.startTime).toISOString(),
      completedAt: state.status === 'COMPLETED' || state.status === 'FAILED' ? new Date().toISOString() : undefined,
      totalLatencyMs: state.totalLatencyMs || Date.now() - state.startTime,
      errorSummary: state.errorSummary,
    };

    return this.repo.saveWorkflowRun(run);
  }
}
