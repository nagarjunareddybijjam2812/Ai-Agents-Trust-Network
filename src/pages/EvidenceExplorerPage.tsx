import React, { useState } from 'react';
import type { WorkflowRun, EvidenceSource, AgentClaim } from '../types/trust.js';
import { FileSearch, ShieldCheck, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Search } from 'lucide-react';

interface Props {
  runs: WorkflowRun[];
}

export const EvidenceExplorerPage: React.FC<Props> = ({ runs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'curated' | 'web'>('all');

  // Collect all unique sources across recent runs
  const allSources: Array<EvidenceSource & { question: string; runId: string }> = [];
  const allClaims: Array<AgentClaim & { question: string; runId: string }> = [];

  for (const r of runs) {
    if (r.evidenceSources) {
      for (const s of r.evidenceSources) {
        if (!allSources.some((item) => item.id === s.id)) {
          allSources.push({ ...s, question: r.question, runId: r.id });
        }
      }
    }
    if (r.claimEvaluations) {
      for (const c of r.claimEvaluations) {
        if (!allClaims.some((item) => item.id === c.id)) {
          allClaims.push({ ...c, question: r.question, runId: r.id });
        }
      }
    }
  }

  const filteredSources = allSources.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'curated') return s.provider === 'curated_benchmark';
    if (filterType === 'web') return s.provider === 'web_search';
    return true;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileSearch className="text-indigo-400" />
          Evidence Provenance & Claim Verification Explorer
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Inspect crawled sources, institutional domain authority scores, SSRF security validation,
          and exact claim-level corroboration.
        </p>
      </div>

      {/* Domain Authority Scoring Rubric Notice */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Evidence Quality Rubric & Authority Tiers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold font-mono">Tier 1: 90 - 99 / 100</span>
            <p className="text-slate-300">
              Primary Repositories (.gov, .edu, WHO, CDC, NASA, NIST, Nature, Science).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-sky-400 font-bold font-mono">Tier 2: 75 - 89 / 100</span>
            <p className="text-slate-300">
              Verified Major News & Encyclopedias (Reuters, AP News, BBC, Wikipedia).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold font-mono">Tier 3: 40 - 74 / 100</span>
            <p className="text-slate-300">
              General Web / Blogs (requires independent multi-source corroboration).
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources, publishers, excerpts..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:border-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            All ({allSources.length})
          </button>
          <button
            onClick={() => setFilterType('curated')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              filterType === 'curated'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Curated Primary
          </button>
          <button
            onClick={() => setFilterType('web')}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              filterType === 'web'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Open Web
          </button>
        </div>
      </div>

      {/* Sources List */}
      <div className="space-y-4">
        {filteredSources.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
            No evidence sources matched your search query.
          </div>
        ) : (
          filteredSources.map((source) => (
            <div
              key={source.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{source.publisher}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    Authority: {source.domainAuthority}/100
                  </span>
                  {source.ssrfSafe && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      SSRF Safe
                    </span>
                  )}
                </div>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  Inspect Source <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-200">{source.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">URL: {source.url}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed italic">
                "{source.excerpt}"
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-500 font-mono">
                <span>Associated Inquiry: {source.question}</span>
                <span>Retrieved: {new Date(source.retrievalTimestamp).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
