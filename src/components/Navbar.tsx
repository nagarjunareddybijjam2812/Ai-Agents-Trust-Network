import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  FileSearch,
  AlertOctagon,
  LineChart,
  History,
  Settings,
  HelpCircle,
  FlaskConical,
  Activity,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'ask'
  | 'workflow'
  | 'agents'
  | 'evidence'
  | 'disagreements'
  | 'analytics'
  | 'benchmark'
  | 'history'
  | 'settings';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  geminiReady: boolean;
  openaiReady: boolean;
  totalRuns: number;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  geminiReady,
  openaiReady,
  totalRuns,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Overview', icon: <Activity size={16} /> },
    { id: 'ask', label: 'Verify AI Question', icon: <HelpCircle size={16} /> },
    { id: 'workflow', label: 'Workflow Graph', icon: <Layers size={16} /> },
    { id: 'agents', label: 'Agent Comparison', icon: <Cpu size={16} /> },
    { id: 'evidence', label: 'Claim & Evidence', icon: <FileSearch size={16} /> },
    { id: 'disagreements', label: 'Contradictions', icon: <AlertOctagon size={16} /> },
    { id: 'analytics', label: 'Trust Calibration', icon: <LineChart size={16} /> },
    { id: 'benchmark', label: 'Benchmark Lab', icon: <FlaskConical size={16} /> },
    { id: 'history', label: 'Audit Log', icon: <History size={16} /> },
    { id: 'settings', label: 'Governance', icon: <Settings size={16} /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="text-emerald-400" size={22} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-mono">
                AI TRUST ARCHITECTURE
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono">
                v2.1-kernel
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-Agent Verification • Calibrated Bayesian Scoring • Non-Consensus Reliability
            </p>
          </div>
        </div>

        {/* Live Provider Health & Telemetry */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
              geminiReady
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                geminiReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>Gemini: {geminiReady ? 'Live (3.8-flash)' : 'Key Missing'}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
              openaiReady
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                openaiReady ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
            />
            <span>OpenAI: {openaiReady ? 'Live (GPT-4o)' : 'Test Double'}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-slate-400">Runs:</span>
            <span className="font-semibold text-white">{totalRuns}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 py-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
