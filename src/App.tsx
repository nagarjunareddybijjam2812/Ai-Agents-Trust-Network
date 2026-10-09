import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AskQuestionPage } from './pages/AskQuestionPage.js';
import { WorkflowInspectorPage } from './pages/WorkflowInspectorPage.js';
import { AgentComparisonPage } from './pages/AgentComparisonPage.js';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage.js';
import { DisagreementsPage } from './pages/DisagreementsPage.js';
import { TrustAnalyticsPage } from './pages/TrustAnalyticsPage.js';
import { BenchmarkPage } from './pages/BenchmarkPage.js';
import { RunHistoryPage } from './pages/RunHistoryPage.js';
import { ProviderConfigPage } from './pages/ProviderConfigPage.js';
import { listWorkflowRuns, getAgentsList } from './api/client.js';
import type { WorkflowRun, ConfiguredAgentMeta } from './types/trust.js';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [agents, setAgents] = useState<ConfiguredAgentMeta[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [runsData, agentsData] = await Promise.all([
        listWorkflowRuns({ limit: 50 }),
        getAgentsList(),
      ]);
      setRuns(runsData.runs || []);
      setAgents(agentsData.agents || []);
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  };

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    setActiveTab('ask');
  };

  const handleNavigateToAsk = () => {
    setSelectedRunId(undefined);
    setActiveTab('ask');
  };

  const geminiAgent = agents.find((a) => a.id === 'gemini_agent');
  const openaiAgent = agents.find((a) => a.id === 'openai_agent');
  const geminiReady = geminiAgent?.state === 'AVAILABLE';
  const openaiReady = openaiAgent?.state === 'AVAILABLE';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
        geminiReady={geminiReady}
        openaiReady={openaiReady}
        totalRuns={runs.length}
      />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardPage
            runs={runs}
            agents={agents}
            onSelectRun={handleSelectRun}
            onNavigateToAsk={handleNavigateToAsk}
          />
        )}

        {activeTab === 'ask' && (
          <AskQuestionPage
            initialRunId={selectedRunId}
            onRunCreated={(runId) => {
              setSelectedRunId(runId);
              fetchData();
            }}
          />
        )}

        {activeTab === 'workflow' && (
          <WorkflowInspectorPage runs={runs} onSelectRun={handleSelectRun} />
        )}

        {activeTab === 'agents' && (
          <AgentComparisonPage
            agents={agents}
            recentRuns={runs}
            onSelectRun={handleSelectRun}
          />
        )}

        {activeTab === 'evidence' && <EvidenceExplorerPage runs={runs} />}

        {activeTab === 'disagreements' && (
          <DisagreementsPage runs={runs} onSelectRun={handleSelectRun} />
        )}

        {activeTab === 'analytics' && <TrustAnalyticsPage runs={runs} />}

        {activeTab === 'benchmark' && <BenchmarkPage />}

        {activeTab === 'history' && (
          <RunHistoryPage runs={runs} onSelectRun={handleSelectRun} />
        )}

        {activeTab === 'settings' && <ProviderConfigPage />}
      </main>

      {/* Production Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>AI Trust Architecture • Production Epistemic Observability</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>LangGraph Orchestration</span>
            <span>•</span>
            <span>Beta-Binomial Bayesian Kernel</span>
            <span>•</span>
            <span>SSRF-Validated Provenance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
