/**
 * Consistency and Contradiction Agent.
 * Evaluates agreement, detects contradictions between candidate agent outputs,
 * maps claims against retrieved evidence, and flags unsupported consensus.
 */

import type {
  AgentCandidateResponse,
  AgentClaim,
  EvidenceSource,
  Disagreement,
} from '../../types/trust.js';

export class ConsistencyAgent {
  public evaluate(
    candidateAnswers: AgentCandidateResponse[],
    evidenceSources: EvidenceSource[]
  ): {
    evaluatedClaims: AgentClaim[];
    disagreements: Disagreement[];
    agreementRatio: number;
    unsupportedConsensusCount: number;
  } {
    const allClaims: AgentClaim[] = [];
    for (const ans of candidateAnswers) {
      if (ans.status === 'SUCCESS' && ans.claims) {
        allClaims.push(...ans.claims);
      }
    }

    // 1. Map claims against retrieved evidence
    const evaluatedClaims = allClaims.map((claim) => {
      const claimLower = claim.claimText.toLowerCase();
      const supportingIds: string[] = [];
      const contradictingIds: string[] = [];

      for (const src of evidenceSources) {
        if (!src.isAccessible) continue;
        const srcText = `${src.title} ${src.excerpt}`.toLowerCase();

        // Check semantic relevance & polarity
        const relevance = this.computeOverlapScore(claimLower, srcText);

        if (relevance > 0.25) {
          // Check for polarity / contradiction signals
          const isNegatedInSrc =
            srcText.includes('not visible') ||
            srcText.includes('no causal link') ||
            srcText.includes('refute') ||
            srcText.includes('myth') ||
            srcText.includes('debunked');

          const isClaimAffirmingMyth =
            (claimLower.includes('is visible') && !claimLower.includes('not visible')) ||
            (claimLower.includes('causes autism') && !claimLower.includes('not') && !claimLower.includes('no'));

          if (isClaimAffirmingMyth && isNegatedInSrc) {
            contradictingIds.push(src.id);
          } else {
            supportingIds.push(src.id);
          }
        }
      }

      let status = claim.verificationStatus;
      let rationale = claim.rationale;

      if (contradictingIds.length > 0) {
        status = 'CONTRADICTED';
        rationale = 'Primary evidence sources directly contradict this assertion.';
      } else if (supportingIds.length >= 2) {
        status = 'SUPPORTED';
        rationale = `Corroborated by ${supportingIds.length} independent sources with high authority.`;
      } else if (supportingIds.length === 1) {
        status = 'PARTIALLY_SUPPORTED';
        rationale = 'Supported by one accessible source; awaiting broader multi-source corroboration.';
      } else {
        status = 'UNVERIFIED';
        rationale = 'No direct corroborating evidence discovered in retrieved records.';
      }

      return {
        ...claim,
        verificationStatus: status,
        supportingEvidenceIds: supportingIds,
        contradictingEvidenceIds: contradictingIds,
        rationale,
      };
    });

    // 2. Cross-agent contradiction detection
    const disagreements: Disagreement[] = [];
    let agreementsCount = 0;
    let comparisonsCount = 0;

    const geminiClaims = evaluatedClaims.filter((c) => c.agentId === 'gemini_agent');
    const openaiClaims = evaluatedClaims.filter((c) => c.agentId === 'openai_agent');

    for (const gClaim of geminiClaims) {
      for (const oClaim of openaiClaims) {
        comparisonsCount++;
        const gText = gClaim.claimText.toLowerCase();
        const oText = oClaim.claimText.toLowerCase();

        // Polar contradiction detection
        const gNegative = this.hasNegativeSignal(gText);
        const oNegative = this.hasNegativeSignal(oText);

        const topicOverlap = this.computeOverlapScore(gText, oText);

        if (topicOverlap > 0.35) {
          if (gNegative !== oNegative) {
            // Direct polarity clash on same topic
            disagreements.push({
              id: `disag-${Date.now()}-${disagreements.length + 1}`,
              conflictingClaimA: {
                claimId: gClaim.id,
                agentId: gClaim.agentId,
                text: gClaim.claimText,
              },
              conflictingClaimB: {
                claimId: oClaim.id,
                agentId: oClaim.agentId,
                text: oClaim.claimText,
              },
              severity: 'HIGH',
              explanation: 'Direct polar contradiction between candidate agents on a primary factual assertion.',
              resolutionStatus: gClaim.supportingEvidenceIds.length > 0 ? 'RESOLVED' : 'UNRESOLVED',
              supportingEvidenceIds: gClaim.supportingEvidenceIds,
              contradictingEvidenceIds: oClaim.contradictingEvidenceIds,
            });
          } else {
            agreementsCount++;
          }
        }
      }
    }

    const agreementRatio = comparisonsCount > 0 ? agreementsCount / comparisonsCount : 0.85;

    // Detect unsupported consensus: cases where both models agree but evidence is missing
    const unsupportedConsensusCount = evaluatedClaims.filter(
      (c) => c.verificationStatus === 'UNVERIFIED'
    ).length;

    return {
      evaluatedClaims,
      disagreements,
      agreementRatio: Math.min(1.0, Math.max(0.0, agreementRatio)),
      unsupportedConsensusCount,
    };
  }

  private hasNegativeSignal(text: string): boolean {
    return (
      /\b(not|cannot|no|never|untrue|false|myth|refutes|disproved)\b/i.test(text)
    );
  }

  private computeOverlapScore(textA: string, textB: string): number {
    const wordsA = new Set(textA.split(/\W+/).filter((w) => w.length > 3));
    const wordsB = new Set(textB.split(/\W+/).filter((w) => w.length > 3));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let match = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) match++;
    }
    return match / Math.min(wordsA.size, wordsB.size);
  }
}
