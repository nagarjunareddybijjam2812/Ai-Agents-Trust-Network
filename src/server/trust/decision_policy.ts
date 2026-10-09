/**
 * Deterministic Decision Policy Engine.
 * Evaluates whether an answer can be ACCEPTED, requires NEEDS_REVIEW, or must be ABSTAINED.
 * Enforces hard safety invariants independently of numerical score.
 */

import type {
  DecisionStatus,
  TrustScoreDecomposition,
  AgentClaim,
  Disagreement,
  AgentCandidateResponse,
} from '../../types/trust.js';

export interface DecisionPolicyConfig {
  minTrustScoreForAcceptance: number; // default 70
  minEvidenceScoreForAcceptance: number; // default 60
  maxUnresolvedDisagreements: number; // default 0 high severity
  minClaimSupportRatio: number; // default 0.65
}

export const DEFAULT_POLICY_CONFIG: DecisionPolicyConfig = {
  minTrustScoreForAcceptance: 70,
  minEvidenceScoreForAcceptance: 60,
  maxUnresolvedDisagreements: 0,
  minClaimSupportRatio: 0.65,
};

export class DecisionPolicyEngine {
  public evaluateDecision(
    trustScore: TrustScoreDecomposition,
    claims: AgentClaim[],
    disagreements: Disagreement[],
    candidateAnswers: AgentCandidateResponse[],
    config: DecisionPolicyConfig = DEFAULT_POLICY_CONFIG
  ): { status: DecisionStatus; rationale: string; unresolvedIssues: string[] } {
    const unresolvedIssues: string[] = [];

    // Rule 1: Check if any answer agent succeeded
    const successfulAgents = candidateAnswers.filter((a) => a.status === 'SUCCESS');
    if (successfulAgents.length === 0) {
      return {
        status: 'ABSTAINED',
        rationale: 'All candidate answer agents failed or were unconfigured. The architecture cannot generate an answer.',
        unresolvedIssues: ['Zero successful model responses received.'],
      };
    }

    // Rule 2: Invariant check - High severity unresolved contradictions
    const highUnresolved = disagreements.filter(
      (d) => d.severity === 'HIGH' && d.resolutionStatus === 'UNRESOLVED'
    );
    if (highUnresolved.length > config.maxUnresolvedDisagreements) {
      unresolvedIssues.push(
        `${highUnresolved.length} high-severity contradiction(s) remain unresolved between candidate models.`
      );
    }

    // Rule 3: Check for contradicted claims
    const contradictedClaims = claims.filter((c) => c.verificationStatus === 'CONTRADICTED');
    if (contradictedClaims.length > 0) {
      unresolvedIssues.push(
        `${contradictedClaims.length} core factual assertion(s) were directly contradicted by authoritative sources.`
      );
    }

    // Rule 4: Claim support ratio
    const supportedClaims = claims.filter(
      (c) => c.verificationStatus === 'SUPPORTED' || c.verificationStatus === 'PARTIALLY_SUPPORTED'
    );
    const totalClaims = Math.max(1, claims.length);
    const supportRatio = supportedClaims.length / totalClaims;
    if (supportRatio < config.minClaimSupportRatio) {
      unresolvedIssues.push(
        `Low claim support ratio: ${(supportRatio * 100).toFixed(1)}% of claims verified (minimum required: ${(config.minClaimSupportRatio * 100).toFixed(0)}%).`
      );
    }

    // Rule 5: Evidence quality threshold
    const evidenceScore = trustScore.dimensions.evidenceQuality.rawScore;
    if (trustScore.dimensions.evidenceQuality.status === 'UNAVAILABLE' || evidenceScore < config.minEvidenceScoreForAcceptance) {
      unresolvedIssues.push(
        `Evidence quality (${evidenceScore}/100) below acceptable threshold (${config.minEvidenceScoreForAcceptance}/100) or unavailable.`
      );
    }

    // Rule 6: Insufficient data coverage
    if (trustScore.measurementStatus === 'INSUFFICIENT_DATA') {
      unresolvedIssues.push('Trust engine reported INSUFFICIENT_DATA coverage across critical dimensions.');
    }

    // Hard gate evaluations
    if (contradictedClaims.length > 0 || highUnresolved.length >= 2) {
      return {
        status: 'ABSTAINED',
        rationale: `System abstained from answering due to critical factual contradiction or unresolvable epistemic clash. Issues: ${unresolvedIssues.join(' ')}`,
        unresolvedIssues,
      };
    }

    if (unresolvedIssues.length > 0 || trustScore.overallScore < config.minTrustScoreForAcceptance) {
      return {
        status: 'NEEDS_REVIEW',
        rationale: `Material uncertainty or incomplete evidence verification identified. Trust score: ${trustScore.overallScore}/100 (Threshold: ${config.minTrustScoreForAcceptance}). Specific review points: ${unresolvedIssues.join(' ')}`,
        unresolvedIssues,
      };
    }

    // If all invariants satisfied and score >= threshold
    return {
      status: 'ACCEPTED',
      rationale: `Verified according to configured trust policy. Trust score: ${trustScore.overallScore}/100 exceeds threshold (${config.minTrustScoreForAcceptance}), ${(supportRatio * 100).toFixed(0)}% of claims corroborated by authoritative evidence, with zero unresolved contradictions.`,
      unresolvedIssues: [],
    };
  }
}
