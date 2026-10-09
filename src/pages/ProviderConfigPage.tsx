import React, { useEffect, useState } from 'react';
import { getConfigStatus } from '../api/client.js';
import { Settings, ShieldCheck, Key, Lock, Cpu, Globe, Sliders } from 'lucide-react';

export const ProviderConfigPage: React.FC = () => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    getConfigStatus().then(setConfig).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-indigo-400" />
          Provider Infrastructure & Decision Governance
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Inspect model providers, environment security, decision policy thresholds, and privacy guardrails.
        </p>
      </div>

      {/* Provider Connectivity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gemini Provider */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-indigo-400" />
              <h3 className="font-semibold text-white">Google GenAI (Gemini)</h3>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                config?.geminiConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {config?.geminiConfigured ? 'LIVE CONFIGURED' : 'KEY MISSING'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div>Model Identifier: <span className="text-white">gemini-3.8-flash</span></div>
            <div>Key Source: <span className="text-slate-400">Environment (GEMINI_API_KEY)</span></div>
            <div>Prompt Guardrails: <span className="text-emerald-400">Independent Prompt Isolation</span></div>
          </div>
        </div>

        {/* OpenAI Provider */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-sky-400" />
              <h3 className="font-semibold text-white">OpenAI Provider</h3>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${
                config?.openaiConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              }`}
            >
              {config?.openaiConfigured ? 'LIVE CONFIGURED' : 'TEST DOUBLE ACTIVE'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div>Configured Model: <span className="text-white">gpt-4o</span></div>
            <div>Key Source: <span className="text-slate-400">Environment (OPENAI_API_KEY)</span></div>
            <div>Fallback State: <span className="text-sky-300">Deterministic High-Fidelity Simulator</span></div>
          </div>
        </div>
      </div>

      {/* Decision Policy Thresholds */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="text-emerald-400" size={18} />
          <h3 className="font-semibold text-white">Configured Decision Policy Rules</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Acceptance Trust Score:</span>
            <div className="text-2xl font-bold text-white">≥ 70 / 100</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Evidence Quality Score:</span>
            <div className="text-2xl font-bold text-white">≥ 60 / 100</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Unresolved Contradictions:</span>
            <div className="text-2xl font-bold text-rose-400">0 High-Severity</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-slate-400">Claim Corroboration:</span>
            <div className="text-2xl font-bold text-emerald-400">≥ 65% Supported</div>
          </div>
        </div>
      </div>

      {/* Security & SSRF Safeguards */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Lock size={16} />
          <h4>Security, SSRF Protections, and Privacy Guarantees</h4>
        </div>

        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>SSRF Defense:</strong> Evidence retrieval resolves all candidate URLs through strict IP and CIDR filters.
            Loopback addresses (127.0.0.1, ::1), private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and cloud metadata
            IPs (169.254.169.254) are rejected unconditionally.
          </p>
          <p>
            • <strong>Untrusted Content Separation:</strong> Web documents and retrieved search excerpts are treated as
            strictly untrusted data. External instructions cannot alter decision policies or trigger tool execution.
          </p>
          <p>
            • <strong>Zero Key UI Exposure:</strong> API credentials are read server-side only from environment variables and
            are never transmitted to the frontend bundle or exposed in logs.
          </p>
        </div>
      </div>
    </div>
  );
};
