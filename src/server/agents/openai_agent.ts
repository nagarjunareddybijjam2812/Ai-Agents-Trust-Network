/**
 * OpenAI Answer Agent.
 * Generates an independent candidate answer with claim extraction.
 * Uses official OpenAI endpoint when OPENAI_API_KEY is present;
 * otherwise executes a deterministic test double with explicit test-double telemetry.
 */

import type { AgentCandidateResponse, AgentClaim } from '../../types/trust.js';

export class OpenAIAnswerAgent {
  private readonly apiKey: string | undefined;
  private readonly modelName: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.modelName = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  public async generateAnswer(question: string): Promise<AgentCandidateResponse> {
    const startTime = Date.now();

    // 1. Live OpenAI API path
    if (this.apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.modelName,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'You are an independent scientific AI answer agent for a trust verification architecture. Return JSON with keys: "answerText", "claims" (array of { "text": string, "category": "factual"|"assumption"|"definition", "confidence": number }), "uncertaintyDeclared": string, "selfReportedConfidence": number.',
              },
              { role: 'user', content: question },
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI API returned HTTP ${response.status}: ${errText}`);
        }

        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        const latencyMs = Date.now() - startTime;

        const claims: AgentClaim[] = (parsed.claims || []).map((c: any, idx: number) => ({
          id: `claim-openai-${Date.now()}-${idx + 1}`,
          claimText: String(c.text || ''),
          category: (['factual', 'assumption', 'definition', 'recommendation'].includes(c.category)
            ? c.category
            : 'factual') as any,
          agentId: 'openai_agent',
          verificationStatus: 'UNVERIFIED',
          supportingEvidenceIds: [],
          contradictingEvidenceIds: [],
          confidence: typeof c.confidence === 'number' ? Math.min(100, Math.max(0, c.confidence)) : 80,
        }));

        return {
          agentId: 'openai_agent',
          provider: 'OpenAI',
          model: this.modelName,
          answerText: parsed.answerText || content,
          claims,
          uncertaintyDeclared: parsed.uncertaintyDeclared || 'Standard epistemic uncertainty.',
          selfReportedConfidence: parsed.selfReportedConfidence || 82,
          status: 'SUCCESS',
          latencyMs,
          tokenUsage: {
            promptTokens: data.usage?.prompt_tokens || 250,
            completionTokens: data.usage?.completion_tokens || 310,
            totalTokens: data.usage?.total_tokens || 560,
          },
          estimatedCostUsd: 0.003,
          isTestDouble: false,
        };
      } catch (err: any) {
        console.warn('OpenAI live call failed, recording provider error:', err?.message);
        return {
          agentId: 'openai_agent',
          provider: 'OpenAI',
          model: this.modelName,
          answerText: '',
          claims: [],
          uncertaintyDeclared: 'High (Provider Call Error)',
          selfReportedConfidence: 0,
          status: 'FAILED',
          latencyMs: Date.now() - startTime,
          error: err?.message || 'OpenAI network error',
          isTestDouble: false,
        };
      }
    }

    // 2. Deterministic High-Fidelity Test Double path
    // Emulates a second independent frontier model with rigorous factual reasoning
    // and realistic claim decomposition
    await new Promise((r) => setTimeout(r, 650)); // Emulate realistic network latency

    const testDoubleResult = this.generateDeterministicTestDouble(question);
    const latencyMs = Date.now() - startTime;

    return {
      agentId: 'openai_agent',
      provider: 'OpenAI (Deterministic Test Double)',
      model: `${this.modelName}-test-double`,
      answerText: testDoubleResult.answerText,
      claims: testDoubleResult.claims,
      uncertaintyDeclared: testDoubleResult.uncertaintyDeclared,
      selfReportedConfidence: testDoubleResult.selfReportedConfidence,
      status: 'SUCCESS',
      latencyMs,
      tokenUsage: {
        promptTokens: 245,
        completionTokens: 290,
        totalTokens: 535,
      },
      estimatedCostUsd: 0.0,
      isTestDouble: true,
    };
  }

  private generateDeterministicTestDouble(question: string): {
    answerText: string;
    claims: AgentClaim[];
    uncertaintyDeclared: string;
    selfReportedConfidence: number;
  } {
    const qLower = question.toLowerCase();

    if (qLower.includes('great wall of china') && (qLower.includes('moon') || qLower.includes('space'))) {
      return {
        answerText:
          'The Great Wall of China is not visible from the Moon with the unaided eye. The Moon is approximately 384,400 kilometers away, and the Great Wall has an average width of only 5 to 9 meters. Resolving it from lunar distance with human visual acuity would require angular resolution far exceeding the limits of the human eye. Apollo astronauts confirmed that no artificial structures are discernible from lunar orbit without magnification.',
        claims: [
          {
            id: `claim-openai-${Date.now()}-1`,
            claimText: 'The Great Wall of China cannot be seen from the Moon without optical magnification.',
            category: 'factual',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 96,
          },
          {
            id: `claim-openai-${Date.now()}-2`,
            claimText: 'The average width of the Great Wall is roughly 5 to 9 meters, which is too narrow for human eye resolution at 384,400 km.',
            category: 'factual',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 94,
          },
        ],
        uncertaintyDeclared: 'Low uncertainty regarding human naked-eye resolution limits from lunar orbit.',
        selfReportedConfidence: 95,
      };
    }

    if (qLower.includes('vaccine') && qLower.includes('autism')) {
      return {
        answerText:
          'Extensive, peer-reviewed scientific studies involving millions of individuals across multiple countries have repeatedly demonstrated that childhood vaccines, including the MMR vaccine, do not cause autism. The original 1998 claim by Andrew Wakefield was found to involve falsified data and was fully retracted by The Lancet.',
        claims: [
          {
            id: `claim-openai-${Date.now()}-1`,
            claimText: 'No scientific evidence supports a causal link between vaccines and autism.',
            category: 'factual',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 99,
          },
          {
            id: `claim-openai-${Date.now()}-2`,
            claimText: 'The 1998 Wakefield paper asserting the autism connection was retracted due to fraudulent methodology.',
            category: 'factual',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 98,
          },
        ],
        uncertaintyDeclared: 'Epidemiological consensus is definitive with very low uncertainty.',
        selfReportedConfidence: 98,
      };
    }

    if (qLower.includes('supervised') && qLower.includes('unsupervised')) {
      return {
        answerText:
          'The fundamental difference between supervised and unsupervised learning lies in the presence of target labels. In supervised learning, algorithms are provided with input features paired with ground-truth output labels (e.g., classification, regression). In unsupervised learning, the model receives only unlabeled data and must uncover underlying data distributions, clusters, or latent dimensionality independently.',
        claims: [
          {
            id: `claim-openai-${Date.now()}-1`,
            claimText: 'Supervised learning requires ground-truth target labels for training.',
            category: 'definition',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 97,
          },
          {
            id: `claim-openai-${Date.now()}-2`,
            claimText: 'Unsupervised learning infers structure such as clusters or density representations without target labels.',
            category: 'definition',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 96,
          },
        ],
        uncertaintyDeclared: 'Definitional standards in computer science are unambiguous.',
        selfReportedConfidence: 97,
      };
    }

    if (qLower.includes('agi') && (qLower.includes('when') || qLower.includes('timeline') || qLower.includes('2027'))) {
      return {
        answerText:
          'There is no scientific consensus or verifiable evidence indicating that Artificial General Intelligence (AGI) will arrive by a specific date. Projections from leading AI researchers, forecasters, and industry laboratories diverge widely from 3 to 30+ years, and definitions of AGI itself vary substantially across the literature.',
        claims: [
          {
            id: `claim-openai-${Date.now()}-1`,
            claimText: 'Exact future arrival dates for AGI cannot be verified with empirical certainty.',
            category: 'assumption',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 88,
          },
          {
            id: `claim-openai-${Date.now()}-2`,
            claimText: 'Expert timeline projections show large variance due to varying definitions and unknown scaling limits.',
            category: 'factual',
            agentId: 'openai_agent',
            verificationStatus: 'UNVERIFIED',
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [],
            confidence: 90,
          },
        ],
        uncertaintyDeclared: 'Extremely high epistemic uncertainty regarding long-term AI trajectories.',
        selfReportedConfidence: 70,
      };
    }

    // Default general synthesis test double
    return {
      answerText: `Analyzing the inquiry: "${question}". From established empirical principles, rigorous answer formulation requires separating direct observations from deductive extrapolation. Primary factors include verified boundary conditions, observational reproducibility, and documented experimental constraints.`,
      claims: [
        {
          id: `claim-openai-${Date.now()}-1`,
          claimText: `The question "${question.slice(0, 70)}" addresses a topic requiring empirical boundary analysis.`,
          category: 'factual',
          agentId: 'openai_agent',
          verificationStatus: 'UNVERIFIED',
          supportingEvidenceIds: [],
          contradictingEvidenceIds: [],
          confidence: 80,
        },
        {
          id: `claim-openai-${Date.now()}-2`,
          claimText: 'Verifiable conclusions depend on peer-reviewed domain evidence and contextual definitions.',
          category: 'assumption',
          agentId: 'openai_agent',
          verificationStatus: 'UNVERIFIED',
          supportingEvidenceIds: [],
          contradictingEvidenceIds: [],
          confidence: 85,
        },
      ],
      uncertaintyDeclared: 'Empirical verification requires matching claims against retrieved primary literature.',
      selfReportedConfidence: 80,
    };
  }
}
