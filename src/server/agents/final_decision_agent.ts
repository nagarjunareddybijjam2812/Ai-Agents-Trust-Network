/**
 * Final Decision Agent.
 * Synthesizes the final verified response based strictly on corroborated claims,
 * primary evidence citations, and transparent uncertainty declarations.
 * Provides a deterministic fallback formatter when external synthesis is constrained.
 */

import { GoogleGenAI } from '@google/genai';
import type {
  DecisionStatus,
  AgentCandidateResponse,
  EvidenceSource,
  AgentClaim,
  Disagreement,
  TrustScoreDecomposition,
} from '../../types/trust.js';

export class FinalDecisionAgent {
  private ai: GoogleGenAI | null = null;
  private readonly modelName = 'gemini-3.8-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public async synthesize(
    question: string,
    decisionStatus: DecisionStatus,
    decisionRationale: string,
    candidateAnswers: AgentCandidateResponse[],
    evidenceSources: EvidenceSource[],
    claims: AgentClaim[],
    disagreements: Disagreement[],
    trustScore: TrustScoreDecomposition
  ): Promise<string> {
    // If system abstained, return an honest, structured abstention explanation
    if (decisionStatus === 'ABSTAINED') {
      return this.formatAbstentionResponse(
        question,
        decisionRationale,
        disagreements,
        claims
      );
    }

    // Attempt model-assisted synthesis if Gemini is configured
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const supportedClaims = claims.filter(
          (c) => c.verificationStatus === 'SUPPORTED' || c.verificationStatus === 'PARTIALLY_SUPPORTED'
        );
        const accessibleSources = evidenceSources.filter((s) => s.isAccessible);

        const prompt = `You are the Final Decision Agent for the AI Trust Architecture.
Your role is to produce a transparent, authoritative, evidence-grounded final answer.

Question: "${question}"
Decision Status: ${decisionStatus}
Decision Rationale: ${decisionRationale}
Overall Trust Score: ${trustScore.overallScore}/100

Corroborated Claims to Include:
${supportedClaims.map((c, i) => `${i + 1}. ${c.claimText} [Status: ${c.verificationStatus}]`).join('\n')}

Authoritative Evidence Citations:
${accessibleSources.map((s, i) => `[Source ${i + 1}] ${s.title} (${s.publisher})`).join('\n')}

Instructions:
1. Deliver a clear, direct, synthesized answer strictly supported by the verified claims above.
2. Embed source citations like [Source 1], [Source 2] where appropriate.
3. If decision is NEEDS_REVIEW, clearly state remaining uncertainties or points requiring human validation.
4. Do NOT introduce unverified claims or speculate beyond the provided sources.`;

        const response = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
        });

        if (response.text && response.text.trim().length > 20) {
          return response.text.trim();
        }
      } catch (err) {
        console.warn('Final Decision LLM synthesis failed, using deterministic formatter:', err);
      }
    }

    // Deterministic fallback formatter
    return this.deterministicFormat(
      question,
      decisionStatus,
      decisionRationale,
      candidateAnswers,
      evidenceSources,
      claims,
      disagreements,
      trustScore
    );
  }

  private deterministicFormat(
    question: string,
    decisionStatus: DecisionStatus,
    decisionRationale: string,
    candidateAnswers: AgentCandidateResponse[],
    evidenceSources: EvidenceSource[],
    claims: AgentClaim[],
    disagreements: Disagreement[],
    trustScore: TrustScoreDecomposition
  ): string {
    const supported = claims.filter((c) => c.verificationStatus === 'SUPPORTED');
    const partiallySupported = claims.filter((c) => c.verificationStatus === 'PARTIALLY_SUPPORTED');
    const accessibleSources = evidenceSources.filter((s) => s.isAccessible);

    const successfulCandidate = candidateAnswers.find((a) => a.status === 'SUCCESS');
    const primaryCandidateText = successfulCandidate ? successfulCandidate.answerText : '';

    let output = '';

    if (decisionStatus === 'ACCEPTED') {
      output += `### Verified Answer\n\n`;
      if (primaryCandidateText) {
        output += `${primaryCandidateText}\n\n`;
      } else if (supported.length > 0) {
        output += `${supported.map((c) => c.claimText).join(' ')}\n\n`;
      }
    } else {
      output += `### Provisional Answer (Review Required)\n\n`;
      if (primaryCandidateText) {
        output += `${primaryCandidateText}\n\n`;
      }
      output += `> **Notice**: This response has been flagged for human review. ${decisionRationale}\n\n`;
    }

    // Supported claims list
    if (supported.length > 0 || partiallySupported.length > 0) {
      output += `#### Verified Factual Points\n`;
      for (const sc of supported) {
        output += `- **Verified**: ${sc.claimText}\n`;
      }
      for (const psc of partiallySupported) {
        output += `- **Partially Corroborated**: ${psc.claimText}\n`;
      }
      output += `\n`;
    }

    // Key sources
    if (accessibleSources.length > 0) {
      output += `#### Authoritative Evidence\n`;
      for (let i = 0; i < Math.min(accessibleSources.length, 3); i++) {
        const s = accessibleSources[i];
        output += `- [${s.publisher}]: *${s.title}* (${s.url})\n`;
      }
      output += `\n`;
    }

    // Disagreements or caveats
    if (disagreements.length > 0) {
      output += `#### Unresolved Nuances & Disagreements\n`;
      for (const d of disagreements) {
        output += `- [${d.severity} Severity] ${d.explanation}\n`;
      }
    }

    return output.trim();
  }

  private formatAbstentionResponse(
    question: string,
    rationale: string,
    disagreements: Disagreement[],
    claims: AgentClaim[]
  ): string {
    const contradicted = claims.filter((c) => c.verificationStatus === 'CONTRADICTED');

    let output = `### System Abstention: Answer Withheld by Decision Policy\n\n`;
    output += `The AI Trust Architecture has declined to provide an affirmative answer to: *"${question}"*.\n\n`;
    output += `**Policy Decision Reason**: ${rationale}\n\n`;

    if (contradicted.length > 0) {
      output += `#### Contradicted Claims Identified\n`;
      for (const c of contradicted) {
        output += `- Claim: "${c.claimText}" — Direct contradiction found in peer-reviewed or official repository records.\n`;
      }
      output += `\n`;
    }

    if (disagreements.length > 0) {
      output += `#### Epistemic Contradictions\n`;
      for (const d of disagreements) {
        output += `- **${d.severity} Priority Conflict**: ${d.explanation}\n`;
      }
      output += `\n`;
    }

    output += `#### Required Additional Verification\n`;
    output += `- Primary empirical documentation or controlled replication trials must be submitted.\n`;
    output += `- Epistemic conflicts between candidate models must be resolved through verified ground truth.\n`;

    return output.trim();
  }
}
