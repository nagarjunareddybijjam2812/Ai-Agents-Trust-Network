/**
 * Mathematical Trust Kernel.
 * Implements Beta-Binomial Bayesian estimation, multi-dimensional score synthesis,
 * dynamic missing-dimension normalization, and calibration metrics.
 */

import type {
  TrustScoreDecomposition,
  HistoricalAccuracyDimension,
  EvidenceQualityDimension,
  ConsistencyDimension,
  CalibrationDimension,
  AgentClaim,
  EvidenceSource,
  Disagreement,
  VerifiedOutcome,
} from '../../types/trust.js';

export interface TrustEngineWeights {
  historical: number; // default 0.40
  evidence: number;   // default 0.30
  consistency: number;// default 0.20
  calibration: number;// default 0.10
}

export const DEFAULT_WEIGHTS: TrustEngineWeights = {
  historical: 0.40,
  evidence: 0.30,
  consistency: 0.20,
  calibration: 0.10,
};

export class MathematicalTrustKernel {
  /**
   * Computes Beta-Binomial posterior accuracy from verified empirical records.
   */
  public computeHistoricalAccuracy(
    outcomes: VerifiedOutcome[],
    priorAlpha = 2,
    priorBeta = 2
  ): HistoricalAccuracyDimension {
    const sampleSize = outcomes.length;
    const observedCorrect = outcomes.filter((o) => o.isCorrect).length;
    const observedIncorrect = sampleSize - observedCorrect;

    const alphaPost = priorAlpha + observedCorrect;
    const betaPost = priorBeta + observedIncorrect;
    const posteriorMean = alphaPost / (alphaPost + betaPost);

    // Posterior variance: (alpha * beta) / ((alpha + beta)^2 * (alpha + beta + 1))
    const total = alphaPost + betaPost;
    const variance = (alphaPost * betaPost) / (total * total * (total + 1));
    const stdDev = Math.sqrt(variance);

    const minBound = Math.max(0, posteriorMean - 1.96 * stdDev);
    const maxBound = Math.min(1, posteriorMean + 1.96 * stdDev);

    const rawScore = Math.round(posteriorMean * 100);

    let status: 'MEASURED' | 'PRIOR_ESTIMATE' | 'INSUFFICIENT_HISTORY' = 'MEASURED';
    let explanation = `Empirically measured from ${sampleSize} verified independent evaluation records (${observedCorrect} correct, ${observedIncorrect} incorrect). 95% Bayesian credible interval: [${Math.round(minBound * 100)}%, ${Math.round(maxBound * 100)}%].`;

    if (sampleSize === 0) {
      status = 'PRIOR_ESTIMATE';
      explanation = `Zero empirical evaluations recorded. Score driven by uniform prior Beta(${priorAlpha},${priorBeta}) with high epistemic variance. Not observed performance.`;
    } else if (sampleSize < 5) {
      status = 'INSUFFICIENT_HISTORY';
      explanation = `Small sample size (N=${sampleSize}) limits statistical significance. Posterior is heavily influenced by prior parameterization.`;
    }

    return {
      weight: DEFAULT_WEIGHTS.historical,
      rawScore,
      sampleSize,
      priorAlpha,
      priorBeta,
      observedCorrect,
      observedIncorrect,
      posteriorMean: Number(posteriorMean.toFixed(4)),
      credibleInterval95: [Number(minBound.toFixed(4)), Number(maxBound.toFixed(4))],
      status,
      explanation,
    };
  }

  /**
   * Computes evidence quality dimension based on domain authority, corroboration, and polarity.
   */
  public computeEvidenceQuality(
    sources: EvidenceSource[],
    claims: AgentClaim[]
  ): EvidenceQualityDimension {
    if (sources.length === 0 || sources.every((s) => !s.isAccessible)) {
      return {
        weight: DEFAULT_WEIGHTS.evidence,
        rawScore: 0,
        domainAuthorityAverage: 0,
        corroborationFactor: 0,
        contradictionDeduction: 0,
        status: 'UNAVAILABLE',
        explanation: 'No accessible evidence sources retrieved. Evidence dimension cannot be verified.',
      };
    }

    const accessibleSources = sources.filter((s) => s.isAccessible);
    const authoritySum = accessibleSources.reduce((acc, s) => acc + s.domainAuthority, 0);
    const domainAuthorityAverage = Math.round(authoritySum / accessibleSources.length);

    // Corroboration calculation
    const supportedClaims = claims.filter((c) => c.verificationStatus === 'SUPPORTED');
    const partiallySupported = claims.filter((c) => c.verificationStatus === 'PARTIALLY_SUPPORTED');
    const contradictedClaims = claims.filter((c) => c.verificationStatus === 'CONTRADICTED');

    const totalClaims = Math.max(1, claims.length);
    const supportRatio = (supportedClaims.length * 1.0 + partiallySupported.length * 0.5) / totalClaims;

    const corroborationFactor = Math.min(100, Math.round(supportRatio * 100));
    const contradictionDeduction = contradictedClaims.length * 30;

    let score = Math.round(domainAuthorityAverage * 0.55 + corroborationFactor * 0.45 - contradictionDeduction);
    score = Math.max(0, Math.min(100, score));

    return {
      weight: DEFAULT_WEIGHTS.evidence,
      rawScore: score,
      domainAuthorityAverage,
      corroborationFactor,
      contradictionDeduction,
      status: 'MEASURED',
      explanation: `Synthesized from ${accessibleSources.length} accessible sources (average domain authority: ${domainAuthorityAverage}/100, claim support ratio: ${Math.round(supportRatio * 100)}%, contradiction penalty: -${contradictionDeduction}).`,
    };
  }

  /**
   * Computes consistency dimension penalizing material contradictions and rewarding independent consensus.
   */
  public computeConsistency(
    disagreements: Disagreement[],
    agreementRatio: number,
    unsupportedConsensusCount: number
  ): ConsistencyDimension {
    let penalty = 0;
    for (const d of disagreements) {
      if (d.severity === 'HIGH') penalty += 35;
      else if (d.severity === 'MEDIUM') penalty += 18;
      else penalty += 8;
    }

    // Penalize unsupported consensus (warning: 2 models agreeing without evidence is not truth)
    const consensusIndependenceScore = Math.max(
      40,
      100 - unsupportedConsensusCount * 12
    );

    let rawScore = Math.round(agreementRatio * 100 - penalty);
    rawScore = Math.max(0, Math.min(100, rawScore));

    return {
      weight: DEFAULT_WEIGHTS.consistency,
      rawScore,
      agreementRatio: Number(agreementRatio.toFixed(2)),
      contradictionPenalty: penalty,
      consensusIndependenceScore,
      status: 'MEASURED',
      explanation: `Cross-agent consistency score: ${rawScore}/100. Agreement ratio: ${Math.round(agreementRatio * 100)}%, detected contradictions penalty: -${penalty}pts, consensus independence factor: ${consensusIndependenceScore}/100.`,
    };
  }

  /**
   * Computes calibration metric (Brier score / ECE) from historical probabilistic predictions.
   */
  public computeCalibration(outcomes: VerifiedOutcome[]): CalibrationDimension {
    const eligible = outcomes.filter((o) => typeof o.statedConfidence === 'number');

    if (eligible.length < 5) {
      return {
        weight: DEFAULT_WEIGHTS.calibration,
        rawScore: 50,
        status: 'INSUFFICIENT_HISTORY',
        explanation: 'Fewer than 5 verified forecasts with recorded probabilities. Labelled UNCALIBRATED.',
      };
    }

    // Brier score: (1/N) * sum((prob - actual)^2) where actual = 1 if isCorrect else 0
    let brierSum = 0;
    for (const item of eligible) {
      const prob = item.statedConfidence / 100.0;
      const actual = item.isCorrect ? 1.0 : 0.0;
      brierSum += Math.pow(prob - actual, 2);
    }
    const brierScore = brierSum / eligible.length;

    // Convert Brier score (0=perfect, 1=worst) to a 0-100 scale: score = (1 - brierScore) * 100
    const rawScore = Math.round(Math.max(0, Math.min(100, (1 - brierScore) * 100)));

    return {
      weight: DEFAULT_WEIGHTS.calibration,
      rawScore,
      brierScore: Number(brierScore.toFixed(4)),
      status: 'CALIBRATED',
      explanation: `Calculated over ${eligible.length} verified predictions. Empirical Brier Score: ${brierScore.toFixed(3)} (ideal=0.0). Calibrated score: ${rawScore}/100.`,
    };
  }

  /**
   * Evaluates overall Trust Score with dynamic missing-dimension normalization:
   * T = sum(w_i * s_i) / sum(w_i) for all i in available dimensions
   */
  public synthesizeTrustScore(
    historicalDim: HistoricalAccuracyDimension,
    evidenceDim: EvidenceQualityDimension,
    consistencyDim: ConsistencyDimension,
    calibrationDim: CalibrationDimension,
    customWeights: TrustEngineWeights = DEFAULT_WEIGHTS
  ): TrustScoreDecomposition {
    const dimensionsList: Array<{
      name: string;
      dim: { weight: number; rawScore: number; status: string };
      weight: number;
    }> = [
      { name: 'historical', dim: historicalDim, weight: customWeights.historical },
      { name: 'evidence', dim: evidenceDim, weight: customWeights.evidence },
      { name: 'consistency', dim: consistencyDim, weight: customWeights.consistency },
      { name: 'calibration', dim: calibrationDim, weight: customWeights.calibration },
    ];

    let weightedSum = 0;
    let availableWeight = 0;
    const totalWeight =
      customWeights.historical +
      customWeights.evidence +
      customWeights.consistency +
      customWeights.calibration;

    for (const item of dimensionsList) {
      if (item.name === 'historical' && item.dim.status === 'PRIOR_ESTIMATE') {
        // Include prior estimate with half weight penalty
        weightedSum += item.dim.rawScore * (item.weight * 0.5);
        availableWeight += item.weight * 0.5;
      } else if (item.dim.status !== 'UNAVAILABLE' && item.dim.status !== 'INSUFFICIENT_HISTORY') {
        weightedSum += item.dim.rawScore * item.weight;
        availableWeight += item.weight;
      }
    }

    if (availableWeight === 0) {
      return {
        overallScore: 0,
        normalizedCoverage: 0,
        measurementStatus: 'INSUFFICIENT_DATA',
        calculationVersion: 'v2.1-bayesian-4d',
        timestamp: new Date().toISOString(),
        dimensions: {
          historicalAccuracy: historicalDim,
          evidenceQuality: evidenceDim,
          consistency: consistencyDim,
          uncertaintyCalibration: calibrationDim,
        },
        appliedWeights: customWeights,
        rationale: 'Zero eligible measurement dimensions available. Cannot calculate trust score.',
      };
    }

    const overallScore = Math.round(weightedSum / availableWeight);
    const normalizedCoverage = Number((availableWeight / totalWeight).toFixed(3));

    let measurementStatus: 'FULL' | 'PARTIAL' | 'INSUFFICIENT_DATA' = 'FULL';
    if (normalizedCoverage < 0.6) {
      measurementStatus = 'INSUFFICIENT_DATA';
    } else if (normalizedCoverage < 0.95) {
      measurementStatus = 'PARTIAL';
    }

    return {
      overallScore: Math.max(0, Math.min(100, overallScore)),
      normalizedCoverage,
      measurementStatus,
      calculationVersion: 'v2.1-bayesian-4d',
      timestamp: new Date().toISOString(),
      dimensions: {
        historicalAccuracy: historicalDim,
        evidenceQuality: evidenceDim,
        consistency: consistencyDim,
        uncertaintyCalibration: calibrationDim,
      },
      appliedWeights: customWeights,
      rationale: `Normalized trust index computed via Bayesian 4D Kernel (${measurementStatus} coverage: ${(normalizedCoverage * 100).toFixed(1)}%). Dimension contributions: Historical (${historicalDim.rawScore}), Evidence (${evidenceDim.rawScore}), Consistency (${consistencyDim.rawScore}), Calibration (${calibrationDim.rawScore}).`,
    };
  }
}
