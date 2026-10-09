# AI Trust Architecture

> **A Multi-Agent Verification Platform with Calibrated Bayesian Scoring, Epistemic Humility, and Deterministic Policy Abstention Gates.**

---

## 1. Project Purpose & Philosophy

Traditional multi-agent systems and "majority-vote" LLM ensembles suffer from severe blind spots:
1. **Consensus Bias**: Multiple frontier models frequently reproduce the same common misconceptions and falsehood traps (e.g. "The Great Wall is visible from the Moon with the naked eye", "humans only use 10% of their brains"). Two models agreeing does not prove factual reality.
2. **Uncalibrated Confidence**: LLMs output arbitrary self-reported probabilities that do not reflect empirical accuracy.
3. **Absence of Abstention**: Systems hallucinate or guess rather than responsibly withholding affirmative answers when evidence is missing.

**AI Trust Architecture** breaks consensus dependence by implementing:
- **Parallel Independent Candidate Agents**: Models generate independent answers without seeing each other's outputs.
- **SSRF-Protected Multi-Source Crawling**: Crawls primary institutional evidence (.gov, .edu, WHO, CDC, NASA, NIST, Nature, Science).
- **Cross-Claim Polarity & Contradiction Detection**: Isolates conflicting factual assertions and penalizes unverified consensus.
- **Mathematical Bayesian Trust Kernel**: Synthesizes a Beta-Binomial posterior accuracy distribution with 95% Credible Intervals.
- **Deterministic Hard Decision Policy**: Gates answers into `ACCEPTED`, `NEEDS_REVIEW`, or `ABSTAINED`. A high numerical score cannot bypass unresolved polar contradictions.

---

## 2. Core Features

- **End-to-End LangGraph Orchestration**: Typed shared state graph with node duration telemetry, retry logic, and conditional bounded review loops.
- **Bayesian 4D Trust Scoring**:
  - Historical Accuracy (40% weight): Beta-Binomial conjugate update from verified evaluations.
  - Evidence Quality (30% weight): Institutional domain authority and corroboration ratio.
  - Cross-Agent Consistency (20% weight): Contradiction penalty and consensus independence discounting.
  - Uncertainty Calibration (10% weight): Empirical Brier Score from probabilistic forecasts.
- **Dynamic Missing-Dimension Normalization**: Dynamically re-weights available dimensions without artificial deflation.
- **Deterministic Policy Abstention**: Withholds answers on falsehood traps, contradictory literature, or unanswerable speculative dates.
- **Reproducible Benchmark Suite**: Empirical head-to-head evaluation comparing Single-Agent, Majority-Vote, and Trust Architecture.
- **Executive Observability Dashboard**: Built with React, Tailwind CSS, Lucide icons, and real-time polling.

---

## 3. Architecture Overview

```text
User Question
     │
     ▼
[LangGraph State Engine]
     ├──► [Gemini Answer Agent (gemini-3.8-flash)] ──┐
     └──► [OpenAI Answer Agent (gpt-4o / Double)] ──┴─► Shared State
                                                             │
                                                             ▼
                                                    [Evidence Crawler]
                                                    (SSRF-Protected)
                                                             │
                                                             ▼
                                                [Consistency Comparator]
                                                (Contradiction Matrix)
                                                             │
                                                             ▼
                                                [Bayesian 4D Trust Kernel]
                                                (Beta-Binomial Posterior)
                                                             │
                                                             ▼
                                                [Decision Policy Router]
                                                ├── ACCEPTED
                                                ├── NEEDS_REVIEW (Bounded Review Pass)
                                                └── ABSTAINED
                                                             │
                                                             ▼
                                                [Final Decision Agent]
                                                (Synthesized with Citations)
```

---

## 4. Technology Stack

- **Backend**: Node.js 22, TypeScript, Express, LangGraph (`@langchain/langgraph`, `@langchain/core`).
- **AI Providers**: `@google/genai` (SDK model `gemini-3.8-flash`), OpenAI API with deterministic test double fallback.
- **Persistence**: Thread-safe ACID JSON repository with atomic write renames (`data/trust_db.json`).
- **Frontend**: React 19, TypeScript (strict mode), Tailwind CSS, Vite.
- **Testing**: Automated unit & integration suite (`tests/test-suite.ts`), TypeScript linter (`npm run lint`), production build (`npm run build`).

---

## 5. Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm or bun

---

## 6. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Environment variables:
- `GEMINI_API_KEY`: Google GenAI API key (required for live Gemini model execution).
- `OPENAI_API_KEY`: OpenAI API key (optional; system runs deterministic test double if absent).
- `OPENAI_MODEL`: OpenAI model identifier (default: `gpt-4o`).
- `PORT`: Server listen port (default: `3000`).

---

## 7. Startup Commands

### Development Mode (Full-Stack Express + Vite on Port 3000):
```bash
npm run dev
```

### Run Automated Test Suite:
```bash
npx tsx tests/test-suite.ts
```

### Production Build:
```bash
npm run build
```

### Production Run:
```bash
npm start
```

### Docker Deployment:
```bash
docker compose up --build
```

---

## 8. API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/questions` | Submits question, starts background LangGraph workflow, returns HTTP 202 with `runId` |
| `GET` | `/api/runs` | List workflow runs with pagination (`limit`, `offset`) and status filters |
| `GET` | `/api/runs/:runId` | Retrieves complete run state, decision status, scores, claims, and final answer |
| `GET` | `/api/runs/:runId/events` | Retrieves chronological event timeline of LangGraph node executions |
| `GET` | `/api/agents` | Lists registered agents, models, and empirical reliability estimates |
| `GET` | `/api/agents/:agentId/history` | Retrieves historical trust snapshots for an agent |
| `GET` | `/api/trust/overview` | Overall trust statistics, decision distribution, and calibration status |
| `GET` | `/api/evidence/:evidenceId` | Deep inspection of specific evidence source excerpt and domain authority |
| `GET` | `/api/config/status` | Safe configuration status (never leaks secrets) |
| `POST` | `/api/evaluations` | Submit ground-truth verified outcome for empirical accuracy tracking |
| `GET` | `/api/evaluations/summary` | Dataset statistics of verified evaluations |
| `POST` | `/api/benchmark/run` | Execute reproducible benchmark suite across test cases |
| `GET` | `/api/benchmark/results` | Retrieve latest benchmark report comparing baselines |
| `GET` | `/api/health` | Service health, memory usage, and provider connectivity |

---

## 9. Decision Status Public Contract

- `ACCEPTED`: Supported by authoritative evidence, high claim corroboration ratio ($\ge 65\%$), and acceptable policy risk ($\text{Trust} \ge 70$, zero unresolved high contradictions).
- `NEEDS_REVIEW`: Material uncertainty, incomplete verification, low claim support, or resolvable nuance.
- `ABSTAINED`: Direct factual contradiction found in primary literature, all candidate agents failed, or speculative unprovable assertion.

---

## 10. Security & Privacy Guarantees

1. **SSRF Safeguards**: All external evidence retrieval blocks loopback addresses, private RFC-1918 CIDR ranges, and cloud metadata IPs (`169.254.169.254`).
2. **Untrusted Content Separation**: Web text is isolated in citation envelopes; instructions in web text cannot alter system policy.
3. **Credential Hygiene**: API keys are server-side only; zero secrets are transmitted to the client bundle.

---

## 11. Verification & Test Results

The test suite executes 22 verification checks covering:
- Beta-Binomial posterior calculations and credible interval enclosure.
- Dynamic missing-dimension normalization and coverage status flags.
- Hard decision policy invariants (rejecting `ACCEPTED` on contradictions even with high numerical scores).
- SSRF protocol and IP filters.
- Consistency Agent polar contradiction detection.
- End-to-end LangGraph execution with real Gemini model integration.

All 22/22 tests pass deterministically.
