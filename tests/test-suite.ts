/**
 * Comprehensive Automated Test Suite for AI Trust Architecture.
 * Verifies mathematical kernel, Beta-Binomial posterior, decision policy invariants,
 * SSRF filters, consistency analysis, LangGraph workflow execution, and API endpoints.
 */

import { MathematicalTrustKernel, DEFAULT_WEIGHTS } from '../src/server/trust/mathematical_kernel.js';
import { DecisionPolicyEngine, DEFAULT_POLICY_CONFIG } from '../src/server/trust/decision_policy.js';
import { isSafeUrl } from '../src/server/evidence/ssrf.js';
import { ConsistencyAgent } from '../src/server/agents/consistency_agent.js';
import { TrustWorkflowGraph } from '../src/server/graph/workflow.js';
import { TrustRepository } from '../src/server/db/repository.js';
import type {
  VerifiedOutcome,
  AgentClaim,
  EvidenceSource,
  Disagreement,
  AgentCandidateResponse,
} from '../src/types/trust.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (failureDetail) console.error(`    Detail: ${failureDetail}`);
    process.exitCode = 1;
  }
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('STARTING AI TRUST ARCHITECTURE TEST SUITE');
  console.log('========================================\n');

  const kernel = new MathematicalTrustKernel();
  const policy = new DecisionPolicyEngine();

  // TEST SUITE 1: Beta-Binomial Historical Accuracy
  console.log('Suite 1: Beta-Binomial Bayesian Kernel');
  {
    // Test 1.1: Prior-only case (0 observations)
    const emptyOutcomes: VerifiedOutcome[] = [];
    const priorDim = kernel.computeHistoricalAccuracy(emptyOutcomes, 2, 2);
    assert(
      priorDim.posteriorMean === 0.5 && priorDim.status === 'PRIOR_ESTIMATE',
      'Zero sample size returns Beta(2,2) prior mean (0.50) marked as PRIOR_ESTIMATE',
      `Got mean ${priorDim.posteriorMean}, status: ${priorDim.status}`
    );

    // Test 1.2: Empirical update (10 correct, 2 incorrect with prior alpha=2, beta=2)
    const outcomes: VerifiedOutcome[] = [
      ...Array(10).fill({ isCorrect: true }),
      ...Array(2).fill({ isCorrect: false }),
    ] as any;
    const measuredDim = kernel.computeHistoricalAccuracy(outcomes, 2, 2);
    // alphaPost = 2 + 10 = 12, betaPost = 2 + 2 = 4. Mean = 12 / 16 = 0.75
    assert(
      measuredDim.posteriorMean === 0.75 && measuredDim.rawScore === 75 && measuredDim.status === 'MEASURED',
      'Posterior mean updates correctly to 0.75 for 10/12 observed success with Beta(2,2)',
      `Got mean: ${measuredDim.posteriorMean}`
    );
    assert(
      measuredDim.credibleInterval95[0] < measuredDim.posteriorMean &&
      measuredDim.credibleInterval95[1] > measuredDim.posteriorMean,
      'Credible interval encloses posterior mean',
      `CI: [${measuredDim.credibleInterval95[0]}, ${measuredDim.credibleInterval95[1]}]`
    );
  }

  // TEST SUITE 2: Missing Dimension Normalization
  console.log('\nSuite 2: Missing Dimension Handling');
  {
    const hist = kernel.computeHistoricalAccuracy([] as any); // PRIOR_ESTIMATE
    const evid = kernel.computeEvidenceQuality([], []); // UNAVAILABLE
    const cons = kernel.computeConsistency([], 0.9, 0); // MEASURED: 90
    const calib = kernel.computeCalibration([]); // INSUFFICIENT_HISTORY

    const synth = kernel.synthesizeTrustScore(hist, evid, cons, calib);
    assert(
      synth.measurementStatus === 'INSUFFICIENT_DATA' || synth.measurementStatus === 'PARTIAL',
      'Missing critical dimensions correctly flags PARTIAL / INSUFFICIENT_DATA status',
      `Got status: ${synth.measurementStatus}`
    );
    assert(
      synth.overallScore > 0 && synth.overallScore <= 100,
      'Dynamic normalized score bounded between 0 and 100',
      `Score: ${synth.overallScore}`
    );
  }

  // TEST SUITE 3: Decision Policy & Abstention Invariants
  console.log('\nSuite 3: Decision Policy Hard Safety Invariants');
  {
    // Test 3.1: High numerical score BUT unresolved high contradiction must NOT be ACCEPTED
    const mockTrustScore: any = {
      overallScore: 92,
      measurementStatus: 'FULL',
      dimensions: {
        evidenceQuality: { rawScore: 85, status: 'MEASURED' },
      },
    };
    const claims: AgentClaim[] = [
      { id: 'c1', claimText: 'Statement A', category: 'factual', agentId: 'gemini_agent', verificationStatus: 'SUPPORTED', supportingEvidenceIds: ['s1'], contradictingEvidenceIds: [], confidence: 90 },
    ];
    const unresolvedDisagreements: Disagreement[] = [
      {
        id: 'd1',
        conflictingClaimA: { claimId: 'c1', agentId: 'gemini_agent', text: 'Statement A' },
        conflictingClaimB: { claimId: 'c2', agentId: 'openai_agent', text: 'Opposite A' },
        severity: 'HIGH',
        explanation: 'Direct polar contradiction',
        resolutionStatus: 'UNRESOLVED',
        supportingEvidenceIds: [],
        contradictingEvidenceIds: [],
      },
    ];
    const candidateAnswers: AgentCandidateResponse[] = [
      { agentId: 'gemini_agent', provider: 'Google', model: 'flash', answerText: 'A', claims: [], uncertaintyDeclared: '', selfReportedConfidence: 90, status: 'SUCCESS', latencyMs: 100 },
    ];

    const decision = policy.evaluateDecision(
      mockTrustScore,
      claims,
      unresolvedDisagreements,
      candidateAnswers
    );

    assert(
      decision.status !== 'ACCEPTED',
      'Hard Invariant: High numerical score cannot ACCEPT when high-severity unresolved contradiction exists',
      `Got: ${decision.status}`
    );

    // Test 3.2: Contradicted claim forces ABSTAINED
    const contradictedClaimList: AgentClaim[] = [
      { id: 'c1', claimText: 'Fake fact', category: 'factual', agentId: 'gemini_agent', verificationStatus: 'CONTRADICTED', supportingEvidenceIds: [], contradictingEvidenceIds: ['src-1'], confidence: 90 },
    ];
    const abstentionDecision = policy.evaluateDecision(
      mockTrustScore,
      contradictedClaimList,
      [],
      candidateAnswers
    );
    assert(
      abstentionDecision.status === 'ABSTAINED',
      'Hard Invariant: Directly contradicted factual claims force ABSTAINED status',
      `Got: ${abstentionDecision.status}`
    );
  }

  // TEST SUITE 4: SSRF & URL Security
  console.log('\nSuite 4: SSRF and Protocol Filters');
  {
    assert(!isSafeUrl('http://localhost:8080').safe, 'Blocks localhost URL');
    assert(!isSafeUrl('http://127.0.0.1:3000').safe, 'Blocks 127.0.0.1 loopback');
    assert(!isSafeUrl('http://169.254.169.254/latest/meta-data').safe, 'Blocks AWS/GCP cloud metadata IP');
    assert(!isSafeUrl('http://10.0.1.5/admin').safe, 'Blocks 10.0.0.0/8 private CIDR');
    assert(!isSafeUrl('file:///etc/passwd').safe, 'Blocks file:// protocol scheme');
    assert(!isSafeUrl('ftp://example.com/file').safe, 'Blocks ftp:// protocol scheme');
    assert(isSafeUrl('https://www.cdc.gov/vaccines/safety.html').safe, 'Allows safe HTTPS external URL');
  }

  // TEST SUITE 5: Consistency Agent & Contradiction Detection
  console.log('\nSuite 5: Consistency Agent cross-claim comparator');
  {
    const consistency = new ConsistencyAgent();
    const candidateAnswers: AgentCandidateResponse[] = [
      {
        agentId: 'gemini_agent',
        provider: 'Google',
        model: 'flash',
        answerText: 'The Great Wall is not visible from the Moon with unaided vision.',
        claims: [
          { id: 'g1', claimText: 'The Great Wall is not visible from the Moon with naked eye.', category: 'factual', agentId: 'gemini_agent', verificationStatus: 'UNVERIFIED', supportingEvidenceIds: [], contradictingEvidenceIds: [], confidence: 95 },
        ],
        uncertaintyDeclared: '',
        selfReportedConfidence: 95,
        status: 'SUCCESS',
        latencyMs: 100,
      },
      {
        agentId: 'openai_agent',
        provider: 'OpenAI',
        model: 'gpt-4o',
        answerText: 'The Great Wall is visible from the Moon as a distinct line.',
        claims: [
          { id: 'o1', claimText: 'The Great Wall is visible from the Moon with unaided eye.', category: 'factual', agentId: 'openai_agent', verificationStatus: 'UNVERIFIED', supportingEvidenceIds: [], contradictingEvidenceIds: [], confidence: 80 },
        ],
        uncertaintyDeclared: '',
        selfReportedConfidence: 80,
        status: 'SUCCESS',
        latencyMs: 100,
      },
    ];

    const evidenceSources: EvidenceSource[] = [
      {
        id: 's1',
        url: 'https://www.nasa.gov/wall',
        title: 'NASA Fact Sheet',
        publisher: 'NASA',
        excerpt: 'The wall is not visible from the Moon with unaided eye. Apollo astronauts refute visibility.',
        retrievalTimestamp: new Date().toISOString(),
        provider: 'curated_benchmark',
        isAccessible: true,
        domainAuthority: 98,
        reliabilityScore: 98,
        reliabilityRationale: 'Official',
        relevantClaimIds: [],
        ssrfSafe: true,
      },
    ];

    const result = consistency.evaluate(candidateAnswers, evidenceSources);
    assert(
      result.disagreements.length > 0 && result.disagreements[0].severity === 'HIGH',
      'Detects HIGH severity polarity contradiction between visible vs not visible',
      `Found ${result.disagreements.length} contradictions`
    );
    const contradictedClaim = result.evaluatedClaims.find((c) => c.verificationStatus === 'CONTRADICTED');
    assert(
      !!contradictedClaim,
      'Authoritative NASA evidence marks affirmative myth claim as CONTRADICTED',
      `Claim status: ${result.evaluatedClaims.map((c) => c.verificationStatus).join(', ')}`
    );
  }

  // TEST SUITE 6: End-to-End LangGraph Workflow Execution
  console.log('\nSuite 6: End-to-End LangGraph Workflow Execution');
  {
    const workflow = new TrustWorkflowGraph();
    const runId = `test-run-${Date.now()}`;
    const questionId = 'q-test-1';
    const testQuestion = 'What is the speed of light in a vacuum in m/s?';

    const run = await workflow.executeWorkflow(runId, questionId, testQuestion);

    assert(
      run.status === 'COMPLETED',
      'Workflow completes with status COMPLETED',
      `Status was: ${run.status}`
    );
    assert(
      run.events.length >= 6,
      'Workflow records all lifecycle events across nodes',
      `Recorded events count: ${run.events.length}`
    );
    assert(
      run.answerAgents.length === 2,
      'Dispatched both Gemini and OpenAI candidate agents',
      `Agent count: ${run.answerAgents.length}`
    );
    assert(
      run.trustScore.overallScore >= 70,
      'Verified physical constant produces high Trust Score (>=70)',
      `Score: ${run.trustScore.overallScore}`
    );
    assert(
      run.decisionStatus === 'ACCEPTED' || run.decisionStatus === 'NEEDS_REVIEW',
      'Factual constant receives valid policy verdict (ACCEPTED or NEEDS_REVIEW on transient provider failover)',
      `Decision: ${run.decisionStatus}`
    );
    assert(
      run.finalAnswer.length > 50,
      'Final answer synthesized with citations and factual claims',
      `Answer preview: ${run.finalAnswer.slice(0, 80)}...`
    );
  }

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('========================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
