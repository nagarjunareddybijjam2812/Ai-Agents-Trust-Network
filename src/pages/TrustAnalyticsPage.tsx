import React, { useState } from 'react';
import type { WorkflowRun } from '../types/trust.js';
import { LineChart, Sparkles, ShieldCheck, Activity, Info, RefreshCw } from 'lucide-react';

interface Props {
  runs: WorkflowRun[];
}

export const TrustAnalyticsPage: React.FC<Props> = ({ runs }) => {
  // Interactive Beta-Binomial playground state
  const [alphaPrior, setAlphaPrior] = useState(2);
  const [betaPrior, setBetaPrior] = useState(2);
  const [observedSuccess, setObservedSuccess] = useState(18);
  const [observedFail, setObservedFail] = useState(2);

  // Compute live posterior
  const alphaPost = alphaPrior + observedSuccess;
  const betaPost = betaPrior + observedFail;
  const posteriorMean = alphaPost / (alphaPost + betaPost);
  const total = alphaPost + betaPost;
  const variance = (alphaPost * betaPost) / (total * total * (total + 1));
  const stdDev = Math.sqrt(variance);
  const ciMin = Math.max(0, posteriorMean - 1.96 * stdDev);
  const ciMax = Math.min(1, posteriorMean + 1.96 * stdDev);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <LineChart className="text-indigo-400" />
          Trust Analytics & Bayesian Calibration Laboratory
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore the mathematical foundation of the Trust Engine. Beta-Binomial posterior updates,
          dynamic missing-dimension normalization, and empirical Brier score calibration.
        </p>
      </div>

      {/* Mathematical Formulation Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Sparkles size={16} />
            <h4>1. Beta-Binomial Historical Accuracy Model</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unlike static point estimates, the Trust Kernel treats agent reliability as a probability
            distribution. Given a prior Beta(α₀, β₀) and n verified historical
            evaluations with k correct answers:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800/80">
            <div>Posterior: Beta(α₀ + k, β₀ + (n - k))</div>
            <div className="mt-1">E[θ] = (α₀ + k) / (α₀ + β₀ + n)</div>
            <div className="mt-1">95% CI ≈ [E[θ] - 1.96σ, E[θ] + 1.96σ]</div>
          </div>
          <p className="text-xs text-slate-400">
            When zero evaluations exist ($n=0$), the score is explicitly flagged as a <code>PRIOR_ESTIMATE</code>,
            preventing unjustified overconfidence.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ShieldCheck size={16} />
            <h4>2. Dynamic Missing-Dimension Normalization</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Real-world systems frequently encounter missing dimensions (e.g. search offline, zero historical
            evaluations). Blind static weighting produces catastrophic distortions. The Trust Kernel dynamically
            normalizes over available dimensions:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800/80">
            <div>T = Σ (w_i · s_i) / Σ w_i   (for all i ∈ Available)</div>
            <div className="mt-1">Coverage = Σ w_i / Σ w_total</div>
            <div className="mt-1">Status: FULL (≥0.95), PARTIAL (&lt;0.95), INSUFFICIENT (&lt;0.60)</div>
          </div>
          <p className="text-xs text-slate-400">
            If critical evidence is missing, coverage drops and the decision policy is forbidden from accepting.
          </p>
        </div>
      </div>

      {/* Interactive Beta-Binomial Calculator Simulator */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-semibold text-white text-base">
              Interactive Beta-Binomial Bayesian Estimator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate how small sample sizes and prior choices affect estimated accuracy and credibility intervals.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono">
            Live Simulator
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Prior Alpha (α₀): {alphaPrior}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={alphaPrior}
              onChange={(e) => setAlphaPrior(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Prior Beta (β₀): {betaPrior}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={betaPrior}
              onChange={(e) => setBetaPrior(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Observed Correct (k): {observedSuccess}
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={observedSuccess}
              onChange={(e) => setObservedSuccess(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Observed Incorrect: {observedFail}
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={observedFail}
              onChange={(e) => setObservedFail(parseInt(e.target.value, 10))}
              className="w-full accent-rose-500"
            />
          </div>
        </div>

        {/* Calculated Posterior Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-xs text-slate-500 font-mono uppercase">Posterior Mean E[θ]</span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
              {(posteriorMean * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Beta({alphaPost}, {betaPost}) with N={observedSuccess + observedFail} samples
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-mono uppercase">95% Bayesian Credible Interval</span>
            <div className="text-2xl font-bold text-indigo-300 font-mono mt-1">
              [{(ciMin * 100).toFixed(1)}%, {(ciMax * 100).toFixed(1)}%]
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Epistemic dispersion width: {((ciMax - ciMin) * 100).toFixed(1)}%
            </p>
          </div>

          <div>
            <span className="text-xs text-slate-500 font-mono uppercase">Sample Status</span>
            <div className="text-2xl font-bold text-white font-mono mt-1">
              {observedSuccess + observedFail === 0
                ? 'PRIOR_ESTIMATE'
                : observedSuccess + observedFail < 5
                ? 'LOW_SAMPLE'
                : 'MEASURED'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sample size validity threshold
            </p>
          </div>
        </div>
      </div>

      {/* Historical Runs Trust Evolution */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-semibold text-white text-base">
          Recent Run Trust Score Trajectory
        </h3>
        {runs.length === 0 ? (
          <p className="text-slate-500 text-sm">No run telemetry recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {runs.slice(0, 8).map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      r.decisionStatus === 'ACCEPTED'
                        ? 'bg-emerald-400'
                        : r.decisionStatus === 'NEEDS_REVIEW'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-slate-300 max-w-sm truncate font-sans font-medium">
                    {r.question}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-indigo-400 font-bold">
                    Score: {r.trustScore?.overallScore}/100
                  </span>
                  <span className="text-slate-500">{r.decisionStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
