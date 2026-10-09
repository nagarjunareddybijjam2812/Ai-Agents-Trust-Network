import React from 'react';
import type { TrustScoreDecomposition } from '../types/trust.js';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  trustScore?: TrustScoreDecomposition;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreGauge: React.FC<Props> = ({ trustScore, size = 'md' }) => {
  if (!trustScore) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-sm">
        Trust evaluation pending...
      </div>
    );
  }

  const { overallScore, measurementStatus, dimensions, normalizedCoverage } = trustScore;

  const scoreColor =
    overallScore >= 75
      ? 'text-emerald-400 stroke-emerald-400'
      : overallScore >= 55
      ? 'text-amber-400 stroke-amber-400'
      : 'text-rose-400 stroke-rose-400';

  const dims = [
    {
      name: 'Historical Accuracy',
      weight: '40%',
      score: dimensions.historicalAccuracy.rawScore,
      status: dimensions.historicalAccuracy.status,
      desc: dimensions.historicalAccuracy.explanation,
      color: 'bg-indigo-500',
    },
    {
      name: 'Evidence Quality',
      weight: '30%',
      score: dimensions.evidenceQuality.rawScore,
      status: dimensions.evidenceQuality.status,
      desc: dimensions.evidenceQuality.explanation,
      color: 'bg-emerald-500',
    },
    {
      name: 'Cross-Agent Consistency',
      weight: '20%',
      score: dimensions.consistency.rawScore,
      status: dimensions.consistency.status,
      desc: dimensions.consistency.explanation,
      color: 'bg-sky-500',
    },
    {
      name: 'Uncertainty Calibration',
      weight: '10%',
      score: dimensions.uncertaintyCalibration.rawScore,
      status: dimensions.uncertaintyCalibration.status,
      desc: dimensions.uncertaintyCalibration.explanation,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-indigo-400" size={20} />
          <h3 className="font-semibold text-white text-base">Trust Reliability Score</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium ${
              measurementStatus === 'FULL'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : measurementStatus === 'PARTIAL'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            {measurementStatus} COVERAGE ({(normalizedCoverage * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="46"
              className="text-slate-800"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r="46"
              className={scoreColor}
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - overallScore / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute text-center">
            <span className={`text-3xl font-extrabold font-mono ${scoreColor}`}>
              {overallScore}
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              / 100
            </span>
          </div>
        </div>

        <div className="flex-1 text-sm text-slate-300 space-y-1.5">
          <p className="font-medium text-white">{trustScore.rationale}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info size={14} className="shrink-0 text-slate-500" />
            <span>
              Bayesian calibrated index. Calculated via version {trustScore.calculationVersion}.
            </span>
          </div>
        </div>
      </div>

      {/* 4-Dimension Breakdown Progress Bars */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Multi-Dimension Decomposition
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dims.map((d) => (
            <div
              key={d.name}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">
                  {d.name}{' '}
                  <span className="text-slate-500 font-mono text-[10px]">({d.weight})</span>
                </span>
                <span className="font-mono font-bold text-white">{d.score}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${d.color} transition-all duration-500`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-[10px] uppercase text-indigo-400">
                  {d.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
